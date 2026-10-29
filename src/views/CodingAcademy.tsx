import { useState, useRef, useEffect } from 'react';
import {
  Code2,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  Bug,
  Lightbulb,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  BookOpen,
  Cpu,
  Database,
  ArrowLeft,
  Flame,
  FileCode,
  Layers,
  Wand2,
  HelpCircle,
  Clock,
  Download,
  AlertCircle,
} from 'lucide-react';
import { explainCodeBug, optimizeCode, generateCodeHint, executeCodeWithGemini } from '@/lib/gemini';
import { supabase, CodingLesson } from '@/lib/supabase';

export type LanguageId = 'python' | 'javascript' | 'typescript' | 'cpp' | 'java' | 'go' | 'sql';

export interface CodeLesson {
  id: string;
  title: string;
  description: string;
  theory: string;
  starterCode: string;
  expectedOutput?: string;
  task: string;
}

export interface LanguageCourse {
  id: LanguageId;
  name: string;
  icon: string;
  badgeColor: string;
  description: string;
  lessons: CodeLesson[];
}

export const LANGUAGE_COURSES: LanguageCourse[] = [
  {
    id: 'python',
    name: 'Python',
    icon: '🐍',
    badgeColor: 'from-amber-500 to-yellow-600',
    description: "Sun'iy intellekt, ma'lumotlar tahlili va backend dasturlash uchun eng mashhur til.",
    lessons: [
      {
        id: 'py-1',
        title: "1. Kirish & Birinchi Dastur: print()",
        description: "Python sintaksisi va ekranga ma'lumot chiqarish asoslari.",
        theory: `Python tilida ma'lumotni ekranga chiqarish uchun \`print()\` funksiyasidan foydalaniladi.
Matnli qiymatlar qo'shtirnoq \`"...\` yoki bir tirnoq \`'...\` ichida yoziladi.
Python sintaksisida nuqta-vergul (;) qo'yish majburiy emas, qator oxirida kod avtomatik yakunlanadi.`,
        starterCode: `# Python dasturlash tiliga xush kelibsiz!
name = "Smart Academy O'quvchisi"
print(f"Salom, {name}!")
print("Dasturlash sari ilk qadamingiz muborak bo'lsin.")`,
        task: "O'z ismingiz va o'qiyotgan litsey yoki fanning nomini ekranga chop eting.",
      },
      {
        id: 'py-2',
        title: "2. O'zgaruvchilar va Ma'lumot Turlari",
        description: "Sonlar (int, float), matnlar (str) va mantiqiy (bool) qiymatlar.",
        theory: `Python dinamik tiplashtirilgan til hisoblanadi. O'zgaruvchi turini oldindan e'lon qilish shart emas:
• Butun son: \`age = 18\` (int)
• O'nlik kasr: \`ball = 182.5\` (float)
• Matn: \`subject = "Huquqshunoslik"\` (str)
• Mantiqiy: \`is_passed = True\` (bool)`,
        starterCode: `# Milliy Sertifikat ballini hisoblash misoli
majburiy_ball = 33.0
asosiy_1 = 93.0
asosiy_2 = 58.8
jami_ball = majburiy_ball + asosiy_1 + asosiy_2

print("Jami to'plangan ball:", jami_ball)
print("189 ballik mezon bo'yicha foiz:", round((jami_ball / 189) * 100, 1), "%")
print("Sertifikat darajasi:", "A+" if jami_ball >= 170 else "A")`,
        task: "3 ta fan bo'yicha ballaringizni o'zgaruvchilarga saqlang va ularning o'rtachasini toping.",
      },
      {
        id: 'py-3',
        title: "3. Shart Operatorlari: if, elif, else",
        description: "Qaror qabul qilish va shartlarni tekshirish mantig'i.",
        theory: `Shartlarni tekshirish uchun \`if\`, \`elif\` va \`else\` kalit so'zlari ishlatiladi.
Muhim qoida: Har bir shart blokidan keyin ikki nuqta (\`:\`) qo'yiladi va ichidagi kod 4 ta probel (indentation) bilan suriladi.`,
        starterCode: `score = 175

if score >= 170:
    print("Daraja: A+ (100% imtiyozli sertifikat)")
elif score >= 150:
    print("Daraja: A (Yuqori ko'rsatkich)")
elif score >= 130:
    print("Daraja: B+ (Yaxshi natija)")
else:
    print("Tayyorgarlikni yanada kuchaytirish zarur.")`,
        task: "Foydalanuvchi yoshiga qarab Harbiy litsey yoki IIV akademiyasiga topshirish huquqini tekshiring.",
      },
      {
        id: 'py-4',
        title: "4. Ro'yxatlar (Lists) va Sikllar (for/while)",
        description: "Ma'lumotlar to'plamlari bilan ishlash va ularni aylanib chiqish.",
        theory: `Ro'yxatlar kvadrat qavsda \`[...]\` saqlanadi. Elementlar ustida qo'shish (\`append\`), o'chirish (\`remove\`) va saralash (\`sort\`) amallari bajariladi.
\`for\` sikli elementlarni birma-bir o'qish uchun eng qulay usuldir.`,
        starterCode: `subjects = ["Konstitutsiya", "Jinoyat Huquqi", "IIV Xizmati", "Matematika", "Kiberxavfsizlik"]

print("O'quv kursi fanlari:")
for i, sub in enumerate(subjects, start=1):
    print(f"{i}. {sub}")`,
        task: "Kamida 5 ta imtihon savolini ro'yxatga soling va for sikli yordamida ekranga chiqaring.",
      },
    ],
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    icon: '⚡',
    badgeColor: 'from-yellow-400 to-amber-500',
    description: "Web saytlar, interaktiv interfeyslar va ilovalar yaratish uchun asosiy til.",
    lessons: [
      {
        id: 'js-1',
        title: "1. JavaScript Asoslari: console.log & let/const",
        description: "O'zgaruvchilarni e'lon qilish va konsolga chiqarish.",
        theory: `JavaScript brauzer ichida to'g'ridan-to'g'ri ishlaydigan skript tilidir.
O'zgaruvchilar:
• \`const\` — o'zgarmas qiymatlar uchun (tavsiya etiladi);
• \`let\` — qiymati o'zgarishi mumkin bo'lgan o'zgaruvchilar uchun;
Konsolga chiqarish: \`console.log(...)\`.`,
        starterCode: `const academy = "Smart Academy";
let activeStudents = 1420;

console.log("Xush kelibsiz:", academy);
console.log("Faol o'quvchilar soni:", activeStudents);

// O'quvchi qo'shildi
activeStudents += 1;
console.log("Yangi ko'rsatkich:", activeStudents);`,
        task: "O'z shaxsiy profilingiz haqidagi ma'lumotlarni console.log orqali chiqaring.",
      },
      {
        id: 'js-2',
        title: "2. Arrow Functions va Massiv Metodlari",
        description: "Zamonaviy funksiyalar va map, filter, reduce metodlari.",
        theory: `ES6 standartida strelka funksiyalar (\`() => {}\`) keng qo'llaniladi.
Massivlar bilan ishlashda \`.map()\`, \`.filter()\` va \`.find()\` kodni toza va o'qilishi oson qiladi.`,
        starterCode: `const examScores = [189, 165, 172, 140, 192, 155];

// A+ darajali ballarni ajratib olish (>= 170)
const topScores = examScores.filter(score => score >= 170);
console.log("A+ ballar:", topScores);

// Har bir balldan foiz hisoblash
const percentages = topScores.map(score => Math.round((score / 189) * 100) + "%");
console.log("Foiz ko'rsatkichlari:", percentages);`,
        task: "Baholar ro'yxatidan 80 dan yuqori bo'lganlarini saralab oluvchi funksiya yozing.",
      },
    ],
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    icon: '🔷',
    badgeColor: 'from-blue-500 to-indigo-600',
    description: "Katta va xavfsiz loyihalar uchun qat'iy tiplashtirilgan JavaScript kengaytmasi.",
    lessons: [
      {
        id: 'ts-1',
        title: "1. TypeScript Type & Interface Asoslari",
        description: "O'zgaruvchi va obyektlar turlarini aniq belgilash.",
        theory: `TypeScript kod yozilayotgan vaqtdayoq xatolarni aniqlaydi.
\`interface\` yoki \`type\` orqali ma'lumot tuzilmasi (schema) yaratiladi.`,
        starterCode: `interface Student {
  id: string;
  name: string;
  score: number;
  isEnrolled: boolean;
}

const cadet: Student = {
  id: "cadet-007",
  name: "Jasur Rahimov",
  score: 184,
  isEnrolled: true,
};

console.log("Kursant ma'lumotlari:", cadet.name, "| Ball:", cadet.score);
console.log("Holat:", cadet.isEnrolled ? "Faol" : "Nofaol");`,
        task: "Dars jadvali uchun Schedule interface-ini yarating va bitta dars obyektini tuzing.",
      },
    ],
  },
  {
    id: 'cpp',
    name: 'C++',
    icon: '⚙️',
    badgeColor: 'from-blue-600 to-cyan-700',
    description: "Olimpiada dasturlash, yuqori tezlikdagi tizimlar va o'yin mexanizmlari uchun kuchli til.",
    lessons: [
      {
        id: 'cpp-1',
        title: "1. C++ Dastur Tuzilishi & std::cout",
        description: "Kutubxonalarni ulash va main() funksiyasi.",
        theory: `C++ dasturlari har doim \`main()\` funksiyasidan boshlanadi.
Chiqarish oqimi \`std::cout << ... << std::endl;\` yordamida amalga oshiriladi.`,
        starterCode: `#include <iostream>
using namespace std;

int main() {
    cout << "Smart Academy C++ Dasturlash Kursi!" << endl;
    int ball = 189;
    cout << "Maksimal ball: " << ball << endl;
    return 0;
}`,
        task: "Ikki sonning yig'indisi va ko'paytmasini hisoblab ekranga chiqaruvchi kod yozing.",
      },
    ],
  },
  {
    id: 'java',
    name: 'Java',
    icon: '☕',
    badgeColor: 'from-orange-500 to-red-600',
    description: "Korporativ tizimlar, Android ilovalar va yirik backend servislari tili.",
    lessons: [
      {
        id: 'java-1',
        title: "1. Java Sinf (Class) va public static void main",
        description: "Obyektga yo'naltirilgan dasturlash (OOP) kirish.",
        theory: `Java to'liq obyektga yo'naltirilgan til bo'lib, har bir kod sinf (class) ichida bo'lishi shart.`,
        starterCode: `public class Main {
    public static void main(String[] args) {
        String academy = "Smart Academy";
        System.out.println("Salom, " + academy + "!");
        int students = 1500;
        System.out.println("O'quvchilar soni: " + students);
    }
}`,
        task: "Talaba nomini va uning guruh raqamini chop etuvchi Java dasturini tuzing.",
      },
    ],
  },
  {
    id: 'go',
    name: 'Go (Golang)',
    icon: '🚀',
    badgeColor: 'from-cyan-500 to-blue-500',
    description: "Google tomonidan yaratilgan, bulutli texnologiyalar va mikroxizmatlar uchun tezkor til.",
    lessons: [
      {
        id: 'go-1',
        title: "1. Go Asoslari: package main va fmt",
        description: "Go tilida ixcham va parallel dasturlash.",
        theory: `Go sintaksisi nihoyatda ixcham va tez kompilyatsiya bo'ladi. Chiqarish uchun \`fmt\` paketi ishlatiladi.`,
        starterCode: `package main

import "fmt"

func main() {
    academy := "Smart Academy Golang"
    fmt.Println("Salom Dunyo -", academy)
    score := 189
    fmt.Printf("Maksimal ball: %d\\n", score)
}`,
        task: "To'g'ri burchakli uchburchakning gipotenuzasini hisoblang.",
      },
    ],
  },
  {
    id: 'sql',
    name: 'SQL',
    icon: '🗄️',
    badgeColor: 'from-emerald-500 to-teal-600',
    description: "Ma'lumotlar ombori (Database) bilan ishlash, so'rovlar yozish va tahlil qilish tili.",
    lessons: [
      {
        id: 'sql-1',
        title: "1. Ma'lumotlarni Tanlash: SELECT va WHERE",
        description: "Jadvaldan kerakli qatorlarni filtrlab olish.",
        theory: `SQL (Structured Query Language) jadvallardagi ma'lumotlarni boshqarish uchun xalqaro standartdir.
• \`SELECT\` — ustunlarni tanlaydi;
• \`FROM\` — qaysi jadvaldan olishni ko'rsatadi;
• \`WHERE\` — shart qo'yadi.`,
        starterCode: `-- O'quvchilar jadvalidan a'lochi natijalarni tanlash
SELECT id, full_name, score, exam_type
FROM student_exams
WHERE score >= 170
ORDER BY score DESC
LIMIT 5;`,
        task: "Huquqshunoslik fanidan 90 balldan yuqori olgan o'quvchilarni tanlovchi SQL so'rovini yozing.",
      },
    ],
  },
];

