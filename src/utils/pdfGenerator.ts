import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { StudyNote } from '../types';

export class PDFGenerator {
  private static readonly PAGE_WIDTH = 210; // A4 width in mm
  private static readonly PAGE_HEIGHT = 297; // A4 height in mm
  private static readonly MARGIN = 20; // Margin in mm
  private static readonly CONTENT_WIDTH = PDFGenerator.PAGE_WIDTH - (2 * PDFGenerator.MARGIN);
  private static readonly LINE_HEIGHT = 7; // Line height in mm
  private static readonly TITLE_SIZE = 16;
  private static readonly HEADING_SIZE = 14;
  private static readonly SUBHEADING_SIZE = 12;
  private static readonly BODY_SIZE = 10;

  static async generatePDF(studyNotes: StudyNote[]): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const successfulNotes = studyNotes.filter(note => !note.error);
    
    if (successfulNotes.length === 0) {
      throw new Error('No successful notes to generate PDF');
    }

    // Add title page
    this.addTitlePage(pdf, successfulNotes);
    
    // Add table of contents
    this.addTableOfContents(pdf, successfulNotes);

    // Process each note
    for (let i = 0; i < successfulNotes.length; i++) {
      const note = successfulNotes[i];
      pdf.addPage();
      await this.addNoteToPDF(pdf, note, i + 1);
    }

