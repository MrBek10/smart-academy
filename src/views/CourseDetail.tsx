import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Award, User, CreditCard, Check, X, GraduationCap, BookOpen } from 'lucide-react';
import { supabase, Course, CourseEnrollment, VideoLesson } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';

export default function CourseDetail({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const { user } = useAuth();
  const toast = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEnroll, setShowEnroll] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', payment_method: 'click' as const });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from('courses').select('*').eq('id', courseId).maybeSingle();
      setCourse(c as Course | null);
      const { data: vs } = await supabase.from('video_lessons').select('*').eq('category', (c as Course)?.category ?? '').order('sort_order');
      setVideos((vs as VideoLesson[]) ?? []);
      if (user) {
        const { data: en } = await supabase.from('course_enrollments').select('*').eq('course_id', courseId).eq('user_id', user.id).maybeSingle();
        setEnrolled(!!en);
      }
      setLoading(false);
    })();
  }, [courseId, user]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-20 text-slate-500">Yuklanmoqda...</div>;
  if (!course) return <div className="max-w-4xl mx-auto px-4 py-20 text-slate-300">Kurs topilmadi.</div>;

  const levelLabels: Record<string, string> = { Boshlangich: "Boshlang'ich", Orta: "O'rta", Yuqori: 'Yuqori' };
  const fmtPrice = (p: number) => new Intl.NumberFormat('uz-UZ').format(p) + " so'm";

  const enroll = async () => {
    if (!form.full_name.trim() || !form.phone.trim()) { toast('Iltimos, ism va telefon raqamni kiriting.', 'error'); return; }
    if (!user) { toast('Kursga yozilish uchun tizimga kiring.', 'error'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('course_enrollments').insert({
      user_id: user.id, course_id: course.id, full_name: form.full_name, phone: form.phone, payment_method: form.payment_method,
    });
    setSubmitting(false);
    if (error) { toast('Yozilishda xatolik: ' + error.message, 'error'); return; }
    setEnrolled(true);
    setShowEnroll(false);
    toast('Tabriklaymiz! Kursga muvaffaqiyatli yozildingiz.', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kurslar ro'yxatiga
      </button>

      <div className="glass rounded-2xl overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-8">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30 mb-4">
            <GraduationCap className="w-3.5 h-3.5" /> {course.category ?? 'Umumiy'}
          </span>
          <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
          <p className="text-slate-300 max-w-2xl">{course.description}</p>
          <div className="flex flex-wrap gap-4 mt-5 text-sm text-slate-300">
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-blue-400" /> {course.duration_hours} soat</span>
            <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-400" /> {levelLabels[course.level]}</span>
            <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-indigo-400" /> {course.instructor_name}</span>
          </div>
        </div>
        <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400">Kurs narxi</span>
            <div className="text-2xl font-bold text-white">{fmtPrice(course.price)}</div>
          </div>
          {enrolled ? (
            <div className="px-5 py-3 rounded-xl bg-green-500/20 text-green-400 font-semibold flex items-center gap-2 border border-green-500/30">
              <Check className="w-5 h-5" /> Kursga yozilgansiz
            </div>
          ) : (
            <button onClick={() => setShowEnroll(true)} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition">
              <CreditCard className="w-4 h-4" /> Kursga yozilish
            </button>
          )}
        </div>
      </div>

      {/* Instructor info */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-white"><User className="w-5 h-5 text-blue-400" /> O'qituvchi haqida</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl font-bold shrink-0">
            {course.instructor_name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-white">{course.instructor_name}</h3>
            <p className="text-sm text-slate-400">{course.category} mutaxassisi</p>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white"><BookOpen className="w-5 h-5 text-blue-400" /> Dars dasturi</h2>
        {videos.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">Bu kurs uchun hozircha videolar yuklanmagan.</p>
        ) : (
          <div className="space-y-2">
            {videos.map((v, i) => (
              <div key={v.id} className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl">
                <span className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold bg-blue-500/20 text-blue-400">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-100 truncate">{v.title}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {Math.floor(v.duration_seconds / 60)} daqiqa</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enrollment modal */}
      {showEnroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={() => setShowEnroll(false)}>
          <div className="glass-strong rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Kursga yozilish</h3>
              <button onClick={() => setShowEnroll(false)} className="text-slate-400 hover:text-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Ism familiya</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Ismingizni kiriting"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 focus:border-blue-500 outline-none text-sm text-slate-100" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 block">Telefon raqami</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 focus:border-blue-500 outline-none text-sm text-slate-100" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1.5 block">To'lov usuli</label>
                <div className="grid grid-cols-2 gap-2">
                  {([['click', 'Click'], ['payme', 'Payme'], ['card', 'Bank karta'], ['cash', 'Naqd']]).map(([k, label]) => (
                    <button key={k} onClick={() => setForm({ ...form, payment_method: k as 'click' })} type="button"
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium transition ${form.payment_method === k ? 'bg-blue-600 text-white' : 'glass text-slate-300 border border-slate-700'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40">
                <span className="text-sm text-slate-400">Kurs narxi</span>
                <span className="font-bold text-white">{fmtPrice(course.price)}</span>
              </div>
              <button onClick={enroll} disabled={submitting}
                className="w-full py-3 rounded-xl text-white font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? 'Yozilmoqda...' : <><Check className="w-4 h-4" /> Yozilishni tasdiqlash</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
