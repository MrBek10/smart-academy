import { useEffect, useState } from 'react';
import { BookOpen, Users, Trophy, Sparkles, ArrowRight, Scale, Clock, Award, Library, GraduationCap, BookText, Star, Plus, Video, Mail, Code2, Brain } from 'lucide-react';
import { supabase, Subject, Exam, ExamResult, Book, ActivityLog } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

const ICONS: Record<string, typeof BookOpen> = {
  BookOpen,
  Scale,
};

export default function StudentHome({
  onOpenSubject,
  onOpenTournaments,
  onOpenExams,
  onOpenLibrary,
  onOpenAdmin,
  onOpenCourses,
  onOpenVideo,
  onOpenAI,
  onOpenContact,
  onOpenDarsxona,
  onOpenCoding,
  onOpenLogic,
  isAdmin = false,
}: {
  onOpenSubject: (id: string) => void;
  onOpenTournaments: () => void;
  onOpenExams: () => void;
  onOpenLibrary: () => void;
  onOpenAdmin?: () => void;
  onOpenCourses?: () => void;
  onOpenVideo?: () => void;
  onOpenAI?: () => void;
  onOpenContact?: () => void;
  onOpenDarsxona?: () => void;
  onOpenCoding?: () => void;
  onOpenLogic?: () => void;
  isAdmin?: boolean;
}) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: subs }, { data: exs }, { data: bks }] = await Promise.all([
        supabase.from('subjects').select('*').order('sort_order'),
        supabase.from('exams').select('*').order('created_at', { ascending: false }),
        supabase.from('books').select('*').order('created_at', { ascending: false }).limit(6),
      ]);
      setSubjects((subs as Subject[]) ?? []);
      setExams((exs as Exam[]) ?? []);
      setBooks((bks as Book[]) ?? []);

      if (user) {
        const [{ data: rs }, { data: lg }] = await Promise.all([
          supabase.from('exam_results').select('*').eq('user_id', user.id),
          supabase.from('activity_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
        ]);
        setResults((rs as ExamResult[]) ?? []);
        setLogs((lg as ActivityLog[]) ?? []);
      }
      setLoading(false);
    })();
  }, [user]);

  const primary = 'var(--theme-primary, #2563eb)';
  const accent = 'var(--theme-accent, #d4af37)';

  const totalSeconds = logs.reduce((acc, l) => acc + (l.duration_seconds ?? 0), 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  const quizzesCount = results.length;
  const booksRead = logs.filter((l) => l.action === 'kitob').length;
  const bestCert = results.length > 0 ? Math.max(...results.map((r) => r.cert_score)) : 0;
  const certLevel = bestCert >= 170 ? 'A' : bestCert >= 120 ? 'B' : bestCert > 0 ? 'C' : '-';

  return (
    <div>
      {/* Hero Banner — dark gradient like the mockup */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border-b border-slate-700/60">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-16">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30 mb-5">
            <Sparkles className="w-3.5 h-3.5" /> LITSEY VA IIV TIZIMI UCHUN
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 leading-tight max-w-2xl">
            Kelajak Zukko IIV Xodimlari va Bilimdon O'quvchilar
          </h1>
          <p className="text-slate-300 mt-4 text-sm sm:text-base leading-relaxed max-w-2xl">
            DTM testlari, Milliy sertifikat simulyatsiyasi, audio-kitoblar va real-time Gemini AI platformasi orqali bilimlaringizni sinang.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onOpenExams}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Test Topshirishni Boshlash
            </button>
            {onOpenCoding && (
              <button
                onClick={onOpenCoding}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
              >
                <Code2 className="w-4 h-4" /> IT & Kod Sandbox
              </button>
            )}
            <button
              onClick={() => onOpenDarsxona ? onOpenDarsxona() : subjects[0] && onOpenSubject(subjects[0].id)}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" /> Darsxonaga Kirish
            </button>
            <button
              onClick={onOpenLibrary}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition flex items-center gap-2"
            >
              <Library className="w-4 h-4" /> Kutubxona
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-10 max-w-lg">
            {[
              { icon: BookOpen, label: 'Fanlar', value: subjects.length },
              { icon: Users, label: 'Imtihonlar', value: exams.length },
              { icon: Sparkles, label: 'AI repetitor', value: '24/7' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <s.icon className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                <div className="text-2xl font-bold text-white">{loading ? '—' : s.value}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Overview — glass cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard icon={Clock} label="Platformadagi Vaqt" value={`${totalMinutes} daqiqa`} color="blue" />
          <StatCard icon={BookText} label="Yechilgan Testlar" value={`${quizzesCount} ta`} color="emerald" />
          <StatCard icon={Award} label="Sertifikat Darajasi" value={certLevel} color="amber" />
          <StatCard icon={BookOpen} label="Tavsiya Kitoblar" value={`${booksRead} ta`} color="purple" />
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          <ModuleCard
            icon={BookOpen}
            title="Darsxona Workspace"
            desc="IIV va maktab fanlari bo'yicha faol video ta'lim, dars konspektlari va resurslar."
            cta="Darsxonaga o'tish"
            onClick={onOpenDarsxona ?? (() => subjects[0] && onOpenSubject(subjects[0].id))}
            iconBg="from-emerald-600 to-emerald-500"
          />
          <ModuleCard
            icon={Code2}
            title="IT & Dasturlash Sandbox"
            desc="Python, JS, C++, Go kod muhriti, interaktiv terminal va Gemini AI Code Mentor."
            cta="Kod yozishni boshlash"
            onClick={onOpenCoding ?? (() => {})}
            iconBg="from-cyan-600 to-indigo-600"
          />
          <ModuleCard
            icon={Brain}
            title="Mantiq, Shaxmat & Shashka"
            desc="Mantiqiy jumboqlar, shaxmat etyudlari va in-browser AI ga qarshi 8x8 shaxmat jangi."
            cta="Maydonga kirish"
            onClick={onOpenLogic ?? (() => {})}
            iconBg="from-purple-600 to-indigo-600"
          />
          <ModuleCard
            icon={GraduationCap}
            title="Kurslar"
            desc="O'zingerizga mos kursni tanlang va yoziling. Dars dasturi va narx mavjud."
            cta="Kurslarni ko'rish"
            onClick={onOpenCourses ?? (() => {})}
            iconBg="from-blue-600 to-indigo-500"
          />
          <ModuleCard
            icon={Video}
            title="Video Darslar"
            desc="Kategoriya va pleylistlar bo'yicha video darslar. Progressingiz avtomatik saqlanadi."
            cta="Videolarni ko'rish"
            onClick={onOpenVideo ?? (() => {})}
            iconBg="from-purple-600 to-purple-500"
          />
          <ModuleCard
            icon={Award}
            title="Imtihon Xonasi"
            desc="DTM testlari, Milliy sertifikat simulyatsiyasi va mavzulashtirilgan topshiriqlar."
            cta="Imtihonlarni ko'rish"
            onClick={onOpenExams}
            iconBg="from-amber-600 to-amber-500"
          />
          <ModuleCard
            icon={Library}
            title="Raqamli Kutubxona"
            desc="Huquqshunoslik va umumta'lim fanlariga oid darsliklar hamda IIV qo'llanmalari."
            cta="Kutubxonani ochish"
            onClick={onOpenLibrary}
            iconBg="from-rose-600 to-rose-500"
          />
          <ModuleCard
            icon={Sparkles}
            title="AI Yordamchi"
            desc="Gemini AI yordamida istalgan savolingizga javob oling. Bilimingizni chuqurlashtiring."
            cta="Savol berish"
            onClick={onOpenAI ?? (() => {})}
            iconBg="from-cyan-600 to-blue-500"
          />
          <ModuleCard
            icon={Mail}
            title="Bog'lanish"
            desc="Savolingiz bormi? Xabar qoldiring, biz tez orada javob beramiz."
            cta="Xabar yuborish"
            onClick={onOpenContact ?? (() => {})}
            iconBg="from-slate-600 to-slate-500"
          />
        </div>

        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
          <BookOpen className="w-6 h-6 text-blue-400" /> Fanlar
        </h2>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => <div key={i} className="h-44 glass rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.map((s) => {
              const Icon = ICONS[s.icon] ?? BookOpen;
              return (
                <button
                  key={s.id}
                  onClick={() => onOpenSubject(s.id)}
                  className="group text-left glass rounded-2xl p-6 hover:border-blue-500/40 hover:-translate-y-0.5 transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ background: `color-mix(in srgb, ${s.color} 20%, transparent)`, color: s.color }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-1.5 text-white">{s.title}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2">{s.description ?? ''}</p>
                  <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-blue-400">
                    Mavzularni ko'rish <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Recent books preview */}
        {books.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                <Library className="w-6 h-6 text-purple-400" /> Kutubxonadan so'nggi kitoblar
              </h2>
              <button onClick={onOpenLibrary} className="text-sm font-medium inline-flex items-center gap-1 text-blue-400">
                Barchasini ko'rish <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {books.slice(0, 4).map((b) => (
                <button key={b.id} onClick={onOpenLibrary} className="text-left glass rounded-2xl p-4 hover:border-indigo-500/40 transition-all">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2 bg-indigo-500/20 text-indigo-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-sm line-clamp-2 text-white">{b.title}</h4>
                  {b.author && <span className="text-xs text-slate-400">{b.author}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-14 flex flex-wrap gap-3">
          <button onClick={onOpenExams} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition">
            <Award className="w-4 h-4" /> Imtihon Xonasi
          </button>
          {isAdmin && (
            <button onClick={onOpenTournaments} className="px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-semibold flex items-center gap-2 hover:bg-slate-700/60 transition">
              <Trophy className="w-4 h-4" /> Turnirlar
            </button>
          )}
          {isAdmin && onOpenAdmin && (
            <button onClick={onOpenAdmin} className="px-5 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-2 hover:bg-emerald-600/30 transition">
              <Plus className="w-4 h-4" /> Yangi Test qo'shish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const colorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  amber: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
};

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Clock; label: string; value: string; color: keyof typeof colorMap }) {
  const c = colorMap[color];
  return (
    <div className="glass p-5 rounded-2xl flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.text} flex items-center justify-center text-xl shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <span className="text-xs text-slate-400 font-medium block">{label}</span>
        <span className="text-xl font-bold truncate block text-white">{value}</span>
      </div>
    </div>
  );
}

function ModuleCard({ icon: Icon, title, desc, cta, onClick, iconBg }: { icon: typeof BookOpen; title: string; desc: string; cta: string; onClick: () => void; iconBg: string }) {
  return (
    <button onClick={onClick} className="group glass rounded-2xl p-6 hover:border-slate-600 hover:-translate-y-0.5 transition-all text-left">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${iconBg} text-white flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-bold text-lg mb-2 text-white">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed mb-4">{desc}</p>
      <span className="text-xs font-semibold inline-flex items-center text-blue-400">
        {cta} <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
      </span>
    </button>
  );
}
