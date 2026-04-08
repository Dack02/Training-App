import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getSession, onAuthStateChange } from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('Failed to fetch profile:', error.message);
      return null;
    }
    return data;
  }

  useEffect(() => {
    let mounted = true;

    // Use getSession() for initial load (avoids Navigator Lock issues in StrictMode)
    getSession().then(async (session) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        const prof = await fetchProfile(session.user.id);
        if (mounted) setProfile(prof);
      }
      if (mounted) setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    // Listen for subsequent auth changes (sign-in, sign-out, token refresh)
    const subscription = onAuthStateChange(async (session) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        const prof = await fetchProfile(session.user.id);
        if (mounted) setProfile(prof);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function refreshProfile() {
    if (session?.user) {
      const prof = await fetchProfile(session.user.id);
      setProfile(prof);
    }
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
