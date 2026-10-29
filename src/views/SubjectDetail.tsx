import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, FileText, ClipboardCheck, ChevronRight } from 'lucide-react';
import { supabase, Subject, Topic, Lesson, Exam } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';

export default function SubjectDetail({
  subjectId,
  onOpenClassroom,
  onBack,
  onOpenExam,
}: {
  subjectId: string;
  onOpenClassroom: (topicId: string) => void;
  onBack: () => void;
  onOpenExam: (examId: string) => void;
}) {
  const { globalTheme } = useTheme();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: sub } = await supabase.from('subjects').select('*').eq('id', subjectId).maybeSingle();
      const subObj = sub as Subject | null;
      setSubject(subObj);

      const { data: tops } = await supabase.from('topics').select('*').eq('subject_id', subjectId).order('sort_order');
      const topsArr = (tops as Topic[]) ?? [];
      setTopics(topsArr);

      const lessonsMap: Record<string, Lesson[]> = {};
      await Promise.all(topsArr.map(async (t) => {
        const { data: les } = await supabase.from('lessons').select('*').eq('topic_id', t.id).order('created_at');
        lessonsMap[t.id] = (les as Lesson[]) ?? [];
      }));
      setLessons(lessonsMap);

      const { data: exs } = await supabase.from('exams').select('*').eq('subject_id', subjectId).order('created_at', { ascending: false });
      setExams((exs as Exam[]) ?? []);

      setLoading(false);
    })();
  }, [subjectId]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-20 text-slate-500">Yuklanmoqda…</div>;
  if (!subject) return <div className="max-w-4xl mx-auto px-4 py-20 text-slate-300">Fan topilmadi.</div>;

  const primary = 'var(--theme-primary, #0f766e)';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Bosh sahifaga
      </button>

      <div className="mb-10">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${subject.color}22`, color: subject.color }}>
          <BookOpen className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-white">{subject.title}</h1>
        <p className="text-slate-400">{subject.description}</p>
      </div>

      {/* Topics */}
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
        <FileText className="w-5 h-5 text-blue-400" /> Mavzular
      </h2>
      <div className="space-y-3 mb-10">
        {topics.length === 0 && <p className="text-slate-500 text-sm">Hozircha mavzular yo'q.</p>}
        {topics.map((t, i) => {
          const tLessons = lessons[t.id] ?? [];
          return (
            <div key={t.id} className="glass rounded-2xl overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: `${subject.color}22`, color: subject.color }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-100">{t.title}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{t.description}</p>
                  </div>
                </div>
              </div>
              {tLessons.length > 0 && (
                <div className="border-t border-slate-700/50 divide-y divide-slate-800">
                  {tLessons.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => onOpenClassroom(t.id)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-800/40 transition-colors group"
                    >
                      <BookOpen className="w-4 h-4 text-slate-500" />
                      <span className="flex-1 text-sm font-medium text-slate-200">{l.title}</span>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Exams */}
      {exams.length > 0 && (
        <>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <ClipboardCheck className="w-5 h-5 text-blue-400" /> Imtihonlar
          </h2>
          <div className="space-y-3">
            {exams.map((e) => (
              <button
                key={e.id}
                onClick={() => onOpenExam(e.id)}
                className="w-full flex items-center gap-3 p-5 glass rounded-2xl hover:border-slate-600 transition-colors text-left group"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/20 text-blue-400">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-100">{e.title}</h3>
                  <p className="text-sm text-slate-400">{e.duration_minutes} daqiqa</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>
        </>
      )}

      {globalTheme === null && null}
    </div>
  );
}
