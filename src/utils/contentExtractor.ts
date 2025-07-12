export interface ExtractedContent {
  content: string;
  metadata: {
    totalPages: number;
    extractedPages: number[];
    relevanceScore: number;
    extractionMethod: 'automatic' | 'page-range' | 'full-text';
    wordCount: number;
  };
}

export interface PageRange {
  start: number;
  end: number;
}

export interface ContentChunk {
  content: string;
  pageNumber: number;
  relevanceScore: number;
  context: string;
}

export class ContentExtractor {
  private static readonly MAX_TOKENS_PER_TOPIC = 6000; // Approximate token limit
  private static readonly CHARS_PER_TOKEN = 4; // Rough estimate
  private static readonly MAX_CHARS = ContentExtractor.MAX_TOKENS_PER_TOPIC * ContentExtractor.CHARS_PER_TOKEN;
  
  /**
   * Extract content based on topics with automatic relevance detection
   */
  static async extractRelevantContent(
    fullText: string,
    topics: string[],
    pageRanges?: PageRange[]
  ): Promise<Map<string, ExtractedContent>> {
    const results = new Map<string, ExtractedContent>();
    
    // Split text into pages (assuming page breaks are marked)
    const pages = this.splitIntoPages(fullText);
    
    for (const topic of topics) {
      let extractedContent: ExtractedContent;
      
      if (pageRanges && pageRanges.length > 0) {
        // Use manual page range extraction
        extractedContent = this.extractByPageRange(pages, pageRanges, topic);
      } else {
        // Use automatic topic-based extraction
        extractedContent = this.extractByTopic(pages, topic);
      }
      
      results.set(topic, extractedContent);
    }
    
    return results;
  }
  
  /**
   * Extract content from specific page ranges
   */
  private static extractByPageRange(
    pages: string[],
    pageRanges: PageRange[],
    topic: string
  ): ExtractedContent {
    let combinedContent = '';
    const extractedPages: number[] = [];
    
    for (const range of pageRanges) {
      const startPage = Math.max(0, range.start - 1); // Convert to 0-based index
      const endPage = Math.min(pages.length - 1, range.end - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        if (pages[i]) {
          combinedContent += `\n\n--- Page ${i + 1} ---\n\n${pages[i]}`;
          extractedPages.push(i + 1);
        }
      }
    }
    
    // If content is still too large, truncate intelligently
    if (combinedContent.length > this.MAX_CHARS) {
      combinedContent = this.intelligentTruncate(combinedContent, topic);
    }
    
    return {
      content: combinedContent.trim(),
      metadata: {
        totalPages: pages.length,
        extractedPages,
        relevanceScore: 1.0, // Manual selection gets max score
        extractionMethod: 'page-range',
        wordCount: combinedContent.split(/\s+/).length
      }
    };
  }
  
  /**
   * Extract content automatically based on topic relevance
   */
  private static extractByTopic(pages: string[], topic: string): ExtractedContent {
    // Create content chunks with relevance scores
    const chunks: ContentChunk[] = [];
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const relevanceScore = this.calculateRelevanceScore(page, topic);
      
      if (relevanceScore > 0.1) { // Only include somewhat relevant pages
        chunks.push({
          content: page,
          pageNumber: i + 1,
          relevanceScore,
          context: this.extractContext(pages, i, topic)
        });
      }
    }
    
    // Sort by relevance score
    chunks.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Build content within token limits
    let combinedContent = '';
    const extractedPages: number[] = [];
    let currentLength = 0;
    
    for (const chunk of chunks) {
      const chunkWithContext = `\n\n--- Page ${chunk.pageNumber} ---\n\n${chunk.content}`;
      
      if (currentLength + chunkWithContext.length > this.MAX_CHARS) {
        // Try to fit a summary of remaining relevant content
        const remainingChunks = chunks.slice(extractedPages.length);
        if (remainingChunks.length > 0) {
          const summary = this.createContentSummary(remainingChunks, topic);
          if (currentLength + summary.length <= this.MAX_CHARS) {
            combinedContent += `\n\n--- Additional Relevant Content Summary ---\n\n${summary}`;
          }
        }
        break;
      }
      
      combinedContent += chunkWithContext;
      extractedPages.push(chunk.pageNumber);
      currentLength += chunkWithContext.length;
    }
    
    // Calculate average relevance score
    const avgRelevanceScore = chunks.length > 0 
      ? chunks.slice(0, extractedPages.length).reduce((sum, chunk) => sum + chunk.relevanceScore, 0) / extractedPages.length
      : 0;
    
