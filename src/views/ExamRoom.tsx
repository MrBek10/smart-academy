import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Send,
  Sparkles,
  FileBadge,
  BookOpen,
  HelpCircle,
} from 'lucide-react';
import { supabase, Exam, ExamQuestion, ExamResult, CERT_MAX_SCORE, logActivity } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { CaptchaModal } from '@/components/Captcha';

type AnswerMap = Record<string, 'a' | 'b' | 'c' | 'd' | null>;

const FALLBACK_QUESTIONS: ExamQuestion[] = [
  {
    id: 'q-1',
    exam_id: 'sample',
    question: "O'zbekiston Respublikasi Konstitutsiyasining qaysi moddasida inson huquqlari va erkinliklarining oliy qadriyat ekanligi belgilangan?",
    option_a: "13-modda",
    option_b: "1-modda",
    option_c: "2-modda",
    option_d: "18-modda",
    correct_answer: 'a',
    explanation: "13-moddada: 'O'zbekiston Respublikasida inson, uning hayoti, erkinligi, sha'ni, qadr-qimmati va boshqa ajralmas huquqlari oliy qadriyat hisoblanadi' deb belgilangan.",
    recommended_topic: "Konstitutsiyaviy huquq asoslari: Inson va fuqaroning asosiy huquqlari",
    created_at: new Date().toISOString(),
  },
  {
    id: 'q-2',
    exam_id: 'sample',
    question: "Quyidagilardan qaysi biri davlat hokimiyati tizimining qonun chiqaruvchi organidir?",
    option_a: "Vazirlar Mahkamasi",
    option_b: "Oliy Majlis (Qonunchilik palatasi va Senat)",
    option_c: "Oliy Sud",
    option_d: "Bosh Prokuratura",
    correct_answer: 'b',
    explanation: "O'zbekiston Respublikasi Oliy Majlisi oliy davlat vakillik organi bo'lib, qonun chiqaruvchi hokimiyatni amalga oshiradi.",
    recommended_topic: "Davlat hokimiyati organlari tizimi va Oliy Majlis vakolatlari",
    created_at: new Date().toISOString(),
  },
  {
    id: 'q-3',
    exam_id: 'sample',
    question: "Shaxs qachongacha jinoyat sodir etishda aybsiz hisoblanadi (Aybsizlik prezumpsiyasi)?",
    option_a: "Tergov organi tomonidan ayblov e'lon qilinguncha",
    option_b: "Uning aybi sudning qonuniy kuchga kirgan hukmi bilan isbotlangunga qadar",
    option_c: "Prokuror ayblov xulosasini tasdiqlaguncha",
    option_d: "Gumon qilinuvchi o'z aybini to'liq tan olguncha",
    correct_answer: 'b',
    explanation: "Aybsizlik prezumpsiyasiga ko'ra, har bir inson uning aybi qonunda nazarda tutilgan tartibda sudning qonuniy kuchga kirgan hukmi bilan isbotlanmaguncha aybsiz hisoblanadi.",
    recommended_topic: "Jinoyat-protsessual huquqi: Inson huquqlari kafolatlari",
    created_at: new Date().toISOString(),
  },
  {
    id: 'q-4',
    exam_id: 'sample',
    question: "Jinoyat qonunchiligida jazoning asosiy maqsadi nimalardan iborat?",
    option_a: "Faqatgina jazolash va qasos olish",
    option_b: "Mahkumni axloqan tuzatish, uning yangi jinoyat sodir etishining oldini olish",
    option_c: "Faqat jarima undirish orqali davlat byudjetini to'ldirish",
    option_d: "Shaxsni jamiyatdan butunlay chetlatish",
    correct_answer: 'b',
    explanation: "Jazo mahkumni tuzatish, uning yangi jinoyat sodir etishining oldini olish hamda boshqa shaxslar tomonidan jinoyat sodir etilishini ogohlantirish maqsadida qo'llaniladi.",
    recommended_topic: "Jinoyat kodeksi: Jazo tushunchasi va uning maqsadlari",
    created_at: new Date().toISOString(),
  },
  {
    id: 'q-5',
    exam_id: 'sample',
    question: "IIV xodimining xizmat faoliyatida qurol ishlatishning qonuniy tartibi qaysi hujjat bilan tartibga solinadi?",
    option_a: "'Ichki ishlar organlari to'g'risida'gi O'zbekiston Respublikasi Qonuni",
    option_b: "Ichki idoraviy tavsiyalar",
    option_c: "Mahalliy hokimlik qarorlari",
    option_d: "Mehnat kodeksi",
    correct_answer: 'a',
    explanation: "'Ichki ishlar organlari to'g'risida'gi Qonunning 23-25 moddalarida jismoniy kuch, maxsus vositalar va o'qotar qurolni qo'llash shartlari va chegaralari qat'iy belgilangan.",
    recommended_topic: "IIV faoliyatining huquqiy asoslari va maxsus vositalarni qo'llash",
    created_at: new Date().toISOString(),
  },
];

