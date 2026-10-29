import { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Bookmark,
  Volume2,
  VolumeX,
  Headphones,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  List,
  Sparkles,
  Type,
  Share2,
  Check,
} from 'lucide-react';
import { Book, logActivity } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export type BookChapter = {
  id: number;
  title: string;
  duration?: string;
  content: string;
};

// Rich default chapters for legal, education, and literature books
const SAMPLE_CHAPTERS: Record<string, BookChapter[]> = {
  default: [
    {
      id: 1,
      title: "1-Bob. Kirish va Asosiy Qoidalar",
      duration: "4:20",
      content: `O'zbekiston Respublikasi — suveren, demokratik, huquqiy, ijtimoiy va dunyoviy davlat. Davlatning nomlari bir xil ma'noni anglatadi.

Davlat xalq irodasini ifoda etib, uning manfaatlariga xizmat qiladi. Davlat organlari va mansabdor shaxslar jamiyat va fuqarolar oldida mas'uldirlar. O'zbekiston Respublikasi o'z hududida qonun ustuvorligini ta'minlaydi.

Inson, uning hayoti, erkinligi, sha'ni, qadr-qimmati va boshqa ajralmas huquqlari oliy qadriyat hisoblanadi. Davlat inson hamda fuqaroning Konstitutsiya va qonunlarda mustahkamlangan huquqlari hamda erkinliklarini ta'minlaydi.

Barcha fuqarolar bir xil huquq va erkinliklarga ega bo'lib, jinsi, irqi, millati, tili, dini, ijtimoiy kelib chiqishi, e'tiqodi, shaxsiy va ijtimoiy mavqeidan qat'i nazar, qonun oldida tengdirlar.`,
    },
    {
      id: 2,
      title: "2-Bob. Huquqiy Davlat va Qonun Ustuvorligi",
      duration: "5:15",
      content: `Huquqiy davlatda barcha munosabatlar inson huquq va manfaatlarini himoya qilishga yo'naltirilgan. Qonun ustuvorligi prinsipi jamiyatdagi har bir shaxs va tashkilot qonun normalariga so'zsiz rioya qilishini anglatadi.

Ichki ishlar organlari tizimida xizmat qiluvchi xodimlar qonuniylik, xolislik, insonparvarlik va fuqarolar huquqlariga hurmat prinsiplari asosida faoliyat olib boradilar.

Har qanday qonunbuzarlikning oldini olish va sodir etilgan huquqbuzarliklarga nisbatan o'z vaqtida adolatli chora ko'rish xavfsizlik va barqarorlikning asosiy kafolatidir.`,
    },
    {
      id: 3,
      title: "3-Bob. IIV Xodimlarining Kasbiy Etikasi",
      duration: "6:05",
      content: `IIV litseyi bitiruvchilari va bo'lajak xodimlar uchun yuksak intellektual salohiyat, qat'iyat hamda qonunga sodiqlik asosiy burchdir.

Kasbiy etika xodimlarning muomala madaniyati, psixologik chidamliligi, ziddiyatli vaziyatlarda to'g'ri qaror qabul qilish mahorati hamda jamoatchilik ishonchini oqlash talablarini o'z ichiga oladi.

Axborot texnologiyalari va raqamli kriminologiya rivojlangan bugungi kunda har bir bilimdon xodim zamonaviy ilm-fan yutuqlarini doimiy ravishda egallab borishi lozim.`,
    },
    {
      id: 4,
      title: "4-Bob. Amaliy Tahlil va Masalalar",
      duration: "4:45",
      content: `Amaliy faoliyatda huquqiy normalarni to'g'ri tatbiq etish nazariy bilimlar bilan uzviy bog'liqdir. Har bir huquqiy kolliziya qonun hujjatlarining ierarxik ustuvorligi asosida hal etiladi.

Shaxs erkinligi daxlsizligi — faqatgina sud qarori yoki qonunda belgilangan qat'iy asoslar bo'yicha cheklanishi mumkin. O'zbekiston Respublikasida inson huquqlari kafolatlari xalqaro standartlarga to'liq moslashtirilgan.`,
    },
  ],
};

interface BookReaderProps {
  book: Book;
  onClose: () => void;
}

