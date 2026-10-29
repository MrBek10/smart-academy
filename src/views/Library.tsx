import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Search,
  Download,
  BookText,
  Scale,
  Calculator,
  Dumbbell,
  Fingerprint,
  Headphones,
  Play,
  FolderPlus,
  Sparkles,
  BookmarkCheck,
  Check,
} from 'lucide-react';
import { supabase, Book, Subject, BookCategory, logActivity } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import BookReader from '@/components/BookReader';

const DEFAULT_BOOKS: (Book & { subject_title: string })[] = [
  {
    id: 'b-1',
    subject_id: 'sub-law',
    category_id: 'cat-law',
    title: "O'zbekiston Respublikasi Konstitutsiyasi (Yangi Tahrir)",
    author: "O'zbekiston Respublikasi Adliya Vazirligi",
    description: "Davlat qurilishi, inson huquq va erkinliklari, sud hokimiyati hamda qonunchilikning oliy poydevori.",
    file_path: 'books/konstitutsiya.pdf',
    file_type: 'pdf',
    file_size: 2450000,
    cover_url: null,
    is_audio: true,
    audio_path: 'audio/konstitutsiya_audio.mp3',
    uploaded_by: 'system',
    created_at: new Date().toISOString(),
    subject_title: 'Huquqshunoslik',
  },
  {
    id: 'b-2',
    subject_id: 'sub-law',
    category_id: 'cat-law',
    title: "Jinoyat Huquqi va Kriminologiya Asoslari",
    author: "IIV Akademiyasi professor-o'qituvchilari",
    description: "Jinoyat tarkibi, jazo tayinlash qoidalari, huquqbuzarliklar profilaktikasi va kriminologik tahlillar.",
    file_path: 'books/jinoyat_huquqi.pdf',
    file_type: 'pdf',
    file_size: 4200000,
    cover_url: null,
    is_audio: true,
    audio_path: 'audio/jinoyat_huquqi.mp3',
    uploaded_by: 'system',
    created_at: new Date().toISOString(),
    subject_title: 'Huquqshunoslik',
  },
  {
    id: 'b-3',
    subject_id: 'sub-civ',
    category_id: 'cat-civ',
    title: "Fuqarolik va Ma'muriy Huquq Nazariyasi",
    author: "Toshkent Davlat Yuridik Universiteti",
    description: "Mulkdorlik huquqi, shartnomaviy majburiyatlar, fuqarolik muomalasi va ma'muriy javobgarlik choralari.",
    file_path: 'books/fuqarolik_huquqi.pdf',
    file_type: 'pdf',
    file_size: 3100000,
    cover_url: null,
    is_audio: true,
    audio_path: 'audio/fuqarolik_huquqi.mp3',
    uploaded_by: 'system',
    created_at: new Date().toISOString(),
    subject_title: "Umumta'lim",
  },
  {
    id: 'b-4',
    subject_id: 'sub-iiv',
    category_id: 'cat-iiv',
    title: "Ichki Ishlar Organlarida Tezkor-Qidiruv Faoliyati",
    author: "IIV Maxsus Kafedrasi",
    description: "IIV litseylari tinglovchilari uchun mo'ljallangan xizmat tartibi, qonuniylik va tezkor choralar qo'llanmasi.",
    file_path: 'books/iiv_faoliyati.pdf',
    file_type: 'pdf',
    file_size: 5120000,
    cover_url: null,
    is_audio: true,
    audio_path: 'audio/iiv_faoliyati.mp3',
    uploaded_by: 'system',
    created_at: new Date().toISOString(),
    subject_title: 'Maxsus',
  },
  {
    id: 'b-5',
    subject_id: 'sub-gen',
    category_id: 'cat-gen',
    title: "DTM Tarix va O'zbekiston Davlatchiligi Qomusi",
    author: "Tarix Instituti & DTM Ekspert guruhi",
    description: "Milliy sertifikat va DTM imtihonlariga tayyorlanish uchun xronologik jadvallar, xaritalar va tahliliy izohlar.",
    file_path: 'books/dtm_tarix.pdf',
    file_type: 'pdf',
    file_size: 6400000,
    cover_url: null,
    is_audio: false,
    audio_path: null,
    uploaded_by: 'system',
    created_at: new Date().toISOString(),
    subject_title: "Umumta'lim",
  },
  {
    id: 'b-6',
    subject_id: 'sub-psy',
    category_id: 'cat-psy',
    title: "Xizmat Faoliyatida Kasbiy Psixologiya va Etika",
    author: "Psixologiya Fanlari Kengashi",
    description: "Stressga chidamlilik, muzokaralar olib borish san'ati, verbal va noverbal muloqot qonuniyatlari.",
    file_path: 'books/psixologiya.pdf',
    file_type: 'pdf',
    file_size: 2800000,
    cover_url: null,
    is_audio: true,
    audio_path: 'audio/psixologiya.mp3',
    uploaded_by: 'system',
    created_at: new Date().toISOString(),
    subject_title: 'Maxsus',
  },
];

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  Huquq: Scale,
  Huquqshunoslik: Scale,
  Maxsus: Fingerprint,
  "Umumta'lim": Calculator,
  Sport: Dumbbell,
};

