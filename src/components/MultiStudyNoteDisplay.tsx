import React, { useState } from 'react';
import { Copy, Download, Heart, Clock, Tag, ChevronDown, ChevronUp, AlertTriangle, FileDown, FileText, BookOpen } from 'lucide-react';
import { StudyNote } from '../types';
import { ContentParser } from '../utils/contentParser';

interface MultiStudyNoteDisplayProps {
  studyNotes: StudyNote[];
  onCopy: (noteId: string) => void;
  onDownload: (noteId: string) => void;
  onSave: (noteId: string) => void;
  onDownloadAll: () => void;
  onDownloadAllPDF: () => void;
}

export const MultiStudyNoteDisplay: React.FC<MultiStudyNoteDisplayProps> = ({
  studyNotes,
  onCopy,
  onDownload,
  onSave,
  onDownloadAll,
  onDownloadAllPDF
}) => {
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set(studyNotes.map(note => note.id)));

  const toggleExpanded = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  const expandAll = () => {
    setExpandedNotes(new Set(studyNotes.map(note => note.id)));
  };

  const collapseAll = () => {
    setExpandedNotes(new Set());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const successfulNotes = studyNotes.filter(note => !note.error);
  const failedNotes = studyNotes.filter(note => note.error);

  // Initialize math rendering when component mounts or content changes
  React.useEffect(() => {
    const timer = setTimeout(() => {
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
    }, 300);
    
    return () => clearTimeout(timer);
  }, [studyNotes, expandedNotes]);
  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Study Notes Generated ({studyNotes.length} topic{studyNotes.length !== 1 ? 's' : ''})
            </h2>
            <p className="text-gray-600 mt-1">
              {successfulNotes.length} successful, {failedNotes.length} failed
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={expandAll}
              className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              Collapse All
            </button>
            {successfulNotes.length > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onDownloadAll}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <FileDown className="w-4 h-4" />
                  <span>TXT</span>
                </button>
                <button
                  onClick={onDownloadAllPDF}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  <FileText className="w-4 h-4" />
                  <span>PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {failedNotes.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800 mb-1">Some topics failed to generate</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {failedNotes.map((note, index) => (
                    <li key={index}>• {note.topic}: {note.error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Individual Notes */}
      {studyNotes.map((studyNote) => (
        <div key={studyNote.id} className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className={`px-6 py-4 border-b border-gray-200 ${studyNote.error ? 'bg-red-50' : 'bg-gradient-to-r from-gray-50 to-gray-100'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h3 className="text-xl font-bold text-gray-800">{studyNote.title}</h3>
                  {studyNote.error && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Failed
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(studyNote.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Tag className="w-4 h-4" />
                    <span>{studyNote.topic}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!studyNote.error && (
                  <>
                    <button
                      onClick={() => onCopy(studyNote.id)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDownload(studyNote.id)}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                      title="Download as text"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onSave(studyNote.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Save to favorites"
                    >
                      <Heart className="w-5 h-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => toggleExpanded(studyNote.id)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  title={expandedNotes.has(studyNote.id) ? "Collapse" : "Expand"}
                >
                  {expandedNotes.has(studyNote.id) ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {expandedNotes.has(studyNote.id) && (
            <>
              {studyNote.error ? (
                <div className="p-6">
                  <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Failed to generate study notes</p>
                      <p className="text-sm text-red-700 mt-1">{studyNote.error}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="prose prose-gray max-w-none math-content">
                    <div 
                      className="text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: ContentParser.parseContent(studyNote.content)
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Tags */}
              {studyNote.tags.length > 0 && !studyNote.error && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {studyNote.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
};