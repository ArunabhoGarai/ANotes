import { createPartFromUri, GoogleGenAI } from '@google/genai';
import { GeminiService as GeminiServiceType } from '../types';
import { GoogleDriveConverter } from '../utils/googleDriveConverter';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class GeminiService {
  private static instance: GeminiService;
  private apiKey: string;
  private genAI: GoogleGenAI;
  private uploadedFile: any = null;

  private constructor() {
    this.apiKey = GEMINI_API_KEY || '';
    this.genAI = new GoogleGenAI({ apiKey: this.apiKey });
  }

  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  async generateStudyNotes(topic: string, sourceContent?: string, useSource?: boolean): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
    }

    const prompt = useSource && sourceContent 
      ? `Based on the provided source material below, create elaborate and detailed study notes in simple language specifically on the topic: "${topic}"

IMPORTANT: Generate notes ONLY based on the information present in the source material provided. Do not add external information not found in the source.

SOURCE MATERIAL:
"""
${sourceContent}
"""

TASK: Extract and organize information from the above source material that relates to "${topic}". Create comprehensive study notes covering:

1. **Source-Based Definitions**: Extract and explain key terms and concepts related to "${topic}" as defined in the source
2. **Source-Based Explanations**: Detailed explanations of concepts as presented in the source material
3. **Examples from Source**: Use only examples, case studies, and illustrations mentioned in the source
4. **Formulas & Equations**: Include any mathematical formulas, equations, or calculations mentioned in the source
5. **Key Points**: Highlight the most important information about "${topic}" from the source
6. **Structured Organization**: Present the information in a clear, logical format for easy studying
7. **Source Context**: Maintain the context and perspective of the original source material

If the source material contains limited information about "${topic}", focus on what is available and clearly indicate the scope of coverage.

CRITICAL FORMATTING REQUIREMENTS:
- Use proper markdown formatting with clear hierarchical structure
- Use ## for main headings, ### for subheadings, #### for sub-subheadings
- Use bullet points (-) and numbered lists (1., 2., 3.) appropriately
- Use **bold** for important terms and concepts
- Use *italics* for emphasis and definitions
- Ensure proper line spacing with double line breaks between sections
- Use blockquotes (>) for important notes or key takeaways
- Use code blocks (\`\`\`) for formulas that need special formatting
- Maintain consistent indentation for nested lists
- Use horizontal rules (---) to separate major sections

IMPORTANT: For any mathematical expressions, formulas, or equations, please use LaTeX notation:
- For inline math: $expression$ (e.g., $E = mc^2$, $\\pi r^2$, $\\frac{1}{2}mv^2$)
- For display math: $$expression$$ (e.g., $$\\frac{d}{dx}f(x) = f'(x)$$, $$\\int_0^\\infty e^{-x} dx = 1$$)
- For chemical formulas: Use proper notation like H_2O, CO_2, C_6H_{12}O_6
- For complex equations: Use proper LaTeX formatting with \\frac{}{}, \\sqrt{}, \\sum_{}, \\int_{}, etc.
- Include Greek letters: \\alpha, \\beta, \\gamma, \\delta, \\theta, \\lambda, \\mu, \\pi, \\sigma, \\omega
- Use proper mathematical operators: \\times, \\div, \\pm, \\leq, \\geq, \\neq, \\approx
- Include proper mathematical symbols and notation where relevant

Examples of good LaTeX formatting:
- Quadratic formula: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
- Kinetic energy: $KE = \\frac{1}{2}mv^2$
- Photosynthesis: $6CO_2 + 6H_2O \\rightarrow C_6H_{12}O_6 + 6O_2$
- Integral: $$\\int_a^b f(x) dx = F(b) - F(a)$$`
      : `Make elaborate and detailed study notes in simple language on the topic: "${topic}"

CRITICAL FORMATTING AND STRUCTURE REQUIREMENTS:

## Content Organization:
1. **Clear Hierarchical Structure**: Use proper markdown headings (##, ###, ####)
2. **Logical Flow**: Organize from basic concepts to advanced topics
3. **Comprehensive Coverage**: Include definitions, explanations, examples, formulas, and applications
4. **Proper Spacing**: Use double line breaks between sections for readability

## Formatting Standards:
- **Main Topics**: Use ## (double hash) for major sections
- **Subtopics**: Use ### (triple hash) for subsections  
- **Details**: Use #### (quad hash) for specific points
- **Important Terms**: Use **bold** for key concepts and definitions
- **Emphasis**: Use *italics* for emphasis and technical terms
- **Lists**: Use proper bullet points (-) and numbered lists (1., 2., 3.)
- **Key Notes**: Use blockquotes (>) for important takeaways
- **Formulas**: Use code blocks (\`\`\`) for complex formulas when needed
- **Section Breaks**: Use horizontal rules (---) between major sections

## Content Requirements:
1. **Detailed Definitions**: Explain every key term, concept, and terminology with crystal clear definitions
2. **Mathematical Formulas**: Include ALL relevant formulas, equations, and mathematical relationships
3. **Numerical Examples**: Provide step-by-step solved examples with detailed calculations
4. **Theoretical Explanations**: Break down complex theories into simple, understandable parts
5. **Practical Applications**: Real-world examples and applications of the concepts
6. **Problem-Solving Techniques**: Methods and strategies for solving related problems
7. **Practice Questions**: Include various types of questions with detailed solutions
8. **Summary and Review**: Comprehensive summary points for quick revision

## Example Structure:
\`\`\`
## Main Topic Name

### Definition and Basic Concepts
- **Key Term 1**: Clear definition
- **Key Term 2**: Clear definition

### Fundamental Principles
1. First principle explanation
2. Second principle explanation

### Mathematical Formulas
$$Important Formula = \\frac{expression}{here}$$

### Practical Examples
#### Example 1: Problem Title
**Given**: Problem statement
**Solution**: Step-by-step solution

### Applications
- Real-world application 1
- Real-world application 2

> **Key Takeaway**: Important summary point

---
\`\`\`

IMPORTANT: For any mathematical expressions, formulas, or equations, please use LaTeX notation:
- For inline math: $expression$ (e.g., $E = mc^2$, $\\pi r^2$, $\\frac{1}{2}mv^2$)
- For display math: $$expression$$ (e.g., $$\\frac{d}{dx}f(x) = f'(x)$$, $$\\int_0^\\infty e^{-x} dx = 1$$)
- For chemical formulas: Use proper notation like H_2O, CO_2, C_6H_{12}O_6
- For complex equations: Use proper LaTeX formatting with \\frac{}{}, \\sqrt{}, \\sum_{}, \\int_{}, etc.
- Include Greek letters: \\alpha, \\beta, \\gamma, \\delta, \\theta, \\lambda, \\mu, \\pi, \\sigma, \\omega
- Use proper mathematical operators: \\times, \\div, \\pm, \\leq, \\geq, \\neq, \\approx
- Include proper mathematical symbols and notation where relevant

Examples of good LaTeX formatting:
- Quadratic formula: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
- Kinetic energy: $KE = \\frac{1}{2}mv^2$
- Photosynthesis: $6CO_2 + 6H_2O \\rightarrow C_6H_{12}O_6 + 6O_2$
- Integral: $$\\int_a^b f(x) dx = F(b) - F(a)$$`;

    try {
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [prompt],
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      });

      return response.text || 'No content generated.';
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  async generateMultipleStudyNotes(topics: string[], sourceContent?: string, useSource?: boolean): Promise<{ topic: string; content: string; error?: string }[]> {
    const results = await Promise.allSettled(
      topics.map(async (topic) => {
        try {
          const content = await this.generateStudyNotes(topic.trim(), sourceContent, useSource);
          return { topic: topic.trim(), content };
        } catch (error) {
          return { 
            topic: topic.trim(), 
            content: '', 
            error: error instanceof Error ? error.message : 'Failed to generate notes' 
          };
        }
      })
    );
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          topic: topics[index].trim(),
          content: '',
          error: 'Request failed'
        };
      }
    });
  }

  async uploadPDFFile(file: File): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
    }

    try {
      // Store file object directly to avoid stack overflow
      this.uploadedFile = file;
      
      console.log('PDF processed successfully for Gemini:', file.name);
    } catch (error) {
      console.error('Gemini PDF upload error:', error);
      throw new Error(`Failed to upload PDF to Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadPDFFromURL(url: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
    }

    try {
      // Convert Google Drive links to direct download links
      let processedUrl = url;
      if (GoogleDriveConverter.isGoogleDriveLink(url)) {
        processedUrl = GoogleDriveConverter.convertToDirectLink(url);
        console.log('Converted Google Drive URL:', processedUrl);
      }
      
      // Validate URL format
      const urlObj = new URL(processedUrl);
      
      // For Google Drive links, we don't need to check .pdf extension
      if (!GoogleDriveConverter.isGoogleDriveLink(url) && !processedUrl.toLowerCase().endsWith('.pdf')) {
        throw new Error('URL must point directly to a PDF file (ending with .pdf) or be a Google Drive sharing link');
      }

      // Try to fetch PDF from URL
      const response = await fetch(processedUrl, {
        mode: 'cors',
        headers: {
          'Accept': 'application/pdf',
        }
      });
      
      if (!response.ok) {
        if (response.status === 0 || response.type === 'opaque') {
          if (GoogleDriveConverter.isGoogleDriveLink(url)) {
            throw new Error('GOOGLE_DRIVE_PERMISSION_ERROR: The Google Drive file is not publicly accessible. Please make sure the file is shared with "Anyone with the link" permission.');
          } else {
            throw new Error('CORS_ERROR');
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/pdf') && !GoogleDriveConverter.isGoogleDriveLink(url)) {
        throw new Error('URL does not point to a PDF file. For Google Drive, make sure you\'re sharing a PDF file.');
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        throw new Error('Downloaded file is empty');
      }

      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const fileName = urlObj.pathname.split('/').pop() || 'document.pdf';
      
      // Use a better filename for Google Drive files
      const finalFileName = GoogleDriveConverter.isGoogleDriveLink(url) 
        ? 'Google_Drive_PDF.pdf' 
        : fileName;
        
      this.uploadedFile = new File([blob], fileName, { type: 'application/pdf' });
      
      console.log('PDF fetched and processed successfully from URL:', processedUrl);
    } catch (error) {
      console.error('Gemini PDF URL upload error:', error);
      
      if (error instanceof Error) {
        if (error.message === 'CORS_ERROR' || error.message.includes('Failed to fetch')) {
          if (GoogleDriveConverter.isGoogleDriveLink(url)) {
            throw new Error('Google Drive links don\'t work due to CORS restrictions. Please use the file upload option or try hosting your PDF on GitHub, Dropbox, or a CDN service instead.');
          } else {
            throw new Error('CORS_BLOCKED: The server doesn\'t allow cross-origin requests. Try a CDN-hosted PDF or use file upload instead.');
          }
        }
        if (error.message.includes('Mixed Content')) {
          throw new Error('MIXED_CONTENT: Cannot load HTTP content from HTTPS page. Please use an HTTPS PDF URL.');
        }
        throw error;
      }
      
      throw new Error(`Failed to upload PDF from URL: Unknown error${GoogleDriveConverter.isGoogleDriveLink(url) ? '. Google Drive links often don\'t work - try file upload instead.' : ''}`);
    }
  }

  async generateStudyNotesFromPDF(topic: string): Promise<string> {
    if (!this.uploadedFile) {
      throw new Error('No PDF file uploaded. Please upload a PDF first.');
    }

    try {
      // Upload file to Gemini
      const uploadedFile = await this.genAI.files.upload({
        file: this.uploadedFile,
        config: {
          displayName: this.uploadedFile.name,
        },
      });

      // Wait for file processing
      let fileStatus = await this.genAI.files.get({ name: uploadedFile.name });
      while (fileStatus.state === 'PROCESSING') {
        console.log('File is processing, waiting...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
        fileStatus = await this.genAI.files.get({ name: uploadedFile.name });
      }

      if (fileStatus.state === 'FAILED') {
        throw new Error('File processing failed.');
      }

      const prompt = `Based on the uploaded PDF document, create elaborate and detailed study notes in simple language specifically on the topic: "${topic}"

IMPORTANT: Generate notes ONLY based on the information present in the uploaded PDF document. Do not add external information not found in the document.

TASK: Extract and organize information from the PDF that relates to "${topic}". Create comprehensive study notes covering:

1. **Document-Based Definitions**: Extract and explain key terms and concepts related to "${topic}" as defined in the document
2. **Document-Based Explanations**: Detailed explanations of concepts as presented in the source material
3. **Examples from Document**: Use only examples, case studies, and illustrations mentioned in the PDF
4. **Formulas & Equations**: Include any mathematical formulas, equations, or calculations mentioned in the document
5. **Key Points**: Highlight the most important information about "${topic}" from the document
6. **Structured Organization**: Present the information in a clear, logical format for easy studying
7. **Document Context**: Maintain the context and perspective of the original document

If the document contains limited information about "${topic}", focus on what is available and clearly indicate the scope of coverage.

FORMATTING REQUIREMENTS:
- Use clear, hierarchical headings and subheadings
- Organize content in logical, easy-to-follow sections based on document structure
- Use bullet points, numbered lists, and proper spacing
- Ensure excellent readability with proper paragraph breaks
- Stay faithful to the document's terminology and explanations

IMPORTANT: For any mathematical expressions, formulas, or equations, please use LaTeX notation:
- For inline math: $expression$ (e.g., $E = mc^2$, $\\pi r^2$, $\\frac{1}{2}mv^2$)
- For display math: $$expression$$ (e.g., $$\\frac{d}{dx}f(x) = f'(x)$$, $$\\int_0^\\infty e^{-x} dx = 1$$)
- For chemical formulas: Use proper notation like H_2O, CO_2, C_6H_{12}O_6
- For complex equations: Use proper LaTeX formatting with \\frac{}{}, \\sqrt{}, \\sum_{}, \\int_{}, etc.
- Include Greek letters: \\alpha, \\beta, \\gamma, \\delta, \\theta, \\lambda, \\mu, \\pi, \\sigma, \\omega
- Use proper mathematical operators: \\times, \\div, \\pm, \\leq, \\geq, \\neq, \\approx

Examples of good LaTeX formatting:
- Quadratic formula: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
- Kinetic energy: $KE = \\frac{1}{2}mv^2$
- Photosynthesis: $6CO_2 + 6H_2O \\rightarrow C_6H_{12}O_6 + 6O_2$
- Integral: $$\\int_a^b f(x) dx = F(b) - F(a)$$`;

      // Create content with file reference
      const content = [prompt];
      
      if (fileStatus.uri && fileStatus.mimeType) {
        const fileContent = createPartFromUri(fileStatus.uri, fileStatus.mimeType);
        content.push(fileContent);
      }

      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: content,
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      });

      // Clean up uploaded file
      try {
        await this.genAI.files.delete({ name: uploadedFile.name });
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError);
      }

      return response.text || 'No content generated.';
    } catch (error) {
      console.error('Gemini PDF generation error:', error);
      throw new Error(`Failed to generate notes from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateMultipleStudyNotesFromPDF(topics: string[]): Promise<{ topic: string; content: string; error?: string }[]> {
    if (!this.uploadedFile) {
      throw new Error('No PDF file uploaded. Please upload a PDF first.');
    }

    const results = await Promise.allSettled(
      topics.map(async (topic) => {
        try {
          const content = await this.generateStudyNotesFromPDF(topic.trim());
          return { topic: topic.trim(), content };
        } catch (error) {
          return { 
            topic: topic.trim(), 
            content: '', 
            error: error instanceof Error ? error.message : 'Failed to generate notes' 
          };
        }
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          topic: topics[index].trim(),
          content: '',
          error: 'Request failed'
        };
      }
    });
  }

  clearUploadedFile(): void {
    this.uploadedFile = null;
  }
}