export default function Library({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [books, setBooks] = useState<(Book & { subject_title: string })[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'audio' | 'pdf'>('all');
  const [filterCat, setFilterCat] = useState<string>('');
  const [newCat, setNewCat] = useState('');
  const [readingBook, setReadingBook] = useState<Book | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: bs }, { data: subs }, { data: cats }] = await Promise.all([
          supabase.from('books').select('*').order('created_at', { ascending: false }),
          supabase.from('subjects').select('*').order('title'),
          supabase.from('book_categories').select('*').order('name'),
        ]);

        const subMap = new Map<string, Subject>((subs as Subject[])?.map((s) => [s.id, s]) ?? []);
        let fetchedBooks: (Book & { subject_title: string })[] = [];

        if (bs && (bs as Book[]).length > 0) {
          fetchedBooks = (bs as Book[]).map((b) => ({
            ...b,
            subject_title: b.subject_id ? subMap.get(b.subject_id)?.title ?? 'Huquq' : 'Huquq',
          }));
        }

        // If database books are empty, seed with high quality default books
        if (fetchedBooks.length === 0) {
          setBooks(DEFAULT_BOOKS);
        } else {
          setBooks(fetchedBooks);
        }

        setSubjects((subs as Subject[]) ?? []);
        setCategories((cats as BookCategory[]) ?? []);
      } catch (err) {
        console.warn('Library fetch fallback:', err);
        setBooks(DEFAULT_BOOKS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addCategory = async () => {
    if (!user || !newCat.trim()) return;
    const { error } = await supabase
      .from('book_categories')
      .insert({ name: newCat.trim(), created_by: user.id });
    if (error) {
      alert("Kategoriya qo'shilmadi: " + error.message);
      return;
    }
    setNewCat('');
    const { data: cats } = await supabase.from('book_categories').select('*').order('name');
    setCategories((cats as BookCategory[]) ?? []);
  };

  const filtered = books.filter((b) => {
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      (b.author ?? '').toLowerCase().includes(q) ||
      (b.description ?? '').toLowerCase().includes(q) ||
      b.subject_title.toLowerCase().includes(q);

    const matchCat = !filterCat || b.category_id === filterCat || b.subject_title === filterCat;

    const matchTab =
      activeFilterTab === 'all'
        ? true
        : activeFilterTab === 'audio'
        ? b.is_audio
        : !b.is_audio;

    return matchSearch && matchCat && matchTab;
  });

  const downloadBook = async (b: Book) => {
    try {
      const { data } = await supabase.storage.from('books').createSignedUrl(b.file_path, 3600);
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        // Fallback open reader directly
        setReadingBook(b);
      }
    } catch {
      setReadingBook(b);
    }
    if (user) await logActivity('kitob', `${b.title} — mutolaa qilindi`);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 font-medium">Kutubxona yuklanmoqda…</p>
      </div>
    );
  }

  const audioCount = books.filter((b) => b.is_audio).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white mb-6 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Bosh sahifaga
      </button>

      {/* Hero Banner */}
      <div className="rounded-3xl p-7 sm:p-9 mb-8 text-white bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-400 via-transparent to-transparent" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide uppercase mb-4 backdrop-blur-md">
          <Headphones className="w-3.5 h-3.5" /> Audio Kitoblar & Raqamli Kutubxona
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2 text-white">
          Raqamli Kutubxona & Audio Matn
        </h1>
        <p className="text-slate-200 text-sm sm:text-base max-w-2xl leading-relaxed">
          Huquqshunoslik, darsliklar va IIV maxsus adabiyotlari. Har bir kitob integratsiyalashgan Audio Matn (Text-to-Audio) pleyeri, boblar sinxronizatsiyasi va xatcho'p tizimi bilan boyitilgan.
        </p>

        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={() => setActiveFilterTab('audio')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeFilterTab === 'audio'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/80 text-indigo-300 border border-indigo-500/30 hover:bg-slate-800'
            }`}
          >
            <Headphones className="w-4 h-4" /> Faqat Audio Kitoblar ({audioCount})
          </button>
          <button
            onClick={() => setActiveFilterTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeFilterTab === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-900/80 text-slate-300 border border-slate-700 hover:bg-slate-800'
            }`}
          >
            Barcha Materiallar ({books.length})
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3.5 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kitob nomi, muallif yoki mavzu bo'yicha qidiruv..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm glass text-white placeholder-slate-400 border border-slate-700/80 focus:border-indigo-500 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilterTab('all')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeFilterTab === 'all'
                ? 'bg-indigo-600 text-white'
                : 'glass text-slate-300 hover:text-white'
            }`}
          >
            Barchasi
          </button>
          <button
            onClick={() => setActiveFilterTab('audio')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeFilterTab === 'audio'
                ? 'bg-indigo-600 text-white'
                : 'glass text-slate-300 hover:text-white'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-indigo-400" /> Audio
          </button>
          <button
            onClick={() => setActiveFilterTab('pdf')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              activeFilterTab === 'pdf'
                ? 'bg-indigo-600 text-white'
                : 'glass text-slate-300 hover:text-white'
            }`}
          >
            <BookText className="w-3.5 h-3.5 text-blue-400" /> Matn/PDF
          </button>
        </div>
      </div>

      {/* Categories if available */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterCat('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterCat === ''
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900/60 text-slate-300 border border-slate-800 hover:text-white'
            }`}
          >
            Barcha toifalar
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterCat(c.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterCat === c.name
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900/60 text-slate-300 border border-slate-800 hover:text-white'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Books Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 glass rounded-3xl p-8">
          <BookOpen className="w-16 h-16 mx-auto mb-3 text-slate-500 opacity-40" />
          <h3 className="text-lg font-bold text-white mb-1">Mos kitob topilmadi</h3>
          <p className="text-sm text-slate-400">
            Qidiruv so'zini o'zgartiring yoki filtrlarni tozalang.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((b) => {
            const Icon = CATEGORY_ICONS[b.subject_title] ?? (b.is_audio ? Headphones : BookText);
            return (
              <div
                key={b.id}
                className="glass rounded-3xl p-5 flex flex-col justify-between hover:border-indigo-500/50 transition-all border border-slate-800 group shadow-lg shadow-black/20"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-indigo-900/60 to-purple-900/60 text-indigo-300 border border-indigo-500/30 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    {b.is_audio ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1">
                        <Headphones className="w-3 h-3" /> Audio Matn
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        Darslik
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base mb-1.5 text-white line-clamp-2 leading-snug group-hover:text-indigo-200 transition-colors">
                    {b.title}
                  </h3>
                  {b.author && (
                    <span className="text-xs text-indigo-400 font-medium block mb-2">
                      {b.author}
                    </span>
                  )}
                  <p className="text-xs text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                    {b.description || "Ta'lim dasturi doirasidagi to'liq darslik va qo'llanma."}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => setReadingBook(b)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition shadow-md active:scale-95"
                  >
                    {b.is_audio ? (
                      <>
                        <Headphones className="w-4 h-4" /> Tinglash & Mutolaa
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4" /> O'qishni boshlash
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => downloadBook(b)}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition"
                    title="Yuklab olish"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Reader Modal */}
      {readingBook && (
        <BookReader book={readingBook} onClose={() => setReadingBook(null)} />
      )}
    </div>
  );
}
