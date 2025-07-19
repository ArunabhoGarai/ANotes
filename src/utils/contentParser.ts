// Enhanced content parser with markdown-it and MathJax integration
export class ContentParser {
  private static markdownRenderer: any = null;

  // Initialize markdown-it with plugins
  private static initializeMarkdownRenderer() {
    if (typeof window !== 'undefined' && (window as any).markdownit && !this.markdownRenderer) {
      const md = (window as any).markdownit({
        html: true,
        linkify: true,
        typographer: true,
        breaks: true,
        quotes: '""\'\'',
      });

      // Add plugins if available
      if ((window as any).markdownitAttrs) {
        md.use((window as any).markdownitAttrs);
      }
      if ((window as any).markdownitFootnote) {
        md.use((window as any).markdownitFootnote);
      }
      if ((window as any).markdownitDeflist) {
        md.use((window as any).markdownitDeflist);
      }
      if ((window as any).markdownitAbbr) {
        md.use((window as any).markdownitAbbr);
      }
      if ((window as any).markdownitMark) {
        md.use((window as any).markdownitMark);
      }
      if ((window as any).markdownitIns) {
        md.use((window as any).markdownitIns);
      }
      if ((window as any).markdownitSub) {
        md.use((window as any).markdownitSub);
      }
      if ((window as any).markdownitSup) {
        md.use((window as any).markdownitSup);
      }

      // Custom rule for math expressions - preserve them during markdown processing
      const defaultTextRenderer = md.renderer.rules.text || function(tokens, idx) {
        return md.utils.escapeHtml(tokens[idx].content);
      };
      
      md.renderer.rules.text = function (tokens: any[], idx: number, options: any, env: any, renderer: any) {
        const token = tokens[idx];
        let content = token.content;
        
        // Protect math expressions from markdown processing
        content = content.replace(/\$\$([^$]+?)\$\$/g, (match: string) => {
          return `<span class="math-display-placeholder">${match}</span>`;
        });
        content = content.replace(/\$([^$\n]+?)\$/g, (match: string) => {
          return `<span class="math-inline-placeholder">${match}</span>`;
        });
        
        return md.utils.escapeHtml(content);
      };

      // Custom rule for code blocks to add syntax highlighting
      const defaultCodeBlockRenderer = md.renderer.rules.code_block || md.renderer.rules.fence;
      md.renderer.rules.code_block = md.renderer.rules.fence = function (tokens: any[], idx: number, options: any, env: any, renderer: any) {
        const token = tokens[idx];
        const langName = token.info ? token.info.trim().split(/\s+/g)[0] : '';
        
        if (langName && typeof window !== 'undefined' && (window as any).hljs) {
          try {
            const highlighted = (window as any).hljs.highlight(token.content, { language: langName });
            return `<pre><code class="hljs language-${langName}">${highlighted.value}</code></pre>`;
          } catch (error) {
            // Fallback to auto-detection
            try {
              const highlighted = (window as any).hljs.highlightAuto(token.content);
              return `<pre><code class="hljs">${highlighted.value}</code></pre>`;
            } catch (autoError) {
              // Fallback to plain code
              return `<pre><code>${md.utils.escapeHtml(token.content)}</code></pre>`;
            }
          }
        }
        
        return defaultCodeBlockRenderer(tokens, idx, options, env, renderer);
      };

      this.markdownRenderer = md;
    }
  }

