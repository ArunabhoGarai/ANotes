import React from 'react';
import { useState, useEffect } from 'react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { StudyNoteInput } from './components/StudyNoteInput';
import { MultiStudyNoteDisplay } from './components/MultiStudyNoteDisplay';
import { LoadingAnimation } from './components/LoadingAnimation';
import { EmptyState } from './components/EmptyState';
import { AuthModal } from './components/AuthModal';
import { useStudyNotes } from './hooks/useStudyNotes';
import { useAuth } from './hooks/useAuth';

function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showHomePage, setShowHomePage] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const { user, signIn, signUp, signOut, signInWithGoogle, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const {
    currentNotes,
    isLoading,
    error,
    generateNotes,
    copyNote,
    downloadNote,
    saveNote,
    downloadAllNotes,
    downloadAllNotesAsPDF
  } = useStudyNotes(isAuthenticated);

  // Handle initialization and OAuth callback
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 2000); // Give auth time to initialize

    return () => clearTimeout(timer);
  }, []);

  // Handle OAuth callback cleanup
  useEffect(() => {
    const currentHash = window.location.hash;
    const currentPath = window.location.pathname;
    
    // Check if this is an auth callback
    if (currentHash.includes('access_token') || currentPath === '/auth/callback') {
      // Clean up the URL after a short delay to allow auth processing
      const timer = setTimeout(() => {
        window.history.replaceState({}, document.title, '/');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Show loading during auth initialization
  if (authIsLoading || isInitializing) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative group">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ANotes
          </h1>
          <p className="text-gray-400">Initializing...</p>
        </div>
      </div>
    );
  }
  const handleAuth = async (email: string, password: string, name?: string) => {
    setAuthLoading(true);
    setAuthError(null);
    
    try {
      if (authMode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password, name!);
      }
      setAuthModalOpen(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setAuthError(null);
    
    try {
      await signInWithGoogle();
      setAuthModalOpen(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Google authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignInClick = () => {
    setAuthMode('signin');
    setAuthError(null);
    setAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Show auth modal if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -inset-10 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </div>
        </div>
        
        <div className="text-center space-y-8 p-8">
          <div className="space-y-4">
            <div className="relative group">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl group-hover:shadow-blue-500/50 transition-all duration-300">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-20 blur transition-all duration-300"></div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ANotes
            </h1>
            <p className="text-gray-400 text-sm">by Arunabho, LLC</p>
            <p className="text-xl text-gray-300 max-w-md mx-auto">
              Transform your learning with AI-powered study notes
            </p>
          </div>
          
          <button
            onClick={handleSignInClick}
            className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-8 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200 shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-1"
          >
            <div className="flex items-center space-x-2">
              <span>Sign In to Get Started</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </button>
        </div>
        
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => {
            setAuthModalOpen(false);
            setAuthError(null);
          }}
          mode={authMode}
          onModeChange={setAuthMode}
          onAuth={handleAuth}
         onGoogleAuth={handleGoogleAuth}
          isLoading={authLoading}
          error={authError}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header 
        user={user} 
        onSignInClick={handleSignInClick}
        onSignOut={handleSignOut}
        showHomeButton={!showHomePage}
        onHomeClick={() => setShowHomePage(true)}
      />
      
      <main className={showHomePage ? '' : 'container mx-auto px-4 py-8'}>
        {showHomePage ? (
          <HomePage 
            user={user!} 
            onGetStarted={() => setShowHomePage(false)}
          />
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Input Section */}
            <StudyNoteInput
              onGenerate={generateNotes}
              isLoading={isLoading}
              error={error}
            />
            
            {/* Content Section */}
            {isLoading ? (
              <LoadingAnimation />
            ) : currentNotes.length > 0 ? (
              <MultiStudyNoteDisplay
                studyNotes={currentNotes}
                onCopy={copyNote}
                onDownload={downloadNote}
                onSave={saveNote}
                onDownloadAll={downloadAllNotes}
                onDownloadAllPDF={downloadAllNotesAsPDF}
              />
            ) : (
              <EmptyState />
            )}
          </div>
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthError(null);
        }}
        mode={authMode}
        onModeChange={setAuthMode}
        onAuth={handleAuth}
        onGoogleAuth={handleGoogleAuth}
        isLoading={authLoading}
        error={authError}
      />
      
      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">ANotes</p>
                <p className="text-gray-400 text-xs">by Arunabho, LLC</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <a
                href="https://github.com/DorachanCodes"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                GitHub
              </a>
              <a
                href="mailto:arunabhogarai72@gmail.com"
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                Contact
              </a>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm">
                © 2025 Arunabho, LLC. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Powered by{' '}
                <a 
                  href="https://ai.google.dev" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-400 hover:text-green-300"
                >
                  Google AI
                </a>
                {' '}and{' '}
                <a 
                  href="https://deepmind.google/technologies/gemini/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300"
                >
                  Gemini 2.0 Flash
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;