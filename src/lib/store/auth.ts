import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;

    const supabase = createClient();

    // Get initial session
    const { data: { user } } = await supabase.auth.getUser();
    let profile: Profile | null = null;

    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, avatar_url, created_at")
        .eq("id", user.id)
        .single();
      profile = data;
    }

    set({ user, profile, loading: false, initialized: true });

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      let currentProfile: Profile | null = null;

      if (currentUser) {
        const { data } = await supabase
          .from("profiles")
          .select("id, email, full_name, role, avatar_url, created_at")
          .eq("id", currentUser.id)
          .single();
        currentProfile = data;
      }

      set({ user: currentUser, profile: currentProfile, loading: false });
    });
  },

  login: async (email: string, password: string) => {
    set({ loading: true });
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ loading: false });
      return { error: error.message };
    }
    return { error: null };
  },

  signup: async (email: string, password: string, fullName: string) => {
    set({ loading: true });
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      set({ loading: false });
      return { error: error.message };
    }
    return { error: null };
  },

  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, profile: null });
    window.location.href = "/";
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, avatar_url, created_at")
      .eq("id", user.id)
      .single();
    set({ profile: data });
  },
}));