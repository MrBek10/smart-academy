import { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Bot,
  Clock,
  Shield,
  ArrowRight,
  Eye,
  Lock,
  Mail,
  User,
  KeyRound,
  CheckCircle2,
  Crown,
  Code2,
  Headphones,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { CREATOR_EMAIL, Role } from '@/lib/supabase';
import Captcha from '@/components/Captcha';
import SimpleAuth from '@/components/SimpleAuth';

export default function Landing({ onEnter }: { onEnter: () => void }) {
  const { enterGuest, enterAsCreator } = useAuth();
  const { globalTheme } = useTheme();
  const [showAuth, setShowAuth] = useState<'login' | 'signup' | 'simple' | null>(null);

  const features = [
    {
      icon: Code2,
      title: 'IT & Dasturlash Akademiyasi',
      desc: 'Python, JS, C++, Go kod sandboxi, konsol va Gemini AI Code Mentor.',
      badge: 'Yangi',
    },
    {
      icon: BookOpen,
      title: 'Virtual Darsxona & Konspekt',
      desc: "Video darslar, shaxsiy konspektlar va haftalik interaktiv dars jadvali.",
    },
    {
      icon: Bot,
      title: 'Gemini AI Repetitor',
      desc: "So'rovlarni eslab qoluvchi multi-turn xotiraga ega sun'iy intellekt yordamchisi.",
    },
    {
      icon: Clock,
      title: '189 Ballik Milliy Imtihon',
      desc: "Milliy Sertifikat va DTM testlari, taymer va OMR blankasi bilan avtomatik baholash.",
    },
    {
      icon: Headphones,
      title: '20+ Fokus Soundtracklar',
      desc: "Dars paytida diqqatni jamlash uchun Lo-Fi, Pianino, Tabiat va Synthwave musiqalari.",
    },
    {
      icon: Shield,
      title: 'Xavfsiz Boshqaruv & Rollar',
      desc: "Yaratuvchi (Creator), admin va o'quvchi rollari bilan himoyalangan ekotizim.",
    },
  ];

  if (showAuth === 'simple') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <SimpleAuth onLoginSuccess={onEnter} onClose={() => setShowAuth(null)} />
      </div>
    );
  }
  if (showAuth === 'login') {
    return (
      <LoginForm
        onBack={() => setShowAuth(null)}
        onGoSignup={() => setShowAuth('signup')}
        onGoSimple={() => setShowAuth('simple')}
        onSuccess={onEnter}
      />
    );
  }
  if (showAuth === 'signup') {
    return (
      <SignupForm
        onBack={() => setShowAuth(null)}
        onGoLogin={() => setShowAuth('login')}
        onGoSimple={() => setShowAuth('simple')}
        onSuccess={onEnter}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="glass-strong border-b border-slate-700/50 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-white bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-md">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <span className="font-extrabold text-lg text-white block leading-tight">
                {globalTheme?.site_name ?? 'Smart Academy'}
              </span>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase block">
                Litsey & Dasturlash Platformasi
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={enterGuest}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 inline-flex items-center gap-1.5 transition"
            >
              <Eye className="w-4 h-4 text-slate-400" />
              <span>Mehmon</span>
            </button>

            <button
              onClick={() => setShowAuth('simple')}
              className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-cyan-300 hover:text-white hover:bg-cyan-950/60 border border-cyan-500/30 transition flex items-center gap-1.5"
              title="Gmail yoki tasdiqlashsiz oddiy kirish"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Oddiy Kirish</span>
            </button>

            <button
              onClick={() => setShowAuth('signup')}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-indigo-300 hover:text-white hover:bg-indigo-950/60 border border-indigo-500/30 transition hidden sm:inline-flex"
            >
              Ro'yxatdan o'tish
            </button>

            <button
              onClick={() => setShowAuth('login')}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-indigo-600/30 transition"
            >
              Kirish
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden text-white bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-950 border-b border-slate-800/80 py-20 lg:py-28">
        <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #6366f1 1px, transparent 1px), radial-gradient(circle at 80% 70%, #38bdf8 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs sm:text-sm font-bold uppercase tracking-wider mb-6 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            Sun'iy Intellekt & Dasturlash bilan Boyitilgan Ta'lim
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight mb-6 text-white">
            Kelajak Ilmini O'rganing. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Smart Academy
            </span> bilan Zafarga Erishing.
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
            Litseylar, IIV tizimi abituriyentlari va IT dasturchilar uchun yagona raqamli ekotizim: Python/JS kod sandbox,
            Milliy Sertifikat (189 ball), video darslar, audio kitoblar va Gemini AI repetitor.
          </p>

          <div className="flex flex-wrap gap-3.5 justify-center">
            <button
              onClick={() => setShowAuth('signup')}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-sm sm:text-base inline-flex items-center gap-2.5 shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
            >
              Akkaunt Yaratish <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowAuth('login')}
              className="px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm sm:text-base border border-slate-700 inline-flex items-center gap-2 transition"
            >
              Tizimga Kirish
            </button>

            <button
              onClick={enterGuest}
              className="px-5 py-3.5 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-sm sm:text-base border border-slate-800 inline-flex items-center gap-2 transition"
            >
              <Eye className="w-4 h-4 text-indigo-400" /> Mehmon Rejimi
            </button>
          </div>

          {/* Quick Creator Direct Sign-In Banner */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 max-w-md mx-auto">
            <button
              onClick={() => {
                enterAsCreator();
                onEnter();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 text-xs font-bold border border-purple-500/30 flex items-center justify-center gap-2 transition group"
            >
              <Crown className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Yaratuvchi ({CREATOR_EMAIL}) sifatida tezkor kirish</span>
            </button>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16 flex-1">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Platformaning Asosiy Imkoniyatlari
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Har bir bo'lim chuqur pedagogik va texnologik asosda yaratilgan
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="glass rounded-3xl p-6 border border-slate-800/80 hover:border-indigo-500/40 transition group relative overflow-hidden"
            >
              {f.badge && (
                <span className="absolute top-4 right-4 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {f.badge}
                </span>
              )}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-indigo-600/20 text-indigo-400 group-hover:scale-110 transition-transform border border-indigo-500/20">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base mb-1.5 text-white">{f.title}</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="glass border-t border-slate-800/80 py-6 text-center text-xs text-slate-400">
        <p className="font-medium text-slate-300">
          {globalTheme?.site_name ?? 'Smart Academy'} — Zamonaviy Raqamli Ta'lim Ekotizimi
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          IT Dasturlash • Darsxona • Milliy Sertifikat • Audio Kitoblar • Gemini AI Repetitor
        </p>
      </footer>
    </div>
  );
}

// ---------------- LOGIN FORM ----------------
function LoginForm({
  onBack,
  onGoSignup,
  onGoSimple,
  onSuccess,
}: {
  onBack: () => void;
  onGoSignup: () => void;
  onGoSimple: () => void;
  onSuccess: () => void;
}) {
  const { signInWithDetails, enterAsCreator } = useAuth();
  const { globalTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    const res = await signInWithDetails(email, password);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Email yoki parol noto'g'ri.");
      return;
    }
    onSuccess();
  };

  const handleQuickCreator = () => {
    enterAsCreator();
    onSuccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <span className="inline-flex w-12 h-12 rounded-2xl items-center justify-center text-white mb-3 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-xl">
            <GraduationCap className="w-6 h-6" />
          </span>
          <h1 className="text-2xl font-black text-white">{globalTheme?.site_name ?? 'Smart Academy'}</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Akkauntingizga kiring</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-3xl p-7 space-y-4 border border-indigo-500/30 shadow-2xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="font-bold text-lg text-white">Tizimga Kirish</h2>
            <button
              type="button"
              onClick={handleQuickCreator}
              className="text-[11px] text-purple-300 hover:text-purple-200 font-bold bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-500/30 flex items-center gap-1"
              title="Yaratuvchi profili sifatida kirish"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" /> Yaratuvchi kirishi
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Email Manzil</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                placeholder="masalan: dilshodbekrayimov6@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-500 outline-none text-sm text-slate-100 placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Parol</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                placeholder="Parolingizni kiriting"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-500 outline-none text-sm text-slate-100 placeholder-slate-500"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-rose-300 bg-rose-950/50 px-3.5 py-2.5 rounded-xl border border-rose-500/30">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold text-sm bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {loading ? 'Tekshirilmoqda…' : 'Kirish'}
          </button>

          <div className="pt-2 text-center text-xs text-slate-400 space-y-2">
            <button
              type="button"
              onClick={onGoSimple}
              className="w-full py-2 px-3 rounded-xl border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-950/60 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" /> Oddiy username/parol orqali kirish (Gmailsiz)
            </button>
            <p>
              Akkauntingiz yo'qmi?{' '}
              <button
                type="button"
                onClick={onGoSignup}
                className="text-indigo-400 hover:text-indigo-300 font-bold underline ml-1"
              >
                Ro'yxatdan o'tish
              </button>
            </p>
            <div>
              <button type="button" onClick={onBack} className="text-slate-500 hover:text-slate-300">
                ← Bosh sahifaga qaytish
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------- SIGNUP FORM ----------------
function SignupForm({
  onBack,
  onGoLogin,
  onGoSimple,
  onSuccess,
}: {
  onBack: () => void;
  onGoLogin: () => void;
  onGoSimple: () => void;
  onSuccess: () => void;
}) {
  const { signUpWithDetails } = useAuth();
  const { globalTheme } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [captchaOk, setCaptchaOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!captchaOk) {
      setError("Iltimos, botdan himoya tekshiruvini bajaring.");
      return;
    }
    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Parollar bir xil emas. Qaytadan tekshiring.");
      return;
    }

    setError(null);
    setLoading(true);

    const res = await signUpWithDetails(email, password, displayName, role);
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Ro'yxatdan o'tishda xatolik yuz berdi.");
      return;
    }
    onSuccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <span className="inline-flex w-12 h-12 rounded-2xl items-center justify-center text-white mb-3 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 shadow-xl">
            <GraduationCap className="w-6 h-6" />
          </span>
          <h1 className="text-2xl font-black text-white">{globalTheme?.site_name ?? 'Smart Academy'}</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Yangi ta'lim akkauntini yarating</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-3xl p-7 space-y-3.5 border border-indigo-500/30 shadow-2xl">
          <h2 className="font-bold text-lg text-white pb-2 border-b border-slate-800">
            Ro'yxatdan O'tish
          </h2>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">Ism va Familiya</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Masalan: Dilshodbek Rayimov"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-500 outline-none text-sm text-slate-100 placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                placeholder="email@misol.uz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-500 outline-none text-sm text-slate-100 placeholder-slate-500"
              />
            </div>
            {email.toLowerCase() === CREATOR_EMAIL.toLowerCase() && (
              <p className="text-[11px] text-amber-400 mt-1 font-semibold flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" /> Yaratuvchi (Creator) sifatida ro'yxatdan o'tmoqdasiz!
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Parol</label>
              <input
                type="password"
                placeholder="Kamida 6 belgi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-500 outline-none text-sm text-slate-100 placeholder-slate-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Takrorlang</label>
              <input
                type="password"
                placeholder="Parolni tasdiqlang"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-500 outline-none text-sm text-slate-100 placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">Rol / Maqom</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="student">O'quvchi / Abituriyent</option>
              <option value="admin">O'qituvchi / Admin</option>
              <option value="creator">Yaratuvchi (To'liq nazorat)</option>
            </select>
          </div>

          <div className="pt-1">
            <Captcha onVerify={setCaptchaOk} label="Botdan himoya tekshiruvi" compact={true} />
          </div>

          {error && (
            <div className="text-xs text-rose-300 bg-rose-950/50 px-3.5 py-2.5 rounded-xl border border-rose-500/30">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
          >
            {loading ? 'Yaratilmoqda…' : "Akkaunt Yaratish"}
          </button>

          <div className="pt-2 text-center text-xs text-slate-400 space-y-2">
            <button
              type="button"
              onClick={onGoSimple}
              className="w-full py-2 px-3 rounded-xl border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-950/60 font-semibold text-xs transition flex items-center justify-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" /> Oddiy username/parol bilan ro'yxatdan o'tish
            </button>
            <p>
              Akkauntingiz bormi?{' '}
              <button
                type="button"
                onClick={onGoLogin}
                className="text-indigo-400 hover:text-indigo-300 font-bold underline ml-1"
              >
                Kirish
              </button>
            </p>
            <div>
              <button type="button" onClick={onBack} className="text-slate-500 hover:text-slate-300">
                ← Bosh sahifaga qaytish
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
