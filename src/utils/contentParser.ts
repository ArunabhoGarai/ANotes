// Enhanced content parser with CDN-based rendering
export class ContentParser {
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
      
      // Generic patterns for chemical formulas
      { pattern: /\b([A-Z][a-z]?)(\d+)\b/g, replacement: '$1<sub>$2</sub>' },
      { pattern: /\(([A-Z][a-z]?\d*)\)(\d+)/g, replacement: '($1)<sub>$2</sub>' }
    ];

    chemicalPatterns.forEach(({ pattern, replacement }) => {
      content = content.replace(pattern, replacement);
    });

    return content;
  }

  private static processSimpleMath(content: string): string {
    // Handle simple mathematical expressions that might not be in LaTeX format
    
    // Simple exponents like x^2, a^n (only if not already processed by LaTeX)
    content = content.replace(/([a-zA-Z0-9)]+)\^([a-zA-Z0-9]+)(?![^<]*>)/g, '$1<sup>$2</sup>');
    
    // Simple subscripts like x_1, a_n (only if not already processed by LaTeX)
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

  private static highlightCode(content: string): string {
    // Process code blocks for syntax highlighting
    if (typeof window !== 'undefined' && (window as any).hljs) {
      // Let highlight.js handle code highlighting after rendering
      setTimeout(() => {
        (window as any).hljs.highlightAll();
      }, 100);
    }
    return content;
  }

  static parseContent(content: string): string {
    try {
      // Clean up the content first
      let processedContent = this.cleanupContent(content);
      
      // Ensure ### headings start on new lines
      processedContent = processedContent.replace(/([^\n])(\s*###)/g, '$1\n$2');
      
      // Use CDN marked.js for markdown parsing
      if (typeof window !== 'undefined' && (window as any).marked) {
        // Configure marked for better rendering
        (window as any).marked.setOptions({
          breaks: true,
          gfm: true,
          headerIds: false,
          mangle: false,
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
        
        processedContent = (window as any).marked.parse(processedContent);
      } else {
        // Fallback: basic markdown processing
        processedContent = this.basicMarkdownParse(processedContent);
      }
      
      // Process chemical formulas
      processedContent = this.processChemicalFormulas(processedContent);
      
      // Process simple mathematical expressions and symbols
      processedContent = this.processSimpleMath(processedContent);
      
      // Process scientific units
      processedContent = this.processUnits(processedContent);
      
      // Process equations and chemical formulas
      processedContent = this.processEquations(processedContent);
      
      // Handle code highlighting
      processedContent = this.highlightCode(processedContent);
      
      // Sanitize the HTML (basic sanitization without DOMPurify)
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
      }, 200);
      
      return processedContent;
    } catch (error) {
      console.error('Error parsing content:', error);
      return this.basicMarkdownParse(content);
    }
  }

  private static basicMarkdownParse(content: string): string {
    // Basic markdown parsing fallback
    return content
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  private static basicSanitize(html: string): string {
    // Basic HTML sanitization (remove script tags and dangerous attributes)
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '');
  }
}