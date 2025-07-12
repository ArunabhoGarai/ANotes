import { OCRProcessor } from './ocrProcessor';

export interface PDFExtractionResult {
  text: string;
  totalPages: number;
}

export class PDFParser {
  static async extractTextFromPDF(
    file: File, 
    onProgress?: (progress: { 
      stage: 'parsing' | 'ocr'; 
      page?: number; 
      totalPages?: number; 
      ocrProgress?: { status: string; progress: number } 
    }) => void
  ): Promise<PDFExtractionResult> {
    try {
      if (onProgress) {
        onProgress({ stage: 'parsing' });
      }

      // Use pdfjs-dist instead of pdf-parse for browser compatibility
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source for PDF.js
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      const numPages = pdf.numPages;
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items from the page
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        if (pageText.trim()) {
          fullText += `--- Page ${pageNum} ---\n\n${pageText}\n\n`;
        }
      }
      
      // Check if we got meaningful text content
      const hasText = fullText && fullText.trim().length > 50; // Minimum threshold
      
      if (!hasText) {
        // Try OCR as fallback
        console.log('No text found in PDF, attempting OCR...');
        
        if (onProgress) {
          onProgress({ stage: 'ocr' });
        }

        const ocrText = await OCRProcessor.processPDFWithOCR(file, (ocrProgress) => {
          if (onProgress) {
            onProgress({
              stage: 'ocr',
              page: ocrProgress.page,
              totalPages: ocrProgress.totalPages,
              ocrProgress: ocrProgress.ocrProgress
            });
          }
        });

        return {
          text: this.cleanupText(ocrText),
          totalPages: numPages
        };
      }
      
      return {
        text: this.cleanupText(fullText),
        totalPages: numPages
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      
      // If PDF.js fails, try OCR as fallback
      console.log('PDF.js failed, attempting OCR fallback...');
      
      try {
        if (onProgress) {
          onProgress({ stage: 'ocr' });
        }

        const ocrText = await OCRProcessor.processPDFWithOCR(file, (ocrProgress) => {
          if (onProgress) {
            onProgress({
              stage: 'ocr',
              page: ocrProgress.page,
              totalPages: ocrProgress.totalPages,
              ocrProgress: ocrProgress.ocrProgress
            });
          }
        });

        // For OCR, we need to estimate total pages from the original PDF
        try {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          
          return {
            text: this.cleanupText(ocrText),
            totalPages: pdf.numPages
          };
        } catch {
          // If we can't get page count, estimate from OCR text
          const estimatedPages = Math.max(1, Math.ceil(ocrText.length / 2000));
          return {
            text: this.cleanupText(ocrText),
            totalPages: estimatedPages
          };
        }
      } catch (ocrError) {
        console.error('OCR fallback also failed:', ocrError);
        throw new Error('Failed to process PDF. This might be a corrupted file or an unsupported PDF format.');
      }
    }
  }

  private static cleanupText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove page numbers and headers/footers (basic cleanup)
      .replace(/^\d+\s*$/gm, '')
      // Remove excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  static validatePDFFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return { isValid: false, error: 'Please select a PDF file.' };
    }
    
    // Check file size (limit to 100MB for OCR support)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      return { isValid: false, error: 'PDF file is too large. Please select a file smaller than 100MB.' };
    }
    
    // Check if file is empty
    if (file.size === 0) {
      return { isValid: false, error: 'The selected file is empty.' };
    }
    
    return { isValid: true };
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}