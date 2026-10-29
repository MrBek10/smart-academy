import { useEffect, useState } from 'react';
import { BookOpen, FileText, ClipboardList, Palette, Plus, Trash2, Save, Check, Upload, File as FileIcon, Library, Headphones, FolderPlus, Video, Award, ShieldCheck, Eye, Sparkles, BarChart3, Code2, Brain } from 'lucide-react';
import { supabase, Subject, Topic, ThemeSettings, TestFile, Book, BookCategory, VideoLesson, Exam, ExamQuestion, ExamType, CodingLesson, MindChallenge } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { CaptchaModal } from '@/components/Captcha';
import ExamAnalytics from '@/components/ExamAnalytics';

type Tab = 'content' | 'videos' | 'exams' | 'analytics' | 'files' | 'books' | 'theme' | 'coding_mind';

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('content');
  const { profile } = useAuth();
  const isCreator = profile?.role === 'creator';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1 text-white">Admin Panel</h1>
      <p className="text-slate-400 text-sm mb-6">
        {isCreator ? "Yaratuvchi rejimi — to'liq boshqaruv huquqi" : "Admin rejimi — kontent, testlar va natijalar tahlili"}
      </p>

      <div className="flex gap-1.5 p-1.5 glass rounded-2xl mb-6 w-fit flex-wrap border border-slate-800">
        <TabBtn icon={BookOpen} label="Fanlar & Darslar" active={tab === 'content'} onClick={() => setTab('content')} />
        <TabBtn icon={Video} label="Video Darslar" active={tab === 'videos'} onClick={() => setTab('videos')} />
        <TabBtn icon={Award} label="Imtihonlar (Milliy/DTM)" active={tab === 'exams'} onClick={() => setTab('exams')} />
        <TabBtn icon={BarChart3} label="Natijalar Tahlili" active={tab === 'analytics'} onClick={() => setTab('analytics')} />
        <TabBtn icon={Code2} label="Dasturlash & Mantiq" active={tab === 'coding_mind'} onClick={() => setTab('coding_mind')} />
        <TabBtn icon={Upload} label="Test fayllari (PDF)" active={tab === 'files'} onClick={() => setTab('files')} />
        <TabBtn icon={Library} label="Kitoblar" active={tab === 'books'} onClick={() => setTab('books')} />
        <TabBtn icon={Palette} label="Sayt dizayni" active={tab === 'theme'} onClick={() => setTab('theme')} />
      </div>

      {tab === 'content' && <ContentManager />}
      {tab === 'videos' && <VideoLessonsManager />}
      {tab === 'exams' && <ExamsManager />}
      {tab === 'analytics' && <ExamAnalytics />}
      {tab === 'coding_mind' && <CodingAndMindAdmin />}
      {tab === 'files' && <FilesManager />}
      {tab === 'books' && <BooksManager />}
      {tab === 'theme' && <ThemeManager />}
    </div>
  );
}