  private static processChemicalFormulas(content: string): string {
    // Enhanced chemical formula processing
    const chemicalPatterns = [
      // Water, carbon dioxide, etc.
      { pattern: /\bH2O\b/g, replacement: 'H<sub>2</sub>O' },
      { pattern: /\bCO2\b/g, replacement: 'CO<sub>2</sub>' },
      { pattern: /\bNH3\b/g, replacement: 'NH<sub>3</sub>' },
      { pattern: /\bCH4\b/g, replacement: 'CH<sub>4</sub>' },
      { pattern: /\bO2\b/g, replacement: 'O<sub>2</sub>' },
      { pattern: /\bN2\b/g, replacement: 'N<sub>2</sub>' },
      { pattern: /\bH2SO4\b/g, replacement: 'H<sub>2</sub>SO<sub>4</sub>' },
      { pattern: /\bNaCl\b/g, replacement: 'NaCl' },
      { pattern: /\bCaCO3\b/g, replacement: 'CaCO<sub>3</sub>' },
      { pattern: /\bNaOH\b/g, replacement: 'NaOH' },
      { pattern: /\bHCl\b/g, replacement: 'HCl' },
      
      // Generic patterns for chemical formulas (only if not already processed)
      { pattern: /\b([A-Z][a-z]?)(\d+)\b(?![^<]*>)/g, replacement: '$1<sub>$2</sub>' },
      { pattern: /\(([A-Z][a-z]?\d*)\)(\d+)(?![^<]*>)/g, replacement: '($1)<sub>$2</sub>' }
    ];

    chemicalPatterns.forEach(({ pattern, replacement }) => {
      content = content.replace(pattern, replacement);
    });

    return content;
  }

  private static processSimpleMath(content: string): string {
    // Handle simple mathematical expressions that might not be in LaTeX format
    
    // Simple exponents like x^2, a^n (only if not already processed by LaTeX or HTML)
    content = content.replace(/([a-zA-Z0-9)]+)\^([a-zA-Z0-9]+)(?![^<]*>)/g, '$1<sup>$2</sup>');
    
