'use client';

import { useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = useCallback(async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile does not exist yet — create fallback profile
        const newProfile: Partial<Profile> = {
          id: currentUser.id,
          email: currentUser.email || null,
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
          role: 'customer',
        };

        const { data: inserted } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (inserted) {
          setProfile(inserted as Profile);
        }
      } else if (data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error('[useUser] Error fetching profile:', err);
    }
  }, [supabase]);

  useEffect(() => {
    // Initial fetch
    const getInitialUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser);
      }
      setLoading(false);
    };

    getInitialUser();

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    signOut,
    refreshProfile: () => user && fetchProfile(user),
  };
}
