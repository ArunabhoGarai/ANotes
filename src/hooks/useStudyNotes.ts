import { useState, useCallback } from 'react';
import { StudyNote, MultiTopicResult } from '../types';
import { GeminiService } from '../services/gemini';
import { SupabaseService } from '../services/supabase';
import { PDFGenerator } from '../utils/pdfGenerator';
import { ContentExtractor, PageRange } from '../utils/contentExtractor';

export const useStudyNotes = (isAuthenticated?: boolean) => {
  const [currentNotes, setCurrentNotes] = useState<StudyNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateNotes = useCallback(async (
    topics: string[], 
    context?: string, 
    useSource?: boolean, 
    pageRanges?: PageRange[],
    useGeminiPDF?: boolean
  ) => {
    setIsLoading(true);
    setError(null);
    setCurrentNotes([]);
    
    try {
      const geminiService = GeminiService.getInstance();
      
      let processedContext = context;
      
      // If we have source content and it's enabled, process it intelligently  
      if (useSource && context && !useGeminiPDF) {
        if (pageRanges && pageRanges.length > 0) {
          // Use manual page range extraction
          const extractedContent = await ContentExtractor.extractRelevantContent(
            context, 
            topics, 
            pageRanges
          );
          
          // For each topic, use its specific extracted content
          const results: any[] = [];
          
          for (const topic of topics) {
            const topicContent = extractedContent.get(topic);
            if (topicContent) {
              try {
                const content = await geminiService.generateStudyNotes(
                  topic, 
                  topicContent.content, 
                  true
                );
                results.push({ topic, content });
              } catch (error) {
                results.push({ 
                  topic, 
                  content: '', 
                  error: error instanceof Error ? error.message : 'Failed to generate notes' 
                });
              }
            }
          }
          
          const newNotes: StudyNote[] = results.map((result, index) => ({
            id: `${Date.now()}-${index}`,
            title: `Page-Specific Study Notes: ${result.topic}`,
            topic: result.topic,
            content: result.content,
            createdAt: new Date(),
            tags: [
              result.topic, 
              'AI Generated', 
              'Page-Specific',
              'Study Notes'
            ],
            error: result.error
          }));
          
          setCurrentNotes(newNotes);
          
          // Set error if any notes failed to generate
          const failedNotes = newNotes.filter(note => note.error);
          if (failedNotes.length > 0) {
            setError(`Failed to generate notes for: ${failedNotes.map(note => note.topic).join(', ')}`);
          }
          
          return;
        } else {
          // Use automatic topic extraction
          const extractedContent = await ContentExtractor.extractRelevantContent(
            context, 
            topics
          );
          
          // For each topic, use its specific extracted content
          const results: any[] = [];
          
          for (const topic of topics) {
            const topicContent = extractedContent.get(topic);
            if (topicContent) {
              try {
                const content = await geminiService.generateStudyNotes(
                  topic, 
                  topicContent.content, 
                  true
                );
                results.push({ 
                  topic, 
                  content,
                  metadata: topicContent.metadata
                });
              } catch (error) {
                results.push({ 
                  topic, 
                  content: '', 
                  error: error instanceof Error ? error.message : 'Failed to generate notes' 
                });
              }
            }
          }
          
          const newNotes: StudyNote[] = results.map((result, index) => ({
            id: `${Date.now()}-${index}`,
            title: `Smart-Extracted Study Notes: ${result.topic}`,
            topic: result.topic,
            content: result.content,
            createdAt: new Date(),
            tags: [
              result.topic, 
              'AI Generated', 
              'Smart-Extracted',
              'Study Notes',
              ...(result.metadata ? [`Relevance: ${Math.round(result.metadata.relevanceScore * 100)}%`] : [])
            ],
            error: result.error
          }));
          
          setCurrentNotes(newNotes);
          
          // Set error if any notes failed to generate
          const failedNotes = newNotes.filter(note => note.error);
          if (failedNotes.length > 0) {
            setError(`Failed to generate notes for: ${failedNotes.map(note => note.topic).join(', ')}`);
          }
          
          return;
        }
      }
      
      // If using Gemini PDF processing, handle it separately
      if (useGeminiPDF && useSource) {
        // For Gemini PDF, we'll pass the file directly to the service
        // This will be handled in the GeminiService
        const results = await geminiService.generateMultipleStudyNotesFromPDF(topics);
        
        const newNotes: StudyNote[] = results.map((result, index) => ({
          id: `${Date.now()}-${index}`,
          title: `Gemini PDF Study Notes: ${result.topic}`,
          topic: result.topic,
          content: result.content,
          createdAt: new Date(),
          tags: [
            result.topic, 
            'AI Generated', 
            'Gemini PDF',
            'Study Notes'
          ],
          error: result.error
        }));
        
        setCurrentNotes(newNotes);
        
        // Set error if any notes failed to generate
        const failedNotes = newNotes.filter(note => note.error);
        if (failedNotes.length > 0) {
          setError(`Failed to generate notes for: ${failedNotes.map(note => note.topic).join(', ')}`);
        }
        
        return;
      }
      
      // Fallback to original method for non-source or simple source content
      const results = await geminiService.generateMultipleStudyNotes(topics, processedContext, useSource);
      
      const newNotes: StudyNote[] = results.map((result, index) => ({
        id: `${Date.now()}-${index}`,
        title: `${useSource ? 'Source-Based ' : ''}Study Notes: ${result.topic}`,
        topic: result.topic,
        content: result.content,
        createdAt: new Date(),
        tags: [
          result.topic, 
          'AI Generated', 
          useSource ? 'Source-Based' : 'Comprehensive',
          'Study Notes'
        ],
        error: result.error
      }));
      
      setCurrentNotes(newNotes);
      
      // Set error if any notes failed to generate
      const failedNotes = newNotes.filter(note => note.error);
      if (failedNotes.length > 0) {
        setError(`Failed to generate notes for: ${failedNotes.map(note => note.topic).join(', ')}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate study notes';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const copyNote = useCallback((noteId: string) => {
    const note = currentNotes.find(n => n.id === noteId);
    if (note) {
      navigator.clipboard.writeText(note.content);
      // You could add a toast notification here
    }
  }, [currentNotes]);

  const downloadNote = useCallback((noteId: string) => {
    const note = currentNotes.find(n => n.id === noteId);
    if (note) {
      const blob = new Blob([note.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [currentNotes]);

  const saveNote = useCallback((noteId: string) => {
    const note = currentNotes.find(n => n.id === noteId);
    if (note && !note.error) {
      if (isAuthenticated) {
        // Save to Supabase database
        const supabaseService = SupabaseService.getInstance();
        supabaseService.saveStudyNote({
          title: note.title,
          topic: note.topic,
          content: note.content,
          tags: note.tags,
          source_based: note.tags.includes('Source-Based')
        }).then(() => {
          console.log('Note saved to database');
          // You could add a toast notification here
        }).catch((error) => {
          console.error('Failed to save note to database:', error);
          // Fallback to localStorage
          const savedNotes = JSON.parse(localStorage.getItem('studyNotes') || '[]');
          savedNotes.push(note);
          localStorage.setItem('studyNotes', JSON.stringify(savedNotes));
        });
      } else {
        // Save to localStorage for non-authenticated users
        const savedNotes = JSON.parse(localStorage.getItem('studyNotes') || '[]');
        savedNotes.push(note);
        localStorage.setItem('studyNotes', JSON.stringify(savedNotes));
        // You could add a toast notification here
      }
    }
  }, [currentNotes, isAuthenticated]);

  const downloadAllNotes = useCallback(() => {
    if (currentNotes.length > 0) {
      const allContent = currentNotes
        .filter(note => !note.error)
        .map(note => `${note.title}\n${'='.repeat(note.title.length)}\n\n${note.content}`)
        .join('\n\n' + '='.repeat(50) + '\n\n');
      
      const blob = new Blob([allContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Study_Notes_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [currentNotes]);

  const downloadAllNotesAsPDF = useCallback(async () => {
    if (currentNotes.length > 0) {
      try {
        await PDFGenerator.generatePDF(currentNotes);
      } catch (error) {
        console.error('Error generating PDF:', error);
        // Fallback to text download
        downloadAllNotes();
      }
    }
  }, [currentNotes, downloadAllNotes]);

  const clearNote = useCallback(() => {
    setCurrentNotes([]);
    setError(null);
  }, []);

  return {
    currentNotes,
    isLoading,
    error,
    generateNotes,
    copyNote,
    downloadNote,
    saveNote,
    downloadAllNotes,
    downloadAllNotesAsPDF,
    clearNote
  };
};