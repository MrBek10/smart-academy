import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Video,
  PlayCircle,
  Clock,
  CheckCircle2,
  BookOpen,
  StickyNote,
  Save,
  Download,
  Sparkles,
  ChevronRight,
  GraduationCap,
  FileText,
  Share2,
  Calendar,
} from 'lucide-react';
import { supabase, VideoLesson, VideoProgress, Subject, TestFile } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import WeeklySchedule from '@/components/WeeklySchedule';

type Note = { video_id: string; text: string; updated: string };

const DEFAULT_VIDEOS: VideoLesson[] = [
  {
    id: 'vid-1',
    title: "1-Dars. Konstitutsiya va Inson Huquqlari: Davlat Suvereniteti",
    description: "Yangi tahrirdagi O'zbekiston Respublikasi Konstitutsiyasining asosiy prinsiplari, davlat tuzilishi va inson qadri.",
    video_url: "https://www.youtube.com/embed/ysz5S6PUM-U",
    category: "Huquqshunoslik",
    playlist: "Litsey Asosiy Kursi",
    duration_seconds: 1420,
    thumbnail_url: null,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'vid-2',
    title: "2-Dars. Jinoyat Huquqi Umumiy Qismi va Javobgarlik Asoslari",
    description: "Jinoyat tarkibi elementlari, jazoni yengillashtiruvchi va og'irlashtiruvchi holatlar, zaruriy mudofaa chegaralari.",
    video_url: "https://www.youtube.com/embed/ysz5S6PUM-U",
    category: "Huquqshunoslik",
    playlist: "Litsey Asosiy Kursi",
    duration_seconds: 1680,
    thumbnail_url: null,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'vid-3',
    title: "3-Dars. Ichki Ishlar Organlarining Huquqiy Maqomi va Xizmat Faoliyati",
    description: "IIV xodimining qonuniy burchlari, jamoat xavfsizligini ta'minlash, fuqarolar bilan muloqot va kasbiy etika qoidalari.",
    video_url: "https://www.youtube.com/embed/ysz5S6PUM-U",
    category: "Maxsus",
    playlist: "IIV Maxsus Tayyorgarlik",
    duration_seconds: 1350,
    thumbnail_url: null,
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: 'vid-4',
    title: "4-Dars. Milliy Sertifikat va DTM Test Savollarini Yechish Usullari",
    description: "189 ballik baholash mezonida mantiqiy tahlil, xatolar ustida ishlash va vaqtdan unumli foydalanish strategiyalari.",
    video_url: "https://www.youtube.com/embed/ysz5S6PUM-U",
    category: "Umumta'lim",
    playlist: "Imtihonlarga Tayyorgarlik",
    duration_seconds: 1890,
    thumbnail_url: null,
    sort_order: 4,
    created_at: new Date().toISOString(),
  },
];

