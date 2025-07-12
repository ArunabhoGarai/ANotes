export class MathRenderer {
  static renderMath(expression: string, display: boolean = false): string {
    try {
      // Use global katex from CDN
      if (typeof window !== 'undefined' && (window as any).katex) {
        return (window as any).katex.renderToString(expression, {
          displayMode: display,
          throwOnError: false,
          errorColor: '#cc0000',
          strict: 'warn',
          trust: false,
          macros: {
            "\\RR": "\\mathbb{R}",
            "\\NN": "\\mathbb{N}",
            "\\ZZ": "\\mathbb{Z}",
            "\\QQ": "\\mathbb{Q}",
            "\\CC": "\\mathbb{C}",
          }
        });
      }
      
      // Fallback if KaTeX is not available
      return `<span class="math-error" title="KaTeX not loaded">${expression}</span>`;
    } catch (error) {
      console.warn('KaTeX rendering error:', error);
      return `<span class="math-error" title="Math rendering error: ${error}">${expression}</span>`;
    }
  }

  static processMathInContent(content: string): string {
    // Process display math first ($$...$$)
    content = content.replace(/\$\$([^$]+?)\$\$/g, (match, expression) => {
      const rendered = this.renderMath(expression.trim(), true);
      return `<div class="math-display">${rendered}</div>`;
    });

    // Process inline math ($...$) - but avoid matching display math
    content = content.replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (match, expression) => {
      const rendered = this.renderMath(expression.trim(), false);
      return `<span class="math-inline">${rendered}</span>`;
    });

    // Process LaTeX display math (\[...\])
    content = content.replace(/\\\[([^\]]+?)\\\]/g, (match, expression) => {
      const rendered = this.renderMath(expression.trim(), true);
      return `<div class="math-display">${rendered}</div>`;
    });

    // Process LaTeX inline math (\(...\))
    content = content.replace(/\\\(([^)]+?)\\\)/g, (match, expression) => {
      const rendered = this.renderMath(expression.trim(), false);
      return `<span class="math-inline">${rendered}</span>`;
    });

    return content;
  }

  // Initialize auto-rendering when content is updated
  static initializeAutoRender() {
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
  }
}