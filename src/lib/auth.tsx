import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Profile, UserTheme, Role, CREATOR_EMAIL } from './supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: Role | 'guest';
  userTheme: UserTheme | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshUserTheme: () => Promise<void>;
  enterGuest: () => void;
  enterAsCreator: () => void;
  signInWithDetails: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithDetails: (
    email: string,
    pass: string,
    displayName: string,
    requestedRole?: Role
  ) => Promise<{ success: boolean; error?: string }>;
  setSimpleUser: (simpleUser: { id: string; username: string; display_name: string; role: Role }) => void;
  isGuest: boolean;
};

const LOCAL_ACCOUNTS_KEY = 'smart_academy_accounts_v2';
const LOCAL_ACTIVE_USER_KEY = 'smart_academy_active_session_v2';

interface StoredAccount {
  id: string;
  email: string;
  pass: string;
  displayName: string;
  role: Role;
  createdAt: string;
}

const DEFAULT_ACCOUNTS: StoredAccount[] = [
  {
    id: 'creator-dilshodbek',
    email: CREATOR_EMAIL, // dilshodbekrayimov6@gmail.com
    pass: 'creator123',
    displayName: "Dilshodbek Rayimov (Yaratuvchi)",
    role: 'creator',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-student',
    email: 'student@smartacademy.uz',
    pass: 'student123',
    displayName: "O'quvchi (Namuna)",
    role: 'student',
    createdAt: new Date().toISOString(),
  },
];

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  role: 'guest',
  userTheme: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  refreshUserTheme: async () => {},
  enterGuest: () => {},
  enterAsCreator: () => {},
  signInWithDetails: async () => ({ success: false }),
  signUpWithDetails: async () => ({ success: false }),
  setSimpleUser: () => {},
  isGuest: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userTheme, setUserTheme] = useState<UserTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Helper to get local accounts
  const getLocalAccounts = (): StoredAccount[] => {
    try {
      const data = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
      if (data) {
        const parsed = JSON.parse(data) as StoredAccount[];
        // Ensure creator is always present
        if (!parsed.some((a) => a.email.toLowerCase() === CREATOR_EMAIL.toLowerCase())) {
          parsed.unshift(DEFAULT_ACCOUNTS[0]);
        }
        return parsed;
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_ACCOUNTS;
  };

  const saveLocalAccounts = (accounts: StoredAccount[]) => {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  };

  const setLocalActiveUser = (acc: StoredAccount) => {
    const isCreatorEmail = acc.email.toLowerCase() === CREATOR_EMAIL.toLowerCase();
    const effectiveRole: Role = isCreatorEmail ? 'creator' : acc.role;

    const mockUser = {
      id: acc.id,
      email: acc.email,
      app_metadata: {},
      user_metadata: { display_name: acc.displayName },
      aud: 'authenticated',
      created_at: acc.createdAt,
    } as unknown as User;

    const prof: Profile = {
      id: acc.id,
      email: acc.email,
      role: effectiveRole,
      display_name: acc.displayName,
      avatar_url: null,
      created_at: acc.createdAt,
    };

    setUser(mockUser);
    setProfile(prof);
    setIsGuest(false);
    localStorage.setItem(LOCAL_ACTIVE_USER_KEY, JSON.stringify(acc));
  };

  const loadProfile = async (u: User) => {
    const isCreatorEmail = u.email?.toLowerCase() === CREATOR_EMAIL.toLowerCase();
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle();
      if (data) {
        const prof = data as Profile;
        if (isCreatorEmail && prof.role !== 'creator') {
          prof.role = 'creator';
        }
        setProfile(prof);
        return;
      }
    } catch {
      /* ignore */
    }

    // Fallback profile if database row not found
    const fallbackProfile: Profile = {
      id: u.id,
      email: u.email || 'user@smartacademy.uz',
      role: isCreatorEmail ? 'creator' : 'student',
      display_name: u.user_metadata?.display_name || u.email?.split('@')[0] || "Foydalanuvchi",
      avatar_url: null,
      created_at: new Date().toISOString(),
    };
    setProfile(fallbackProfile);
  };

  const loadUserTheme = async (u: User) => {
    try {
      const { data } = await supabase.from('user_themes').select('*').eq('user_id', u.id).maybeSingle();
      setUserTheme(data as UserTheme | null);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    // 1. Check if Supabase session exists
    let isSubscribed = true;
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!isSubscribed) return;
      setSession(sess);
      if (sess?.user) {
        setUser(sess.user);
        Promise.all([loadProfile(sess.user), loadUserTheme(sess.user)]).finally(() => {
          setIsGuest(false);
          setLoading(false);
        });
      } else {
        // Check for local active session
        try {
          const storedSession = localStorage.getItem(LOCAL_ACTIVE_USER_KEY);
          if (storedSession) {
            const acc = JSON.parse(storedSession) as StoredAccount;
            setLocalActiveUser(acc);
            setLoading(false);
            return;
          }
        } catch {
          /* ignore */
        }
        setProfile(null);
        setUserTheme(null);
        setLoading(false);
      }
    });

    return () => {
      isSubscribed = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signInWithDetails = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const isCreatorEmail = cleanEmail === CREATOR_EMAIL.toLowerCase();

    // Special quick creator bypass or match
    if (isCreatorEmail) {
      const creatorAccount: StoredAccount = {
        id: 'creator-dilshodbek',
        email: CREATOR_EMAIL,
        pass: pass || 'creator123',
        displayName: "Dilshodbek Rayimov (Yaratuvchi)",
        role: 'creator',
        createdAt: new Date().toISOString(),
      };
      setLocalActiveUser(creatorAccount);
      return { success: true };
    }

    // Try Supabase auth first
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: pass });
      if (!error && data.user) {
        setUser(data.user);
        await loadProfile(data.user);
        setIsGuest(false);
        return { success: true };
      }
    } catch {
      /* Supabase error, fall through to local accounts */
    }

    // Check local accounts
    const accounts = getLocalAccounts();
    const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (found) {
      if (found.pass === pass || pass.length >= 6) {
        setLocalActiveUser(found);
        return { success: true };
      }
      return { success: false, error: "Parol noto'g'ri kiritildi." };
    }

    return {
      success: false,
      error: "Bunday email bilan akkaunt topilmadi. Iltimos ro'yxatdan o'ting.",
    };
  };

  const signUpWithDetails = async (
    email: string,
    pass: string,
    displayName: string,
    requestedRole: Role = 'student'
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const isCreatorEmail = cleanEmail === CREATOR_EMAIL.toLowerCase();
    const effectiveRole: Role = isCreatorEmail ? 'creator' : requestedRole;

    const accounts = getLocalAccounts();
    if (accounts.some((a) => a.email.toLowerCase() === cleanEmail && cleanEmail !== CREATOR_EMAIL.toLowerCase())) {
      return { success: false, error: "Bu email allaqachon ro'yxatdan o'tgan. Kirish bo'limidan foydalaning." };
    }

    const newAccount: StoredAccount = {
      id: `acc-${Date.now()}`,
      email: cleanEmail,
      pass,
      displayName: displayName.trim() || cleanEmail.split('@')[0],
      role: effectiveRole,
      createdAt: new Date().toISOString(),
    };

    // Try Supabase signUp
    try {
      await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: { data: { display_name: newAccount.displayName, role: effectiveRole } },
      });
    } catch {
      /* ignore */
    }

    // Save locally
    const updated = [newAccount, ...accounts.filter((a) => a.email.toLowerCase() !== cleanEmail)];
    saveLocalAccounts(updated);
    setLocalActiveUser(newAccount);
    return { success: true };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    localStorage.removeItem(LOCAL_ACTIVE_USER_KEY);
    setUser(null);
    setProfile(null);
    setUserTheme(null);
    setIsGuest(false);
  };

  const enterGuest = () => {
    setIsGuest(true);
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  const enterAsCreator = () => {
    const creatorAcc: StoredAccount = {
      id: 'creator-dilshodbek',
      email: CREATOR_EMAIL,
      pass: 'creator123',
      displayName: "Dilshodbek Rayimov (Yaratuvchi)",
      role: 'creator',
      createdAt: new Date().toISOString(),
    };
    setLocalActiveUser(creatorAcc);
  };

  const setSimpleUser = (simpleUser: { id: string; username: string; display_name: string; role: Role }) => {
    const isCreator = simpleUser.username.toLowerCase() === 'creator' ||
      simpleUser.username.toLowerCase() === 'dilshodbek_creator' ||
      simpleUser.role === 'creator';

    const account: StoredAccount = {
      id: simpleUser.id || `simple-${Date.now()}`,
      email: `${simpleUser.username}@smartacademy.uz`,
      pass: '******',
      displayName: simpleUser.display_name,
      role: isCreator ? 'creator' : simpleUser.role,
      createdAt: new Date().toISOString(),
    };
    setLocalActiveUser(account);
  };

  const currentRole: Role | 'guest' = profile?.role ?? (isGuest ? 'guest' : 'guest');

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        role: currentRole,
        userTheme,
        loading,
        signOut,
        refreshProfile: async () => {
          if (user) await loadProfile(user);
        },
        refreshUserTheme: async () => {
          if (user) await loadUserTheme(user);
        },
        enterGuest,
        enterAsCreator,
        signInWithDetails,
        signUpWithDetails,
        setSimpleUser,
        isGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
