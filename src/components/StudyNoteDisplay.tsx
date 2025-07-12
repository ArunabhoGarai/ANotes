import React from 'react';
import { Copy, Download, Heart, Clock, Tag } from 'lucide-react';
import { StudyNote } from '../types';
import { ContentParser } from '../utils/contentParser';

interface StudyNoteDisplayProps {
  studyNote: StudyNote;
  onCopy: () => void;
  onDownload: () => void;
  onSave: () => void;
}

export const StudyNoteDisplay: React.FC<StudyNoteDisplayProps> = ({
  studyNote,
  onCopy,
  onDownload,
  onSave
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Initialize math rendering when component mounts
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).renderMathInElement) {
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
  }, [studyNote]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-800 mb-2">{studyNote.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
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
            <button
              onClick={onCopy}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="Copy to clipboard"
            >
              <Copy className="w-5 h-5" />
            </button>
            <button
              onClick={onDownload}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
              title="Download as text"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onSave}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="Save to favorites"
            >
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
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

      {/* Tags */}
      {studyNote.tags.length > 0 && (
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
    </div>
  );
};