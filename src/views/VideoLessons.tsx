import { useState, useEffect } from 'react';
import { X, PlayCircle, Filter, Video, Clock, CheckCircle2, ArrowLeft, Search } from 'lucide-react';
import { supabase, VideoLesson, VideoProgress } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export default function VideoLessons({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [progress, setProgress] = useState<Record<string, VideoProgress>>({});
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Barchasi');
  const [search, setSearch] = useState('');
  const [activeVideo, setActiveVideo] = useState<VideoLesson | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const load = async () => {
    const { data: vids } = await supabase.from('video_lessons').select('*').order('sort_order').order('created_at');
    const vidArr = (vids as VideoLesson[]) ?? [];
    setVideos(vidArr);
    if (user) {
      const { data: pg } = await supabase.from('video_progress').select('*').eq('user_id', user.id);
      const pMap: Record<string, VideoProgress> = {};
      (pg as VideoProgress[])?.forEach((p) => { pMap[p.video_id] = p; });
      setProgress(pMap);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-20 text-slate-500">Yuklanmoqda...</div>;

  const categories = ['Barchasi', ...Array.from(new Set(videos.map((v) => v.category)))];
  const playlists = Array.from(new Set(videos.map((v) => v.playlist).filter(Boolean) as string[]));

  const filtered = videos.filter((v) => {
    const matchCat = category === 'Barchasi' || v.category === category;
    const q = search.toLowerCase().trim();
    const matchSearch = !q || v.title.toLowerCase().includes(q) || (v.description ?? '').toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const markComplete = async (v: VideoLesson) => {
    if (!user) return;
    await supabase.from('video_progress').upsert({
      user_id: user.id, video_id: v.id, watched_seconds: v.duration_seconds, completed: true, updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,video_id' });
    await load();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Bosh sahifaga
      </button>

      <div className="rounded-2xl p-7 mb-8 text-white bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-slate-700/60 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium mb-4">
          <Video className="w-4 h-4" /> Video Darslar
        </div>
        <h1 className="text-3xl font-bold mb-2">Video Darslar Moduli</h1>
        <p className="opacity-90 max-w-2xl">Kategoriya va pleylistlar bo'yicha video darslarni tomosha qiling. Progressingiz avtomatik saqlanadi.</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Video qidirish..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm glass text-slate-100 border border-slate-700 focus:outline-none focus:border-blue-500" />
        </div>
        <button onClick={() => setFilterOpen(!filterOpen)} className="px-4 py-2.5 rounded-xl glass text-slate-200 text-sm font-medium inline-flex items-center gap-2 border border-slate-700">
          <Filter className="w-4 h-4" /> {category}
        </button>
      </div>

      {filterOpen && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((c) => (
            <button key={c} onClick={() => { setCategory(c); setFilterOpen(false); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${category === c ? 'bg-blue-600 text-white' : 'glass text-slate-300 hover:border-slate-600'}`}>
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Playlists */}
      {playlists.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3 text-white">Pleylistlar</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {playlists.map((pl) => {
              const count = videos.filter((v) => v.playlist === pl).length;
              return (
                <button key={pl} onClick={() => setCategory(videos.find((v) => v.playlist === pl)?.category ?? 'Barchasi')}
                  className="glass rounded-xl p-4 text-left hover:border-blue-500/40 transition-all">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2 bg-blue-500/20 text-blue-400">
                    <PlayCircle className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-sm text-white">{pl}</h3>
                  <p className="text-xs text-slate-400">{count} ta video</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Video grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Video className="w-14 h-14 mx-auto mb-3 opacity-30" />
          <p>{search || category !== 'Barchasi' ? 'Qidiruv bo\'yicha video topilmadi.' : 'Hozircha videolar yo\'q.'}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((v) => {
            const pg = progress[v.id];
            return (
              <button key={v.id} onClick={() => setActiveVideo(v)} className="group glass rounded-2xl overflow-hidden text-left hover:border-blue-500/40 transition-all">
                <div className="relative aspect-video bg-slate-800 flex items-center justify-center">
                  <PlayCircle className="w-12 h-12 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-xs text-white">{fmtDur(v.duration_seconds)}</span>
                  {pg?.completed && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 text-xs font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Tomosh qilingan
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">{v.category}</span>
                  <h3 className="font-semibold text-sm mt-1 text-white line-clamp-2">{v.title}</h3>
                  {v.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{v.description}</p>}
                  {pg && !pg.completed && (
                    <div className="mt-2">
                      <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (pg.watched_seconds / v.duration_seconds) * 100)}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Video player modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={() => setActiveVideo(null)}>
          <div className="glass-strong rounded-2xl max-w-3xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <h3 className="font-bold text-white">{activeVideo.title}</h3>
              <button onClick={() => setActiveVideo(null)} className="text-slate-400 hover:text-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="aspect-video bg-black">
              <iframe src={activeVideo.video_url} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-300 mb-3">{activeVideo.description}</p>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {fmtDur(activeVideo.duration_seconds)}</span>
                <span>{activeVideo.category}</span>
              </div>
              {user && (
                <button onClick={() => markComplete(activeVideo)} className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white inline-flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Darsni yakunlashim
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
