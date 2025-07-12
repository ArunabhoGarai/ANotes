import React, { useState, useMemo } from 'react';
import { Send, Loader2, AlertCircle, Info, BookOpen, FileText, Type } from 'lucide-react';
import { PDFUpload } from './PDFUpload';
import { ContentExtractor, PageRange } from '../utils/contentExtractor';

interface StudyNoteInputProps {
  onGenerate: (topics: string[], context?: string, useSource?: boolean, pageRanges?: PageRange[]) => void;
  isLoading: boolean;
  error: string | null;
}

export const StudyNoteInput: React.FC<StudyNoteInputProps> = ({
  onGenerate,
  isLoading,
  error
}) => {
  const [topicsInput, setTopicsInput] = useState('');
  const [sourceContent, setSourceContent] = useState('');
  const [useSource, setUseSource] = useState(false);
  const [sourceType, setSourceType] = useState<'text' | 'pdf'>('text');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageRanges, setPageRanges] = useState<PageRange[]>([]);
  const [pdfError, setPdfError] = useState<string>('');
  const [useGeminiPDF, setUseGeminiPDF] = useState(false);

  // Parse topics from comma-separated input
  const parsedTopics = useMemo(() => {
    return topicsInput
      .split(',')
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0);
  }, [topicsInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedTopics.length > 0 && !isLoading) {
      onGenerate(
        parsedTopics, 
        useSource ? sourceContent.trim() || undefined : undefined,
        useSource,
        pageRanges.length > 0 ? pageRanges : undefined,
        useGeminiPDF
      );
    }
  };

  const handlePDFTextExtracted = (text: string, fileName: string, pages?: number) => {
    setSourceContent(text);
    setUploadedFileName(fileName);
    setTotalPages(pages || 0);
    setPdfError('');
    
    // Parse page ranges from the extracted text if it contains page markers
    if (text.includes('--- Page ') && pages) {
      // Extract page numbers that were actually included
      const pageMatches = text.match(/--- Page (\d+) ---/g);
      if (pageMatches) {
        const extractedPageNumbers = pageMatches.map(match => {
          const pageNum = match.match(/\d+/);
          return pageNum ? parseInt(pageNum[0]) : 0;
        }).filter(num => num > 0);
        
        if (extractedPageNumbers.length > 0) {
          // Convert to page ranges
          const ranges: PageRange[] = [];
          let start = extractedPageNumbers[0];
          let end = extractedPageNumbers[0];
          
          for (let i = 1; i < extractedPageNumbers.length; i++) {
            if (extractedPageNumbers[i] === end + 1) {
              end = extractedPageNumbers[i];
            } else {
              ranges.push({ start, end });
              start = extractedPageNumbers[i];
              end = extractedPageNumbers[i];
            }
          }
          ranges.push({ start, end });
          
          setPageRanges(ranges);
        }
      }
    } else {
      setPageRanges([]);
    }
    
    if (text && !useSource) {
      setUseSource(true);
    }
  };

  const handlePDFError = (error: string) => {
    setPdfError(error);
    setSourceContent('');
    setUploadedFileName('');
  };

  const clearSource = () => {
    setSourceContent('');
    setUploadedFileName('');
    setTotalPages(0);
    setPageRanges([]);
    setPdfError('');
    if (sourceType === 'pdf') {
      setUseSource(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="topics" className="block text-sm font-semibold text-gray-700 mb-2">
            Study Topics * ({parsedTopics.length} topic{parsedTopics.length !== 1 ? 's' : ''} detected)
          </label>
          <input
            type="text"
            id="topics"
            value={topicsInput}
            onChange={(e) => setTopicsInput(e.target.value)}
            placeholder="Enter topics separated by commas: Photosynthesis, World War II, Machine Learning, Quantum Physics..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
            disabled={isLoading}
          />
          
          {/* Topic Preview */}
          {parsedTopics.length > 0 && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-600 mb-2">Detected Topics:</p>
              <div className="flex flex-wrap gap-2">
                {parsedTopics.map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {index + 1}. {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={`border rounded-xl p-4 transition-colors duration-200 ${
          useSource 
            ? 'bg-green-50 border-green-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start space-x-2">
            {useSource ? (
              <BookOpen className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            )}
            <div className={`text-sm ${useSource ? 'text-green-700' : 'text-blue-700'}`}>
              <p className="font-medium mb-1">Multi-Topic Generation</p>
              <p>
                {useSource 
                  ? 'Generate notes based on your source material. Each topic will be analyzed against the provided reference content.'
                  : 'Separate multiple topics with commas. Each topic will be processed separately to generate comprehensive, detailed study notes with unlimited length and depth.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Source Content Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-gray-700">
              {useSource ? 'Source Material *' : 'Source Material (Optional)'}
            </label>
            <div className="flex items-center space-x-3">
              <span className={`text-sm font-medium transition-colors duration-200 ${
                useSource ? 'text-gray-500' : 'text-gray-700'
              }`}>
                General Notes
              </span>
              <button
                type="button"
                onClick={() => setUseSource(!useSource)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  useSource ? 'bg-green-600' : 'bg-gray-300'
                }`}
                disabled={isLoading}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                    useSource ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium transition-colors duration-200 ${
                useSource ? 'text-green-700' : 'text-gray-500'
              }`}>
                Use Source
              </span>
            </div>
          </div>

          {/* Helper text that appears only when toggle is off */}
          {!useSource && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>Have a book or text material?</strong> Switch on "Use Source" above to generate notes specifically from your content. 
                This ensures your notes are based exactly on your study material rather than general knowledge.
              </p>
            </div>
          )}

          {/* Source Type Selection */}
          {useSource && (
            <div className="mb-4">
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-sm font-medium text-gray-700">Source Type:</span>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sourceType"
                      value="text"
                      checked={sourceType === 'text'}
                      onChange={(e) => {
                        setSourceType(e.target.value as 'text' | 'pdf');
                        if (e.target.value === 'text') {
                          clearSource();
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <Type className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Text Input</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sourceType"
                      value="pdf"
                      checked={sourceType === 'pdf'}
                      onChange={(e) => {
                        setSourceType(e.target.value as 'text' | 'pdf');
                        if (e.target.value === 'pdf') {
                          setSourceContent('');
                        }
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">PDF Upload</span>
                  </label>
                </div>
              </div>
              
              {/* Gemini PDF Processing Toggle */}
              {sourceType === 'pdf' && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">G</span>
                      </div>
                      <span className="text-sm font-medium text-purple-800">
                        Gemini PDF Processing (Beta)
                      </span>
                    </div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={useGeminiPDF}
                        onChange={(e) => setUseGeminiPDF(e.target.checked)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        disabled={isLoading}
                      />
                      <span className="text-sm text-purple-700">Enable</span>
                    </label>
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    {useGeminiPDF 
                      ? 'PDF will be processed directly by Gemini AI for better understanding of complex layouts, images, and mathematical content.'
                      : 'PDF will be processed locally using text extraction and OCR fallback.'
                    }
                  </p>
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-700">
                      ⚠️ <strong>Warning:</strong> If Gemini upload fails, toggle Gemini PDF processing off.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Text Input */}
          {(!useSource || sourceType === 'text') && (
            <div className="relative">
              <textarea
                id="source"
                value={sourceContent}
                onChange={(e) => setSourceContent(e.target.value)}
                placeholder={useSource 
                  ? "Paste your reference material here (textbook content, research papers, lecture notes, etc.). The AI will generate study notes based specifically on this source content for each topic..."
                  : "Optional: Paste reference material to generate source-based notes, or leave empty for general comprehensive notes..."
                }
                rows={6}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none ${
                  useSource 
                    ? 'border-green-300 focus:ring-green-500 bg-green-50' 
                    : 'border-gray-300 focus:ring-blue-500 bg-gray-100 cursor-not-allowed'
                }`}
                disabled={isLoading || !useSource}
              />
              {useSource && sourceType === 'text' && (
                <div className="absolute top-2 right-2">
                  <Type className="w-5 h-5 text-green-500" />
                </div>
              )}
            </div>
          )}

          {/* PDF Upload */}
          {useSource && sourceType === 'pdf' && (
            <PDFUpload
              onTextExtracted={handlePDFTextExtracted}
              onError={handlePDFError}
              disabled={isLoading}
              useGeminiPDF={useGeminiPDF}
            />
          )}

          {/* Source Content Info */}
          {useSource && sourceContent.trim() && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <BookOpen className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1">
                    Source Content: {sourceContent.length.toLocaleString()} characters{totalPages > 0 && ` from ${totalPages} pages`}
                    {uploadedFileName && (
                      <span className="ml-2 text-green-600">from {uploadedFileName}</span>
                    )}
                  </p>
                  <p className="text-xs text-green-600">
                    AI will automatically find relevant content for each topic from the source material
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Validation Messages */}
          {useSource && !sourceContent.trim() && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <p className="text-xs text-yellow-700">
                  {sourceType === 'pdf' 
                    ? 'Please upload a PDF file when "Use Source" is enabled'
                    : 'Source material is required when "Use Source" is enabled'
                  }
                </p>
              </div>
            </div>
          )}

          {/* PDF Error */}
          {pdfError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-xs text-red-700">{pdfError}</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={parsedTopics.length === 0 || isLoading || (useSource && !sourceContent.trim())}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>
                Generating {parsedTopics.length} {useSource ? 'Source-Based' : ''} Study Note{parsedTopics.length !== 1 ? 's' : ''}...
              </span>
            </>
          ) : (
            <>
              {useSource ? <BookOpen className="w-5 h-5" /> : <Send className="w-5 h-5" />}
              <span>
                Generate {parsedTopics.length} {useSource ? (pageRanges.length > 0 ? 'Page-Specific' : 'Smart-Extracted') : ''} Study Note{parsedTopics.length !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};