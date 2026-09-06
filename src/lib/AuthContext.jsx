import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) { setSession(data.session); setIsLoadingAuth(false); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) { setSession(nextSession); setIsLoadingAuth(false); }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) fetch('/api/users/sync', { method: 'POST', headers: { Authorization: `Bearer ${data.session.access_token}` } }).catch(() => undefined);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  const user = session?.user || null;
  const authUser = user ? {
    id: user.id,
    email: user.email || '',
    full_name: user.user_metadata?.full_name || '',
    display_name: user.user_metadata?.full_name || '',
    is_verified: Boolean(user.email_confirmed_at),
    role: user.app_metadata?.role || 'user'
  } : null;

  return (
    <AuthContext.Provider value={{ 
      user: authUser,
      isAuthenticated: Boolean(session),
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: null,
      authChecked: isLoaded,
      logout: async () => { await supabase.auth.signOut(); window.location.href = '/'; },
      navigateToLogin: () => { window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`; },
      checkUserAuth: async () => undefined,
      checkAppState: async () => undefined,
      getToken: async () => (await supabase.auth.getSession()).data.session?.access_token
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
