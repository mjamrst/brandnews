"use client";

import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  useEffect(() => {
    let mounted = true;

    // Race a promise against a timeout to prevent indefinite hangs
    function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
      return Promise.race([
        Promise.resolve(promise),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Auth timeout")), ms)
        ),
      ]);
    }

    async function initialize() {
      try {
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          5000
        );
        if (!mounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          try {
            const { data } = await withTimeout(
              supabase
                .from("profiles")
                .select("*")
                .eq("id", currentUser.id)
                .single(),
              5000
            );
            if (mounted) setProfile(data);
          } catch {
            // Profile fetch failed — proceed without profile
          }
        }
      } catch {
        // getSession() failed or timed out — clear stale state
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      }
      if (mounted) setLoading(false);
    }

    initialize();

    // Only handle subsequent auth changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted || event === "INITIAL_SESSION") return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          try {
            const { data } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", currentUser.id)
              .single();
            if (mounted) setProfile(data);
          } catch {
            // Profile fetch failed
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
