import React from 'react';
import { Brain, Sparkles } from 'lucide-react';

export const LoadingAnimation: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-gray-800">
            AI is analyzing your topics...
          </h3>
          <p className="text-gray-600 max-w-md">
            Gemini 2.0 Flash is generating comprehensive study notes for each topic. 
            Multiple topics are processed simultaneously for faster results.
          </p>
        </div>

        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};