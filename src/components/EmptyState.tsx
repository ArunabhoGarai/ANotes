import React from 'react';
import { BookOpen, Lightbulb, Target, Zap } from 'lucide-react';

export const EmptyState: React.FC = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Comprehensive Notes',
      description: 'Get detailed study materials with key concepts, definitions, and examples'
    },
    {
      icon: Lightbulb,
      title: 'Smart Explanations',
      description: 'Complex topics broken down into easy-to-understand explanations'
    },
    {
      icon: Target,
      title: 'Exam Ready',
      description: 'Practice questions and review points to help you prepare for tests'
    },
    {
      icon: Zap,
      title: 'Instant Generation',
      description: 'AI-powered notes generated in seconds, not hours'
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
          <BookOpen className="w-10 h-10 text-white" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800">
            Generate Your First Study Notes
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Enter any topic above and let our AI create comprehensive, 
            detailed study notes to help you learn faster and more effectively.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
              <div className="flex-shrink-0">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800 text-sm">{feature.title}</h3>
                <p className="text-gray-600 text-xs mt-1">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
          <p className="text-sm text-blue-700">
            <strong>Pro Tips:</strong> Be specific with your topics for better results. 
            Use commas to separate multiple topics: "Photosynthesis, World War II, Machine Learning"
          </p>
        </div>
      </div>
    </div>
  );
};