    // Simple subscripts like x_1, a_n (only if not already processed by LaTeX or HTML)
    content = content.replace(/([a-zA-Z0-9)]+)_([a-zA-Z0-9]+)(?![^<]*>)/g, '$1<sub>$2</sub>');
    
    // Common mathematical symbols and Greek letters
    const mathReplacements: Record<string, string> = {
      // Mathematical operators
      '+-': '±',
      '<=': '≤',
      '>=': '≥',
      '!=': '≠',
      '~=': '≈',
      '<<': '≪',
      '>>': '≫',
      'infinity': '∞',
      'sqrt': '√',
      'sum': '∑',
      'integral': '∫',
      'partial': '∂',
      'nabla': '∇',
      'degree': '°',
      'times': '×',
      'divide': '÷',
      'therefore': '∴',
      'because': '∵',
      'proportional': '∝',
      'approximately': '≈',
      'equivalent': '≡',
      'perpendicular': '⊥',
      'parallel': '∥',
      'angle': '∠',
      'triangle': '△',
      
      // Greek letters (lowercase)
      'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ',
      'epsilon': 'ε', 'zeta': 'ζ', 'eta': 'η', 'theta': 'θ',
      'iota': 'ι', 'kappa': 'κ', 'lambda': 'λ', 'mu': 'μ',
      'nu': 'ν', 'xi': 'ξ', 'omicron': 'ο', 'pi': 'π',
      'rho': 'ρ', 'sigma': 'σ', 'tau': 'τ', 'upsilon': 'υ',
      'phi': 'φ', 'chi': 'χ', 'psi': 'ψ', 'omega': 'ω',
      
      // Greek letters (uppercase)
      'Alpha': 'Α', 'Beta': 'Β', 'Gamma': 'Γ', 'Delta': 'Δ',
      'Epsilon': 'Ε', 'Zeta': 'Ζ', 'Eta': 'Η', 'Theta': 'Θ',
      'Iota': 'Ι', 'Kappa': 'Κ', 'Lambda': 'Λ', 'Mu': 'Μ',
      'Nu': 'Ν', 'Xi': 'Ξ', 'Omicron': 'Ο', 'Pi': 'Π',
      'Rho': 'Ρ', 'Sigma': 'Σ', 'Tau': 'Τ', 'Upsilon': 'Υ',
      'Phi': 'Φ', 'Chi': 'Χ', 'Psi': 'Ψ', 'Omega': 'Ω'
    };

    Object.entries(mathReplacements).forEach(([text, symbol]) => {
      const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedText}\\b`, 'gi');
      content = content.replace(regex, symbol);
    });

    return content;
  }

  private static processEquations(content: string): string {
    // Look for equation-like patterns and wrap them in special styling
    
    // Pattern for equations with = sign (avoid HTML attributes)
    content = content.replace(/([A-Za-z0-9\s\+\-\*\/\^\(\)πΔθλμσφωαβγδε√∑∫∂∇±≤≥≠≈×÷°]+\s*=\s*[A-Za-z0-9\s\+\-\*\/\^\(\)πΔθλμσφωαβγδε√∑∫∂∇±≤≥≠≈×÷°]+)(?![^<]*>)/g, 
      '<span class="equation">$1</span>');
    
    // Pattern for chemical equations with arrows
    content = content.replace(/([A-Za-z0-9\s\+\(\)<sub><\/sub>]+)\s*→\s*([A-Za-z0-9\s\+\(\)<sub><\/sub>]+)/g, 
      '<span class="chemical-equation">$1 → $2</span>');
    
    // Pattern for chemical equations with other arrows
    content = content.replace(/([A-Za-z0-9\s\+\(\)<sub><\/sub>]+)\s*⇌\s*([A-Za-z0-9\s\+\(\)<sub><\/sub>]+)/g, 
      '<span class="chemical-equation">$1 ⇌ $2</span>');

    return content;
  }

  private static processUnits(content: string): string {
    // Common scientific units
    const unitReplacements: Record<string, string> = {
      'm/s': 'm/s', 'm/s2': 'm/s²', 'm/s^2': 'm/s²',
      'kg*m/s2': 'kg⋅m/s²', 'kg*m/s^2': 'kg⋅m/s²',
      'J/mol': 'J/mol', 'cal/mol': 'cal/mol', 'L/mol': 'L/mol',
      'g/mol': 'g/mol', 'mol/L': 'mol/L', 'atm': 'atm',
      'Pa': 'Pa', 'kPa': 'kPa', 'MPa': 'MPa', 'GPa': 'GPa',
      'N/m2': 'N/m²', 'N/m^2': 'N/m²',
      'kg/m3': 'kg/m³', 'kg/m^3': 'kg/m³',
      'g/cm3': 'g/cm³', 'g/cm^3': 'g/cm³'
    };

    Object.entries(unitReplacements).forEach(([pattern, replacement]) => {
      const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedPattern}\\b`, 'g');
      content = content.replace(regex, replacement);
    });

    return content;
  }

  private static cleanupContent(content: string): string {
    // Remove excessive whitespace and clean up formatting
    return content
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  private static restoreMathPlaceholders(content: string): string {
    // Restore math expressions from placeholders
    content = content.replace(/<span class="math-display-placeholder">(.*?)<\/span>/g, '$1');
    content = content.replace(/<span class="math-inline-placeholder">(.*?)<\/span>/g, '$1');
    return content;
  }

  static parseContent(content: string): string {
    try {
      // Clean up the content first
      let processedContent = this.cleanupContent(content);
      
      // Ensure headings start on new lines and have proper spacing
      processedContent = processedContent.replace(/([^\n])(\s*#{1,6}\s)/g, '$1\n\n$2');
      processedContent = processedContent.replace(/\n{3,}/g, '\n\n'); // Clean up excessive newlines
      
      // Initialize markdown-it renderer
      this.initializeMarkdownRenderer();
      
      // Use markdown-it for parsing if available
      if (this.markdownRenderer) {
        try {
          processedContent = this.markdownRenderer.render(processedContent);
        } catch (error) {
          console.warn('markdown-it parsing error:', error);
          // Fallback to marked.js if available
          if (typeof window !== 'undefined' && (window as any).marked) {
            (window as any).marked.setOptions({
              breaks: true,
              gfm: true,
              headerIds: false,
              mangle: false
            });
            processedContent = (window as any).marked.parse(processedContent);
          } else {
            // Final fallback: basic markdown processing
            processedContent = this.basicMarkdownParse(processedContent);
          }
        }
      } else if (typeof window !== 'undefined' && (window as any).marked) {
        // Fallback to marked.js
        (window as any).marked.setOptions({
          breaks: true,
          gfm: true,
          headerIds: false,
          mangle: false
        });
        processedContent = (window as any).marked.parse(processedContent);
      } else {
        // Final fallback: basic markdown processing
        processedContent = this.basicMarkdownParse(processedContent);
      }
      
      // Restore math placeholders
      processedContent = this.restoreMathPlaceholders(processedContent);
      
      // Process chemical formulas
      processedContent = this.processChemicalFormulas(processedContent);
      
      // Process simple mathematical expressions and symbols
      processedContent = this.processSimpleMath(processedContent);
      
      // Process scientific units
      processedContent = this.processUnits(processedContent);
      
      // Process equations and chemical formulas
      processedContent = this.processEquations(processedContent);
      
      // Sanitize the HTML (basic sanitization)
      processedContent = this.basicSanitize(processedContent);
      
      // Initialize math rendering after content is processed
      setTimeout(() => {
        // Try MathJax first (better for complex expressions)
        if (typeof window !== 'undefined' && (window as any).MathJax) {
          (window as any).MathJax.typesetPromise().catch((err: any) => {
            console.warn('MathJax rendering error:', err);
          });
        }
        // Fallback to KaTeX
        else if (typeof window !== 'undefined' && (window as any).renderMathInElement) {
          (window as any).renderMathInElement(document.body, {
            delimiters: [
              {left: '$$', right: '$$', display: true},
              {left: '$', right: '$', display: false},
              {left: '\\[', right: '\\]', display: true},
              {left: '\\(', right: '\\)', display: false}
            ],
            throwOnError: false,
            errorColor: '#cc0000'
          });
        }
        
        // Initialize code highlighting
        if (typeof window !== 'undefined' && (window as any).hljs) {
          (window as any).hljs.highlightAll();
        }
      }, 200);
      
      return processedContent;
    } catch (error) {
      console.error('Error parsing content:', error);
      return this.basicMarkdownParse(content);
    }
  }

  private static basicMarkdownParse(content: string): string {
    // Enhanced basic markdown parsing fallback
    return content
      // Headers
      .replace(/^######\s+(.*$)/gm, '<h6>$1</h6>')
      .replace(/^#####\s+(.*$)/gm, '<h5>$1</h5>')
      .replace(/^####\s+(.*$)/gm, '<h4>$1</h4>')
      .replace(/^###\s+(.*$)/gm, '<h3>$1</h3>')
      .replace(/^##\s+(.*$)/gm, '<h2>$1</h2>')
      .replace(/^#\s+(.*$)/gm, '<h1>$1</h1>')
      
      // Bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      
      // Code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
      
      // Lists
      .replace(/^\s*[\*\-]\s+(.*$)/gm, '<li>$1</li>')
      .replace(/^\s*\d+\.\s+(.*$)/gm, '<li>$1</li>')
      
      // Wrap consecutive list items
      .replace(/(<li>.*?<\/li>(?:\s*<li>.*?<\/li>)*)/gs, '<ul>$1</ul>')
      
      // Blockquotes
      .replace(/^>\s*(.*$)/gm, '<blockquote>$1</blockquote>')
      
      // Horizontal rules
      .replace(/^---$/gm, '<hr>')
      .replace(/^\*\*\*$/gm, '<hr>')
      
      // Line breaks and paragraphs
      .split('\n\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map(paragraph => {
        // Don't wrap headings, lists, blockquotes, or code blocks in paragraphs
        if (paragraph.match(/^<(h[1-6]|ul|ol|li|blockquote|pre|hr)/)) {
          return paragraph;
        }
        return `<p>${paragraph}</p>`;
      })
      .join('\n')
      
      // Clean up empty paragraphs
      .replace(/<p><\/p>/g, '')
      .replace(/<p>\s*<\/p>/g, '');
  }

  private static basicSanitize(html: string): string {
    // Basic HTML sanitization (remove script tags and dangerous attributes)
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '');
  }
}