export default function BookReader({ book, onClose }: BookReaderProps) {
  const { user } = useAuth();
  const [chapters] = useState<BookChapter[]>(SAMPLE_CHAPTERS.default);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [themeMode, setThemeMode] = useState<'slate' | 'purple' | 'obsidian'>('slate');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [speechProgress, setSpeechProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const activeChapter = chapters[currentChapterIdx] || chapters[0];

  // Load bookmark status
  useEffect(() => {
    const bookmarkKey = `bookmark_${user?.id || 'guest'}_${book.id}_ch${activeChapter.id}`;
    setIsBookmarked(!!localStorage.getItem(bookmarkKey));
  }, [book.id, activeChapter.id, user]);

  // Cancel any ongoing speech when unmounting or changing chapter
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Web Speech API / Audio initialization
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert("Kechirasiz, brauzeringiz ovozli matn (Text-to-Speech) tizimini qo'llab-quvvatlamaydi.");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(activeChapter.content);
        utterance.rate = rate;
        utterance.pitch = 1.0;
        utterance.lang = 'uz-UZ';

        // Choose suitable natural voice if available
        const voices = window.speechSynthesis.getVoices();
        const uzVoice = voices.find((v) => v.lang.includes('uz') || v.lang.includes('tr') || v.lang.includes('ru'));
        if (uzVoice) utterance.voice = uzVoice;

        utterance.onboundary = (e) => {
          if (e.charIndex && activeChapter.content.length > 0) {
            setSpeechProgress(Math.round((e.charIndex / activeChapter.content.length) * 100));
          }
        };

        utterance.onend = () => {
          setIsPlaying(false);
          setSpeechProgress(100);
          if (currentChapterIdx < chapters.length - 1) {
            // auto next chapter
            setCurrentChapterIdx((c) => c + 1);
          }
        };

        utterance.onerror = () => {
          setIsPlaying(false);
        };

        synthRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsPlaying(true);

        if (user) {
          logActivity('audio_kitob', `${book.title} — ${activeChapter.title} tinglanmoqda`);
        }
      }
    }
  };

  const changeRate = () => {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (rates.indexOf(rate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setRate(newRate);
    if (isPlaying && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setTimeout(toggleSpeech, 150);
    }
  };

  const toggleBookmark = () => {
    const bookmarkKey = `bookmark_${user?.id || 'guest'}_${book.id}_ch${activeChapter.id}`;
    if (isBookmarked) {
      localStorage.removeItem(bookmarkKey);
      setIsBookmarked(false);
    } else {
      localStorage.setItem(bookmarkKey, JSON.stringify({
        bookId: book.id,
        bookTitle: book.title,
        chapterId: activeChapter.id,
        chapterTitle: activeChapter.title,
        savedAt: new Date().toISOString(),
      }));
      setIsBookmarked(true);
    }
  };

  const handleNextChapter = () => {
    if (currentChapterIdx < chapters.length - 1) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlaying(false);
      setSpeechProgress(0);
      setCurrentChapterIdx((c) => c + 1);
    }
  };

  const handlePrevChapter = () => {
    if (currentChapterIdx > 0) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlaying(false);
      setSpeechProgress(0);
      setCurrentChapterIdx((c) => c - 1);
    }
  };

  const themeStyles = {
    slate: 'bg-slate-950 text-slate-100 border-slate-800',
    purple: 'bg-[#0f0c1b] text-purple-100 border-purple-900/50',
    obsidian: 'bg-black text-white border-zinc-800',
  };

  const fontStyles = {
    normal: 'text-base leading-relaxed',
    large: 'text-lg leading-loose',
    xlarge: 'text-xl leading-loose',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div
        className={`rounded-3xl w-full max-w-4xl h-[92vh] flex flex-col shadow-2xl border ${themeStyles[themeMode]} overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <header className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between gap-3 bg-slate-900/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Headphones className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base truncate">{book.title}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                  Audio & Matn
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {book.author || 'Smart Academy Nashri'} • {activeChapter.title}
              </p>
            </div>
          </div>

          {/* Right Toolbar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Chapter list toggle */}
            <button
              onClick={() => setShowChapterList(!showChapterList)}
              className={`p-2 rounded-xl text-slate-300 hover:text-white transition ${
                showChapterList ? 'bg-indigo-600/30 text-indigo-300' : 'hover:bg-slate-800/60'
              }`}
              title="Boblar ro'yxati"
            >
              <List className="w-5 h-5" />
            </button>

            {/* Font size toggle */}
            <button
              onClick={() => {
                setFontSize((f) => (f === 'normal' ? 'large' : f === 'large' ? 'xlarge' : 'normal'));
              }}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
              title="Matn o'lchami"
            >
              <Type className="w-5 h-5" />
            </button>

            {/* Bookmark */}
            <button
              onClick={toggleBookmark}
              className={`p-2 rounded-xl transition ${
                isBookmarked
                  ? 'text-amber-400 bg-amber-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title={isBookmarked ? "Xatcho'p saqlangan" : "Xatcho'p qo'yish"}
            >
              <Bookmark className="w-5 h-5" />
            </button>

            {/* Theme selector */}
            <button
              onClick={() => {
                setThemeMode((t) => (t === 'slate' ? 'purple' : t === 'purple' ? 'obsidian' : 'slate'));
              }}
              className="px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 border border-slate-700/60 transition"
              title="Mavzuni almashtirish"
            >
              {themeMode === 'slate' ? 'Slate' : themeMode === 'purple' ? 'Binafsha' : 'Obsidian'}
            </button>

            <button
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800/60 transition ml-2"
              title="Yopish"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Body with optional sidebar */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Main Reading area */}
          <main className="flex-1 overflow-y-auto p-6 sm:p-10 max-w-3xl mx-auto space-y-6">
            <div className="pb-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Bob {activeChapter.id} / {chapters.length}
                </span>
                <h1 className="text-2xl font-extrabold text-white mt-1">{activeChapter.title}</h1>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Taxminiy vaqt</span>
                <div className="text-sm font-semibold text-indigo-300 font-mono">
                  {activeChapter.duration || '4:30'}
                </div>
              </div>
            </div>

            {/* Chapter Text */}
            <div className={`text-slate-200 whitespace-pre-wrap font-sans ${fontStyles[fontSize]}`}>
              {activeChapter.content}
            </div>

            {/* Chapter navigation footer */}
            <div className="pt-8 mt-12 border-t border-slate-800/80 flex items-center justify-between">
              <button
                onClick={handlePrevChapter}
                disabled={currentChapterIdx === 0}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-sm font-medium text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Oldingi Bob
              </button>

              <span className="text-xs text-slate-400 font-mono">
                {currentChapterIdx + 1} - bob
              </span>

              <button
                onClick={handleNextChapter}
                disabled={currentChapterIdx === chapters.length - 1}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2 transition shadow-md"
              >
                Keyingi Bob <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </main>

          {/* Chapter sidebar drawer */}
          {showChapterList && (
            <aside className="w-72 border-l border-slate-800 bg-slate-900/90 backdrop-blur-md p-4 overflow-y-auto flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" /> Boblar
                  </h4>
                  <button
                    onClick={() => setShowChapterList(false)}
                    className="p-1 text-slate-400 hover:text-white rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {chapters.map((ch, idx) => {
                    const active = idx === currentChapterIdx;
                    return (
                      <button
                        key={ch.id}
                        onClick={() => {
                          if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                          setIsPlaying(false);
                          setSpeechProgress(0);
                          setCurrentChapterIdx(idx);
                        }}
                        className={`w-full text-left p-3 rounded-xl transition text-xs flex items-center justify-between border ${
                          active
                            ? 'bg-indigo-600/30 border-indigo-500/50 text-white font-semibold'
                            : 'hover:bg-slate-800/60 border-transparent text-slate-300'
                        }`}
                      >
                        <span className="truncate pr-2">{ch.title}</span>
                        <span className="font-mono text-[10px] text-slate-400 shrink-0">
                          {ch.duration}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                <p>AI sinxronizatsiya va nutq vositasi yordamida o'qiladi.</p>
              </div>
            </aside>
          )}
        </div>

        {/* Audio Player Bottom Dock */}
        <footer className="px-5 py-3.5 border-t border-slate-800/80 bg-slate-900/90 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left info & progress */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow shrink-0">
              {isPlaying ? (
                <span className="flex items-end gap-0.5 h-4">
                  <span className="w-1 bg-white rounded-full eq-bar-1"></span>
                  <span className="w-1 bg-white rounded-full eq-bar-2"></span>
                  <span className="w-1 bg-white rounded-full eq-bar-3"></span>
                </span>
              ) : (
                <Headphones className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white truncate block">
                Audio Matn: {activeChapter.title}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-24 sm:w-36 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                    style={{ width: `${speechProgress}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {speechProgress}%
                </span>
              </div>
            </div>
          </div>

          {/* Center Playback Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                  setIsPlaying(false);
                  setSpeechProgress(0);
                }
              }}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Qaytadan boshlash"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={toggleSpeech}
              className="w-11 h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-transform active:scale-95"
              title={isPlaying ? "To'xtatish" : "Tinglashni boshlash"}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            {/* Speed control */}
            <button
              onClick={changeRate}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-indigo-500 text-xs font-mono font-bold text-indigo-300 transition"
              title="Ovoz tezligini o'zgartirish"
            >
              {rate}x
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center gap-1.5 transition"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {copiedLink ? "Nusxalandi!" : "Ulashish"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