export default function ExamRoom({ examId, onBack }: { examId: string; onBack: () => void }) {
  const { user } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);

  // Captcha submission gate
  const [showSubmitCaptcha, setShowSubmitCaptcha] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: ex } = await supabase.from('exams').select('*').eq('id', examId).maybeSingle();
        const exObj = ex as Exam | null;

        const effectiveExam: Exam = exObj || {
          id: examId,
          title: "Huquqshunoslik Milliy Sertifikati & DTM Sinovi",
          subject_id: 'sub-law',
          duration_minutes: 20,
          exam_type: 'milliy_sertifikat',
          created_at: new Date().toISOString(),
        };

        setExam(effectiveExam);

        const { data: qs } = await supabase
          .from('exam_questions')
          .select('*')
          .eq('exam_id', examId)
          .order('created_at');

        let qsArr = (qs as ExamQuestion[]) ?? [];
        if (qsArr.length === 0) {
          qsArr = FALLBACK_QUESTIONS;
        }

        setQuestions(qsArr);
        setSecondsLeft((effectiveExam.duration_minutes ?? 20) * 60);

        const initial: AnswerMap = {};
        qsArr.forEach((q) => (initial[q.id] = null));
        setAnswers(initial);
      } catch (err) {
        console.warn('Exam load error:', err);
        setExam({
          id: examId,
          title: "Huquqshunoslik Milliy Sertifikati & DTM Sinovi",
          subject_id: 'sub-law',
          duration_minutes: 20,
          exam_type: 'milliy_sertifikat',
          created_at: new Date().toISOString(),
        });
        setQuestions(FALLBACK_QUESTIONS);
        setSecondsLeft(20 * 60);
      } finally {
        setLoading(false);
      }
    })();
  }, [examId]);

  useEffect(() => {
    if (submitted || loading || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [submitted, loading, secondsLeft]);

  useEffect(() => {
    if (secondsLeft === 0 && !submitted && !loading && questions.length > 0) {
      finalizeExam();
    }
  }, [secondsLeft, submitted, loading, questions.length]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 font-medium">Imtihon savollari yuklanmoqda…</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-300 mb-4">Imtihon ma'lumotlari topilmadi.</p>
        <button onClick={onBack} className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-sm">
          Ortga qaytish
        </button>
      </div>
    );
  }

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const score = questions.reduce((acc, q) => acc + (answers[q.id] === q.correct_answer ? 1 : 0), 0);
  const percent = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const passed = percent >= 60;
  const certScore = Math.round((percent / 100) * CERT_MAX_SCORE * 10) / 10;

  const certGrade =
    certScore >= 170
      ? { label: 'A+ — Maksimal Imtiyoz', color: '#10b981' }
      : certScore >= 150
      ? { label: 'A — A\'lo Daraja', color: '#10b981' }
      : certScore >= 130
      ? { label: 'B+ — Yaxshi Daraja', color: '#3b82f6' }
      : certScore >= 110
      ? { label: 'B — Qoniqarli', color: '#f59e0b' }
      : certScore >= 90
      ? { label: 'C — Chegara', color: '#f97316' }
      : { label: 'Sertifikat Yo\'q (<90 ball)', color: '#ef4444' };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const finalizeExam = async () => {
    setSubmitted(true);
    const totalSec = (exam?.duration_minutes ?? 20) * 60 - secondsLeft;
    if (user) {
      try {
        await supabase.from('exam_results').upsert(
          {
            user_id: user.id,
            exam_id: examId,
            score,
            total: questions.length,
            percent,
            cert_score: certScore,
          },
          { onConflict: 'user_id,exam_id' }
        );
        await logActivity(
          'imtihon',
          `${exam?.title} — ${score}/${questions.length} (${percent}%) — ${certScore} ball`,
          totalSec
        );
      } catch (err) {
        console.warn('Result save fallback:', err);
      }
    }
  };

  const handleAnswerSelect = (qid: string, choice: 'a' | 'b' | 'c' | 'd') => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qid]: choice }));
  };

  // If already submitted: Result view
  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="glass-strong rounded-3xl p-6 sm:p-9 text-center border border-indigo-500/30 shadow-2xl">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg ${
              passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            <Award className="w-10 h-10" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold mb-1 text-white">
            Imtihon Muvaffaqiyatli Yakunlandi
          </h1>
          <p className="text-slate-300 text-sm mb-6">{exam.title}</p>

          {/* Milliy Sertifikat Score Banner */}
          <div className="glass rounded-3xl p-6 mb-8 border border-indigo-500/40 relative overflow-hidden bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950">
            <div className="flex items-center gap-2 mb-2 justify-center text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <FileBadge className="w-4 h-4" /> Rasmiy Milliy Sertifikat Balli
            </div>
            <div className="text-5xl font-black mb-1 font-mono text-white">
              {certScore} <span className="text-lg text-slate-400 font-sans">/ {CERT_MAX_SCORE}</span>
            </div>
            <div
              className="inline-block px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wide uppercase my-3 text-white shadow-md"
              style={{ backgroundColor: certGrade.color }}
            >
              {certGrade.label}
            </div>
            <p className="text-xs text-slate-300 mt-2">
              {passed
                ? "Tabriklaymiz! Siz litsey va OTM uchun tavsiya etiluvchi sertifikat ballini qo'lga kiritdingiz."
                : "Sertifikat uchun kamida 90 ball to'plash lozim. Xatolaringiz ustida ishlab, qayta topshirishingiz mumkin."}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-8 text-sm">
            <div className="glass rounded-2xl p-4 border border-slate-800">
              <div className="text-2xl font-black text-white font-mono">{questions.length}</div>
              <div className="text-xs text-slate-400 mt-1">Jami Savollar</div>
            </div>
            <div className="glass rounded-2xl p-4 border border-emerald-500/30">
              <div className="text-2xl font-black text-emerald-400 font-mono">{score}</div>
              <div className="text-xs text-slate-400 mt-1">To'g'ri Javoblar</div>
            </div>
            <div className="glass rounded-2xl p-4 border border-rose-500/30">
              <div className="text-2xl font-black text-rose-400 font-mono">{questions.length - score}</div>
              <div className="text-xs text-slate-400 mt-1">Xatolar</div>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="text-left space-y-4 mb-8">
            <h3 className="font-bold text-white text-base">Savollar tahlili va to'g'ri javoblar:</h3>
            {questions.map((q, idx) => {
              const userAns = answers[q.id];
              const isRight = userAns === q.correct_answer;
              return (
                <div
                  key={q.id}
                  className={`glass rounded-2xl p-4 border ${
                    isRight ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-rose-500/40 bg-rose-950/10'
                  }`}
                >
                  <div className="flex items-start gap-2.5 mb-2">
                    {isRight ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-white">
                        {idx + 1}. {q.question}
                      </div>
                      <div className="text-xs mt-2 space-y-1">
                        {!isRight && userAns && (
                          <div className="text-rose-300">
                            Sizning javobingiz: <strong>({userAns.toUpperCase()}) {q[`option_${userAns}`]}</strong>
                          </div>
                        )}
                        <div className="text-emerald-300 font-medium">
                          To'g'ri javob: <strong>({q.correct_answer.toUpperCase()}) {q[`option_${q.correct_answer}`]}</strong>
                        </div>
                      </div>

                      {/* Explanation & Why it is wrong */}
                      {q.explanation && (
                        <div className="text-xs text-slate-300 mt-2.5 pt-2 border-t border-slate-800 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>{!isRight ? "Nima uchun xato? / Tahlil:" : "Tushuntirish:"}</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed pl-5">{q.explanation}</p>
                        </div>
                      )}

                      {/* Recommended Topic to Study */}
                      {(q.recommended_topic || !isRight) && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center flex-wrap gap-2 text-xs">
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" /> Tavsiya etilgan mavzu:
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium">
                            {q.recommended_topic || "Umumiy huquqiy va me'yoriy asoslar"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => {
                setSubmitted(false);
                const initial: AnswerMap = {};
                questions.forEach((q) => (initial[q.id] = null));
                setAnswers(initial);
                setSecondsLeft((exam?.duration_minutes ?? 20) * 60);
                setCurrentQ(0);
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 transition"
            >
              <RotateCcw className="w-4 h-4" /> Qayta TopsHirsh
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white transition shadow"
            >
              Imtihonlar Ro'yxatiga Qaytish
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Test View
  const activeQuestion = questions[currentQ] || questions[0];
  const userChoice = activeQuestion ? answers[activeQuestion.id] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Imtihonni tark etish
        </button>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-indigo-300 font-mono font-bold text-sm flex items-center gap-2 shadow-inner">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>{fmt(secondsLeft)}</span>
          </div>

          <button
            onClick={() => setShowSubmitCaptcha(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" /> Testni topshirish
          </button>
        </div>
      </div>

      {/* Question Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Savol <strong>{currentQ + 1}</strong> / {questions.length}</span>
          <span>{answeredCount} ta belgilandi</span>
        </div>
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="glass-strong rounded-3xl p-6 sm:p-9 border border-indigo-500/30 shadow-2xl mb-6">
        <div className="flex items-start gap-4 mb-6">
          <span className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-300 font-mono font-bold text-sm flex items-center justify-center shrink-0 border border-indigo-500/30">
            {currentQ + 1}
          </span>
          <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed">
            {activeQuestion.question}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3 pl-0 sm:pl-13">
          {(['a', 'b', 'c', 'd'] as const).map((key) => {
            const isSelected = userChoice === key;
            const text = activeQuestion[`option_${key}`];
            return (
              <button
                key={key}
                onClick={() => handleAnswerSelect(activeQuestion.id, key)}
                className={`w-full text-left p-4 rounded-2xl transition border flex items-center gap-3.5 group ${
                  isSelected
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                    : 'glass hover:bg-slate-800/80 border-slate-800 text-slate-200'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-xl uppercase font-mono font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 group-hover:text-white'
                  }`}
                >
                  {key}
                </span>
                <span className="text-sm font-medium leading-snug">{text}</span>
              </button>
            );
          })}
        </div>

        {/* Navigation prev/next inside question */}
        <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-800">
          <button
            onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
            disabled={currentQ === 0}
            className="px-4 py-2 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Oldingi
          </button>

          {/* Quick jump pills */}
          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto max-w-sm px-2">
            {questions.map((q, idx) => {
              const isFilled = answers[q.id] !== null;
              const isCur = idx === currentQ;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQ(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center ${
                    isCur
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                      : isFilled
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentQ((q) => Math.min(questions.length - 1, q + 1))}
            disabled={currentQ === questions.length - 1}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2 transition shadow"
          >
            Keyingi <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Captcha Modal before submitting exam */}
      <CaptchaModal
        isOpen={showSubmitCaptcha}
        title="Imtihon natijalarini tasdiqlash"
        description="Natijalaringiz tizimga qayd etilishi uchun quyidagi bot himoyasi tekshiruvini bajaring."
        onSuccess={() => {
          setShowSubmitCaptcha(false);
          finalizeExam();
        }}
        onClose={() => setShowSubmitCaptcha(false)}
      />
    </div>
  );
}