function TabBtn({ icon: Icon, label, active, onClick }: { icon: typeof BookOpen; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${active ? 'bg-blue-600 text-white shadow' : 'text-slate-400'}`}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}

function ContentManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [newSubject, setNewSubject] = useState({ title: '', description: '', color: '#0f766e', icon: 'BookOpen' });
  const [newTopic, setNewTopic] = useState({ title: '', description: '' });
  const [newLesson, setNewLesson] = useState({ topicId: '', title: '', content: '' });
  const [newQuestion, setNewQuestion] = useState({
    topicId: '', question: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_answer: 'a' as 'a' | 'b' | 'c' | 'd', explanation: '',
  });

  const load = async () => {
    const { data: subs } = await supabase.from('subjects').select('*').order('sort_order');
    const subsArr = (subs as Subject[]) ?? [];
    setSubjects(subsArr);
    if (subsArr[0] && !selectedSubject) setSelectedSubject(subsArr[0].id);
    if (selectedSubject) {
      const { data: tops } = await supabase.from('topics').select('*').eq('subject_id', selectedSubject).order('sort_order');
      setTopics((tops as Topic[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const { data: subs } = await supabase.from('subjects').select('*').order('sort_order');
      const subsArr = (subs as Subject[]) ?? [];
      setSubjects(subsArr);
      if (subsArr[0]) setSelectedSubject(subsArr[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    (async () => {
      const { data: tops } = await supabase.from('topics').select('*').eq('subject_id', selectedSubject).order('sort_order');
      setTopics((tops as Topic[]) ?? []);
    })();
  }, [selectedSubject]);

  const addSubject = async () => {
    if (!newSubject.title.trim()) return;
    const { error } = await supabase.from('subjects').insert({ ...newSubject, sort_order: subjects.length + 1 });
    if (error) { alert('Xato: ' + error.message); return; }
    setNewSubject({ title: '', description: '', color: '#0f766e', icon: 'BookOpen' });
    await load();
  };

  const addTopic = async () => {
    if (!newTopic.title.trim() || !selectedSubject) return;
    const { error } = await supabase.from('topics').insert({ ...newTopic, subject_id: selectedSubject, sort_order: topics.length + 1 });
    if (error) { alert('Xato: ' + error.message); return; }
    setNewTopic({ title: '', description: '' });
    await load();
  };

  const addLesson = async () => {
    if (!newLesson.topicId || !newLesson.title.trim() || !newLesson.content.trim()) return;
    const { error } = await supabase.from('lessons').insert({ topic_id: newLesson.topicId, title: newLesson.title, content: newLesson.content });
    if (error) { alert('Xato: ' + error.message); return; }
    setNewLesson({ topicId: '', title: '', content: '' });
    alert("Dars doska matni qo'shildi!");
  };

  const addQuestion = async () => {
    const nq = newQuestion;
    if (!nq.topicId || !nq.question.trim() || !nq.option_a.trim() || !nq.option_b.trim() || !nq.option_c.trim() || !nq.option_d.trim()) return;
    const { error } = await supabase.from('questions').insert(nq);
    if (error) { alert('Xato: ' + error.message); return; }
    setNewQuestion({ topicId: '', question: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', explanation: '' });
    alert("Test savoli qo'shildi!");
  };

  const deleteSubject = async (id: string) => {
    if (!confirm("Bu fan va uning barcha mavzulari, darslari va testlari o'chiriladi. Davom etasizmi?")) return;
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) { alert('Xato: ' + error.message); return; }
    if (selectedSubject === id) setSelectedSubject(null);
    await load();
  };

  const deleteTopic = async (id: string) => {
    if (!confirm("Bu mavzu va uning darslari/testlari o'chiriladi. Davom etasizmi?")) return;
    const { error } = await supabase.from('topics').delete().eq('id', id);
    if (error) { alert('Xato: ' + error.message); return; }
    await load();
  };

  if (loading) return <div className="text-slate-500">Yuklanmoqda…</div>;

  return (
    <div className="space-y-8">
      <Section title="Fanlar" icon={BookOpen}>
        <div className="space-y-2 mb-4">
          {subjects.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 glass rounded-xl">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}22`, color: s.color }}>
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate text-slate-100">{s.title}</div>
                <div className="text-xs text-slate-500 truncate">{s.description ?? ''}</div>
              </div>
              <button onClick={() => setSelectedSubject(s.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selectedSubject === s.id ? 'text-white' : 'bg-slate-800/60 text-slate-300'}`} style={selectedSubject === s.id ? { background: s.color } : {}}>
                {selectedSubject === s.id ? 'Tanlangan' : 'Mavzular'}
              </button>
              <button onClick={() => deleteSubject(s.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {subjects.length === 0 && <p className="text-sm text-slate-500">Hozircha fanlar yo'q.</p>}
        </div>
        <AddForm onSubmit={addSubject}>
          <Input placeholder="Fan nomi" value={newSubject.title} onChange={(v) => setNewSubject({ ...newSubject, title: v })} />
          <Input placeholder="Tavsif" value={newSubject.description} onChange={(v) => setNewSubject({ ...newSubject, description: v })} />
          <div className="flex items-center gap-2">
            <input type="color" value={newSubject.color} onChange={(e) => setNewSubject({ ...newSubject, color: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer" />
            <span className="text-xs text-stone-500">Rang</span>
          </div>
        </AddForm>
      </Section>

      {selectedSubject && (
        <Section title="Mavzular" icon={FileText}>
          <div className="space-y-2 mb-4">
            {topics.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-3 glass rounded-xl">
                <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate text-slate-100">{t.title}</div>
                  <div className="text-xs text-slate-500 truncate">{t.description ?? ''}</div>
                </div>
                <button onClick={() => deleteTopic(t.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {topics.length === 0 && <p className="text-sm text-slate-500">Hozircha mavzular yo'q.</p>}
          </div>
          <AddForm onSubmit={addTopic}>
            <Input placeholder="Mavzu nomi" value={newTopic.title} onChange={(v) => setNewTopic({ ...newTopic, title: v })} />
            <Input placeholder="Tavsif" value={newTopic.description} onChange={(v) => setNewTopic({ ...newTopic, description: v })} />
          </AddForm>
        </Section>
      )}

      {topics.length > 0 && (
        <Section title="Dars (Doska matni) qo'shish" icon={FileText}>
          <div className="glass rounded-xl p-4 space-y-3">
            <Select placeholder="Mavzu tanlang" value={newLesson.topicId} onChange={(v) => setNewLesson({ ...newLesson, topicId: v })} options={topics.map((t) => ({ value: t.id, label: t.title }))} />
            <Input placeholder="Dars sarlavhasi" value={newLesson.title} onChange={(v) => setNewLesson({ ...newLesson, title: v })} />
            <textarea placeholder="Doska matni (\n bilan yangi qatorlar)" value={newLesson.content} onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })} rows={6} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 focus:border-blue-500 outline-none text-sm font-mono text-slate-100" />
            <button onClick={addLesson} className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500">
              <Plus className="w-4 h-4" /> Dars qo'shish
            </button>
          </div>
        </Section>
      )}

      {topics.length > 0 && (
        <Section title="Test savoli qo'shish" icon={ClipboardList}>
          <div className="glass rounded-xl p-4 space-y-3">
            <Select placeholder="Mavzu tanlang" value={newQuestion.topicId} onChange={(v) => setNewQuestion({ ...newQuestion, topicId: v })} options={topics.map((t) => ({ value: t.id, label: t.title }))} />
            <Input placeholder="Savol" value={newQuestion.question} onChange={(v) => setNewQuestion({ ...newQuestion, question: v })} />
            <div className="grid sm:grid-cols-2 gap-2.5">
              <Input placeholder="A variant" value={newQuestion.option_a} onChange={(v) => setNewQuestion({ ...newQuestion, option_a: v })} />
              <Input placeholder="B variant" value={newQuestion.option_b} onChange={(v) => setNewQuestion({ ...newQuestion, option_b: v })} />
              <Input placeholder="C variant" value={newQuestion.option_c} onChange={(v) => setNewQuestion({ ...newQuestion, option_c: v })} />
              <Input placeholder="D variant" value={newQuestion.option_d} onChange={(v) => setNewQuestion({ ...newQuestion, option_d: v })} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">To'g'ri javob:</span>
              {(['a', 'b', 'c', 'd'] as const).map((k) => (
                <button key={k} onClick={() => setNewQuestion({ ...newQuestion, correct_answer: k })} className={`w-8 h-8 rounded-lg text-sm font-bold uppercase ${newQuestion.correct_answer === k ? 'text-white bg-blue-600' : 'bg-slate-800/60 text-slate-400'}`}>
                  {k}
                </button>
              ))}
            </div>
            <Input placeholder="Izoh (ixtiyoriy)" value={newQuestion.explanation} onChange={(v) => setNewQuestion({ ...newQuestion, explanation: v })} />
            <button onClick={addQuestion} className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500">
              <Plus className="w-4 h-4" /> Savol qo'shish
            </button>
          </div>
        </Section>
      )}
    </div>
  );
}

function VideoLessonsManager() {
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', video_url: '', category: 'Umumiy', playlist: '', instructor_name: '', duration_seconds: '0' });

  const load = async () => {
    const { data } = await supabase.from('video_lessons').select('*').order('created_at', { ascending: false });
    setVideos((data as VideoLesson[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ title: '', description: '', video_url: '', category: 'Umumiy', playlist: '', instructor_name: '', duration_seconds: '0' });
    setEditId(null);
  };

  const save = async () => {
    if (!form.title.trim() || !form.video_url.trim()) { alert('Sarlavha va video havola majburiy.'); return; }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      video_url: form.video_url.trim(),
      category: form.category.trim() || 'Umumiy',
      playlist: form.playlist.trim() || null,
      duration_seconds: parseInt(form.duration_seconds) || 0,
      sort_order: 0,
    };
    if (editId) {
      const { error } = await supabase.from('video_lessons').update(payload).eq('id', editId);
      if (error) { alert('Xato: ' + error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('video_lessons').insert(payload);
      if (error) { alert('Xato: ' + error.message); setSaving(false); return; }
    }
    setSaving(false);
    resetForm();
    await load();
  };

  const edit = (v: VideoLesson) => {
    setEditId(v.id);
    setForm({ title: v.title, description: v.description ?? '', video_url: v.video_url, category: v.category, playlist: v.playlist ?? '', instructor_name: '', duration_seconds: String(v.duration_seconds) });
  };

  const [deleteTargetVideo, setDeleteTargetVideo] = useState<VideoLesson | null>(null);
  const [showVideoCaptcha, setShowVideoCaptcha] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<VideoLesson | null>(null);

  const confirmDeleteVideo = async () => {
    if (!deleteTargetVideo) return;
    const { error } = await supabase.from('video_lessons').delete().eq('id', deleteTargetVideo.id);
    if (error) {
      alert("Xato: " + error.message);
    } else {
      await load();
      alert("Video dars o'chirildi.");
    }
    setDeleteTargetVideo(null);
  };

  const remove = (v: VideoLesson) => {
    setDeleteTargetVideo(v);
    setShowVideoCaptcha(true);
  };

  if (loading) return <div className="text-slate-400">Yuklanmoqda…</div>;

  return (
    <div className="space-y-6">
      <Section title="Video dars qo'shish / tahrirlash" icon={Video}>
        <div className="glass rounded-2xl p-5 border border-slate-800 space-y-3">
          <Input placeholder="Dars nomi" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <Input placeholder="Video havola (YouTube/Vimeo/MP4 URL)" value={form.video_url} onChange={(v) => setForm({ ...form, video_url: v })} />
          <div className="grid sm:grid-cols-2 gap-2.5">
            <Input placeholder="Kategoriya (masalan: Huquqshunoslik)" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
            <Input placeholder="Pleylist (ixtiyoriy)" value={form.playlist} onChange={(v) => setForm({ ...form, playlist: v })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            <Input placeholder="Davomiyligi (soniya, masalan: 1200)" value={form.duration_seconds} onChange={(v) => setForm({ ...form, duration_seconds: v })} />
            <Input placeholder="O'qituvchi / Kafedra (ixtiyoriy)" value={form.instructor_name} onChange={(v) => setForm({ ...form, instructor_name: v })} />
          </div>
          <TextArea placeholder="Tavsif (ixtiyoriy)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl text-white text-xs font-bold inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow disabled:opacity-50 transition">
              <Plus className="w-4 h-4" /> {editId ? 'Saqlash' : 'Darsni Qo\'shish'}
            </button>
            {editId && (
              <button onClick={resetForm} className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-300 glass hover:bg-slate-800/60">Bekor</button>
            )}
          </div>
        </div>
      </Section>

      <Section title="Mavjud video darslar" icon={Video}>
        <div className="space-y-2">
          {videos.length === 0 && <p className="text-sm text-slate-400">Hozircha video darslar yo'q.</p>}
          {videos.map((v) => (
            <div key={v.id} className="flex items-center gap-3 p-3.5 glass rounded-2xl border border-slate-800">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-800 text-indigo-400">
                <Video className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate text-white">{v.title}</div>
                <div className="text-xs text-slate-400 truncate">{v.category} · {v.duration_seconds} soniya</div>
              </div>
              <button onClick={() => setPreviewVideo(v)} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/40 flex items-center gap-1 transition">
                <Eye className="w-3.5 h-3.5" /> Ko'rish
              </button>
              <button onClick={() => edit(v)} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition">Tahrir</button>
              <button onClick={() => remove(v)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors" title="O'chirish">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={() => setPreviewVideo(null)}>
          <div className="glass-strong rounded-3xl p-5 max-w-2xl w-full border border-indigo-500/30 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm truncate">{previewVideo.title}</h3>
              <button onClick={() => setPreviewVideo(null)} className="p-1 text-slate-400 hover:text-white rounded">
                Yopish
              </button>
            </div>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden">
              <iframe src={previewVideo.video_url} className="w-full h-full" allowFullScreen title={previewVideo.title} />
            </div>
          </div>
        </div>
      )}

      {/* Delete Captcha Modal */}
      <CaptchaModal
        isOpen={showVideoCaptcha}
        title="Video darsni o'chirishni tasdiqlash"
        description={`"${deleteTargetVideo?.title}" darsini o'chirish uchun bot tekshiruvini tasdiqlang.`}
        onSuccess={() => {
          setShowVideoCaptcha(false);
          confirmDeleteVideo();
        }}
        onClose={() => {
          setShowVideoCaptcha(false);
          setDeleteTargetVideo(null);
        }}
      />
    </div>
  );
}