    return {
      content: combinedContent.trim(),
      metadata: {
        totalPages: pages.length,
        extractedPages,
        relevanceScore: avgRelevanceScore,
        extractionMethod: 'automatic',
        wordCount: combinedContent.split(/\s+/).length
      }
    };
  }
  
  /**
   * Calculate relevance score for a page based on topic
   */
  private static calculateRelevanceScore(pageContent: string, topic: string): number {
    const normalizedContent = pageContent.toLowerCase();
    const normalizedTopic = topic.toLowerCase();
    
    let score = 0;
    
    // Direct topic mention (highest weight)
    const directMatches = (normalizedContent.match(new RegExp(normalizedTopic, 'g')) || []).length;
    score += directMatches * 0.4;
    
    // Topic words individually
    const topicWords = normalizedTopic.split(/\s+/).filter(word => word.length > 2);
    for (const word of topicWords) {
      const wordMatches = (normalizedContent.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
      score += wordMatches * 0.2;
    }
    
    // Related terms and synonyms
    const relatedTerms = this.getRelatedTerms(topic);
    for (const term of relatedTerms) {
      const termMatches = (normalizedContent.match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
      score += termMatches * 0.1;
    }
    
    // Header/title context (pages with topic in headers get bonus)
    const headerPatterns = [
      new RegExp(`^\\s*#{1,6}\\s*.*${normalizedTopic}.*$`, 'gm'),
      new RegExp(`^\\s*\\d+\\.\\s*.*${normalizedTopic}.*$`, 'gm'),
      new RegExp(`^\\s*chapter\\s+\\d+.*${normalizedTopic}.*$`, 'gmi')
    ];
    
    for (const pattern of headerPatterns) {
      if (pattern.test(normalizedContent)) {
        score += 0.5;
      }
    }
    
    // Normalize score based on content length
    const contentLength = pageContent.length;
    const normalizedScore = contentLength > 0 ? score / Math.sqrt(contentLength / 1000) : 0;
    
    return Math.min(normalizedScore, 1.0); // Cap at 1.0
  }
  
  /**
   * Get related terms for better topic matching
   */
  private static getRelatedTerms(topic: string): string[] {
    const topicLower = topic.toLowerCase();
    const relatedTermsMap: Record<string, string[]> = {
      // Science topics
      'photosynthesis': ['chlorophyll', 'glucose', 'carbon dioxide', 'oxygen', 'light reaction', 'calvin cycle'],
      'mitosis': ['cell division', 'chromosome', 'prophase', 'metaphase', 'anaphase', 'telophase'],
      'dna': ['genetic', 'nucleotide', 'double helix', 'replication', 'transcription', 'translation'],
      'evolution': ['natural selection', 'adaptation', 'species', 'darwin', 'mutation', 'fitness'],
      
      // Math topics
      'calculus': ['derivative', 'integral', 'limit', 'function', 'differentiation', 'integration'],
      'algebra': ['equation', 'variable', 'polynomial', 'quadratic', 'linear', 'coefficient'],
      'geometry': ['triangle', 'circle', 'angle', 'theorem', 'proof', 'coordinate'],
      
      // Physics topics
      'mechanics': ['force', 'motion', 'velocity', 'acceleration', 'newton', 'momentum'],
      'thermodynamics': ['heat', 'temperature', 'entropy', 'energy', 'gas law', 'thermal'],
      'electromagnetism': ['electric', 'magnetic', 'field', 'current', 'voltage', 'maxwell'],
      
      // History topics
      'world war': ['battle', 'treaty', 'alliance', 'military', 'strategy', 'conflict'],
      'renaissance': ['art', 'humanism', 'reformation', 'printing press', 'florence', 'leonardo'],
      
      // General academic terms
      'theory': ['hypothesis', 'principle', 'concept', 'model', 'framework'],
      'analysis': ['method', 'approach', 'technique', 'procedure', 'evaluation'],
    };
    
    // Find related terms
    const relatedTerms: string[] = [];
    
    for (const [key, terms] of Object.entries(relatedTermsMap)) {
      if (topicLower.includes(key) || key.includes(topicLower)) {
        relatedTerms.push(...terms);
      }
    }
    
    // Add common academic suffixes/prefixes
    const topicWords = topicLower.split(/\s+/);
    for (const word of topicWords) {
      if (word.length > 3) {
        relatedTerms.push(
          word + 's', // plural
          word + 'ing', // gerund
          word + 'ed', // past tense
          word + 'tion', // noun form
          word + 'al', // adjective
        );
      }
    }
    
    return [...new Set(relatedTerms)]; // Remove duplicates
  }
  
  /**
   * Extract context around a page (previous and next pages)
   */
  private static extractContext(pages: string[], pageIndex: number, topic: string): string {
    const contextPages: string[] = [];
    
    // Add previous page if relevant
    if (pageIndex > 0) {
      const prevPage = pages[pageIndex - 1];
      if (this.calculateRelevanceScore(prevPage, topic) > 0.05) {
        contextPages.push(prevPage.substring(0, 500) + '...');
      }
    }
    
    // Add next page if relevant
    if (pageIndex < pages.length - 1) {
      const nextPage = pages[pageIndex + 1];
      if (this.calculateRelevanceScore(nextPage, topic) > 0.05) {
        contextPages.push(nextPage.substring(0, 500) + '...');
      }
    }
    
    return contextPages.join('\n\n');
  }
  
  /**
   * Create a summary of remaining relevant content
   */
  private static createContentSummary(chunks: ContentChunk[], topic: string): string {
    const summaryParts: string[] = [];
    
    for (const chunk of chunks.slice(0, 5)) { // Limit to top 5 remaining chunks
      // Extract key sentences that mention the topic
      const sentences = chunk.content.split(/[.!?]+/);
      const relevantSentences = sentences.filter(sentence => 
        sentence.toLowerCase().includes(topic.toLowerCase())
      ).slice(0, 2); // Max 2 sentences per chunk
      
      if (relevantSentences.length > 0) {
        summaryParts.push(`Page ${chunk.pageNumber}: ${relevantSentences.join('. ')}.`);
      }
    }
    
    return summaryParts.join('\n\n');
  }
  
  /**
   * Intelligently truncate content while preserving important information
   */
  private static intelligentTruncate(content: string, topic: string): string {
    const paragraphs = content.split(/\n\s*\n/);
    let truncatedContent = '';
    let currentLength = 0;
    
    // Sort paragraphs by relevance to topic
    const scoredParagraphs = paragraphs.map(paragraph => ({
      content: paragraph,
      score: this.calculateRelevanceScore(paragraph, topic)
    })).sort((a, b) => b.score - a.score);
    
    // Add paragraphs in order of relevance until we hit the limit
    for (const paragraph of scoredParagraphs) {
      if (currentLength + paragraph.content.length > this.MAX_CHARS) {
        break;
      }
      truncatedContent += paragraph.content + '\n\n';
      currentLength += paragraph.content.length + 2;
    }
    
    return truncatedContent.trim();
  }
  
  /**
   * Split text into pages based on page markers or estimated page breaks
   */
  private static splitIntoPages(text: string): string[] {
    // Try to split by explicit page markers first
    let pages = text.split(/--- Page \d+ ---/);
    
    // If no explicit page markers, estimate pages by content length
    if (pages.length === 1) {
      const avgCharsPerPage = 2000; // Rough estimate
      const numPages = Math.ceil(text.length / avgCharsPerPage);
      pages = [];
      
      for (let i = 0; i < numPages; i++) {
        const start = i * avgCharsPerPage;
        const end = Math.min((i + 1) * avgCharsPerPage, text.length);
        pages.push(text.substring(start, end));
      }
    }
    
    return pages.filter(page => page.trim().length > 0);
  }
  
  /**
   * Validate page ranges
   */
  static validatePageRanges(ranges: PageRange[], totalPages: number): { isValid: boolean; error?: string } {
    for (const range of ranges) {
      if (range.start < 1 || range.end < 1) {
        return { isValid: false, error: 'Page numbers must be greater than 0' };
      }
      
      if (range.start > totalPages || range.end > totalPages) {
        return { isValid: false, error: `Page numbers cannot exceed ${totalPages}` };
      }
      
      if (range.start > range.end) {
        return { isValid: false, error: 'Start page must be less than or equal to end page' };
      }
    }
    
    return { isValid: true };
  }
  
  /**
   * Parse page range string (e.g., "1-5, 10-15, 20")
   */
  static parsePageRanges(rangeString: string): PageRange[] {
    const ranges: PageRange[] = [];
    const parts = rangeString.split(',').map(part => part.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(num => parseInt(num.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          ranges.push({ start, end });
        }
      } else {
        const pageNum = parseInt(part);
        if (!isNaN(pageNum)) {
          ranges.push({ start: pageNum, end: pageNum });
        }
      }
    }
    
    return ranges;
  }
}