export default function CodingAcademy({ onBack }: { onBack: () => void }) {
  const [courses, setCourses] = useState<LanguageCourse[]>(LANGUAGE_COURSES);
  const [selectedLangId, setSelectedLangId] = useState<LanguageId>('python');
  const [activeLessonIdx, setActiveLessonIdx] = useState<number>(0);
  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'curriculum' | 'mentor'>('editor');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // AI Mentor feedback state
  const [mentorText, setMentorText] = useState<string>('');
  const [mentorLoading, setMentorLoading] = useState<boolean>(false);
  const [mentorAction, setMentorAction] = useState<'bug' | 'clean' | 'hint' | 'custom' | null>(null);
  const [customQuestion, setCustomQuestion] = useState<string>('');

  // Fetch dynamic coding lessons
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('coding_lessons').select('*').order('sort_order');
        if (data && data.length > 0) {
          setCourses((prev) =>
            prev.map((course) => {
              const dynamicForLang = (data as CodingLesson[])
                .filter((l) => l.language.toLowerCase() === course.id.toLowerCase())
                .map((l) => ({
                  id: l.id,
                  title: l.title,
                  description: l.description || "Amaliy dars",
                  theory: l.theory_content,
                  starterCode: l.initial_code || '',
                  expectedOutput: l.expected_output || undefined,
                  task: "Kodni ishga tushiring va natijani konsolda kuzating.",
                }));
              if (dynamicForLang.length > 0) {
                return {
                  ...course,
                  lessons: [...dynamicForLang, ...course.lessons],
                };
              }
              return course;
            })
          );
        }
      } catch {
        /* fallback to default */
      }
    })();
  }, []);

  const currentCourse = courses.find((c) => c.id === selectedLangId) || courses[0];
  const currentLesson = currentCourse.lessons[activeLessonIdx] || currentCourse.lessons[0];

  // Sync starter code when language or lesson changes
  useEffect(() => {
    if (currentLesson) {
      setCode(currentLesson.starterCode);
      setOutput('');
      setExecutionTime(null);
    }
  }, [selectedLangId, activeLessonIdx, courses]);

  // Execute Code
  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('Dastur ishga tushirilmoqda...');
    setExecutionTime(null);

    const startTime = performance.now();

    try {
      if (selectedLangId === 'javascript' || selectedLangId === 'typescript') {
        // Safe in-browser execution with intercepted logs
        const logs: string[] = [];
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        const capture = (...args: any[]) => {
          logs.push(
            args
              .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
              .join(' ')
          );
        };

        try {
          const runContext = {
            console: { log: capture, warn: capture, error: capture, info: capture },
            Math,
            Date,
            JSON,
            Array,
            Object,
            String,
            Number,
            Boolean,
          };

          // Strip simple TS type annotations if running TypeScript in eval
          let codeToRun = code;
          if (selectedLangId === 'typescript') {
            codeToRun = code
              .replace(/:\s*(string|number|boolean|any|void|Student|Schedule)(\[\])?/g, '')
              .replace(/interface\s+\w+\s*\{[^}]*\}/g, '');
          }

          const func = new Function(
            'context',
            `with(context) {
              ${codeToRun}
            }`
          );

          func(runContext);

          const duration = Math.round(performance.now() - startTime);
          setExecutionTime(duration);

          if (logs.length > 0) {
            setOutput(logs.join('\n'));
          } else {
            setOutput("(Kod muvaffaqiyatli bajarildi, lekin konsolga hech narsa chiqarilmadi)");
          }
        } catch (err: any) {
          setOutput(`[XATOLIK - Runtime Error]:\n${err?.message || err}`);
        }
      } else {
        // Python, C++, Java, Go, SQL: Run via Gemini AI Execution Sandbox / Fallback
        const result = await executeCodeWithGemini(code, currentCourse.name);
        setExecutionTime(result.timeMs);
        setOutput(result.stdout);
      }
    } catch (err: any) {
      setOutput(`[Kutilmagan xatolik]: ${err?.message || err}`);
    } finally {
      setIsRunning(false);
    }
  };

  // AI Code Mentor: Explain Bug
  const handleExplainBug = async () => {
    setActiveTab('mentor');
    setMentorLoading(true);
    setMentorAction('bug');
    setMentorText("Koddagi xatoliklar tahlil qilinmoqda...");

    try {
      const explanation = await explainCodeBug(code, currentCourse.name, output);
      setMentorText(explanation);
    } catch {
      setMentorText("Mentor javobini olishda xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      setMentorLoading(false);
    }
  };

  // AI Code Mentor: Optimize / Clean Code
  const handleOptimizeCode = async () => {
    setActiveTab('mentor');
    setMentorLoading(true);
    setMentorAction('clean');
    setMentorText("Clean Code va samaradorlik mezonlari bo'yicha tahlil qilinmoqda...");

    try {
      const advice = await optimizeCode(code, currentCourse.name);
      setMentorText(advice);
    } catch {
      setMentorText("Maslahat olishda xatolik yuz berdi.");
    } finally {
      setMentorLoading(false);
    }
  };

  // AI Code Mentor: Get Hint
  const handleGetHint = async () => {
    setActiveTab('mentor');
    setMentorLoading(true);
    setMentorAction('hint');
    setMentorText("Siz uchun foydali yo'naltiruvchi maslahat tayyorlanmoqda...");

    try {
      const hint = await generateCodeHint(currentLesson.task, code, currentCourse.name);
      setMentorText(hint);
    } catch {
      setMentorText("Maslahat olishda xatolik yuz berdi.");
    } finally {
      setMentorLoading(false);
    }
  };

  // AI Code Mentor: Custom Question
  const handleAskCustomQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || mentorLoading) return;

    setActiveTab('mentor');
    setMentorLoading(true);
    setMentorAction('custom');
    setMentorText("Savolingiz o'rganilmoqda...");

    try {
      const prompt = `Foydalanuvchi ${currentCourse.name} darsi yuzasidan savol berdi:
Savol: "${customQuestion}"
Joriy kod:
\`\`\`${currentCourse.name}
${code}
\`\`\`
Iltimos, o'zbek tilida aniq va tushunarli javob bering.`;

      const response = await explainCodeBug(code, currentCourse.name, prompt);
      setMentorText(response);
      setCustomQuestion('');
    } catch {
      setMentorText("Javob olishda xatolik yuz berdi.");
    } finally {
      setMentorLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Bosh sahifaga
      </button>

      {/* Hero Header Banner */}
      <div className="rounded-3xl p-7 sm:p-9 mb-8 text-white bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase mb-4 backdrop-blur-md">
          <Code2 className="w-4 h-4 text-cyan-400" /> IT & Dasturlash Akademiyasi • Code Playground
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-2 text-white">
              Brauzerda Kod Yozing va O'rganing
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Python, JavaScript, TypeScript, C++, Java, Go va SQL tillari bo'yicha interaktiv darslik,
              real vaqtda ishga tushiruvchi Code Sandbox hamda Gemini AI Code Mentor yordamchisi.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shrink-0">
            <div className="text-center px-3 border-r border-slate-800">
              <div className="text-xl font-black text-white font-mono">7</div>
              <div className="text-[11px] text-slate-400">Dasturlash Tili</div>
            </div>
            <div className="text-center px-3 border-r border-slate-800">
              <div className="text-xl font-black text-cyan-400 font-mono">100%</div>
              <div className="text-[11px] text-slate-400">In-Browser</div>
            </div>
            <div className="text-center px-3">
              <div className="text-xl font-black text-emerald-400 font-mono">AI</div>
              <div className="text-[11px] text-slate-400">Code Mentor</div>
            </div>
          </div>
        </div>
      </div>

      {/* Language Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {courses.map((lang) => {
          const isSelected = selectedLangId === lang.id;
          return (
            <button
              key={lang.id}
              onClick={() => {
                setSelectedLangId(lang.id);
                setActiveLessonIdx(0);
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition shrink-0 border ${
                isSelected
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-400/60 shadow-lg shadow-indigo-900/40'
                  : 'glass text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-base">{lang.icon}</span>
              <span>{lang.name}</span>
              <span className="text-[10px] font-mono opacity-80 bg-black/30 px-1.5 py-0.5 rounded">
                {lang.lessons.length} dars
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Left (Lessons & Theory) / Right (Editor & Console & AI Mentor) */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Lesson List & Task */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass rounded-3xl p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                {currentCourse.name} Darslari
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {activeLessonIdx + 1} / {currentCourse.lessons.length}
              </span>
            </div>

            <div className="space-y-2">
              {currentCourse.lessons.map((lesson, idx) => {
                const isActive = idx === activeLessonIdx;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLessonIdx(idx)}
                    className={`w-full text-left p-3 rounded-2xl transition border text-xs ${
                      isActive
                        ? 'bg-indigo-950/70 border-indigo-500 text-white font-bold shadow'
                        : 'bg-slate-900/50 hover:bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{lesson.title}</span>
                      {isActive && <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lesson Theory & Task Box */}
          <div className="glass rounded-3xl p-5 border border-slate-800 space-y-4">
            <div>
              <span className="text-[10px] uppercase font-black text-indigo-400 tracking-wider">
                Nazariy Tushuntirish
              </span>
              <h3 className="text-base font-bold text-white mt-1 mb-2">{currentLesson.title}</h3>
              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                {currentLesson.theory}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> Amaliy Topshiriq
              </span>
              <p className="text-xs text-slate-200 mt-1 bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/30 font-medium">
                {currentLesson.task}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (8 cols): Code Editor + Output Console + AI Code Mentor */}
        <div className="lg:col-span-8 space-y-4">
          {/* Editor Header Bar with Tabs */}
          <div className="glass rounded-3xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  activeTab === 'editor'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" /> Kod Sandboxi
              </button>
              <button
                onClick={() => setActiveTab('mentor')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  activeTab === 'mentor'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> AI Code Mentor
              </button>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={copyCode}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-800 transition"
                title="Kodni nusxalash"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedCode ? 'Nusxalandi' : 'Nusxa'}</span>
              </button>

              <button
                onClick={() => setCode(currentLesson.starterCode)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-800 transition"
                title="Kodni qayta tiklash"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Qaytarish</span>
              </button>

              {/* Main RUN button */}
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition active:scale-95 disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isRunning ? 'Bajarilmoqda...' : '▶ Ishga tushirish'}</span>
              </button>
            </div>
          </div>

          {/* MAIN VIEW TAB: Code Editor + Terminal */}
          {activeTab === 'editor' && (
            <div className="space-y-4">
              {/* Code Editor Area */}
              <div className="glass rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
                {/* Editor Top Bar */}
                <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                    <span className="text-slate-400 font-mono font-medium ml-2">
                      main.{selectedLangId === 'python' ? 'py' : selectedLangId === 'javascript' ? 'js' : selectedLangId === 'typescript' ? 'ts' : selectedLangId === 'cpp' ? 'cpp' : selectedLangId === 'java' ? 'java' : selectedLangId === 'go' ? 'go' : 'sql'}
                    </span>
                  </div>

                  {/* AI Mentor Quick Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleExplainBug}
                      className="px-2.5 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 text-[11px] font-bold border border-rose-500/30 flex items-center gap-1 transition"
                      title="Koddagi xatolikni AI orqali tushunish"
                    >
                      <Bug className="w-3 h-3" />
                      <span>Xatoni tushuntir</span>
                    </button>

                    <button
                      onClick={handleOptimizeCode}
                      className="px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/70 text-indigo-300 text-[11px] font-bold border border-indigo-500/30 flex items-center gap-1 transition"
                      title="Toza kod tavsiyalari"
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Optimallashtirish</span>
                    </button>

                    <button
                      onClick={handleGetHint}
                      className="px-2.5 py-1 rounded-lg bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 text-[11px] font-bold border border-amber-500/30 flex items-center gap-1 transition"
                      title="Topshiriq uchun maslahat"
                    >
                      <Lightbulb className="w-3 h-3" />
                      <span>Maslahat</span>
                    </button>
                  </div>
                </div>

                {/* Editor Textarea with Line Numbers simulation */}
                <div className="relative flex bg-slate-950/90 font-mono text-xs sm:text-sm min-h-[320px]">
                  {/* Line numbers column */}
                  <div className="w-12 py-4 select-none text-right pr-3 text-slate-600 bg-slate-950 border-r border-slate-900 font-mono text-xs">
                    {code.split('\n').map((_, i) => (
                      <div key={i} className="leading-6">
                        {i + 1}
                      </div>
                    ))}
                  </div>

                  {/* Code editor input */}
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck={false}
                    className="flex-1 p-4 bg-transparent text-slate-100 outline-none resize-none leading-6 font-mono text-xs sm:text-sm"
                    style={{ tabSize: 2 }}
                    placeholder="Kodingizni shu yerga yozing..."
                  />
                </div>
              </div>

              {/* Terminal Output Console */}
              <div className="glass rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white font-mono">Terminal Chiqishi (Console Output)</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {executionTime !== null && (
                      <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {executionTime}ms
                      </span>
                    )}
                    <button
                      onClick={() => setOutput('')}
                      className="text-slate-400 hover:text-white text-[11px] transition"
                    >
                      Tozalash
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 font-mono text-xs min-h-[140px] max-h-[220px] overflow-y-auto leading-relaxed text-emerald-300 whitespace-pre-wrap">
                  {output ? (
                    output
                  ) : (
                    <span className="text-slate-600">
                      Natijani ko'rish uchun "▶ Ishga tushirish" tugmasini bosing...
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI CODE MENTOR TAB */}
          {activeTab === 'mentor' && (
            <div className="glass rounded-3xl p-6 border border-indigo-500/40 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Gemini AI Code Mentor</h3>
                    <p className="text-xs text-slate-400">
                      O'zbek tilida xatolarni tushuntirish va kodni tozalash maslahatlari
                    </p>
                  </div>
                </div>

                {mentorAction && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {mentorAction === 'bug'
                      ? 'Xato tahlili'
                      : mentorAction === 'clean'
                      ? 'Clean Code'
                      : mentorAction === 'hint'
                      ? 'Maslahat'
                      : 'Savol-javob'}
                  </span>
                )}
              </div>

              {/* Mentor response box */}
              <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 min-h-[200px] leading-relaxed text-xs sm:text-sm text-slate-200 whitespace-pre-wrap font-sans">
                {mentorLoading ? (
                  <div className="flex items-center gap-3 text-indigo-400 py-8 justify-center">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="font-semibold">AI Mentor kodingizni tahlil qilmoqda…</span>
                  </div>
                ) : mentorText ? (
                  mentorText
                ) : (
                  <div className="text-center py-10 text-slate-500">
                    <Sparkles className="w-10 h-10 mx-auto mb-2 text-indigo-400 opacity-40" />
                    <p className="font-medium text-slate-400">
                      Kodingiz bo'yicha savol bering yoki yuqoridagi tugmalardan birini bosing:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      <button
                        onClick={handleExplainBug}
                        className="px-3 py-1.5 rounded-xl bg-rose-950/60 text-rose-300 border border-rose-500/30 text-xs font-bold hover:bg-rose-900"
                      >
                        🐞 Xatoni tushuntir
                      </button>
                      <button
                        onClick={handleOptimizeCode}
                        className="px-3 py-1.5 rounded-xl bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 text-xs font-bold hover:bg-indigo-900"
                      >
                        ⚡ Kodni tozalash
                      </button>
                      <button
                        onClick={handleGetHint}
                        className="px-3 py-1.5 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-900"
                      >
                        💡 Maslahat olish
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Ask custom coding question form */}
              <form onSubmit={handleAskCustomQuestion} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Kodingiz yoki dasturlash bo'yicha har qanday savolni yozing..."
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm outline-none focus:border-indigo-500 placeholder-slate-500"
                />
                <button
                  type="submit"
                  disabled={mentorLoading || !customQuestion.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold transition disabled:opacity-50 shrink-0"
                >
                  So'rash
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
