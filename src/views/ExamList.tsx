import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  GraduationCap,
  Clock,
  ChevronRight,
  BookOpen,
  Award,
  Plus,
  Building2,
  FileBadge,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { supabase, Exam, Subject, ExamResult, ExamType } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PdfTestModal from '@/components/PdfTestModal';
import { CaptchaModal } from '@/components/Captcha';

type PanelKey = 'dtm' | 'milliy_sertifikat' | 'mavzuviy';

const PANELS: { key: PanelKey; label: string; icon: typeof BookOpen; desc: string; badge: string }[] = [
  {
    key: 'milliy_sertifikat',
    label: 'Milliy Sertifikat',
    icon: FileBadge,
    desc: "189 ballik rasmiy baholash tizimi, A+ dan C gacha bo'lgan toifalar simulyatsiyasi",
    badge: '189 Ball Tizimi',
  },
  {
    key: 'dtm',
    label: 'DTM Testlari',
    icon: Building2,
    desc: "Davlat Test Markazi standartlaridagi majburiy va mutaxassislik fanlari bloklari",
    badge: 'DTM Standarti',
  },
  {
    key: 'mavzuviy',
    label: 'Mavzuiy Testlar',
    icon: BookOpen,
    desc: "Alohida mavzular va boblar bo'yicha mustahkamlovchi amaliy nazorat savollari",
    badge: 'Boblar Tahlili',
  },
];

const DEFAULT_EXAMS: (Exam & { subject_title: string; subject_color: string })[] = [
  // Milliy Sertifikat
  {
    id: 'exam-ms-1',
    title: "Huquqshunoslik Fanidan Milliy Sertifikat Sinovi",
    subject_id: 'sub-law',
    duration_minutes: 45,
    exam_type: 'milliy_sertifikat',
    created_at: new Date().toISOString(),
    subject_title: 'Huquqshunoslik',
    subject_color: '#3b82f6',
  },
  {
    id: 'exam-ms-2',
    title: "O'zbekiston Davlatchiligi va Tarixi Milliy Sertifikat Imtihoni",
    subject_id: 'sub-hist',
    duration_minutes: 35,
    exam_type: 'milliy_sertifikat',
    created_at: new Date().toISOString(),
    subject_title: "Umumta'lim",
    subject_color: '#8b5cf6',
  },
  // DTM Testlari
  {
    id: 'exam-dtm-1',
    title: "DTM Asosiy Blok: Huquqshunoslik + Ona tili + O'zbekiston tarixi",
    subject_id: 'sub-law',
    duration_minutes: 60,
    exam_type: 'dtm',
    created_at: new Date().toISOString(),
    subject_title: 'Huquqshunoslik',
    subject_color: '#3b82f6',
  },
  {
    id: 'exam-dtm-2',
    title: "IIV Litseylari Kirish Imtihonlari DTM Modeli",
    subject_id: 'sub-iiv',
    duration_minutes: 45,
    exam_type: 'dtm',
    created_at: new Date().toISOString(),
    subject_title: 'Maxsus',
    subject_color: '#10b981',
  },
  // Mavzuiy Testlar
  {
    id: 'exam-mav-1',
    title: "Konstitutsiya Asoslari va Fuqarolik Jamiyati Mavzuiy Testi",
    subject_id: 'sub-law',
    duration_minutes: 20,
    exam_type: 'mavzuviy',
    created_at: new Date().toISOString(),
    subject_title: 'Huquqshunoslik',
    subject_color: '#3b82f6',
  },
  {
    id: 'exam-mav-2',
    title: "Jinoyat Huquqi Umumiy Qism: Qilmish va Jinoiy Javobgarlik",
    subject_id: 'sub-law',
    duration_minutes: 25,
    exam_type: 'mavzuviy',
    created_at: new Date().toISOString(),
    subject_title: 'Huquqshunoslik',
    subject_color: '#f59e0b',
  },
  {
    id: 'exam-mav-3',
    title: "Ichki Ishlar Organlarida Xizmat O'tash Tartibi Nazorati",
    subject_id: 'sub-iiv',
    duration_minutes: 20,
    exam_type: 'mavzuviy',
    created_at: new Date().toISOString(),
    subject_title: 'Maxsus',
    subject_color: '#10b981',
  },
];

