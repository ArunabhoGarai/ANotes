import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, BookOpen, Settings, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  onSignOut: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 rounded-lg px-3 py-2 transition-colors duration-200 backdrop-blur-sm"
      >
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-white">
            {getInitials(user.name, user.email)}
          </span>
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-white">
            {user.name || user.email.split('@')[0]}
          </p>
          <p className="text-xs text-blue-100">{user.email}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-xl shadow-lg border border-gray-700 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {getInitials(user.name, user.email)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                // TODO: Navigate to saved notes
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors duration-200"
            >
              <BookOpen className="w-4 h-4 text-gray-400" />
              <span>My Saved Notes</span>
            </button>
            
            <button
              onClick={() => {
                setIsOpen(false);
                // TODO: Navigate to settings
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors duration-200"
            >
              <Settings className="w-4 h-4 text-gray-400" />
              <span>Settings</span>
            </button>
          </div>

          {/* Sign Out */}
          <div className="border-t border-gray-700 pt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};