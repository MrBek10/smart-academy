import { useState, useEffect } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  FileText,
  Upload,
  Download,
  Check,
  Send,
  Eye,
  RotateCcw,
} from 'lucide-react';
import Captcha from '@/components/Captcha';

export type OMRQuestion = {
  num: number;
  questionText: string;
  options: { key: 'a' | 'b' | 'c' | 'd'; text: string }[];
  correct: 'a' | 'b' | 'c' | 'd';
  explanation: string;
};

// High-fidelity sample test dataset for PDF / OMR mode
export const SAMPLE_MILLIY_TEST: OMRQuestion[] = [
  {
    num: 1,
    questionText: "O'zbekiston Respublikasi Konstitutsiyasining 1-moddasiga muvofiq O'zbekiston qanday davlat deb e'lon qilingan?",
    options: [
      { key: 'a', text: "Suveren, demokratik, huquqiy, ijtimoiy va dunyoviy davlat" },
      { key: 'b', text: "Unitar, konfederativ va teokratik davlat" },
      { key: 'c', text: "Faqatgina parlamentar respublika" },
      { key: 'd', text: "Prezidentlik boshqaruvidagi monarxiya" },
    ],
    correct: 'a',
    explanation: "Yangi tahrirdagi Konstitutsiyaning 1-moddasida O'zbekiston suveren, demokratik, huquqiy, ijtimoiy va dunyoviy davlat ekanligi mustahkamlangan.",
  },
  {
    num: 2,
    questionText: "Inson huquqlari umumjahon deklaratsiyasi BMT Bosh Assambleyasi tomonidan qachon qabul qilingan?",
    options: [
      { key: 'a', text: "1945-yil 24-oktyabr" },
      { key: 'b', text: "1948-yil 10-dekabr" },
      { key: 'c', text: "1991-yil 31-avgust" },
      { key: 'd', text: "1992-yil 8-dekabr" },
    ],
    correct: 'b',
    explanation: "Inson huquqlari umumjahon deklaratsiyasi 1948-yil 10-dekabrda BMT tomonidan qabul qilingan.",
  },
  {
    num: 3,
    questionText: "Jinoyat qonunchiligiga ko'ra, qilmishda jinoyat tarkibining qaysi elementi mavjud bo'lmasa, shaxs jinoiy javobgarlikka tortilmaydi?",
    options: [
      { key: 'a', text: "Faqatgina guvohlar ko'rsatmasi" },
      { key: 'b', text: "Obyekt, obyektiv tomon, subyekt, subyektiv tomondan biri mavjud bo'lmasa" },
      { key: 'c', text: "Shaxsning o'z aybini to'liq tan olmaganligi" },
      { key: 'd', text: "Jabrlanuvchi arizasi bo'lmasa" },
    ],
    correct: 'b',
    explanation: "Jinoyat tarkibi to'rtta elementdan (obyekt, obyektiv tomon, subyekt, subyektiv tomon) iborat bo'lib, ulardan birortasi bo'lmasa, jinoiy javobgarlik kelib chiqmaydi.",
  },
  {
    num: 4,
    questionText: "O'zbekiston Respublikasida sud hokimiyatining mustaqilligi qanday tamoyil asosida ta'minlanadi?",
    options: [
      { key: 'a', text: "Hokimiyatlar bo'linishi va sudyalarning faqat qonunga bo'ysunishi" },
      { key: 'b', text: "Sudyalarning ijro etuvchi organlarga hisobdorligi" },
      { key: 'c', text: "Har yili prokuratura tomonidan tekshiruvdan o'tishi" },
      { key: 'd', text: "Qarorlarning hokimlar tomonidan tasdiqlanishi" },
    ],
    correct: 'a',
    explanation: "Sud hokimiyati mustaqil bo'lib, u hokimiyatlar bo'linishi prinsipiga tayanadi va sudyalar faqat qonunga bo'ysunadilar.",
  },
  {
    num: 5,
    questionText: "Milliy sertifikat baholash mezonida eng yuqori natija necha ball qilib belgilangan?",
    options: [
      { key: 'a', text: "100 ball" },
      { key: 'b', text: "75.6 ball" },
      { key: 'c', text: "189 ball" },
      { key: 'd', text: "200 ball" },
    ],
    correct: 'c',
    explanation: "O'zbekistonda Milliy sertifikat tizimi bo'yicha maksimal ko'rsatkich 189 ballni tashkil qiladi.",
  },
];

