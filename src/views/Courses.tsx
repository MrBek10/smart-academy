import { useState, useEffect } from 'react';
import { ArrowLeft, GraduationCap, Clock, Award, ChevronRight, Plus, X, Sparkles, BookOpen } from 'lucide-react';
import { supabase, Course } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

const DEFAULT_COURSES: Course[] = [
  {
    id: 'course-1',
    title: "Konstitutsiya va Davlat Boshqaruvi",
    description: "Yangi tahrirdagi O'zbekiston Respublikasi Konstitutsiyasining konseptual prinsiplari, inson huquqlari kafolatlari va davlat hokimiyati tuzilishi.",
    instructor_name: "Dotsent S.M. Karimov",
    price: 350000,
    duration_hours: 36,
    level: "Orta",
    category: "Huquqshunoslik",
    thumbnail_url: null,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'course-2',
    title: "Python & IT Dasturlash Akademiyasi",
    description: "Noldan professional dasturchigacha: Python sintaksisi, algoritmlar, ma'lumotlar tuzilmasi, SQLite va sun'iy intellekt integratsiyasi.",
    instructor_name: "Dilshodbek Rayimov",
    price: 450000,
    duration_hours: 48,
    level: "Boshlangich",
    category: "Dasturlash",
    thumbnail_url: null,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'course-3',
    title: "189 Ballik Milliy Sertifikat & DTM Intensiv",
    description: "Ona tili, matematika, tarix majburiy bloklari hamda asosiy mutaxassislik fanlaridan diagnostik testlar, OMR blankasi va nostandart savollar tahlili.",
    instructor_name: "Katta o'qituvchi N.B. Aliyev",
    price: 400000,
    duration_hours: 42,
    level: "Yuqori",
    category: "Imtihon",
    thumbnail_url: null,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'course-4',
    title: "Ichki Ishlar Organlari Maxsus Tayyorgarligi",
    description: "IIV xodimining huquqiy maqomi, jamoat tartibini saqlash, saf tayyorgarligi nizomi va kasbiy etika qoidalari.",
    instructor_name: "Mayor X.A. Rahimov",
    price: 380000,
    duration_hours: 30,
    level: "Orta",
    category: "Maxsus",
    thumbnail_url: null,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'course-5',
    title: "Kiberxavfsizlik va Axborot Gigiyenasi",
    description: "Raqamli xavfsizlik asoslari, ma'lumotlar shifrlanishi, tarmoq hujumlarini aniqlash va litseylar uchun kiberhimoya vositalari.",
    instructor_name: "Muhandis D.E. Qodirov",
    price: 420000,
    duration_hours: 32,
    level: "Boshlangich",
    category: "IT & Xavfsizlik",
    thumbnail_url: null,
    is_published: true,
    created_at: new Date().toISOString(),
  },
];

