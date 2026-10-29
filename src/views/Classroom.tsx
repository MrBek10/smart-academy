import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Sparkles, Bot, User as UserIcon, Loader2, CalendarCheck } from 'lucide-react';
import { supabase, Topic, Lesson, Question } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';

type ChatMsg = { role: 'user' | 'ai'; text: string };

export default function Classroom({
  topicId,
  onBack,
  onOpenSubject,
}: {
  topicId: string;
  onBack: () => void;
  onOpenSubject: (id: string) => void;
}) {
  const { globalTheme } = useTheme();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: top } = await supabase.from('topics').select('*').eq('id', topicId).maybeSingle();
      const topObj = top as Topic | null;
      setTopic(topObj);

      if (topObj) {
        const { data: les } = await supabase.from('lessons').select('*').eq('topic_id', topObj.id).order('created_at').limit(1).maybeSingle();
        setLesson(les as Lesson | null);
      }

      const { data: qs } = await supabase.from('questions').select('*').eq('topic_id', topicId).order('created_at');
      setQuestions((qs as Question[]) ?? []);

      setLoading(false);
    })();
  }, [topicId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat, thinking]);

  // AI tutor: first checks lesson content locally, then falls back to Wikipedia API
  const answerFromLesson = (q: string): string | null => {
    const text = q.toLowerCase();
    const lessonText = lesson?.content ?? '';
    const lines = lessonText.split('\n').filter(Boolean);

    const keywords = text.split(/\s+/).filter((w) => w.length > 4);
    let bestLine = '';
    let bestScore = 0;
    for (const line of lines) {
      const lower = line.toLowerCase();
      let score = 0;
      for (const kw of keywords) {
        if (lower.includes(kw)) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestLine = line;
      }
    }

    const matchedQ = questions.find((qq) => {
      const ql = qq.question.toLowerCase();
      return keywords.some((kw) => ql.includes(kw));
    });

    const parts: string[] = [];

    if (matchedQ && matchedQ.explanation) {
      parts.push(`Bu mavzuda: ${matchedQ.explanation}`);
    }

    if (bestScore > 0 && bestLine.trim().length > 0) {
      parts.push(`Dars materialiga ko'ra: ${bestLine.trim()}`);
    }

    // Built-in knowledge for common legal terms
    if (text.includes('davlat') && text.includes('belgi')) {
      parts.push("Davlatning asosiy belgilari: hududiy bo'linish, aholi, hokimiyat, suverenitet va qonun chiqaruvchi hokimiyat.");
    }
    if (text.includes('huquq') && (text.includes('nima') || text.includes('tushun'))) {
      parts.push("Huquq — davlat tomonidan tasdiqlangan va majburlash kuchiga ega bo'lgan xulq-atvor normalari yig'indisidir.");
    }
    if (text.includes('konstitutsi')) {
      parts.push("Konstitutsiya — eng oliy qonun bo'lib, boshqa barcha qonunlardan ustun turadi.");
    }
    if (text.includes('suverenitet')) {
      parts.push("Suverenitet — davlatning ichki va tashqi ishlarda mustaqil qaror qabul qilishidir.");
    }

    return parts.length > 0 ? parts.join('\n\n') : null;
  };

  const searchWikipedia = async (q: string): Promise<string> => {
    try {
      const wikiUrl = `https://uz.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`;
      const res = await fetch(wikiUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.extract) {
          let result = data.extract;
          if (data.content_urls?.desktop?.page) {
            result += `\n\nWikipedia sahifasi: ${data.content_urls.desktop.page}`;
          }
          return result;
        }
      }
      return "Wikipedia'da bu mavzu bo'yicha maqola topilmadi. Iltimos, savolni aniqlashtiring yoki dars matnidan foydalaning.";
    } catch {
      return "Internetga ulanishda xatolik. Iltimos qaytadan urinib ko'ring.";
    }
  };

  const send = async () => {
    const q = input.trim();
    if (!q || thinking) return;
    setInput('');
    setChat((c) => [...c, { role: 'user', text: q }]);
    setThinking(true);

    // First try Gemini AI edge function; fall back to lesson content, then Wikipedia
    let ans: string;
    try {
      const { data: fnData, error: fnErr } = await supabase.functions.invoke('ai-tutor', {
        body: {
          question: q,
          lessonContent: lesson?.content ?? undefined,
          topicTitle: topic?.title ?? undefined,
        },
      });
      if (!fnErr && fnData?.answer) {
        ans = fnData.answer as string;
      } else {
        // Fallback to local lesson content
        const localAns = answerFromLesson(q);
        if (localAns) {
          await new Promise((r) => setTimeout(r, 500));
          ans = localAns;
        } else {
          ans = await searchWikipedia(q);
        }
      }
    } catch {
      // Edge function unavailable — use lesson + Wikipedia fallback
      const localAns = answerFromLesson(q);
      if (localAns) {
        await new Promise((r) => setTimeout(r, 500));
        ans = localAns;
      } else {
        ans = await searchWikipedia(q);
      }
    }

    setChat((c) => [...c, { role: 'ai', text: ans }]);
    setThinking(false);

    // Log conversation (best-effort)
    if (topic) {
      await supabase.from('ai_conversations').insert({ topic_id: topic.id, question: q, answer: ans });
    }
  };

  const generateStudyPlan = () => {
    const today = new Date().toLocaleDateString('uz-UZ', { weekday: 'long' });
    const plan = `Bugungi AI Dars Rejami (${today}):

09:00 - 10:00: Huquqshunoslik darsi (Konstitutsiya moddalari)
10:15 - 11:00: DTM Test simulyatori (10 savol)
11:15 - 12:00: Kutubxona — IIV qo'llanmasini mutolaa qilish
14:00 - 14:45: Mavzu bo'yicha takroriy test
15:00 - 15:30: AI yordamida qiyin mavzularni tushuntirish`;

    setChat((c) => [...c, { role: 'ai', text: plan }]);
  };

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20 text-slate-500">Yuklanmoqda…</div>;

  const boardBg = 'var(--board-bg, #1a1a1a)';
  const boardText = 'var(--board-text, #f5f5f5)';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Orqaga
      </button>

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white">{lesson?.title ?? topic?.title ?? 'Dars'}</h1>
        {topic?.description && <p className="text-slate-400 text-sm mt-1">{topic.description}</p>}
      </div>

      {topic && (
        <button onClick={() => onOpenSubject(topic.subject_id)} className="sr-only">Fan</button>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Blackboard */}
        <div className="lg:col-span-2">
          <div
            className="rounded-2xl p-1.5 shadow-xl"
            style={{ background: 'linear-gradient(135deg, #5a4a3a, #3a2a1a)' }}
          >
            <div
              className="rounded-xl p-7 md:p-10 min-h-[420px] font-mono leading-relaxed whitespace-pre-wrap text-sm md:text-base"
              style={{
                background: boardBg,
                color: boardText,
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
                fontFamily: '"Caveat", "Comic Sans MS", cursive',
              }}
            >
              {lesson?.content ?? 'Dars materiali hozircha yuklanmagan.'}
            </div>
          </div>
          <p className="text-center text-xs text-slate-500 mt-3 italic">Virtual doska — matnni o'qing va AI ga savol bering</p>
        </div>

        {/* AI tutor */}
        <div className="glass rounded-2xl flex flex-col h-[500px] lg:h-auto">
          <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-tr from-blue-600 to-indigo-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-sm leading-tight text-white">AI Repetitor</div>
              <div className="text-xs text-slate-400">Mavzu bo'yicha savol bering</div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {chat.length === 0 && (
              <div className="text-center text-sm text-slate-500 py-8">
                <Bot className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Salom! Men AI repetitorman. Doskadagi mavzu bo'yicha savol bering, men sizga sodda qilib tushuntirib beraman.</p>
              </div>
            )}
            {chat.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-slate-700' : 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white'}`}>
                  {m.role === 'user' ? <UserIcon className="w-4 h-4 text-slate-200" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800/60 text-slate-200'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex gap-2">
                <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white bg-gradient-to-tr from-blue-600 to-indigo-500">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-800/60 rounded-2xl px-3.5 py-2.5 text-sm text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> O'ylayapman…
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-slate-700/50 space-y-2">
            <button
              onClick={generateStudyPlan}
              className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <CalendarCheck className="w-3.5 h-3.5" /> Bugungi kun uchun shaxsiy dars rejasini tuzish (AI)
            </button>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Savolingizni yozing…"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 focus:border-blue-500 outline-none text-sm text-slate-100 transition-colors"
              />
              <button
                onClick={send}
                disabled={!input.trim() || thinking}
                className="px-3.5 rounded-xl text-white disabled:opacity-40 transition-opacity bg-blue-600 hover:bg-blue-500"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {globalTheme === null && null}
    </div>
  );
}
