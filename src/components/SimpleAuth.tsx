import React, { useState, useEffect } from 'react';
import { supabase, SimpleUser, UserSessionHistory, Role } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import {
  User,
  Lock,
  History,
  ShieldCheck,
  LogIn,
  UserPlus,
  Monitor,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Crown,
} from 'lucide-react';

interface SimpleAuthProps {
  onLoginSuccess: (user: SimpleUser) => void;
  onClose?: () => void;
}

const LOCAL_SIMPLE_USERS_KEY = 'smart_academy_simple_users_v1';
const LOCAL_SESSION_HISTORY_KEY = 'smart_academy_session_history_v1';

export default function SimpleAuth({ onLoginSuccess, onClose }: SimpleAuthProps) {
  const { setSimpleUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'history'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<UserSessionHistory[]>([]);

  useEffect(() => {
    loadLocalHistory();
  }, []);

  const loadLocalHistory = () => {
    try {
      const stored = localStorage.getItem(LOCAL_SESSION_HISTORY_KEY);
      if (stored) {
        setHistoryList(JSON.parse(stored));
      }
    } catch {
      /* ignore */
    }
  };

  const recordSession = async (userId: string, action: string) => {
    const deviceInfo = typeof navigator !== 'undefined' ? `${navigator.platform || 'Desktop'} — ${navigator.userAgent.slice(0, 60)}...` : 'Noma\'lum Qurilma';
    const newSession: UserSessionHistory = {
      id: `sess-${Date.now()}`,
      user_id: userId,
      action,
      device_info: deviceInfo,
      ip_address: '127.0.0.1 (Mahalliy)',
      created_at: new Date().toISOString(),
    };

    // 1. Try Supabase
    try {
      await supabase.from('user_session_history').insert({
        user_id: userId,
        action,
        device_info: deviceInfo,
        ip_address: '127.0.0.1',
      });
    } catch {
      /* fallback to local */
    }

    // 2. Save locally
    try {
      const existing: UserSessionHistory[] = JSON.parse(localStorage.getItem(LOCAL_SESSION_HISTORY_KEY) || '[]');
      const updated = [newSession, ...existing].slice(0, 30);
      localStorage.setItem(LOCAL_SESSION_HISTORY_KEY, JSON.stringify(updated));
      setHistoryList(updated);
    } catch {
      /* ignore */
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage("Foydalanuvchi nomi kamida 3 ta belgidan iborat bo'lishi kerak.");
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage("Parol kamida 4 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    setLoading(true);

    const isCreatorTarget = cleanUsername === 'creator' || cleanUsername === 'dilshodbek_creator';
    const effectiveRole: Role = isCreatorTarget ? 'creator' : role;
    const finalDisplayName = displayName.trim() || (isCreatorTarget ? "Dilshodbek Rayimov (Yaratuvchi)" : cleanUsername);

    const newUser: SimpleUser = {
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      password_hash: password, // In production client-side, hashed or verified
      display_name: finalDisplayName,
      role: effectiveRole,
      rating: 1000,
      created_at: new Date().toISOString(),
    };

    // 1. Try Supabase insertion
    let registeredUser = newUser;
    try {
      const { data, error } = await supabase
        .from('simple_users')
        .insert({
          username: cleanUsername,
          password_hash: password,
          display_name: finalDisplayName,
          role: effectiveRole,
          rating: 1000,
        })
        .select()
        .single();

      if (error) {
        // If error is duplicate username
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          setErrorMessage("Bunday foydalanuvchi nomi allaqachon mavjud! Boshqa nom tanlang.");
          setLoading(false);
          return;
        }
      } else if (data) {
        registeredUser = data as SimpleUser;
      }
    } catch {
      /* Supabase table might not exist yet, proceed with local fallback */
    }

    // 2. Save in local accounts
    try {
      const stored: SimpleUser[] = JSON.parse(localStorage.getItem(LOCAL_SIMPLE_USERS_KEY) || '[]');
      if (stored.some((u) => u.username.toLowerCase() === cleanUsername)) {
        setErrorMessage("Bunday foydalanuvchi nomi lokal bazada allaqachon mavjud!");
        setLoading(false);
        return;
      }
      stored.push(registeredUser);
      localStorage.setItem(LOCAL_SIMPLE_USERS_KEY, JSON.stringify(stored));
    } catch {
      /* ignore */
    }

    await recordSession(registeredUser.id, 'royxatdan_otish');
    setSimpleUser({
      id: registeredUser.id,
      username: registeredUser.username,
      display_name: registeredUser.display_name,
      role: registeredUser.role,
    });

    setSuccessMessage("Akkaunt muvaffaqiyatli yaratildi! Kirilmoqda...");
    setTimeout(() => {
      onLoginSuccess(registeredUser);
      onClose?.();
    }, 400);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !password) {
      setErrorMessage("Foydalanuvchi nomi va parolni kiriting.");
      return;
    }

    setLoading(true);

    // Special creator quick credentials
    if (
      (cleanUsername === 'creator' || cleanUsername === 'dilshodbek_creator' || cleanUsername === 'dilshodbekrayimov6@gmail.com') &&
      (password === 'creator123' || password === '123456')
    ) {
      const creatorUser: SimpleUser = {
        id: 'creator-dilshodbek',
        username: 'dilshodbek_creator',
        password_hash: 'creator123',
        display_name: "Dilshodbek Rayimov (Yaratuvchi)",
        role: 'creator',
        rating: 2500,
        created_at: new Date().toISOString(),
      };
      await recordSession(creatorUser.id, 'kirish');
      setSimpleUser({
        id: creatorUser.id,
        username: creatorUser.username,
        display_name: creatorUser.display_name,
        role: 'creator',
      });
      setSuccessMessage("Yaratuvchi hisobi bilan muvaffaqiyatli kirildi!");
      setTimeout(() => {
        onLoginSuccess(creatorUser);
        onClose?.();
      }, 400);
      return;
    }

    // 1. Try Supabase query
    try {
      const { data, error } = await supabase
        .from('simple_users')
        .select('*')
        .eq('username', cleanUsername)
        .eq('password_hash', password)
        .maybeSingle();

      if (!error && data) {
        const user = data as SimpleUser;
        await recordSession(user.id, 'kirish');
        setSimpleUser({
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          role: user.role,
        });
        setSuccessMessage("Muvaffaqiyatli kirildi!");
        setTimeout(() => {
          onLoginSuccess(user);
          onClose?.();
        }, 400);
        return;
      }
    } catch {
      /* continue to local fallback */
    }

    // 2. Try LocalStorage
    try {
      const stored: SimpleUser[] = JSON.parse(localStorage.getItem(LOCAL_SIMPLE_USERS_KEY) || '[]');
      const found = stored.find(
        (u) => u.username.toLowerCase() === cleanUsername && u.password_hash === password
      );

      if (found) {
        await recordSession(found.id, 'kirish');
        setSimpleUser({
          id: found.id,
          username: found.username,
          display_name: found.display_name,
          role: found.role,
        });
        setSuccessMessage("Muvaffaqiyatli kirildi!");
        setTimeout(() => {
          onLoginSuccess(found);
          onClose?.();
        }, 400);
        return;
      }
    } catch {
      /* ignore */
    }

    setLoading(false);
    setErrorMessage("Foydalanuvchi nomi yoki parol noto'g'ri. Iltimos tekshirib qayta urinib ko'ring.");
  };

  return (
    <div className="w-full max-w-md mx-auto glass-strong rounded-3xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl backdrop-blur-xl relative">
      {/* Header Tabs */}
      <div className="flex items-center justify-between gap-2 mb-6 p-1 glass rounded-2xl border border-slate-700/60">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setErrorMessage(null);
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
            mode === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <LogIn className="w-4 h-4" /> Kirish
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setErrorMessage(null);
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
            mode === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserPlus className="w-4 h-4" /> Ro'yxatdan O'tish
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('history');
            loadLocalHistory();
          }}
          className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
            mode === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
          title="Kirishlar tarixi"
        >
          <History className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form Area */}
      {mode === 'login' && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Foydalanuvchi nomi (Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="masalan: dilshodbek_creator yoki alisher12"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Parol
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Quick Creator Helper button */}
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" /> Yaratuvchi (Creator) akkaunti:
            </span>
            <button
              type="button"
              onClick={() => {
                setUsername('dilshodbek_creator');
                setPassword('creator123');
              }}
              className="text-[11px] underline font-bold hover:text-amber-100"
            >
              To'ldirish
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Tizimga Kirish
              </>
            )}
          </button>
        </form>
      )}

      {mode === 'register' && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Foydalanuvchi nomi (Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="lotin harflarida, masalan: jasur_99"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              To'liq ism-familiya (Display Name)
            </label>
            <div className="relative">
              <Sparkles className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jasur Qodirov"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Parol
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Rolni tanlang
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  role === 'student'
                    ? 'border-indigo-500 bg-indigo-600/30 text-white'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                O'quvchi
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  role === 'admin'
                    ? 'border-indigo-500 bg-indigo-600/30 text-white'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Akkaunt Yaratish
              </>
            )}
          </button>
        </form>
      )}

      {mode === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Faoliyat & Kirish Tarixi
            </h4>
            <span className="text-[11px] text-slate-500">{historyList.length} ta yozuv</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {historyList.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 glass rounded-xl">
                Hozircha kirishlar tarixi mavjud emas.
              </div>
            ) : (
              historyList.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 rounded-xl glass border border-slate-800/80 text-xs space-y-1 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-indigo-300 capitalize">
                      {item.action === 'kirish'
                        ? "Kirish muvaffaqiyatli"
                        : item.action === 'royxatdan_otish'
                        ? "Ro'yxatdan o'tildi"
                        : item.action}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                    <Monitor className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{item.device_info || 'Standart Brauzer'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-xl text-xs text-slate-400 hover:text-white transition"
        >
          Bekor qilish
        </button>
      )}
    </div>
  );
}
