import { useEffect, useState } from 'react';
import { Trophy, Calendar, Users, Plus, X, Check } from 'lucide-react';
import { supabase, Tournament, Subject } from '@/lib/supabase';

export default function Tournaments({ canCreate = false }: { canCreate?: boolean }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', subject_id: '', start_date: '', end_date: '', status: 'upcoming' as Tournament['status'] });

  const load = async () => {
    const { data: ts } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
    const { data: subs } = await supabase.from('subjects').select('*').order('sort_order');
    setTournaments((ts as Tournament[]) ?? []);
    setSubjects((subs as Subject[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.title.trim()) return;
    await supabase.from('tournaments').insert({
      title: form.title,
      description: form.description,
      subject_id: form.subject_id || null,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
      status: form.status,
    });
    setForm({ title: '', description: '', subject_id: '', start_date: '', end_date: '', status: 'upcoming' });
    setAdding(false);
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm('Turnir o\'chirilsinmi?')) return;
    await supabase.from('tournaments').delete().eq('id', id);
    await load();
  };

  const setStatus = async (id: string, status: Tournament['status']) => {
    await supabase.from('tournaments').update({ status }).eq('id', id);
    await load();
  };

  const statusBadge = (s: Tournament['status']) => {
    const map = {
      upcoming: { label: "Tez orada", cls: 'bg-blue-100 text-blue-700' },
      active: { label: 'Faol', cls: 'bg-green-100 text-green-700' },
      completed: { label: 'Yakunlangan', cls: 'bg-stone-100 text-stone-500' },
    };
    const m = map[s];
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${m.cls}`}>{m.label}</span>;
  };

  const subjectTitle = (id: string | null) => subjects.find((s) => s.id === id)?.title ?? 'Umumiy';

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-20 text-slate-500">Yuklanmoqda…</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Trophy className="w-6 h-6 text-amber-400" /> Turnirlar va Musobaqalar
          </h1>
          <p className="text-slate-400 text-sm mt-1">O'quvchilar o'rtasidagi bilim bellashuvlari</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setAdding(!adding)}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500"
          >
            {adding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {adding ? 'Bekor qilish' : 'Turnir qo\'shish'}
          </button>
        )}
      </div>

      {adding && (
        <div className="glass rounded-2xl p-5 mb-6 space-y-3">
          <input type="text" placeholder="Turnir nomi" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 focus:border-amber-500 focus:outline-none text-sm text-slate-100" />
          <input type="text" placeholder="Tavsif" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 focus:border-amber-500 focus:outline-none text-sm text-slate-100" />
          <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 focus:border-amber-500 focus:outline-none text-sm text-slate-100">
            <option value="">Fan tanlang (ixtiyoriy)</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Boshlanish</label>
              <input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 focus:border-amber-500 focus:outline-none text-sm text-slate-100" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Tugash</label>
              <input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 focus:border-amber-500 focus:outline-none text-sm text-slate-100" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Holat</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Tournament['status'] })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 focus:border-amber-500 focus:outline-none text-sm text-slate-100">
                <option value="upcoming">Tez orada</option>
                <option value="active">Faol</option>
                <option value="completed">Yakunlangan</option>
              </select>
            </div>
          </div>
          <button onClick={add} className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500">
            <Check className="w-4 h-4" /> Saqlash
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {tournaments.map((t) => (
          <div key={t.id} className="glass rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-500/20 text-amber-400">
                <Trophy className="w-5 h-5" />
              </div>
              {statusBadge(t.status)}
            </div>
            <h3 className="font-bold mb-1 text-white">{t.title}</h3>
            <p className="text-sm text-slate-400 mb-3 line-clamp-2">{t.description ?? ''}</p>
            <div className="space-y-1.5 text-xs text-slate-500">
              <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Fan: {subjectTitle(t.subject_id)}</div>
              {t.start_date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {new Date(t.start_date).toLocaleDateString('uz-UZ')}
                  {t.end_date && ` — ${new Date(t.end_date).toLocaleDateString('uz-UZ')}`}
                </div>
              )}
            </div>
            {canCreate && (
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-700/50">
                <button onClick={() => setStatus(t.id, 'active')} className="px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 text-xs font-medium hover:bg-green-500/20">Faol</button>
                <button onClick={() => setStatus(t.id, 'completed')} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-medium hover:bg-slate-700">Yakunlash</button>
                <button onClick={() => remove(t.id)} className="ml-auto p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
        {tournaments.length === 0 && !adding && (
          <div className="sm:col-span-2 text-center py-12 text-slate-500">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Hozircha turnirlar yo'q.{canCreate ? ' "Turnir qo\'shish" tugmasini bosing.' : ''}</p>
          </div>
        )}
      </div>
    </div>
  );
}
