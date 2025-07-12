import React from 'react';
import { BookOpen, Github, Mail, Home } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { User } from '../hooks/useAuth';

interface HeaderProps {
  user: User | null;
  onSignInClick: () => void;
  onSignOut: () => void;
  showHomeButton?: boolean;
  onHomeClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  onSignInClick, 
  onSignOut, 
  showHomeButton = false,
  onHomeClick 
}) => {
  return (
    <header className="bg-gray-900/95 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            className={`flex items-center space-x-3 ${showHomeButton && onHomeClick ? 'cursor-pointer group' : ''}`}
            onClick={showHomeButton && onHomeClick ? onHomeClick : undefined}
          >
            <div className="relative">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition-all duration-300"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                ANotes
              </h1>
              <p className="text-gray-400 text-xs">by Arunabho, LLC</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {showHomeButton && onHomeClick && (
              <button
                onClick={onHomeClick}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200 group"
              >
                <Home className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                <span>Home</span>
              </button>
            )}
            <a
              href="https://github.com/DorachanCodes"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200 group"
            >
              <Github className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              <span>GitHub</span>
            </a>
            <a
              href="mailto:arunabhogarai72@gmail.com"
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-200 group"
            >
              <Mail className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              <span>Contact Us</span>
            </a>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <UserMenu user={user} onSignOut={onSignOut} />
            ) : (
              <button
                onClick={onSignInClick}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};