interface PdfTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  examTitle: string;
  examType: 'milliy_sertifikat' | 'dtm' | 'mavzuviy';
  durationMinutes?: number;
}

export default function PdfTestModal({
  isOpen,
  onClose,
  examTitle,
  examType,
  durationMinutes = 20,
}: PdfTestModalProps) {
  const [questions, setQuestions] = useState<OMRQuestion[]>(SAMPLE_MILLIY_TEST);
  const [answers, setAnswers] = useState<Record<number, 'a' | 'b' | 'c' | 'd'>>({});
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
  const [submitted, setSubmitted] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [customFile, setCustomFile] = useState<File | null>(null);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || submitted) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setSubmitted(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, submitted]);

  if (!isOpen) return null;

  const handleSelectAnswer = (qNum: number, choice: 'a' | 'b' | 'c' | 'd') => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qNum]: choice }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.num] === q.correct) {
        correctCount += 1;
      }
    });

    const percent = Math.round((correctCount / questions.length) * 100);
    const milliyScore = Math.round((percent / 100) * 189 * 10) / 10;
    const dtmScore = Math.round((percent / 100) * 93 * 10) / 10;

    return {
      correctCount,
      total: questions.length,
      percent,
      milliyScore,
      dtmScore,
    };
  };

  const scoreData = calculateScore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomFile(file);

    // If JSON format, parse questions
    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setQuestions(parsed);
            setAnswers({});
            setSubmitted(false);
            alert(`${parsed.length} ta savol muvaffaqiyatli yuklandi!`);
          }
        } catch {
          alert("JSON fayli noto'g'ri formatda.");
        }
      };
      reader.readAsText(file);
    } else {
      alert(`PDF fayli tanlandi: ${file.name}. Interaktiv javoblar varaqasi faollashtirildi.`);
    }
  };

  const formatTimer = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const getCertGrade = (score: number) => {
    if (score >= 170) return { label: 'A+ (Eng yuqori)', color: 'text-emerald-400 bg-emerald-500/20' };
    if (score >= 150) return { label: 'A (A\'lo)', color: 'text-emerald-400 bg-emerald-500/20' };
    if (score >= 130) return { label: 'B+ (Yaxshi)', color: 'text-blue-400 bg-blue-500/20' };
    if (score >= 110) return { label: 'B (Qoniqarli)', color: 'text-amber-400 bg-amber-500/20' };
    if (score >= 90) return { label: 'C (O\'tish chegarasi)', color: 'text-orange-400 bg-orange-500/20' };
    return { label: 'Sertifikat berilmaydi (<90 ball)', color: 'text-rose-400 bg-rose-500/20' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div
        className="glass-strong rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl border border-indigo-500/30 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-900/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base truncate">{examTitle}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold uppercase border border-indigo-500/30">
                  {examType === 'milliy_sertifikat' ? 'Milliy Sertifikat (189)' : examType === 'dtm' ? 'DTM Test' : 'Mavzuiy Test'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Interaktiv javoblar varaqasi (OMR Sheet) va tezkor tekshiruv
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Countdown timer */}
            <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-2 text-indigo-300 font-mono font-bold text-sm">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>{formatTimer(secondsLeft)}</span>
            </div>

            {/* Custom test uploader */}
            <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 flex items-center gap-1.5 transition">
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF / JSON yuklash</span>
              <input
                type="file"
                accept=".pdf,.json"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Modal Main View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left panel: Questions sheet */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 border-b md:border-b-0 md:border-r border-slate-800">
            {customFile && (
              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-center justify-between">
                <span>Fayl biriktirilgan: <strong>{customFile.name}</strong></span>
                <span className="text-[11px] text-slate-400">Interaktiv OMR jadvalida belgilang</span>
              </div>
            )}

            <div className="space-y-6">
              {questions.map((q) => {
                const userChoice = answers[q.num];
                const isCorrect = userChoice === q.correct;
                return (
                  <div
                    key={q.num}
                    className={`glass rounded-2xl p-5 border transition-all ${
                      submitted
                        ? isCorrect
                          ? 'border-emerald-500/40 bg-emerald-950/10'
                          : 'border-rose-500/40 bg-rose-950/10'
                        : userChoice
                        ? 'border-indigo-500/40'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-500/30">
                        {q.num}
                      </span>
                      <p className="font-semibold text-sm text-white leading-relaxed">
                        {q.questionText}
                      </p>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-10">
                      {q.options.map((opt) => {
                        const selected = userChoice === opt.key;
                        const isThisCorrect = opt.key === q.correct;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => handleSelectAnswer(q.num, opt.key)}
                            disabled={submitted}
                            className={`p-3 rounded-xl text-left text-xs transition border flex items-start gap-2.5 ${
                              submitted
                                ? isThisCorrect
                                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-semibold'
                                  : selected
                                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-200'
                                  : 'opacity-50 border-transparent text-slate-400'
                                : selected
                                ? 'bg-indigo-600/30 border-indigo-500 text-white font-semibold shadow-sm'
                                : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span className="w-5 h-5 rounded uppercase font-mono font-bold flex items-center justify-center shrink-0 bg-slate-800 text-slate-300 text-[11px]">
                              {opt.key}
                            </span>
                            <span className="leading-snug">{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation after submission */}
                    {submitted && (
                      <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-300 pl-10">
                        <strong className="text-indigo-300">Tushuntirish: </strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: Interactive OMR Bubble Sheet & Results */}
          <div className="w-full md:w-80 p-5 bg-slate-900/40 overflow-y-auto flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h4 className="font-bold text-sm text-white">Javoblar varaqasi (OMR)</h4>
                <span className="text-xs text-indigo-400 font-mono font-bold">
                  {Object.keys(answers).length} / {questions.length} belgilandi
                </span>
              </div>

              {/* OMR bubble grid */}
              <div className="space-y-2">
                {questions.map((q) => {
                  const userChoice = answers[q.num];
                  return (
                    <div
                      key={q.num}
                      className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-slate-800/50"
                    >
                      <span className="font-mono text-xs text-slate-400 w-6">
                        {String(q.num).padStart(2, '0')}.
                      </span>
                      <div className="flex items-center gap-1.5">
                        {(['a', 'b', 'c', 'd'] as const).map((optKey) => {
                          const isPicked = userChoice === optKey;
                          const isRight = q.correct === optKey;
                          return (
                            <button
                              key={optKey}
                              onClick={() => handleSelectAnswer(q.num, optKey)}
                              disabled={submitted}
                              className={`w-7 h-7 rounded-full text-[11px] font-mono font-bold uppercase transition flex items-center justify-center border ${
                                submitted
                                  ? isRight
                                    ? 'bg-emerald-500 border-emerald-400 text-white shadow'
                                    : isPicked
                                    ? 'bg-rose-500 border-rose-400 text-white'
                                    : 'border-slate-800 text-slate-500'
                                  : isPicked
                                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-500'
                              }`}
                            >
                              {optKey}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scorecard or Submit Button */}
            {!submitted ? (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                {showCaptcha && !captchaVerified && (
                  <Captcha
                    onVerify={(ok) => {
                      setCaptchaVerified(ok);
                      if (ok) {
                        setSubmitted(true);
                        setShowCaptcha(false);
                      }
                    }}
                    label="Testni yakunlash uchun bot tekshiruvi"
                  />
                )}

                <button
                  onClick={() => {
                    if (!captchaVerified) {
                      setShowCaptcha(true);
                    } else {
                      setSubmitted(true);
                    }
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-sm text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 active:scale-95"
                >
                  <Send className="w-4 h-4" /> Javoblarni topshirish
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-800 space-y-3 animate-in fade-in">
                <div className="glass rounded-2xl p-4 text-center border border-indigo-500/30">
                  <Award className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <h4 className="font-bold text-white text-base">Natijalar tahlili</h4>

                  <div className="text-3xl font-extrabold text-indigo-300 my-1 font-mono">
                    {examType === 'milliy_sertifikat' ? `${scoreData.milliyScore} ball` : `${scoreData.percent}%`}
                  </div>
                  <p className="text-xs text-slate-300 mb-3">
                    {scoreData.correctCount} / {scoreData.total} ta to'g'ri ({scoreData.percent}%)
                  </p>

                  {examType === 'milliy_sertifikat' && (
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${getCertGrade(scoreData.milliyScore).color}`}>
                      {getCertGrade(scoreData.milliyScore).label}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSubmitted(false);
                    setAnswers({});
                    setSecondsLeft(durationMinutes * 60);
                  }}
                  className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw className="w-4 h-4" /> Qaytadan yechish
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