export default function ExamList({
  onOpenExam,
  onBack,
  onOpenAdmin,
  isAdmin = false,
}: {
  onOpenExam: (id: string) => void;
  onBack: () => void;
  onOpenAdmin?: () => void;
  isAdmin?: boolean;
}) {
  const { user, profile } = useAuth();
  const role = profile?.role ?? 'guest';
  const canManage = role === 'admin' || role === 'creator' || isAdmin;
  const [exams, setExams] = useState<(Exam & { subject_title: string; subject_color: string })[]>([]);
  const [results, setResults] = useState<Record<string, ExamResult>>({});
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState<PanelKey>('milliy_sertifikat');

  // Interactive PDF/OMR sheet modal state
  const [activePdfExam, setActivePdfExam] = useState<{
    title: string;
    type: 'milliy_sertifikat' | 'dtm' | 'mavzuviy';
    duration: number;
  } | null>(null);

  // Captcha gate before entering exam room
  const [targetExamId, setTargetExamId] = useState<string | null>(null);
  const [showCaptchaModal, setShowCaptchaModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: exs } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
        const exsArr = (exs as Exam[]) ?? [];

        let enriched: (Exam & { subject_title: string; subject_color: string })[] = [];

        if (exsArr.length > 0) {
          const subjectIds = [...new Set(exsArr.map((e) => e.subject_id))];
          const { data: subs } = await supabase
            .from('subjects')
            .select('*')
            .in('id', subjectIds.length ? subjectIds : ['00000000-0000-0000-0000-000000000000']);
          const subMap = new Map<string, Subject>((subs as Subject[])?.map((s) => [s.id, s]) ?? []);

          enriched = exsArr.map((e) => {
            const s = subMap.get(e.subject_id);
            return {
              ...e,
              subject_title: s?.title ?? 'Huquqshunoslik',
              subject_color: s?.color ?? '#3b82f6',
            };
          });
        }

        if (enriched.length === 0) {
          setExams(DEFAULT_EXAMS);
        } else {
          // Merge default exams if some types are missing
          const combined = [...enriched];
          DEFAULT_EXAMS.forEach((def) => {
            if (!combined.some((c) => c.exam_type === def.exam_type)) {
              combined.push(def);
            }
          });
          setExams(combined);
        }

        if (user) {
          const { data: rs } = await supabase.from('exam_results').select('*').eq('user_id', user.id);
          const rMap: Record<string, ExamResult> = {};
          (rs as ExamResult[])?.forEach((r) => {
            rMap[r.exam_id] = r;
          });
          setResults(rMap);
        }
      } catch (err) {
        console.warn('Exams fetch fallback:', err);
        setExams(DEFAULT_EXAMS);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleStartExamWithProtection = (examId: string) => {
    setTargetExamId(examId);
    setShowCaptchaModal(true);
  };

  const handleCaptchaSuccess = () => {
    setShowCaptchaModal(false);
    if (targetExamId) {
      onOpenExam(targetExamId);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 font-medium">Imtihonlar yuklanmoqda…</p>
      </div>
    );
  }

  const panelExams = exams.filter((e) => (e.exam_type ?? 'mavzuviy') === panel);
  const grouped: Record<string, typeof panelExams> = {};
  panelExams.forEach((e) => {
    const key = e.subject_title || "Umumiy";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white mb-6 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Bosh sahifaga
      </button>

      {/* Hero Header */}
      <div className="rounded-3xl p-7 sm:p-9 mb-8 text-white bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase mb-4 backdrop-blur-md">
          <Award className="w-3.5 h-3.5 text-indigo-400" /> Rasmiy Imtihonlar va Sinov Tizimi
        </div>

        <div className="flex flex-col md:flex-row items-start justify-between gap-5">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2 text-white">
              Imtihon Xonasi: Milliy Sertifikat & DTM
            </h1>
            <p className="text-slate-200 text-sm sm:text-base max-w-2xl leading-relaxed">
              O'zbekiston Respublikasi Milliy Sertifikat (189 ball), DTM imtihonlari va mavzuiy nazorat testlari. Har bir imtihon botlarga qarshi xavfsizlik (Captcha) va interaktiv OMR jadvali bilan jihozlangan.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => {
                setActivePdfExam({
                  title: 'Huquqshunoslik Milliy Sertifikat PDF Sinovi',
                  type: 'milliy_sertifikat',
                  duration: 30,
                });
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-indigo-300 border border-indigo-500/40 font-bold text-xs flex items-center gap-2 transition"
            >
              <FileText className="w-4 h-4" /> PDF & OMR Varaqasi
            </button>
            {canManage && onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition flex items-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" /> Yangi Test Qo'shish
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3-Panel Tabs: Milliy Sertifikat, DTM, Mavzuiy */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8">
        {PANELS.map((p) => {
          const active = panel === p.key;
          const count = exams.filter((e) => (e.exam_type ?? 'mavzuviy') === p.key).length;
          return (
            <button
              key={p.key}
              onClick={() => setPanel(p.key)}
              className={`p-5 rounded-3xl border text-left transition-all relative overflow-hidden group ${
                active
                  ? 'border-indigo-500/70 bg-gradient-to-br from-indigo-950/90 via-purple-950/60 to-slate-950 text-white shadow-xl shadow-indigo-950/50'
                  : 'glass border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                    active
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'bg-slate-800/80 text-indigo-400'
                  }`}
                >
                  <p.icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                    active
                      ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count} ta imtihon
                </span>
              </div>

              <h3 className="font-bold text-base mb-1 text-white">{p.label}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">
                {p.desc}
              </p>

              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                {p.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* List of exams in active panel */}
      {panelExams.length === 0 ? (
        <div className="text-center py-16 text-slate-400 glass rounded-3xl p-8">
          <GraduationCap className="w-16 h-16 mx-auto mb-3 text-slate-500 opacity-40" />
          <h3 className="text-lg font-bold text-white mb-1">Ushbu toifada imtihonlar mavjud emas</h3>
          <p className="text-sm text-slate-400">
            {canManage ? "Admin panel orqali yangi imtihon yuklang." : "Yaqin orada yangi testlar qo'shiladi."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([subj, exs]) => (
            <div key={subj} className="space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>{subj}</span>
              </h2>

              <div className="space-y-3">
                {exs.map((e) => {
                  const r = results[e.id];
                  return (
                    <div
                      key={e.id}
                      className="glass rounded-3xl p-5 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform"
                          style={{
                            background: `color-mix(in srgb, ${e.subject_color} 25%, transparent)`,
                            color: e.subject_color,
                          }}
                        >
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-white text-base group-hover:text-indigo-200 transition-colors truncate">
                            {e.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                            <span className="flex items-center gap-1 text-slate-300">
                              <Clock className="w-3.5 h-3.5 text-indigo-400" /> {e.duration_minutes} daqiqa
                            </span>
                            <span>•</span>
                            <span className="text-indigo-300 font-medium">
                              {e.exam_type === 'milliy_sertifikat'
                                ? '189 Balli Sertifikat'
                                : e.exam_type === 'dtm'
                                ? 'DTM Shabloni'
                                : 'Mavzuiy Test'}
                            </span>
                            {r && (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                                Avvalgi natija: {r.percent}% ({r.cert_score} ball)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                        <button
                          onClick={() => {
                            setActivePdfExam({
                              title: e.title,
                              type: e.exam_type,
                              duration: e.duration_minutes,
                            });
                          }}
                          className="px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                          title="Interaktiv OMR javoblar varaqasi orqali yechish"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-400" /> OMR Varaqasi
                        </button>

                        <button
                          onClick={() => handleStartExamWithProtection(e.id)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Boshlash <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive PDF & OMR modal */}
      {activePdfExam && (
        <PdfTestModal
          isOpen={true}
          onClose={() => setActivePdfExam(null)}
          examTitle={activePdfExam.title}
          examType={activePdfExam.type}
          durationMinutes={activePdfExam.duration}
        />
      )}

      {/* Captcha Gate before Exam Room */}
      <CaptchaModal
        isOpen={showCaptchaModal}
        title="Imtihon Xonasi Xavfsizlik Tekshiruvi"
        description="Imtihonga kirishdan avval siz inson ekanligingizni tasdiqlang. Bu natijalar sofligini ta'minlaydi."
        onSuccess={handleCaptchaSuccess}
        onClose={() => setShowCaptchaModal(false)}
      />
    </div>
  );
}
