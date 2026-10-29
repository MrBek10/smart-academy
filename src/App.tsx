import { useState } from 'react';
import {
  GraduationCap,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  BookOpen,
  Trophy,
  Library,
  Eye,
  EyeOff,
  Headphones,
  Video,
  Sparkles,
  Mail,
  GraduationCap as CourseIcon,
  Code2,
  Settings,
  Brain,
  UserPlus,
} from 'lucide-react';
import SimpleAuth from '@/components/SimpleAuth';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { ToastProvider } from '@/components/Toast';
import { AudioProvider, useAudio } from '@/lib/audio';
import { SoundtrackMiniBar } from '@/components/SoundtrackPlayer';
import Landing from '@/views/Landing';
import StudentHome from '@/views/StudentHome';
import SubjectDetail from '@/views/SubjectDetail';
import Classroom from '@/views/Classroom';
import Darsxona from '@/views/Darsxona';
import ExamRoom from '@/views/ExamRoom';
import ExamList from '@/views/ExamList';
import AdminPanel from '@/views/AdminPanel';
import Tournaments from '@/views/Tournaments';
import ProfilePage from '@/views/ProfilePage';
import LibraryPage from '@/views/Library';
import VideoLessons from '@/views/VideoLessons';
import Courses from '@/views/Courses';
import CourseDetail from '@/views/CourseDetail';
import AIAssistant from '@/views/AIAssistant';
import CodingAcademy from '@/views/CodingAcademy';
import LogicGames from '@/views/LogicGames';
import SiteSettings from '@/views/SiteSettings';
import ContactForm from '@/components/ContactForm';

type Route =
  | { name: 'home' }
  | { name: 'darsxona' }
  | { name: 'coding' }
  | { name: 'logic' }
  | { name: 'subject'; subjectId: string }
  | { name: 'classroom'; topicId: string }
  | { name: 'exams' }
  | { name: 'exam'; examId: string }
  | { name: 'admin' }
  | { name: 'tournaments' }
  | { name: 'library' }
  | { name: 'profile' }
  | { name: 'settings' }
  | { name: 'video' }
  | { name: 'courses' }
  | { name: 'course'; courseId: string }
  | { name: 'ai' }
  | { name: 'contact' };

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <AudioProvider>
            <AppInner />
            <SoundtrackMiniBar />
          </AudioProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

