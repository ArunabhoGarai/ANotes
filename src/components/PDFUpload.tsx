import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle, Loader2, Eye, Zap, Hash, Link, Globe } from 'lucide-react';
import { PDFParser } from '../utils/pdfParser';
import { OCRProcessor } from '../utils/ocrProcessor';
import { ContentExtractor, PageRange } from '../utils/contentExtractor';
import { GeminiService } from '../services/gemini';
import { GoogleDriveConverter } from '../utils/googleDriveConverter';
import { cdnUploadService } from '../services/cdnUpload';

interface PDFUploadProps {
  onTextExtracted: (text: string, fileName: string, totalPages?: number) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  useGeminiPDF?: boolean;
}

export const PDFUpload: React.FC<PDFUploadProps> = ({
  onTextExtracted,
  onError,
  disabled = false,
  useGeminiPDF = true,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [processingStage, setProcessingStage] = useState<'parsing' | 'ocr'>('parsing');
  const [ocrProgress, setOcrProgress] = useState<{
    page?: number;
    totalPages?: number;
    status?: string;
    progress?: number;
  }>({});
  const [usePageRange, setUsePageRange] = useState(false);
  const [pageRangeInput, setPageRangeInput] = useState('');
  const [geminiUploadStatus, setGeminiUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [pdfUrl, setPdfUrl] = useState('');
  const [isGoogleDriveLink, setIsGoogleDriveLink] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState('');
  const [cdnUploadStatus, setCdnUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'failed'>('idle');
  const [cdnUrl, setCdnUrl] = useState('');

  const handleFileSelect = useCallback(async (file: File) => {
    if (disabled) return;

    // Validate file
    const validation = PDFParser.validatePDFFile(file);
    if (!validation.isValid) {
      onError(validation.error || 'Invalid file');
      return;
    }

    setIsProcessing(true);
    setUploadedFile(file);
    setProcessingStage('parsing');
    setOcrProgress({});
    setPageRangeInput('');

    try {
      if (useGeminiPDF) {
        // Try CDN upload first for Gemini processing
        setCdnUploadStatus('uploading');
        const cdnResult = await cdnUploadService.uploadPDF(file);
        
        if (cdnResult.success && cdnResult.url) {
          setCdnUploadStatus('success');
          setCdnUrl(cdnResult.url);
          
          console.log('File.io upload successful:', cdnResult.url);
          
          // Now process the CDN URL with Gemini
          setGeminiUploadStatus('uploading');
          const geminiService = GeminiService.getInstance();
          await geminiService.uploadPDFFromURL(cdnResult.url);
          setGeminiUploadStatus('success');
          
          setExtractedText('PDF uploaded to CDN and processed by Gemini');
          setTotalPages(0);
          onTextExtracted('GEMINI_PDF_UPLOADED', file.name, 0);
        } else {
          setCdnUploadStatus('failed');
          console.log('File.io upload failed, falling back to direct Gemini upload');
          
          // Fallback to direct Gemini upload
          setGeminiUploadStatus('uploading');
          const geminiService = GeminiService.getInstance();
          await geminiService.uploadPDFFile(file);
          setGeminiUploadStatus('success');
          
          setExtractedText('PDF uploaded directly to Gemini for processing');
          setTotalPages(0);
          onTextExtracted('GEMINI_PDF_UPLOADED', file.name, 0);
        }
      } else {
        // Use local processing
        const { text, totalPages: pages } = await PDFParser.extractTextFromPDF(file, (progress) => {
          setProcessingStage(progress.stage);
          if (progress.stage === 'ocr') {
            setOcrProgress({
              page: progress.page,
              totalPages: progress.totalPages,
              status: progress.ocrProgress?.status,
              progress: progress.ocrProgress?.progress
            });
          }
        });
        setExtractedText(text);
        setTotalPages(pages);
        onTextExtracted(text, file.name, pages);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process PDF';
      onError(errorMessage);
      setUploadedFile(null);
      setExtractedText('');
      setTotalPages(0);
      setGeminiUploadStatus('error');
    } finally {
      setIsProcessing(false);
      setProcessingStage('parsing');
      setOcrProgress({});
    }
  }, [onTextExtracted, onError, disabled]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');

    if (pdfFile) {
      handleFileSelect(pdfFile);
    } else {
      onError('Please drop a PDF file');
    }
  }, [handleFileSelect, onError, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFileSelect]);

  const clearFile = useCallback(() => {
    setUploadedFile(null);
    setExtractedText('');
    setTotalPages(0);
    setProcessingStage('parsing');
    setOcrProgress({});
    setCdnUploadStatus('idle');
    setCdnUrl('');
    setUsePageRange(false);
    setPageRangeInput('');
    onTextExtracted('', '', 0);
    setPdfUrl('');
    setGeminiUploadStatus('idle');
    setIsGoogleDriveLink(false);
    setConvertedUrl('');
    
    // Clear Gemini uploaded file if it exists
    if (useGeminiPDF) {
      const geminiService = GeminiService.getInstance();
      geminiService.clearUploadedFile();
    }
    setPdfUrl('');
  }, [onTextExtracted]);

  // Check if URL is Google Drive link and convert it
  const handleUrlChange = useCallback((url: string) => {
    setPdfUrl(url);
    
    if (GoogleDriveConverter.isGoogleDriveLink(url)) {
      setIsGoogleDriveLink(true);
      const directUrl = GoogleDriveConverter.convertToDirectLink(url);
      setConvertedUrl(directUrl);
    } else {
      setIsGoogleDriveLink(false);
      setConvertedUrl('');
    }
  }, []);

  const handleUrlUpload = useCallback(async () => {
    if (!pdfUrl.trim() || disabled) return;

    setIsProcessing(true);
    setGeminiUploadStatus('uploading');
    setProcessingStage('parsing');

    try {
      // Use converted URL if it's a Google Drive link
      const urlToUse = isGoogleDriveLink && convertedUrl ? convertedUrl : pdfUrl.trim();
      
      if (useGeminiPDF) {
        // Use Gemini URL processing - upload the PDF to Gemini service
        const geminiService = GeminiService.getInstance();
        await geminiService.uploadPDFFromURL(urlToUse);
        setGeminiUploadStatus('success');
        setUploadedFile({ name: 'PDF from URL' } as File);
        setExtractedText('PDF uploaded to Gemini from URL for processing');
        setTotalPages(0);
        onTextExtracted('GEMINI_PDF_UPLOADED', 'PDF from URL', 0);
      } else {
        // Fetch and process locally
        const response = await fetch(urlToUse);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const file = new File([blob], 'PDF from URL', { type: 'application/pdf' });
        await handleFileSelect(file);
      }
    } catch (error) {
      let errorMessage = 'Failed to process PDF from URL';
      
      if (error instanceof Error) {
        if (error.message.startsWith('CORS_BLOCKED:')) {
          errorMessage = error.message.replace('CORS_BLOCKED: ', '') + '\n\nTip: Try using a PDF from Google Drive, Dropbox, or other services that support cross-origin requests.';
        } else if (error.message.startsWith('MIXED_CONTENT:')) {
          errorMessage = error.message.replace('MIXED_CONTENT: ', '') + '\n\nTip: Look for HTTPS versions of the PDF URL.';
        } else {
          errorMessage = error.message;
        }
      }
      
      onError(errorMessage);
      setGeminiUploadStatus('error');
    } finally {
      setIsProcessing(false);
    }
  }, [pdfUrl, disabled, useGeminiPDF, handleFileSelect, onTextExtracted, onError, isGoogleDriveLink, convertedUrl]);
  const handlePageRangeChange = useCallback((rangeString: string) => {
    setPageRangeInput(rangeString);
    
    if (rangeString.trim() && extractedText && totalPages > 0) {
      try {
        const ranges = ContentExtractor.parsePageRanges(rangeString);
        const validation = ContentExtractor.validatePageRanges(ranges, totalPages);
        
        if (validation.isValid && ranges.length > 0) {
          // Extract content from specified page ranges
          const pages = extractedText.split(/--- Page \d+ ---/);
          let rangeContent = '';
          const extractedPages: number[] = [];
          
          for (const range of ranges) {
            for (let i = range.start; i <= range.end; i++) {
              if (pages[i - 1]) {
                rangeContent += `\n\n--- Page ${i} ---\n\n${pages[i - 1]}`;
                extractedPages.push(i);
              }
            }
          }
          
          onTextExtracted(rangeContent.trim(), uploadedFile?.name || '', totalPages);
        } else if (!validation.isValid) {
          onError(validation.error || 'Invalid page range');
        }
      } catch (error) {
        onError('Invalid page range format. Use format like: 1-5, 10-15, 20');
      }
    } else if (!rangeString.trim() && extractedText) {
      // Reset to full text if range is cleared
      onTextExtracted(extractedText, uploadedFile?.name || '', totalPages);
    }
  }, [extractedText, totalPages, uploadedFile, onTextExtracted, onError]);

  const getProcessingMessage = () => {
    if (processingStage === 'parsing') {
      return {
        title: 'Processing PDF...',
        subtitle: 'Extracting text content from your book',
        icon: FileText
      };
    } else {
      const { page, totalPages, status, progress } = ocrProgress;
      return {
        title: 'OCR Processing...',
        subtitle: page && totalPages 
          ? `Processing page ${page} of ${totalPages} (${status || 'processing'}${progress ? ` - ${progress}%` : ''})`
          : 'Converting scanned pages to text using OCR',
        icon: Eye
      };
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Method Selection */}
      {useGeminiPDF && (
        <div className="flex items-center space-x-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <span className="text-sm font-medium text-purple-800">Upload Method:</span>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="uploadMethod"
                value="file"
                checked={uploadMethod === 'file'}
                onChange={(e) => {
                  setUploadMethod(e.target.value as 'file' | 'url');
                  if (e.target.value === 'file') {
                    setPdfUrl('');
                  }
                }}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                disabled={isProcessing}
              />
              <Upload className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-purple-700">File Upload</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="uploadMethod"
                value="url"
                checked={uploadMethod === 'url'}
                onChange={(e) => {
                  setUploadMethod(e.target.value as 'file' | 'url');
                  if (e.target.value === 'url') {
                    clearFile();
                  }
                }}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                disabled={isProcessing}
              />
              <Globe className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-purple-700">URL Link</span>
            </label>
          </div>
        </div>
      )}

      {/* URL Input */}
      {useGeminiPDF && uploadMethod === 'url' && (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-500" />
              <input
                type="url"
                value={pdfUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Insert direct link of webpage containing pdf"
                className="w-full pl-10 pr-4 py-3 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                disabled={isProcessing}
              />
            </div>
            <button
              onClick={handleUrlUpload}
              disabled={!pdfUrl.trim() || isProcessing}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              <span>Upload</span>
            </button>
          </div>
          
          {/* Google Drive Link Detection */}
          {isGoogleDriveLink && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 mb-1">
                    ⚠️ Google Drive Link Detected
                  </p>
                  <p className="text-xs text-yellow-700 mb-2">
                    Google Drive links often fail due to CORS restrictions. Converted link:
                  </p>
                  <div className="bg-white border border-yellow-200 rounded p-2 mb-2">
                    <p className="text-xs text-gray-600 font-mono break-all">
                      {convertedUrl}
                    </p>
                  </div>
                  <p className="text-xs text-yellow-600 font-medium">
                    💡 Recommendation: Use file upload or try alternative hosting services for better reliability.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <p className="text-xs text-purple-600">
              Enter a direct PDF URL. Google Drive links may not work due to CORS restrictions.
            </p>
            
            {/* Google Drive Instructions */}
            <details className="text-xs text-purple-600">
              <summary className="cursor-pointer hover:text-purple-700 font-medium">
                📋 How to share from Google Drive
              </summary>
              <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded">
                <p className="text-xs text-red-600 font-medium mb-2">⚠️ Google Drive links often don't work due to CORS restrictions</p>
                <ol className="list-decimal list-inside space-y-1 text-purple-700">
                  {GoogleDriveConverter.getSharingInstructions().map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs font-medium text-blue-800 mb-1">💡 Better Alternatives:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-700 text-xs">
                    {GoogleDriveConverter.getAlternativeHostingOptions().map((option, index) => (
                      <li key={index}>{option}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </details>
          </div>
        </div>
      )}
      {/* Upload Area */}
      {(!useGeminiPDF || uploadMethod === 'file') && (
        <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : isDragOver
            ? 'border-blue-400 bg-blue-50'
            : uploadedFile
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 cursor-pointer'
        }`}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          disabled={disabled || isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          {isProcessing ? (
            (() => {
              if (useGeminiPDF && geminiUploadStatus === 'uploading') {
                if (cdnUploadStatus === 'uploading') {
                  return (
                    <>
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded flex items-center justify-center">
                          <span className="text-white text-sm font-bold">CDN</span>
                        </div>
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin absolute -top-1 -right-1" />
                      </div>
                      <p className="text-sm font-medium text-blue-700">Uploading to CDN...</p>
                      <p className="text-xs text-blue-600 text-center max-w-xs">
                        Uploading PDF to CDN for reliable access by Gemini AI
                      </p>
                    </>
                  );
                } else {
                  return (
                    <>
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded flex items-center justify-center">
                          <span className="text-white text-sm font-bold">G</span>
                        </div>
                        <Loader2 className="w-4 h-4 text-purple-500 animate-spin absolute -top-1 -right-1" />
                      </div>
                      <p className="text-sm font-medium text-purple-700">Processing with Gemini...</p>
                      <p className="text-xs text-purple-600 text-center max-w-xs">
                        {cdnUploadStatus === 'success' 
                          ? 'CDN upload successful! Now processing with Gemini AI'
                          : 'Processing PDF directly with Gemini AI'
                        }
                      </p>
                    </>
                  );
                }
              } else {
                const { title, subtitle, icon: Icon } = getProcessingMessage();
                return (
                  <>
                    <div className="relative">
                      <Icon className="w-8 h-8 text-blue-600" />
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin absolute -top-1 -right-1" />
                    </div>
                    <p className="text-sm font-medium text-blue-700">{title}</p>
                    <p className="text-xs text-blue-600 text-center max-w-xs">{subtitle}</p>
                    {processingStage === 'ocr' && ocrProgress.progress && (
                      <div className="w-48 h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-300 ease-out"
                          style={{ width: `${ocrProgress.progress}%` }}
                        />
                      </div>
                    )}
                  </>
                );
              }
            })()
          ) : uploadedFile ? (
            useGeminiPDF && geminiUploadStatus === 'success' ? (
              <>
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded flex items-center justify-center">
                  <span className="text-white text-sm font-bold">G</span>
                </div>
                <p className="text-sm font-medium text-purple-700">
                  {cdnUploadStatus === 'success' ? 'PDF Uploaded via CDN to Gemini' : 'PDF Uploaded to Gemini'}
                </p>
                <div className="text-center">
                  <p className="text-xs text-purple-600">{uploadedFile.name}</p>
                  <p className="text-xs text-purple-500">
                    {PDFParser.formatFileSize(uploadedFile.size)} • 
                    {cdnUploadStatus === 'success' ? ' CDN hosted • ' : ' '}
                    Ready for AI processing
                  </p>
                  {cdnUrl && (
                    <p className="text-xs text-green-600 mt-1">
                      File.io CDN URL: {cdnUrl.substring(0, 50)}...
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="w-8 h-8 text-green-600" />
                <p className="text-sm font-medium text-green-700">PDF Uploaded Successfully</p>
                <div className="text-center">
                  <p className="text-xs text-green-600">{uploadedFile.name}</p>
                  <p className="text-xs text-green-500">
                    {PDFParser.formatFileSize(uploadedFile.size)} • {extractedText.length.toLocaleString()} characters extracted
                  </p>
                </div>
              </>
            )
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  Drop your PDF book here or click to browse
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {useGeminiPDF 
                    ? 'PDF will be processed directly by Gemini AI'
                    : 'Supports PDF files up to 100MB • OCR enabled for scanned documents • File.io CDN integration'
                  }
                </p>
              </div>
            </>
          )}
        </div>

        {uploadedFile && !isProcessing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearFile();
            }}
            className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors duration-200"
            title="Remove file"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
        </div>
      )}

      {/* File Info */}
      {uploadedFile && !isProcessing && (
        <div className={`border rounded-lg p-4 ${
          useGeminiPDF && geminiUploadStatus === 'success'
            ? 'bg-purple-50 border-purple-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-start space-x-3">
            {useGeminiPDF && geminiUploadStatus === 'success' ? (
              <div className="w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">G</span>
              </div>
            ) : (
              <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-medium truncate ${
                useGeminiPDF && geminiUploadStatus === 'success' ? 'text-purple-800' : 'text-green-800'
              }`}>
                {uploadedFile.name}
              </h4>
              <div className="mt-1 space-y-1">
                <p className={`text-xs ${
                  useGeminiPDF && geminiUploadStatus === 'success' ? 'text-purple-700' : 'text-green-700'
                }`}>
                  <span className="font-medium">Size:</span> {PDFParser.formatFileSize(uploadedFile.size)}
                </p>
                {!useGeminiPDF && (
                  <p className="text-xs text-green-700">
                    <span className="font-medium">Text extracted:</span> {extractedText.length.toLocaleString()} characters
                  </p>
                )}
                {totalPages > 0 && !useGeminiPDF && (
                  <p className="text-xs text-green-700">
                    <span className="font-medium">Total pages:</span> {totalPages}
                  </p>
                )}
                <p className={`text-xs ${
                  useGeminiPDF && geminiUploadStatus === 'success' ? 'text-purple-600' : 'text-green-600'
                }`}>
                  {useGeminiPDF 
                    ? `Ready for Gemini AI processing${cdnUploadStatus === 'success' ? ' (via File.io CDN)' : ''} - supports complex layouts, images, and mathematical content`
                    : 'Ready to generate source-based study notes from this book content'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing Info */}
      {isProcessing && (
        <div className={`border rounded-lg p-4 ${
          processingStage === 'ocr' 
            ? 'bg-purple-50 border-purple-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            {processingStage === 'ocr' ? (
              <>
                <Eye className="w-4 h-4 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm text-purple-700 font-medium">
                    OCR Processing Active
                  </p>
                  <p className="text-xs text-purple-600">
                    {ocrProgress.page && ocrProgress.totalPages 
                      ? `Processing page ${ocrProgress.page} of ${ocrProgress.totalPages}`
                      : 'Converting scanned document to searchable text'
                    }
                  </p>
                  {ocrProgress.progress && (
                    <div className="mt-2 w-full h-1.5 bg-purple-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 transition-all duration-300 ease-out"
                        style={{ width: `${ocrProgress.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                <p className="text-sm text-blue-700">
                  Extracting text from PDF... This may take a moment for larger files.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* OCR Info Banner */}
      {!isProcessing && !uploadedFile && !useGeminiPDF && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Zap className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-purple-800 mb-1">
                OCR-Powered Text Extraction
              </h4>
              <p className="text-xs text-purple-700 leading-relaxed">
                Our system automatically detects and processes both regular PDFs and scanned documents. 
                Scanned textbooks, research papers, and image-based PDFs are converted to searchable text using advanced OCR technology.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Gemini PDF Info Banner */}
      {!isProcessing && !uploadedFile && useGeminiPDF && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">G</span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-purple-800 mb-1">
                Gemini AI PDF Processing with File.io CDN (Beta)
              </h4>
              <p className="text-xs text-purple-700 leading-relaxed">
                Your PDF will be uploaded to File.io CDN first, then processed by Gemini AI for advanced understanding of:
                complex layouts, embedded images, mathematical equations, charts, diagrams, and multi-column text. 
                File.io CDN hosting ensures reliable access and better processing results.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};