function ExamsManager() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);

  // Captcha gate for deleting an exam
  const [deleteTargetExam, setDeleteTargetExam] = useState<Exam | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);

  // New Exam Form
  const [newExam, setNewExam] = useState({
    title: '',
    subject_id: '',
    duration_minutes: '30',
    exam_type: 'milliy_sertifikat' as ExamType,
  });

  // New Question Form
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'a' as 'a' | 'b' | 'c' | 'd',
    explanation: '',
  });

  // Bulk JSON Question Import
  const [jsonText, setJsonText] = useState('');
  const [showJsonModal, setShowJsonModal] = useState(false);

  const load = async () => {
    try {
      const [{ data: exs }, { data: subs }] = await Promise.all([
        supabase.from('exams').select('*').order('created_at', { ascending: false }),
        supabase.from('subjects').select('*').order('sort_order'),
      ]);
      setExams((exs as Exam[]) ?? []);
      setSubjects((subs as Subject[]) ?? []);
      if (!newExam.subject_id && subs && subs.length > 0) {
        setNewExam((p) => ({ ...p, subject_id: subs[0].id }));
      }
    } catch (err) {
      console.warn('Exams load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const loadQuestions = async (examId: string) => {
    setSelectedExamId(examId);
    const { data } = await supabase.from('exam_questions').select('*').eq('exam_id', examId).order('created_at');
    setQuestions((data as ExamQuestion[]) ?? []);
  };

  const createExam = async () => {
    if (!newExam.title.trim() || !newExam.subject_id) {
      alert("Iltimos, imtihon nomi va fanni tanlang.");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.from('exams').insert({
      title: newExam.title.trim(),
      subject_id: newExam.subject_id,
      duration_minutes: parseInt(newExam.duration_minutes) || 30,
      exam_type: newExam.exam_type,
    }).select().maybeSingle();

    setSaving(false);
    if (error) {
      alert("Xato: " + error.message);
      return;
    }
    setNewExam({
      title: '',
      subject_id: subjects[0]?.id || '',
      duration_minutes: '30',
      exam_type: 'milliy_sertifikat',
    });
    await load();
    if (data) {
      setSelectedExamId(data.id);
    }
    alert("Yangi imtihon moduli muvaffaqiyatli yaratildi!");
  };

  const addQuestion = async () => {
    if (!selectedExamId) {
      alert("Avval imtihonni tanlang.");
      return;
    }
    if (!newQuestion.question.trim() || !newQuestion.option_a.trim() || !newQuestion.option_b.trim()) {
      alert("Savol matni va variantlarni to'liq kiriting.");
      return;
    }

    const { error } = await supabase.from('exam_questions').insert({
      exam_id: selectedExamId,
      ...newQuestion,
    });

    if (error) {
      alert("Savol qo'shishda xato: " + error.message);
      return;
    }

    setNewQuestion({
      question: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: 'a',
      explanation: '',
    });
    await loadQuestions(selectedExamId);
    alert("Test savoli qo'shildi!");
  };

  const importJsonQuestions = async () => {
    if (!selectedExamId || !jsonText.trim()) return;
    try {
      const parsed = JSON.parse(jsonText.trim());
      if (!Array.isArray(parsed) || parsed.length === 0) {
        alert("Fayl ichida savollar massivi bo'lishi kerak.");
        return;
      }
      const formatted = parsed.map((p) => ({
        exam_id: selectedExamId,
        question: p.question || p.questionText,
        option_a: p.option_a || p.options?.[0]?.text || '',
        option_b: p.option_b || p.options?.[1]?.text || '',
        option_c: p.option_c || p.options?.[2]?.text || '',
        option_d: p.option_d || p.options?.[3]?.text || '',
        correct_answer: p.correct_answer || p.correct || 'a',
        explanation: p.explanation || null,
      }));

      const { error } = await supabase.from('exam_questions').insert(formatted);
      if (error) {
        alert("Yuklashda xato: " + error.message);
        return;
      }
      setShowJsonModal(false);
      setJsonText('');
      await loadQuestions(selectedExamId);
      alert(`${formatted.length} ta savol yuklandi!`);
    } catch {
      alert("JSON formati noto'g'ri. Iltimos sintaksisni tekshiring.");
    }
  };

  const deleteExamConfirmed = async () => {
    if (!deleteTargetExam) return;
    const { error } = await supabase.from('exams').delete().eq('id', deleteTargetExam.id);
    if (error) {
      alert("O'chirishda xatolik: " + error.message);
    } else {
      if (selectedExamId === deleteTargetExam.id) setSelectedExamId(null);
      await load();
      alert("Imtihon o'chirildi.");
    }
    setDeleteTargetExam(null);
  };

  if (loading) return <div className="text-slate-400">Yuklanmoqda…</div>;

  return (
    <div className="space-y-6">
      {/* Create New Exam */}
      <Section title="Yangi Imtihon Moduli Yaratish (Milliy Sertifikat / DTM / Mavzuiy)" icon={Award}>
        <div className="glass rounded-2xl p-5 border border-slate-800 space-y-3">
          <Input
            placeholder="Imtihon nomi (masalan: Huquqshunoslik Milliy Sertifikati)"
            value={newExam.title}
            onChange={(v) => setNewExam({ ...newExam, title: v })}
          />

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Imtihon turi</label>
              <select
                value={newExam.exam_type}
                onChange={(e) => setNewExam({ ...newExam, exam_type: e.target.value as ExamType })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
              >
                <option value="milliy_sertifikat">Milliy Sertifikat (189 ball)</option>
                <option value="dtm">DTM Testlari</option>
                <option value="mavzuviy">Mavzuiy Test</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Fan</label>
              <select
                value={newExam.subject_id}
                onChange={(e) => setNewExam({ ...newExam, subject_id: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white outline-none focus:border-indigo-500"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Vaqt (daqiqa)</label>
              <Input
                placeholder="Daqiqa"
                value={newExam.duration_minutes}
                onChange={(v) => setNewExam({ ...newExam, duration_minutes: v })}
              />
            </div>
          </div>

          <button
            onClick={createExam}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-white text-xs font-bold inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Imtihonni Saqlash
          </button>
        </div>
      </Section>

      {/* Existing Exams List */}
      <Section title="Mavjud Imtihonlar" icon={ClipboardList}>
        <div className="space-y-2">
          {exams.length === 0 && <p className="text-sm text-slate-400">Hozircha imtihonlar qo'shilmagan.</p>}
          {exams.map((ex) => {
            const isSelected = selectedExamId === ex.id;
            return (
              <div
                key={ex.id}
                className={`p-4 rounded-2xl transition border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isSelected ? 'border-indigo-500 bg-indigo-950/40' : 'glass border-slate-800'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white truncate">{ex.title}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {ex.exam_type}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Davomiyligi: {ex.duration_minutes} daqiqa</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadQuestions(ex.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 hover:bg-indigo-600/50 transition"
                  >
                    Savollarni ko'rish / qo'shish
                  </button>

                  <button
                    onClick={() => {
                      setDeleteTargetExam(ex);
                      setShowCaptcha(true);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                    title="Imtihonni o'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Questions Manager for Selected Exam */}
      {selectedExamId && (
        <Section title="Tanlangan Imtihonga Savollar Qo'shish" icon={Plus}>
          <div className="glass rounded-2xl p-5 border border-indigo-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 uppercase">
                Jami savollar: {questions.length} ta
              </span>
              <button
                onClick={() => setShowJsonModal(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" /> JSON formatda ommaviy yuklash
              </button>
            </div>

            <Input
              placeholder="Savol matni"
              value={newQuestion.question}
              onChange={(v) => setNewQuestion({ ...newQuestion, question: v })}
            />

            <div className="grid sm:grid-cols-2 gap-2.5">
              <Input
                placeholder="A varianti"
                value={newQuestion.option_a}
                onChange={(v) => setNewQuestion({ ...newQuestion, option_a: v })}
              />
              <Input
                placeholder="B varianti"
                value={newQuestion.option_b}
                onChange={(v) => setNewQuestion({ ...newQuestion, option_b: v })}
              />
              <Input
                placeholder="C varianti"
                value={newQuestion.option_c}
                onChange={(v) => setNewQuestion({ ...newQuestion, option_c: v })}
              />
              <Input
                placeholder="D varianti"
                value={newQuestion.option_d}
                onChange={(v) => setNewQuestion({ ...newQuestion, option_d: v })}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-semibold">To'g'ri javob:</span>
              {(['a', 'b', 'c', 'd'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setNewQuestion({ ...newQuestion, correct_answer: k })}
                  className={`w-8 h-8 rounded-xl text-xs font-bold font-mono uppercase transition ${
                    newQuestion.correct_answer === k
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-900 border border-slate-700 text-slate-400'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <Input
              placeholder="Qonuniy izoh yoki tushuntirish (ixtiyoriy)"
              value={newQuestion.explanation}
              onChange={(v) => setNewQuestion({ ...newQuestion, explanation: v })}
            />

            <button
              onClick={addQuestion}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 inline-flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" /> Savolni Qo'shish
            </button>
          </div>
        </Section>
      )}

      {/* JSON Import Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="glass-strong rounded-3xl p-6 max-w-lg w-full border border-indigo-500/30 space-y-4">
            <h3 className="font-bold text-white text-base">Savollarni JSON Formatda Yuklash</h3>
            <p className="text-xs text-slate-300">
              Savollarni quyidagi formatda joylashtiring:
              <br />
              <code className="text-indigo-300 font-mono text-[11px] block mt-1">
                [{'{"question":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_answer":"a"}'}]
              </code>
            </p>
            <textarea
              rows={8}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="JSON kodini bu yerga joylashtiring..."
              className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white"
              >
                Bekor qilish
              </button>
              <button
                onClick={importJsonQuestions}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500"
              >
                Yuklash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Exam Captcha Modal */}
      <CaptchaModal
        isOpen={showCaptcha}
        title="Imtihonni o'chirishni tasdiqlash"
        description={`"${deleteTargetExam?.title}" imtihonini butunlay o'chirish uchun xavfsizlik tekshiruvini bajaring.`}
        onSuccess={() => {
          setShowCaptcha(false);
          deleteExamConfirmed();
        }}
        onClose={() => {
          setShowCaptcha(false);
          setDeleteTargetExam(null);
        }}
      />
    </div>
  );
}

function FilesManager() {
  const { user } = useAuth();
  const [files, setFiles] = useState<TestFile[]>([]);
  const [topics, setTopics] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ topicId: '', title: '' });

  const load = async () => {
    const { data: f } = await supabase.from('test_files').select('*').order('created_at', { ascending: false });
    setFiles((f as TestFile[]) ?? []);
    const { data: t } = await supabase.from('topics').select('id, title').order('title');
    setTopics((t as { id: string; title: string }[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const upload = async (file: File) => {
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) { alert('Fayl 10MB dan kichik bo\'lishi kerak.'); return; }
    const allowed = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) { alert('Faqat PDF, Word yoki matn fayllari ruxsat etiladi.'); return; }
    setUploading(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from('test-files').upload(path, file);
    if (upErr) { alert('Yuklash xatosi: ' + upErr.message); setUploading(false); return; }
    const { error: dbErr } = await supabase.from('test_files').insert({
      topic_id: form.topicId || null,
      title: form.title || file.name,
      file_path: path,
      file_type: ext,
      file_size: file.size,
      uploaded_by: user.id,
    });
    setUploading(false);
    if (dbErr) { alert('Saqlash xatosi: ' + dbErr.message); return; }
    setForm({ topicId: '', title: '' });
    await load();
  };

  const remove = async (f: TestFile) => {
    if (!confirm('Fayl o\'chirilsinmi?')) return;
    await supabase.storage.from('test-files').remove([f.file_path]);
    await supabase.from('test_files').delete().eq('id', f.id);
    await load();
  };

  const getSignedUrl = async (f: TestFile) => {
    const { data, error } = await supabase.storage.from('test-files').createSignedUrl(f.file_path, 3600);
    if (error) { alert('URL olish xatosi: ' + error.message); return; }
    window.open(data.signedUrl, '_blank');
  };

  if (loading) return <div className="text-slate-500">Yuklanmoqda…</div>;

  return (
    <div className="space-y-6">
      <Section title="Test fayli yuklash" icon={Upload}>
        <div className="glass rounded-xl p-4 space-y-3">
          <Input placeholder="Fayl sarlavhasi" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <Select placeholder="Mavzu (ixtiyoriy)" value={form.topicId} onChange={(v) => setForm({ ...form, topicId: v })} options={topics.map((t) => ({ value: t.id, label: t.title }))} />
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:bg-slate-800/40 transition-colors">
            {uploading ? (
              <span className="text-sm text-slate-400">Yuklanmoqda…</span>
            ) : (
              <>
                <Upload className="w-7 h-7 text-slate-500 mb-2" />
                <span className="text-sm text-slate-400">PDF, Word yoki matn faylini tanlang (max 10MB)</span>
              </>
            )}
            <input type="file" accept=".pdf,.doc,.docx,.txt,.rtf" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} disabled={uploading} />
          </label>
        </div>
      </Section>

      <Section title="Yuklang fayllar" icon={FileIcon}>
        <div className="space-y-2">
          {files.length === 0 && <p className="text-sm text-slate-500">Hozircha fayllar yo'q.</p>}
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 p-3 glass rounded-xl">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-800">
                <FileIcon className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate text-slate-100">{f.title}</div>
                <div className="text-xs text-slate-500 truncate">{f.file_type?.toUpperCase()} · {Math.round((f.file_size ?? 0) / 1024)} KB</div>
              </div>
              <button onClick={() => getSignedUrl(f)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/60 text-slate-300 hover:bg-slate-700">Yuklab olish</button>
              <button onClick={() => remove(f)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function BooksManager() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', author: '', description: '', subjectId: '', categoryId: '', isAudio: false });
  const [newCat, setNewCat] = useState('');

  const load = async () => {
    const { data: b } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    setBooks((b as Book[]) ?? []);
    const { data: s } = await supabase.from('subjects').select('*').order('title');
    setSubjects((s as Subject[]) ?? []);
    const { data: c } = await supabase.from('book_categories').select('*').order('name');
    setCategories((c as BookCategory[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addCategory = async () => {
    if (!user || !newCat.trim()) return;
    const { error } = await supabase.from('book_categories').insert({ name: newCat.trim(), created_by: user.id });
    if (error) { alert('Kategoriya qo\'shilmadi: ' + error.message); return; }
    setNewCat('');
    await load();
  };

  const removeCategory = async (id: string) => {
    if (!confirm('Kategoriya o\'chirilsinmi?')) return;
    const { error } = await supabase.from('book_categories').delete().eq('id', id);
    if (error) { alert('Xato: ' + error.message); return; }
    await load();
  };

  const upload = async (file: File) => {
    if (!user) return;
    if (!form.title.trim()) { alert('Iltimos, kitob sarlavhasini kiriting.'); return; }
    setUploading(true);
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from('books').upload(path, file);
    if (upErr) { alert('Yuklash xatosi: ' + upErr.message); setUploading(false); return; }
    const { error: dbErr } = await supabase.from('books').insert({
      title: form.title.trim(),
      author: form.author.trim() || null,
      description: form.description.trim() || null,
      subject_id: form.subjectId || null,
      category_id: form.categoryId || null,
      file_path: path,
      file_type: ext,
      file_size: file.size,
      is_audio: form.isAudio,
      uploaded_by: user.id,
    });
    setUploading(false);
    if (dbErr) { alert('Saqlash xatosi: ' + dbErr.message); return; }
    setForm({ title: '', author: '', description: '', subjectId: '', categoryId: '', isAudio: false });
    await load();
  };

  const uploadAudioBook = async (file: File) => {
    if (!user) return;
    if (file.size > 50 * 1024 * 1024) { alert('Audio fayl 50MB dan kichik bo\'lishi kerak.'); return; }
    const allowed = ['.mp3', '.wav', '.ogg', '.m4a'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) { alert('Faqat MP3, WAV, OGG yoki M4A fayllari ruxsat etiladi.'); return; }
    if (!form.title.trim()) { alert('Iltimos, kitob sarlavhasini kiriting.'); return; }
    setUploading(true);
    const path = `${user.id}/${Date.now()}-audio-${file.name}`;
    const { error: upErr } = await supabase.storage.from('audio-files').upload(path, file);
    if (upErr) { alert('Yuklash xatosi: ' + upErr.message); setUploading(false); return; }
    const { error: dbErr } = await supabase.from('books').insert({
      title: form.title.trim(),
      author: form.author.trim() || null,
      description: form.description.trim() || null,
      subject_id: form.subjectId || null,
      category_id: form.categoryId || null,
      file_path: 'audio',
      audio_path: path,
      file_type: ext,
      file_size: file.size,
      is_audio: true,
      uploaded_by: user.id,
    });
    setUploading(false);
    if (dbErr) { alert('Saqlash xatosi: ' + dbErr.message); return; }
    setForm({ title: '', author: '', description: '', subjectId: '', categoryId: '', isAudio: false });
    await load();
  };

  const remove = async (b: Book) => {
    if (!confirm('Kitob o\'chirilsinmi?')) return;
    const paths = [b.file_path];
    if (b.audio_path) paths.push(b.audio_path);
    const bucket = b.is_audio ? 'audio-files' : 'books';
    if (b.is_audio) {
      await supabase.storage.from('audio-files').remove([b.audio_path!]);
    } else {
      await supabase.storage.from('books').remove([b.file_path]);
    }
    await supabase.from('books').delete().eq('id', b.id);
    await load();
  };

  const getSignedUrl = async (b: Book) => {
    const bucket = b.is_audio ? 'audio-files' : 'books';
    const path = b.is_audio ? b.audio_path! : b.file_path;
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
    if (error) { alert('URL olish xatosi: ' + error.message); return; }
    window.open(data.signedUrl, '_blank');
  };

  if (loading) return <div className="text-slate-500">Yuklanmoqda…</div>;

  return (
    <div className="space-y-6">
      {/* Kitob kategoriyalari */}
      <Section title="Kitob kategoriyalari" icon={FolderPlus}>
        <div className="glass rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 text-sm text-slate-200">
                {c.name}
                <button onClick={() => removeCategory(c.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </span>
            ))}
            {categories.length === 0 && <span className="text-sm text-slate-500">Hozircha kategoriyalar yo'q.</span>}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Yangi kategoriya nomi" value={newCat} onChange={(v) => setNewCat(v)} />
            <button onClick={addCategory} className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2 shrink-0 bg-blue-600 hover:bg-blue-500">
              <Plus className="w-4 h-4" /> Qo'shish
            </button>
          </div>
        </div>
      </Section>

      <Section title="Kitob yuklash" icon={Library}>
        <div className="glass rounded-xl p-4 space-y-3">
          <Input placeholder="Kitob sarlavhasi" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <div className="grid sm:grid-cols-2 gap-2.5">
            <Input placeholder="Muallif (ixtiyoriy)" value={form.author} onChange={(v) => setForm({ ...form, author: v })} />
            <Select placeholder="Fan (ixtiyoriy)" value={form.subjectId} onChange={(v) => setForm({ ...form, subjectId: v })} options={subjects.map((s) => ({ value: s.id, label: s.title }))} />
          </div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            <Select placeholder="Kategoriya (ixtiyoriy)" value={form.categoryId} onChange={(v) => setForm({ ...form, categoryId: v })} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
            <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/60 text-sm text-slate-200">
              <input type="checkbox" checked={form.isAudio} onChange={(e) => setForm({ ...form, isAudio: e.target.checked })} className="w-4 h-4" />
              <Headphones className="w-4 h-4 text-slate-400" /> Audio kitob
            </label>
          </div>
          <TextArea placeholder="Tavsif (ixtiyoriy)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
          {form.isAudio ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:bg-slate-800/40 transition-colors">
              {uploading ? <span className="text-sm text-slate-400">Yuklanmoqda…</span> : (
                <>
                  <Headphones className="w-7 h-7 text-slate-500 mb-2" />
                  <span className="text-sm text-slate-400">MP3, WAV, OGG yoki M4A audio faylini tanlang (max 50MB)</span>
                </>
              )}
              <input type="file" accept=".mp3,.wav,.ogg,.m4a" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAudioBook(e.target.files[0])} disabled={uploading} />
            </label>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:bg-slate-800/40 transition-colors">
              {uploading ? <span className="text-sm text-slate-400">Yuklanmoqda…</span> : (
                <>
                  <Upload className="w-7 h-7 text-slate-500 mb-2" />
                  <span className="text-sm text-slate-400">PDF, EPUB yoki Word faylini tanlang (max 20MB)</span>
                </>
              )}
              <input type="file" accept=".pdf,.epub,.doc,.docx" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} disabled={uploading} />
            </label>
          )}
        </div>
      </Section>

      <Section title="Kitoblar ro'yxati" icon={BookOpen}>
        <div className="space-y-2">
          {books.length === 0 && <p className="text-sm text-slate-500">Hozircha kitoblar yo'q.</p>}
          {books.map((b) => (
            <div key={b.id} className="flex items-center gap-3 p-3 glass rounded-xl">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-800">
                {b.is_audio ? <Headphones className="w-4 h-4 text-slate-400" /> : <BookOpen className="w-4 h-4 text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate text-slate-100">{b.title}</div>
                <div className="text-xs text-slate-500 truncate">
                  {b.author ? b.author + ' · ' : ''}{b.file_type?.toUpperCase()} · {Math.round((b.file_size ?? 0) / 1024)} KB{b.is_audio ? ' · Audio' : ''}
                </div>
              </div>
              <button onClick={() => getSignedUrl(b)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/60 text-slate-300 hover:bg-slate-700">Yuklab olish</button>
              <button onClick={() => remove(b)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function ThemeManager() {
  const { globalTheme, refresh } = useTheme();
  const [form, setForm] = useState<ThemeSettings | null>(globalTheme);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(globalTheme); }, [globalTheme]);

  if (!form) return <div className="text-slate-500">Yuklanmoqda…</div>;

  const save = async () => {
    const { error } = await supabase.from('theme_settings').upsert({
      id: 1,
      site_name: form.site_name,
      primary_color: form.primary_color,
      accent_color: form.accent_color,
      board_bg: form.board_bg,
      board_text: form.board_text,
    });
    if (error) { alert('Xato: ' + error.message); return; }
    await refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const presets = [
    { name: 'Standart', primary_color: '#0f766e', accent_color: '#f59e0b', board_bg: '#1a1a1a', board_text: '#f5f5f5' },
    { name: 'Okean', primary_color: '#0369a1', accent_color: '#0ea5e9', board_bg: '#0c1929', board_text: '#e0f2fe' },
    { name: 'Emerald', primary_color: '#059669', accent_color: '#10b981', board_bg: '#022c22', board_text: '#d1fae5' },
    { name: "To'q sariq", primary_color: '#c2410c', accent_color: '#f97316', board_bg: '#1c1917', board_text: '#fef3c7' },
    { name: 'Bordo', primary_color: '#9f1239', accent_color: '#e11d48', board_bg: '#1a0a10', board_text: '#ffe4e6' },
    { name: 'Tungi binafsha', primary_color: '#6d28d9', accent_color: '#8b5cf6', board_bg: '#0f0a1f', board_text: '#ede9fe' },
  ];

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-1 flex items-center gap-2 text-white"><Palette className="w-4 h-4" /> Saytning global dizayni</h3>
        <p className="text-sm text-slate-400 mb-4">Bu dizayn hamma foydalanuvchilar uchun standart bo'ladi. Har bir foydalanuvchi o'z profilida o'z dizaynini tanlashi mumkin.</p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-1.5 block">Sayt nomi</label>
            <input type="text" value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 focus:border-blue-500 outline-none text-sm text-slate-100" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <ColorField label="Asosiy rang" value={form.primary_color} onChange={(v) => setForm({ ...form, primary_color: v })} />
            <ColorField label="Aksent rang" value={form.accent_color} onChange={(v) => setForm({ ...form, accent_color: v })} />
            <ColorField label="Doska fon rangi" value={form.board_bg} onChange={(v) => setForm({ ...form, board_bg: v })} />
            <ColorField label="Doska matn rangi" value={form.board_text} onChange={(v) => setForm({ ...form, board_text: v })} />
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold mb-4 text-white">Tayyor dizaynlar</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {presets.map((p) => (
            <button key={p.name} onClick={() => setForm({ ...form, ...p })} className="text-left p-3 rounded-xl glass hover:border-slate-600 transition-all">
              <div className="flex gap-1 mb-2 h-8 rounded-lg overflow-hidden">
                <div className="flex-1" style={{ background: p.primary_color }} />
                <div className="flex-1" style={{ background: p.accent_color }} />
                <div className="flex-1" style={{ background: p.board_bg }} />
              </div>
              <div className="text-xs font-medium text-slate-200">{p.name}</div>
            </button>
          ))}
        </div>
      </div>

      <button onClick={save} className="px-6 py-3 rounded-xl text-white font-semibold inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500">
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />} {saved ? 'Saqlandi!' : 'Saqlash'}
      </button>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof BookOpen; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-white">
        <Icon className="w-5 h-5 text-blue-400" /> {title}
      </h2>
      {children}
    </div>
  );
}

function AddForm({ children, onSubmit }: { children: React.ReactNode; onSubmit: () => void }) {
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex flex-wrap items-end gap-2.5">
        {children}
        <button onClick={onSubmit} className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500">
          <Plus className="w-4 h-4" /> Qo'shish
        </button>
      </div>
    </div>
  );
}

function Input({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return <input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 focus:border-blue-500 outline-none text-sm text-slate-100" />;
}

function Select({ placeholder, value, onChange, options }: { placeholder: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 focus:border-blue-500 outline-none text-sm text-slate-100">
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-300 mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 focus:border-blue-500 outline-none text-sm font-mono text-slate-100" />
      </div>
    </div>
  );
}

function TextArea({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return <textarea placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 focus:border-blue-500 outline-none text-sm resize-y text-slate-100" />;
}

// ---------------- CODING & MIND CHALLENGES ADMIN ----------------
function CodingAndMindAdmin() {
  const [subTab, setSubTab] = useState<'coding' | 'mind'>('coding');

  // Coding lessons state
  const [codingLessons, setCodingLessons] = useState<CodingLesson[]>([]);
  const [cLang, setCLang] = useState('python');
  const [cTitle, setCTitle] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cTheory, setCTheory] = useState('');
  const [cCode, setCCode] = useState('');
  const [cExpected, setCExpected] = useState('');

  // Mind challenges state
  const [challenges, setChallenges] = useState<MindChallenge[]>([]);
  const [mCategory, setMCategory] = useState<'mantiq' | 'shaxmat' | 'shashka'>('mantiq');
  const [mTitle, setMTitle] = useState('');
  const [mProblem, setMProblem] = useState('');
  const [mFen, setMFen] = useState('');
  const [mAnswer, setMAnswer] = useState('');
  const [mExplanation, setMExplanation] = useState('');
  const [mTopic, setMTopic] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: cData } = await supabase.from('coding_lessons').select('*').order('created_at', { ascending: false });
      if (cData) setCodingLessons(cData as CodingLesson[]);

      const { data: mData } = await supabase.from('mind_challenges').select('*').order('created_at', { ascending: false });
      if (mData) setChallenges(mData as MindChallenge[]);
    } catch {
      /* ignore */
    }
  };

  const handleAddCodingLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cTitle.trim() || !cTheory.trim()) return;

    setLoading(true);
    const newLesson = {
      language: cLang,
      title: cTitle.trim(),
      description: cDesc.trim() || null,
      theory_content: cTheory.trim(),
      initial_code: cCode || null,
      expected_output: cExpected || null,
      sort_order: codingLessons.length + 1,
    };

    try {
      const { data, error } = await supabase.from('coding_lessons').insert(newLesson).select().single();
      if (!error && data) {
        setCodingLessons([data as CodingLesson, ...codingLessons]);
      } else {
        // Local fallback
        const mock: CodingLesson = {
          id: `cd-${Date.now()}`,
          ...newLesson,
          created_at: new Date().toISOString(),
        };
        setCodingLessons([mock, ...codingLessons]);
      }
      setSuccess("Dasturlash darsi muvaffaqiyatli saqlandi!");
      setCTitle('');
      setCDesc('');
      setCTheory('');
      setCCode('');
      setCExpected('');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCodingLesson = async (id: string) => {
    if (!confirm("Haqiqatan ham bu darsni o'chirmoqchimisiz?")) return;
    try {
      await supabase.from('coding_lessons').delete().eq('id', id);
    } catch {
      /* ignore */
    }
    setCodingLessons(codingLessons.filter((l) => l.id !== id));
  };

  const handleAddChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle.trim() || !mProblem.trim() || !mAnswer.trim()) return;

    setLoading(true);
    const newChal = {
      category: mCategory,
      title: mTitle.trim(),
      problem_text: mProblem.trim(),
      image_url: null,
      fen_state: mFen.trim() || null,
      correct_answer: mAnswer.trim(),
      explanation: mExplanation.trim() || 'Tushuntirish mavjud emas.',
      recommended_topic: mTopic.trim() || null,
    };

    try {
      const { data, error } = await supabase.from('mind_challenges').insert(newChal).select().single();
      if (!error && data) {
        setChallenges([data as MindChallenge, ...challenges]);
      } else {
        const mock: MindChallenge = {
          id: `mc-${Date.now()}`,
          ...newChal,
          created_at: new Date().toISOString(),
        };
        setChallenges([mock, ...challenges]);
      }
      setSuccess("Intellektual masala muvaffaqiyatli qo'shildi!");
      setMTitle('');
      setMProblem('');
      setMFen('');
      setMAnswer('');
      setMExplanation('');
      setMTopic('');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChallenge = async (id: string) => {
    if (!confirm("Haqiqatan ham bu masalani o'chirmoqchimisiz?")) return;
    try {
      await supabase.from('mind_challenges').delete().eq('id', id);
    } catch {
      /* ignore */
    }
    setChallenges(challenges.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Subtab selector */}
      <div className="flex gap-2 p-1 glass rounded-2xl border border-slate-800 w-fit">
        <button
          onClick={() => setSubTab('coding')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
            subTab === 'coding' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code2 className="w-4 h-4" /> Dasturlash Darslari ({codingLessons.length})
        </button>
        <button
          onClick={() => setSubTab('mind')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
            subTab === 'mind' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Brain className="w-4 h-4" /> Mantiq, Shaxmat & Shashka ({challenges.length})
        </button>
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4" /> {success}
        </div>
      )}

      {/* Coding Tab */}
      {subTab === 'coding' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={handleAddCodingLesson} className="glass rounded-3xl p-6 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" /> Yangi Dasturlash Darsi Qo'shish
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Dasturlash Tili</label>
                <select
                  value={cLang}
                  onChange={(e) => setCLang(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-indigo-500"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                  <option value="go">Go</option>
                  <option value="sql">SQL</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Dars Sarlavhasi</label>
                <input
                  type="text"
                  required
                  placeholder="masalan: 4. Sikllar va for operatori"
                  value={cTitle}
                  onChange={(e) => setCTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Qisqacha Tavsif</label>
              <input
                type="text"
                placeholder="masalan: for va while sikllari yordamida massivlarni aylanib chiqish"
                value={cDesc}
                onChange={(e) => setCDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Nazariy Tushuntirish (Theory)</label>
              <textarea
                required
                rows={4}
                placeholder="Nazariya matni..."
                value={cTheory}
                onChange={(e) => setCTheory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-indigo-500 resize-y"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Boshlang'ich Kod (Starter Code)</label>
              <textarea
                rows={3}
                placeholder="# Dars kodi..."
                value={cCode}
                onChange={(e) => setCCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono outline-none focus:border-indigo-500 resize-y"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Kutilayotgan Natija (Expected Output)</label>
              <input
                type="text"
                placeholder="masalan: 10 ta son chop etilishi kerak"
                value={cExpected}
                onChange={(e) => setCExpected(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
            >
              {loading ? "Saqlanmoqda..." : "Darsni Saqlash"}
            </button>
          </form>

          {/* List of lessons */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-base">Bazada Saqlangan Dasturlash Darslari</h3>
            {codingLessons.length === 0 ? (
              <div className="p-6 glass rounded-2xl text-center text-xs text-slate-500">
                Hozircha qo'shimcha darslar kiritilmagan. Standart darslar ishlatilmoqda.
              </div>
            ) : (
              codingLessons.map((l) => (
                <div key={l.id} className="glass rounded-2xl p-4 border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {l.language}
                      </span>
                      <h4 className="font-bold text-sm text-white">{l.title}</h4>
                    </div>
                    {l.description && <p className="text-xs text-slate-400">{l.description}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteCodingLesson(l.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                    title="O'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Mind Challenges Tab */}
      {subTab === 'mind' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <form onSubmit={handleAddChallenge} className="glass rounded-3xl p-6 border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" /> Yangi Intellektual Masala Qo'shish
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Kategoriya</label>
                <select
                  value={mCategory}
                  onChange={(e) => setMCategory(e.target.value as 'mantiq' | 'shaxmat' | 'shashka')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-indigo-500"
                >
                  <option value="mantiq">Mantiq Masalasi</option>
                  <option value="shaxmat">Shaxmat Etyudi</option>
                  <option value="shashka">Shashka Kombinatsiyasi</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Masala Sarlavhasi</label>
                <input
                  type="text"
                  required
                  placeholder="masalan: Oqlarning 3 yurishda moti"
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Masala Matni</label>
              <textarea
                required
                rows={3}
                placeholder="Masalaning to'liq bayoni..."
                value={mProblem}
                onChange={(e) => setMProblem(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-indigo-500 resize-y"
              />
            </div>

            {mCategory === 'shaxmat' && (
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">FEN Holati (Ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="masalan: 6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1"
                  value={mFen}
                  onChange={(e) => setMFen(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">To'g'ri Javob</label>
              <input
                type="text"
                required
                placeholder="masalan: Rd8# yoki Echkini"
                value={mAnswer}
                onChange={(e) => setMAnswer(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Izoh va Isbot (Explanation)</label>
              <textarea
                rows={2}
                placeholder="Nima uchun bu javob to'g'ri ekanligi..."
                value={mExplanation}
                onChange={(e) => setMExplanation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-indigo-500 resize-y"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Tavsiya Etiluvchi Mavzu</label>
              <input
                type="text"
                placeholder="masalan: Mantiqiy Deduksiya / Geometrik Mot"
                value={mTopic}
                onChange={(e) => setMTopic(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
            >
              {loading ? "Saqlanmoqda..." : "Masalani Saqlash"}
            </button>
          </form>

          {/* List of challenges */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-base">Bazada Saqlangan Masalalar</h3>
            {challenges.length === 0 ? (
              <div className="p-6 glass rounded-2xl text-center text-xs text-slate-500">
                Hozircha qo'shimcha masalalar kiritilmagan.
              </div>
            ) : (
              challenges.map((c) => (
                <div key={c.id} className="glass rounded-2xl p-4 border border-slate-800 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {c.category}
                      </span>
                      <h4 className="font-bold text-sm text-white">{c.title}</h4>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{c.problem_text}</p>
                    <div className="text-[11px] text-emerald-400 mt-1">Javob: {c.correct_answer}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteChallenge(c.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                    title="O'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
