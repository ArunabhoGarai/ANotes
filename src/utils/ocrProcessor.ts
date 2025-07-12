import Tesseract from 'tesseract.js';

export interface OCRProgress {
  status: string;
  progress: number;
}

export class OCRProcessor {
  private static worker: Tesseract.Worker | null = null;

  static async initializeWorker(): Promise<Tesseract.Worker> {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker('eng', 1, {
        logger: m => {
          // Optional: Log OCR progress
          console.log('OCR Progress:', m);
        }
      });
    }
    return this.worker;
  }

  static async terminateWorker(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  static async extractTextFromImage(
    imageData: string | File | ImageData | HTMLCanvasElement,
    onProgress?: (progress: OCRProgress) => void
  ): Promise<string> {
    try {
      const worker = await this.initializeWorker();
      
      const { data } = await worker.recognize(imageData, {
        logger: (m) => {
          if (onProgress && m.status && typeof m.progress === 'number') {
            onProgress({
              status: m.status,
              progress: Math.round(m.progress * 100)
            });
          }
        }
      });

      return data.text.trim();
    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async convertPDFPagesToImages(file: File): Promise<HTMLCanvasElement[]> {
    try {
      // Dynamic import to avoid bundling issues
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const canvases: HTMLCanvasElement[] = [];
      const numPages = pdf.numPages;

      for (let pageNum = 1; pageNum <= Math.min(numPages, 10); pageNum++) { // Limit to first 10 pages
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          throw new Error('Could not get canvas context');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        canvases.push(canvas);
      }

      return canvases;
    } catch (error) {
      console.error('PDF to image conversion error:', error);
      throw new Error(`Failed to convert PDF to images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async processPDFWithOCR(
    file: File,
    onProgress?: (progress: { page: number; totalPages: number; ocrProgress: OCRProgress }) => void
  ): Promise<string> {
    try {
      // Convert PDF pages to images
      const canvases = await this.convertPDFPagesToImages(file);
      
      if (canvases.length === 0) {
        throw new Error('No pages found in PDF');
      }

      let fullText = '';
      
      // Process each page with OCR
      for (let i = 0; i < canvases.length; i++) {
        const canvas = canvases[i];
        
        const pageText = await this.extractTextFromImage(canvas, (ocrProgress) => {
          if (onProgress) {
            onProgress({
              page: i + 1,
              totalPages: canvases.length,
              ocrProgress
            });
          }
        });

        if (pageText.trim()) {
          fullText += `\n\n--- Page ${i + 1} ---\n\n${pageText}`;
        }
      }

      if (!fullText.trim()) {
        throw new Error('No text could be extracted from the PDF using OCR');
      }

      // Clean up the extracted text
      const cleanText = fullText
        .replace(/\s+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      return cleanText;
    } catch (error) {
      console.error('PDF OCR processing error:', error);
      throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  static async processImageFile(
    file: File,
    onProgress?: (progress: OCRProgress) => void
  ): Promise<string> {
    try {
      const text = await this.extractTextFromImage(file, onProgress);
      
      if (!text.trim()) {
        throw new Error('No text could be extracted from the image');
      }

      return text.trim();
    } catch (error) {
      console.error('Image OCR processing error:', error);
      throw new Error(`Image OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static formatConfidence(confidence: number): string {
    return `${Math.round(confidence)}%`;
  }
}