export default function Courses({ onBack, onOpenCourse }: { onBack: () => void; onOpenCourse: (id: string) => void }) {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Barchasi');

  const isAdmin = profile?.role === 'admin' || profile?.role === 'creator';

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('courses')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        let list = (data as Course[]) ?? [];
        if (list.length === 0) {
          list = DEFAULT_COURSES;
        }
        setCourses(list);

        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          const { data: ens } = await supabase.from('course_enrollments').select('course_id').eq('user_id', user.user.id);
          setEnrolledIds(((ens as { course_id: string }[]) ?? []).map((e) => e.course_id));
        }
      } catch {
        setCourses(DEFAULT_COURSES);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const levelLabels: Record<string, string> = { Boshlangich: "Boshlang'ich", Orta: "O'rta", Yuqori: 'Yuqori' };
  const fmtPrice = (p: number) => new Intl.NumberFormat('uz-UZ').format(p) + " so'm";

  const categories = ['Barchasi', ...Array.from(new Set(courses.map((c) => c.category).filter(Boolean) as string[]))];

  const filtered = activeCategory === 'Barchasi' ? courses : courses.filter((c) => c.category === activeCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Bosh sahifaga
      </button>

      <div className="rounded-3xl p-7 sm:p-9 mb-8 text-white bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 border border-indigo-500/30 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase mb-4 border border-indigo-500/30">
              <GraduationCap className="w-4 h-4" /> Professional Ta'lim Dasturlari
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mb-2">Smart Academy Kurslar Katalogi</h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Huquqshunoslik, DTM & Milliy Sertifikat, IT dasturlash va IIV maxsus yo'nalishlari bo'yicha
              tasdiqlangan o'quv dasturlari.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs sm:text-sm flex items-center gap-2 transition shadow-lg shadow-indigo-600/30 text-white"
            >
              {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {showAdd ? 'Bekor' : "Kurs qo'shish"}
            </button>
          )}
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white shadow'
                : 'glass text-slate-300 hover:text-white border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-500 text-center py-16">Kurslar yuklanmoqda...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500 glass rounded-3xl p-8 border border-slate-800">
          <GraduationCap className="w-14 h-14 mx-auto mb-3 opacity-30 text-indigo-400" />
          <p>Ushbu toifada kurslar topilmadi.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => {
            const enrolled = enrolledIds.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => onOpenCourse(c.id)}
                className="group glass rounded-3xl p-6 text-left hover:border-indigo-500/50 hover:-translate-y-1 transition-all border border-slate-800/80 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-indigo-600/20 text-indigo-400 group-hover:scale-110 transition-transform border border-indigo-500/20">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                    {c.category ?? 'Umumiy'}
                  </span>
                  <h3 className="font-bold text-lg mb-1.5 text-white mt-1 group-hover:text-indigo-300 transition-colors">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{c.description ?? ''}</p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-3 mt-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" /> {c.duration_hours} soat
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-400" /> {levelLabels[c.level] || c.level}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/80">
                    <span className="font-extrabold text-white text-sm">{fmtPrice(c.price)}</span>
                    {enrolled ? (
                      <span className="text-xs text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                        Yozilgan
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-indigo-400 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Batafsil <ChevronRight className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showAdd && isAdmin && (
        <AddCourseForm
          onDone={() => {
            setShowAdd(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

function AddCourseForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructor_name: '',
    price: '350000',
    duration_hours: '36',
    level: 'Boshlangich',
    category: 'Huquqshunoslik',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await supabase.from('courses').insert({
      title: form.title,
      description: form.description,
      instructor_name: form.instructor_name || 'Admin',
      price: parseFloat(form.price) || 0,
      duration_hours: parseInt(form.duration_hours, 10) || 0,
      level: form.level,
      category: form.category || null,
      is_published: true,
    });
    setSaving(false);
    onDone();
  };

  return (
    <div className="glass rounded-3xl p-6 mt-8 space-y-4 border border-indigo-500/40 shadow-2xl">
      <h3 className="font-bold text-lg text-white">Yangi Kurs Qo'shish</h3>
      <input
        type="text"
        placeholder="Kurs nomi"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 outline-none focus:border-indigo-500"
      />
      <textarea
        placeholder="Kurs tavsifi"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={3}
        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 outline-none focus:border-indigo-500 resize-none"
      />
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="O'qituvchi ismi"
          value={form.instructor_name}
          onChange={(e) => setForm({ ...form, instructor_name: e.target.value })}
          className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 outline-none focus:border-indigo-500"
        />
        <input
          type="text"
          placeholder="Kategoriya (masalan: Huquqshunoslik, Dasturlash)"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 outline-none focus:border-indigo-500"
        />
        <input
          type="number"
          placeholder="Narx (so'm)"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 outline-none focus:border-indigo-500"
        />
        <input
          type="number"
          placeholder="Davomiyligi (soat)"
          value={form.duration_hours}
          onChange={(e) => setForm({ ...form, duration_hours: e.target.value })}
          className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 outline-none focus:border-indigo-500"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 shadow-md"
        >
          {saving ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </div>
    </div>
  );
}