function AppInner() {
  const { user, profile, loading, isGuest, signOut } = useAuth();
  const { globalTheme } = useTheme();
  const { setShowFullPlayer, isPlaying } = useAudio();
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [navOpen, setNavOpen] = useState(false);
  const [viewAsStudent, setViewAsStudent] = useState(false);
  const [showSimpleAuthModal, setShowSimpleAuthModal] = useState(false);

  const go = (r: Route) => {
    setRoute(r);
    setNavOpen(false);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-slate-300 font-medium text-sm">Smart Academy yuklanmoqda...</div>
        </div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return <Landing onEnter={() => go({ name: 'home' })} />;
  }

  const role = profile?.role ?? 'guest';
  const isAdmin = (role === 'admin' || role === 'creator') && !viewAsStudent;
  const isActualAdmin = role === 'admin' || role === 'creator';
  const siteName = globalTheme?.site_name ?? 'Smart Academy';

  const navItems: { label: string; icon: typeof BookOpen; active: boolean; onClick: () => void; badge?: string }[] = [
    { label: 'Bosh sahifa', icon: BookOpen, active: route.name === 'home', onClick: () => go({ name: 'home' }) },
    { label: 'Darsxona', icon: Video, active: route.name === 'darsxona', onClick: () => go({ name: 'darsxona' }) },
    { label: 'Dasturlash', icon: Code2, active: route.name === 'coding', onClick: () => go({ name: 'coding' }), badge: 'IT' },
    { label: 'Mantiq & Shaxmat', icon: Brain, active: route.name === 'logic', onClick: () => go({ name: 'logic' }), badge: 'Yangi' },
    { label: 'Kurslar', icon: CourseIcon, active: route.name === 'courses' || route.name === 'course', onClick: () => go({ name: 'courses' }) },
    { label: 'Video Darslar', icon: Video, active: route.name === 'video', onClick: () => go({ name: 'video' }) },
    { label: 'Kutubxona', icon: Library, active: route.name === 'library', onClick: () => go({ name: 'library' }) },
    { label: 'Imtihon Xonasi', icon: GraduationCap, active: route.name === 'exams' || route.name === 'exam', onClick: () => go({ name: 'exams' }) },
    { label: 'AI Yordamchi', icon: Sparkles, active: route.name === 'ai', onClick: () => go({ name: 'ai' }) },
    { label: 'Sozlamalar', icon: Settings, active: route.name === 'settings', onClick: () => go({ name: 'settings' }) },
  ];
  if (isAdmin) navItems.push({ label: 'Turnirlar', icon: Trophy, active: route.name === 'tournaments', onClick: () => go({ name: 'tournaments' }) });
  if (isAdmin) navItems.push({ label: 'Admin panel', icon: LayoutDashboard, active: route.name === 'admin', onClick: () => go({ name: 'admin' }) });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
      <header className="glass-strong sticky top-0 z-40 border-b border-slate-700/60 shadow-lg shadow-black/20 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => go({ name: 'home' })} className="flex items-center gap-2.5 group">
            <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div className="text-left">
              <span className="font-extrabold text-lg tracking-tight text-white block leading-tight">
                {siteName}
              </span>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase block">
                Litsey & IT Ta'lim
              </span>
            </div>
          </button>

          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((n) => (
              <button
                key={n.label}
                onClick={n.onClick}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  n.active
                    ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-indigo-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <n.icon className="w-3.5 h-3.5" />
                <span>{n.label}</span>
                {n.badge && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500 text-slate-950 font-black">
                    {n.badge}
                  </span>
                )}
              </button>
            ))}

            <div className="w-px h-5 bg-slate-800 mx-1.5" />

            {/* Soundtrack player quick button */}
            <button
              onClick={() => setShowFullPlayer(true)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition relative"
              title="Fokus Soundtrack Pleyer"
            >
              <Headphones className="w-4 h-4 text-indigo-400" />
              {isPlaying && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            {isAdmin && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                  role === 'creator'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {role === 'creator' ? 'Yaratuvchi' : 'Admin'}
              </span>
            )}

            {isActualAdmin && (
              <button
                onClick={() => setViewAsStudent((v) => !v)}
                className="px-2 py-1 rounded-xl text-xs font-semibold border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition flex items-center gap-1"
              >
                {viewAsStudent ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {viewAsStudent ? 'Admin' : 'O\'quvchi'}
              </button>
            )}

            {user ? (
              <>
                <button
                  onClick={() => go({ name: 'profile' })}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-800/80 transition"
                  title="Profil sahifasi"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-indigo-500" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-700 to-purple-600 flex items-center justify-center text-white">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                  <span className="text-xs font-bold max-w-[100px] truncate text-slate-200">
                    {profile?.display_name ?? profile?.email}
                  </span>
                </button>
                <button
                  onClick={signOut}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Chiqish"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-1 text-[11px] font-bold text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
                  Mehmon
                </span>
                <button
                  onClick={() => setShowSimpleAuthModal(true)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-black text-cyan-300 hover:text-white bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-900/80 transition flex items-center gap-1 shadow-sm"
                  title="Gmail shart emas! Login va parol bilan akkaunt ochish"
                >
                  <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Akkaunt Ochish</span>
                </button>
              </div>
            )}
          </nav>

          {/* Mobile Nav Button */}
          <div className="flex items-center gap-2 xl:hidden">
            <button
              onClick={() => setShowFullPlayer(true)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition relative"
            >
              <Headphones className="w-4 h-4 text-indigo-400" />
              {isPlaying && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setNavOpen(!navOpen)}
              className="p-2 rounded-xl hover:bg-slate-800/80 text-slate-200"
            >
              {navOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {navOpen && (
          <div className="xl:hidden glass border-t border-slate-700/60 px-4 py-3 space-y-1 max-h-[80vh] overflow-y-auto">
            {navItems.map((n) => (
              <button
                key={n.label}
                onClick={n.onClick}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between transition ${
                  n.active ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <n.icon className="w-4 h-4" />
                  <span>{n.label}</span>
                </div>
                {n.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950 font-black">
                    {n.badge}
                  </span>
                )}
              </button>
            ))}

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-700/60">
              <button
                onClick={() => go({ name: 'settings' })}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-800 flex items-center gap-2"
              >
                <Settings className="w-4 h-4 text-indigo-400" /> Sayt Sozlamalari
              </button>

              {user ? (
                <button
                  onClick={signOut}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" /> Chiqish
                </button>
              ) : (
                <button
                  onClick={() => {
                    setNavOpen(false);
                    setShowSimpleAuthModal(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Akkaunt Ochish (Gmail shart emas)</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Guest Banner Reminder */}
      {(!user || isGuest) && (
        <div className="bg-gradient-to-r from-indigo-950/95 via-slate-900/95 to-cyan-950/95 border-b border-cyan-500/30 px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <span className="text-xs">
              <strong className="text-white">Mehmon rejimi faol:</strong> O'quv natijalari, shaxmat reytingi va IT kodlaringizni saqlab qolish uchun oddiy akkaunt oching.
            </span>
            <span className="text-cyan-400 font-semibold hidden md:inline">
              (Gmail yoki tasdiqlash kodi umuman talab qilinmaydi!)
            </span>
          </div>
          <button
            onClick={() => setShowSimpleAuthModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow-md transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Akkaunt Ochish</span>
          </button>
        </div>
      )}

      <main className="flex-1 pb-16">
        {route.name === 'home' && (
          <StudentHome
            onOpenSubject={(id) => go({ name: 'subject', subjectId: id })}
            onOpenTournaments={() => go({ name: 'tournaments' })}
            onOpenExams={() => go({ name: 'exams' })}
            onOpenLibrary={() => go({ name: 'library' })}
            onOpenAdmin={() => go({ name: 'admin' })}
            onOpenCourses={() => go({ name: 'courses' })}
            onOpenVideo={() => go({ name: 'video' })}
            onOpenAI={() => go({ name: 'ai' })}
            onOpenContact={() => go({ name: 'contact' })}
            onOpenDarsxona={() => go({ name: 'darsxona' })}
            onOpenCoding={() => go({ name: 'coding' })}
            onOpenLogic={() => go({ name: 'logic' })}
            isAdmin={isAdmin}
          />
        )}
        {route.name === 'coding' && (
          <CodingAcademy onBack={() => go({ name: 'home' })} />
        )}
        {route.name === 'logic' && (
          <LogicGames onBack={() => go({ name: 'home' })} />
        )}
        {route.name === 'settings' && (
          <SiteSettings onBack={() => go({ name: 'home' })} />
        )}
        {route.name === 'darsxona' && (
          <Darsxona
            onBack={() => go({ name: 'home' })}
            onOpenAI={() => go({ name: 'ai' })}
          />
        )}
        {route.name === 'subject' && (
          <SubjectDetail
            subjectId={route.subjectId}
            onOpenClassroom={(topicId) => go({ name: 'classroom', topicId })}
            onBack={() => go({ name: 'home' })}
            onOpenExam={(examId) => go({ name: 'exam', examId })}
          />
        )}
        {route.name === 'classroom' && (
          <Classroom
            topicId={route.topicId}
            onBack={() => go({ name: 'home' })}
            onOpenSubject={(id) => go({ name: 'subject', subjectId: id })}
          />
        )}
        {route.name === 'exams' && (
          <ExamList
            onOpenExam={(id) => go({ name: 'exam', examId: id })}
            onBack={() => go({ name: 'home' })}
            onOpenAdmin={() => go({ name: 'admin' })}
            isAdmin={isAdmin}
          />
        )}
        {route.name === 'exam' && (
          <ExamRoom
            examId={route.examId}
            onBack={() => go({ name: 'exams' })}
          />
        )}
        {route.name === 'library' && (
          <LibraryPage onBack={() => go({ name: 'home' })} />
        )}
        {route.name === 'video' && (
          <VideoLessons onBack={() => go({ name: 'home' })} />
        )}
        {route.name === 'courses' && (
          <Courses
            onBack={() => go({ name: 'home' })}
            onOpenCourse={(id) => go({ name: 'course', courseId: id })}
          />
        )}
        {route.name === 'course' && (
          <CourseDetail
            courseId={route.courseId}
            onBack={() => go({ name: 'courses' })}
          />
        )}
        {route.name === 'ai' && (
          <AIAssistant
            onBack={() => go({ name: 'home' })}
            onOpenSettings={() => go({ name: 'settings' })}
          />
        )}
        {route.name === 'contact' && (
          <div className="max-w-2xl mx-auto px-4 py-8">
            <ContactForm />
          </div>
        )}
        {route.name === 'admin' && isAdmin && <AdminPanel />}
        {route.name === 'tournaments' && isAdmin && (
          <Tournaments canCreate={isAdmin} />
        )}
        {route.name === 'profile' && user && (
          <ProfilePage onBack={() => go({ name: 'home' })} />
        )}
      </main>

      <footer className="glass border-t border-slate-800/80 py-6 text-center text-xs text-slate-400">
        <p className="font-medium text-slate-300">
          {siteName} — Litseylar, IIV Tizimi va IT Dasturlash Uchun Raqamli Ta'lim Platformasi
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          Darsxona • IT Kod Sandbox • Audio Kitoblar • Milliy Sertifikat & DTM • Gemini AI • 20+ Fokus Soundtrack
        </p>
      </footer>

      {showSimpleAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <SimpleAuth
            onLoginSuccess={() => setShowSimpleAuthModal(false)}
            onClose={() => setShowSimpleAuthModal(false)}
          />
        </div>
      )}
    </div>
  );
}
