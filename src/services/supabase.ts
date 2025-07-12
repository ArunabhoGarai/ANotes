import { createClient, SupabaseClient, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { User } from '../hooks/useAuth';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export class SupabaseService {
  private static instance: SupabaseService;
  private supabase: SupabaseClient;

  private constructor() {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables. Please set up Supabase connection.');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  // Authentication methods
  async signUp(email: string, password: string, name: string): Promise<User> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Failed to create user account');
    }

    return {
      id: data.user.id,
      email: data.user.email!,
      name: name
    };
  }

  async signInWithGoogle(): Promise<User> {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    // The actual user data will be available after redirect
    // This method initiates the OAuth flow
    return {} as User; // Temporary return
  }

  async signIn(email: string, password: string): Promise<User> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Failed to sign in');
    }

    return {
      id: data.user.id,
      email: data.user.email!,
      name: data.user.user_metadata?.name
    };
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name
    };
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  // Database methods for study notes
  async saveStudyNote(note: {
    title: string;
    topic: string;
    content: string;
    tags: string[];
    source_based: boolean;
  }) {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to save notes');
    }

    const { data, error } = await this.supabase
      .from('study_notes')
      .insert({
        ...note,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save note: ${error.message}`);
    }

    return data;
  }

  async getUserStudyNotes(limit?: number) {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to fetch notes');
    }

    let query = this.supabase
      .from('study_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch notes: ${error.message}`);
    }

    return data || [];
  }

  async deleteStudyNote(noteId: string) {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to delete notes');
    }

    const { error } = await this.supabase
      .from('study_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id);

    if (error) {
      throw new Error(`Failed to delete note: ${error.message}`);
    }
  }

  async updateStudyNote(noteId: string, updates: {
    title?: string;
    content?: string;
    tags?: string[];
  }) {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to update notes');
    }

    const { data, error } = await this.supabase
      .from('study_notes')
      .update(updates)
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update note: ${error.message}`);
    }

    return data;
  }
}