    // Save the PDF
    const fileName = `Study_Notes_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  }

  private static addTitlePage(pdf: jsPDF, notes: StudyNote[]): void {
    const centerX = PDFGenerator.PAGE_WIDTH / 2;
    
    // Main title
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AI-Generated Study Notes', centerX, 60, { align: 'center' });
    
    // Subtitle
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Comprehensive Study Materials', centerX, 75, { align: 'center' });
    
    // Date
    pdf.setFontSize(12);
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    pdf.text(`Generated on: ${currentDate}`, centerX, 90, { align: 'center' });
    
    // Topics summary
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Topics Covered:', centerX, 120, { align: 'center' });
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    let yPos = 135;
    notes.forEach((note, index) => {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 30;
      }
      pdf.text(`${index + 1}. ${note.topic}`, centerX, yPos, { align: 'center' });
      yPos += 8;
    });
    
    // Footer
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Powered by Gemini 2.0 Flash AI', centerX, 280, { align: 'center' });
  }

  private static addTableOfContents(pdf: jsPDF, notes: StudyNote[]): void {
    pdf.addPage();
    
    // Title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Table of Contents', PDFGenerator.MARGIN, 40);
    
    let yPos = 60;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    notes.forEach((note, index) => {
      if (yPos > 260) {
        pdf.addPage();
        yPos = 30;
      }
      
      const pageNum = index + 4; // Accounting for title and TOC pages
      const topicText = `${index + 1}. ${note.topic}`;
      const dots = '.'.repeat(Math.max(3, 60 - topicText.length - pageNum.toString().length));
      
      pdf.text(topicText, PDFGenerator.MARGIN, yPos);
      pdf.text(`${dots} ${pageNum}`, PDFGenerator.MARGIN, yPos, { align: 'right', maxWidth: PDFGenerator.CONTENT_WIDTH });
      yPos += 10;
    });
  }

  private static async addNoteToPDF(pdf: jsPDF, note: StudyNote, noteNumber: number): Promise<void> {
    let yPos = PDFGenerator.MARGIN;
    
    // Note title
    pdf.setFontSize(PDFGenerator.TITLE_SIZE);
    pdf.setFont('helvetica', 'bold');
    const titleText = `${noteNumber}. ${note.topic}`;
    pdf.text(titleText, PDFGenerator.MARGIN, yPos);
    yPos += 15;
    
    // Separator line
    pdf.setLineWidth(0.5);
    pdf.line(PDFGenerator.MARGIN, yPos, PDFGenerator.PAGE_WIDTH - PDFGenerator.MARGIN, yPos);
    yPos += 10;
    
    // Process content
    const processedContent = this.preprocessContentForPDF(note.content);
    await this.addContentToPDF(pdf, processedContent, yPos);
  }

  private static preprocessContentForPDF(content: string): string {
    // Convert markdown-style headers to plain text with formatting markers
    content = content.replace(/^### (.*$)/gm, '||SUBHEADING||$1');
    content = content.replace(/^## (.*$)/gm, '||HEADING||$1');
    content = content.replace(/^# (.*$)/gm, '||HEADING||$1');
    
    // Convert bold text
    content = content.replace(/\*\*(.*?)\*\*/g, '||BOLD||$1||/BOLD||');
    content = content.replace(/__(.*?)__/g, '||BOLD||$1||/BOLD||');
    
    // Convert italic text
    content = content.replace(/\*(.*?)\*/g, '||ITALIC||$1||/ITALIC||');
    content = content.replace(/_(.*?)_/g, '||ITALIC||$1||/ITALIC||');
    
    // Handle mathematical expressions - convert LaTeX to readable text
    content = this.convertMathToText(content);
    
    // Handle chemical formulas
    content = this.convertChemicalFormulas(content);
    
    // Clean up extra whitespace
    content = content.replace(/\n{3,}/g, '\n\n');
    content = content.replace(/\s{2,}/g, ' ');
    
    return content.trim();
  }

  private static convertMathToText(content: string): string {
    // Convert display math ($$...$$)
    content = content.replace(/\$\$(.*?)\$\$/gs, (match, expression) => {
      return `\n||MATH||${this.latexToText(expression.trim())}||/MATH||\n`;
    });
    
    // Convert inline math ($...$)
    content = content.replace(/\$([^$\n]+?)\$/g, (match, expression) => {
      return this.latexToText(expression.trim());
    });
    
    return content;
  }

  private static latexToText(latex: string): string {
    // Common LaTeX to text conversions
    const conversions: Record<string, string> = {
      // Fractions
      '\\frac{([^}]+)}{([^}]+)}': '($1)/($2)',
      
      // Square roots
      '\\sqrt{([^}]+)}': '√($1)',
      '\\sqrt\\[([^\\]]+)\\]{([^}]+)}': '$2^(1/$1)',
      
      // Superscripts and subscripts
      '\\^{([^}]+)}': '^($1)',
      '_{([^}]+)}': '_($1)',
      
      // Greek letters
      '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
      '\\epsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ',
      '\\iota': 'ι', '\\kappa': 'κ', '\\lambda': 'λ', '\\mu': 'μ',
      '\\nu': 'ν', '\\xi': 'ξ', '\\pi': 'π', '\\rho': 'ρ',
      '\\sigma': 'σ', '\\tau': 'τ', '\\upsilon': 'υ', '\\phi': 'φ',
      '\\chi': 'χ', '\\psi': 'ψ', '\\omega': 'ω',
      
      // Capital Greek letters
      '\\Alpha': 'Α', '\\Beta': 'Β', '\\Gamma': 'Γ', '\\Delta': 'Δ',
      '\\Epsilon': 'Ε', '\\Zeta': 'Ζ', '\\Eta': 'Η', '\\Theta': 'Θ',
      '\\Iota': 'Ι', '\\Kappa': 'Κ', '\\Lambda': 'Λ', '\\Mu': 'Μ',
      '\\Nu': 'Ν', '\\Xi': 'Ξ', '\\Pi': 'Π', '\\Rho': 'Ρ',
      '\\Sigma': 'Σ', '\\Tau': 'Τ', '\\Upsilon': 'Υ', '\\Phi': 'Φ',
      '\\Chi': 'Χ', '\\Psi': 'Ψ', '\\Omega': 'Ω',
      
      // Mathematical operators
      '\\times': '×', '\\div': '÷', '\\pm': '±', '\\mp': '∓',
      '\\leq': '≤', '\\geq': '≥', '\\neq': '≠', '\\approx': '≈',
      '\\equiv': '≡', '\\propto': '∝', '\\infty': '∞',
      
      // Integrals and sums
      '\\int': '∫', '\\sum': '∑', '\\prod': '∏',
      '\\int_{([^}]+)}\\^{([^}]+)}': '∫[$1 to $2]',
      '\\sum_{([^}]+)}\\^{([^}]+)}': '∑[$1 to $2]',
      
      // Derivatives
      '\\frac{d}{dx}': 'd/dx',
      '\\frac{\\partial}{\\partial ([^}]+)}': '∂/∂$1',
      
      // Common functions
      '\\sin': 'sin', '\\cos': 'cos', '\\tan': 'tan',
      '\\log': 'log', '\\ln': 'ln', '\\exp': 'exp',
      
      // Arrows
      '\\rightarrow': '→', '\\leftarrow': '←', '\\leftrightarrow': '↔',
      '\\Rightarrow': '⇒', '\\Leftarrow': '⇐', '\\Leftrightarrow': '⇔',
      
      // Sets
      '\\mathbb{R}': 'ℝ', '\\mathbb{N}': 'ℕ', '\\mathbb{Z}': 'ℤ',
      '\\mathbb{Q}': 'ℚ', '\\mathbb{C}': 'ℂ',
      
      // Brackets
      '\\left\\(': '(', '\\right\\)': ')',
      '\\left\\[': '[', '\\right\\]': ']',
      '\\left\\{': '{', '\\right\\}': '}',
    };
    
    let result = latex;
    
    // Apply conversions
    Object.entries(conversions).forEach(([pattern, replacement]) => {
      const regex = new RegExp(pattern, 'g');
      result = result.replace(regex, replacement);
    });
    
    // Clean up remaining LaTeX commands
    result = result.replace(/\\[a-zA-Z]+/g, '');
    result = result.replace(/[{}]/g, '');
    
    return result;
  }

  private static convertChemicalFormulas(content: string): string {
    // Convert common chemical formulas
    const chemicalFormulas: Record<string, string> = {
      'H2O': 'H₂O',
      'CO2': 'CO₂',
      'NH3': 'NH₃',
      'CH4': 'CH₄',
      'O2': 'O₂',
      'N2': 'N₂',
      'H2SO4': 'H₂SO₄',
      'CaCO3': 'CaCO₃',
      'NaOH': 'NaOH',
      'HCl': 'HCl',
    };
    
    Object.entries(chemicalFormulas).forEach(([formula, replacement]) => {
      const regex = new RegExp(`\\b${formula}\\b`, 'g');
      content = content.replace(regex, replacement);
    });
    
    // Generic subscript conversion for chemical formulas
    content = content.replace(/([A-Z][a-z]?)(\d+)/g, '$1₍$2₎');
    content = content.replace(/₍(\d)₎/g, (match, digit) => {
      const subscripts = '₀₁₂₃₄₅₆₇₈₉';
      return subscripts[parseInt(digit)];
    });
    
    return content;
  }

  private static async addContentToPDF(pdf: jsPDF, content: string, startY: number): Promise<void> {
    let yPos = startY;
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (yPos > PDFGenerator.PAGE_HEIGHT - PDFGenerator.MARGIN) {
        pdf.addPage();
        yPos = PDFGenerator.MARGIN;
      }
      
      if (line.trim() === '') {
        yPos += PDFGenerator.LINE_HEIGHT;
        continue;
      }
      
      // Handle special formatting
      if (line.startsWith('||HEADING||')) {
        const text = line.replace('||HEADING||', '');
        pdf.setFontSize(PDFGenerator.HEADING_SIZE);
        pdf.setFont('helvetica', 'bold');
        yPos += 5; // Extra space before heading
        pdf.text(text, PDFGenerator.MARGIN, yPos);
        yPos += PDFGenerator.LINE_HEIGHT + 3;
        continue;
      }
      
      if (line.startsWith('||SUBHEADING||')) {
        const text = line.replace('||SUBHEADING||', '');
        pdf.setFontSize(PDFGenerator.SUBHEADING_SIZE);
        pdf.setFont('helvetica', 'bold');
        yPos += 3; // Extra space before subheading
        pdf.text(text, PDFGenerator.MARGIN, yPos);
        yPos += PDFGenerator.LINE_HEIGHT + 2;
        continue;
      }
      
      if (line.startsWith('||MATH||') && line.endsWith('||/MATH||')) {
        const mathText = line.replace('||MATH||', '').replace('||/MATH||', '');
        pdf.setFontSize(PDFGenerator.BODY_SIZE);
        pdf.setFont('helvetica', 'italic');
        yPos += 3; // Extra space before math
        
        // Center mathematical expressions
        const centerX = PDFGenerator.PAGE_WIDTH / 2;
        pdf.text(mathText, centerX, yPos, { align: 'center' });
        yPos += PDFGenerator.LINE_HEIGHT + 3;
        continue;
      }
      
      // Handle regular text with inline formatting
      pdf.setFontSize(PDFGenerator.BODY_SIZE);
      pdf.setFont('helvetica', 'normal');
      
      const processedLine = this.processInlineFormatting(line);
      const wrappedLines = pdf.splitTextToSize(processedLine, PDFGenerator.CONTENT_WIDTH);
      
      for (const wrappedLine of wrappedLines) {
        if (yPos > PDFGenerator.PAGE_HEIGHT - PDFGenerator.MARGIN) {
          pdf.addPage();
          yPos = PDFGenerator.MARGIN;
        }
        
        pdf.text(wrappedLine, PDFGenerator.MARGIN, yPos);
        yPos += PDFGenerator.LINE_HEIGHT;
      }
      
      yPos += 2; // Extra spacing between paragraphs
    }
  }

  private static processInlineFormatting(text: string): string {
    // Remove formatting markers for now (jsPDF doesn't support rich text easily)
    text = text.replace(/\|\|BOLD\|\|(.*?)\|\|\/BOLD\|\|/g, '$1');
    text = text.replace(/\|\|ITALIC\|\|(.*?)\|\|\/ITALIC\|\|/g, '$1');
    
    return text;
  }
}