export default function Darsxona({
  onBack,
  onOpenAI,
}: {
  onBack: () => void;
  onOpenAI: () => void;
}) {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progress, setProgress] = useState<Record<string, VideoProgress>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<VideoLesson | null>(null);
  const [noteText, setNoteText] = useState('');
  const [activeSubject, setActiveSubject] = useState<string>('Barchasi');
  const [testFiles, setTestFiles] = useState<TestFile[]>([]);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState<'lessons' | 'schedule'>('lessons');

  useEffect(() => {
    (async () => {
      try {
        const [{ data: vids }, { data: subs }] = await Promise.all([
          supabase.from('video_lessons').select('*').order('sort_order').order('created_at'),
          supabase.from('subjects').select('*').order('sort_order'),
        ]);

        let vidArr = (vids as VideoLesson[]) ?? [];
        if (vidArr.length === 0) {
          vidArr = DEFAULT_VIDEOS;
        }

        setVideos(vidArr);
        setActiveVideo(vidArr[0] || null);

        setSubjects((subs as Subject[]) ?? []);

        if (user) {
          const { data: pg } = await supabase.from('video_progress').select('*').eq('user_id', user.id);
          const pMap: Record<string, VideoProgress> = {};
          (pg as VideoProgress[])?.forEach((p) => {
            pMap[p.video_id] = p;
          });
          setProgress(pMap);
        }

        const { data: tf } = await supabase
          .from('test_files')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        setTestFiles((tf as TestFile[]) ?? []);
      } catch (err) {
        console.warn('Darsxona load error:', err);
        setVideos(DEFAULT_VIDEOS);
        setActiveVideo(DEFAULT_VIDEOS[0]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Load notes whenever active video changes
  useEffect(() => {
    if (!activeVideo) return;
    const userId = user?.id || 'guest';
    const key = `darsxona_notes_${userId}_${activeVideo.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Note;
        setNoteText(parsed.text);
        setNotes((n) => ({ ...n, [activeVideo.id]: parsed.text }));
        return;
      } catch {
        /* ignore */
      }
    }
    setNoteText('');
  }, [activeVideo, user]);

  const saveNote = () => {
    if (!activeVideo) return;
    const userId = user?.id || 'guest';
    const key = `darsxona_notes_${userId}_${activeVideo.id}`;
    const note: Note = { video_id: activeVideo.id, text: noteText, updated: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(note));
    setNotes((n) => ({ ...n, [activeVideo.id]: noteText }));
    setNoteSavedFeedback(true);
    setTimeout(() => setNoteSavedFeedback(false), 2500);
  };

  const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const markComplete = async (v: VideoLesson) => {
    if (!user) return;
    try {
      await supabase.from('video_progress').upsert(
        {
          user_id: user.id,
          video_id: v.id,
          watched_seconds: v.duration_seconds,
          completed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,video_id' }
      );
      const { data: pg } = await supabase.from('video_progress').select('*').eq('user_id', user.id);
      const pMap: Record<string, VideoProgress> = {};
      (pg as VideoProgress[])?.forEach((p) => {
        pMap[p.video_id] = p;
      });
      setProgress(pMap);
    } catch (err) {
      console.warn('Progress mark error:', err);
    }
  };

  const downloadFile = async (f: TestFile) => {
    try {
      const { data } = await supabase.storage.from('test-files').createSignedUrl(f.file_path, 3600);
      if (data) window.open(data.signedUrl, '_blank');
    } catch {
      alert("Fayl yuklab olinmadi.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 font-medium">Darsxona yuklanmoqda…</p>
      </div>
    );
  }

  const completedCount = Object.values(progress).filter((p) => p.completed).length;
  const totalCount = videos.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredVideos =
    activeSubject === 'Barchasi'
      ? videos
      : videos.filter(
          (v) =>
            v.category === activeSubject ||
            v.category.toLowerCase().includes(activeSubject.toLowerCase())
        );

  // Helper to embed YouTube or other video urls safely
  const getEmbedUrl = (rawUrl: string) => {
    if (!rawUrl) return '';
    if (rawUrl.includes('youtube.com/watch?v=')) {
      const vId = rawUrl.split('watch?v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${vId}`;
    }
    if (rawUrl.includes('youtu.be/')) {
      const vId = rawUrl.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${vId}`;
    }
    return rawUrl;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white mb-6 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Bosh sahifaga
      </button>

      {/* Hero Header */}
      <div className="rounded-3xl p-7 sm:p-9 mb-8 text-white bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase mb-4 backdrop-blur-md">
          <BookOpen className="w-3.5 h-3.5" /> Darsxona — Faol O'rganish & Video Konspekt Markazi
        </div>

        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2 text-white">
              Darsxona Workspace
            </h1>
            <p className="text-slate-200 text-sm sm:text-base max-w-2xl leading-relaxed">
              Video darslarni tomosha qiling, har bir mavzu bo'yicha shaxsiy konspekt va eslatmalar yozing, progressni kuzating va savollar bo'yicha AI repetitorga murojaat qiling.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 shrink-0">
            <div className="text-center px-3 border-r border-slate-800">
              <div className="text-xl font-black text-white font-mono">{totalCount}</div>
              <div className="text-[11px] text-slate-400">Jami Dars</div>
            </div>
            <div className="text-center px-3 border-r border-slate-800">
              <div className="text-xl font-black text-emerald-400 font-mono">{completedCount}</div>
              <div className="text-[11px] text-slate-400">Tugallangan</div>
            </div>
            <div className="text-center px-3">
              <div className="text-xl font-black text-indigo-400 font-mono">{progressPercent}%</div>
              <div className="text-[11px] text-slate-400">Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Section Switcher */}
      <div className="flex gap-2 p-1.5 glass rounded-2xl mb-6 w-fit border border-slate-800">
        <button
          onClick={() => setWorkspaceTab('lessons')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            workspaceTab === 'lessons'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Video Darslar & Konspekt</span>
        </button>

        <button
          onClick={() => setWorkspaceTab('schedule')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
            workspaceTab === 'schedule'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Haftalik Dars Jadvali & Kalendar</span>
        </button>
      </div>

      {workspaceTab === 'schedule' ? (
        <WeeklySchedule
          onSelectVideoLesson={(vidId) => {
            const found = videos.find((v) => v.id === vidId);
            if (found) {
              setActiveVideo(found);
              setWorkspaceTab('lessons');
            }
          }}
        />
      ) : (
        <>
          {/* Category filter tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveSubject('Barchasi')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeSubject === 'Barchasi'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'glass text-slate-300 hover:text-white border-slate-800'
              }`}
            >
              Barchasi ({videos.length})
            </button>
            {['Huquqshunoslik', 'Maxsus', "Umumta'lim"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveSubject(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeSubject === cat
                    ? 'bg-indigo-600 text-white shadow'
                    : 'glass text-slate-300 hover:text-white border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Main Workspace 2-column layout */}
          <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Video list */}
        <div className="lg:col-span-1 space-y-3 max-h-[720px] overflow-y-auto pr-1">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
            <Video className="w-4 h-4 text-indigo-400" /> Darslar Ro'yxati
          </h2>

          {filteredVideos.map((v) => {
            const pg = progress[v.id];
            const isActive = activeVideo?.id === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setActiveVideo(v)}
                className={`w-full text-left rounded-2xl p-4 transition-all border ${
                  isActive
                    ? 'border-indigo-500 bg-indigo-950/60 shadow-lg shadow-indigo-950/50'
                    : 'glass border-slate-800/80 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      pg?.completed
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-indigo-300'
                    }`}
                  >
                    {pg?.completed ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <PlayCircle className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold text-sm line-clamp-2 leading-snug ${
                        isActive ? 'text-white font-bold' : 'text-slate-200'
                      }`}
                    >
                      {v.title}
                    </h3>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-500" /> {fmtDur(v.duration_seconds)}
                      </span>
                      <span>•</span>
                      <span className="text-indigo-300 font-medium">{v.category}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {filteredVideos.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-10 glass rounded-2xl p-4">
              Ushbu toifada darslar topilmadi.
            </p>
          )}
        </div>

        {/* Right: Active video screen + Notebook + AI shortcut */}
        <div className="lg:col-span-2 space-y-6">
          {activeVideo ? (
            <>
              {/* Video Player */}
              <div className="glass rounded-3xl overflow-hidden border border-indigo-500/30 shadow-2xl">
                <div className="aspect-video bg-black relative">
                  <iframe
                    src={getEmbedUrl(activeVideo.video_url)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={activeVideo.title}
                  />
                </div>

                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      {activeVideo.title}
                    </h2>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0 w-fit">
                      {activeVideo.category}
                    </span>
                  </div>

                  {activeVideo.description && (
                    <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                      {activeVideo.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300 font-mono">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" /> {fmtDur(activeVideo.duration_seconds)}
                      </span>
                      {activeVideo.playlist && (
                        <span>Pleylist: {activeVideo.playlist}</span>
                      )}
                    </div>

                    <button
                      onClick={() => markComplete(activeVideo)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow ${
                        progress[activeVideo.id]?.completed
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {progress[activeVideo.id]?.completed
                        ? 'Dars o\'zlashtirilgan'
                        : 'Darsni yakunlash'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes workspace */}
              <div className="glass rounded-3xl p-6 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-indigo-400" /> Dars Konspekti & Shaxsiy Eslatmalar
                  </h3>
                  {noteSavedFeedback && (
                    <span className="text-xs text-emerald-400 font-semibold animate-in fade-in flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saqlandi
                    </span>
                  )}
                </div>

                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={5}
                  placeholder="Ushbu dars bo'yicha muhim qoidalar, xulosalar yoki savollaringizni yozib boring..."
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 focus:border-indigo-500 outline-none text-sm text-slate-100 placeholder-slate-500 resize-y leading-relaxed transition"
                />

                <div className="flex items-center justify-between mt-3">
                  <span className="text-[11px] text-slate-400">
                    Eslatmalar avtomatik ravishda xotirada saqlanadi.
                  </span>
                  <button
                    onClick={saveNote}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 inline-flex items-center gap-1.5 transition shadow"
                  >
                    <Save className="w-3.5 h-3.5" /> Saqlash
                  </button>
                </div>
              </div>

              {/* AI Q&A Shortcut Banner */}
              <button
                onClick={onOpenAI}
                className="w-full glass rounded-3xl p-5 hover:border-indigo-500/50 transition-all text-left border border-slate-800 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-sm group-hover:text-indigo-200 transition-colors">
                      AI Repetitordan So'rash (Gemini AI)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ushbu video dars mavzusi bo'yicha tushunmagan savollaringizga bir zumda javob oling.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </>
          ) : (
            <div className="glass rounded-3xl p-16 text-center border border-slate-800">
              <PlayCircle className="w-16 h-16 text-indigo-400/40 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">Darsni tanlang</h3>
              <p className="text-xs text-slate-400">
                Chap tomondagi ro'yxatdan darsni bosing va tomosha qilishni boshlang.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )}
</div>
  );
}
