import { useEffect, useRef, useState } from 'react';
import { Music, X, Play, Pause, Upload, Trash2, Volume2, Headphones, Repeat, Repeat1, SkipForward, Shuffle } from 'lucide-react';
import { supabase, AudioFile } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

type Track = { title: string; category: string; url: string };

const FOCUS_TRACKS: Track[] = [
  { title: 'Chuqur fokus', category: 'Focus', url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3' },
  { title: 'Tabiat ovozleri', category: 'Ambient', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_8e6a30f0fa.mp3' },
  { title: 'Yomg\'ir tovushi', category: 'Ambient', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_2c2c7d0e14.mp3' },
  { title: 'Lo-Fi tinglov', category: 'Lo-Fi', url: 'https://cdn.pixabay.com/audio/2024/02/05/audio_22e3e0d7c8.mp3' },
  { title: 'Study Beats', category: 'Study', url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_4c2c7d0e14.mp3' },
  { title: 'Deep Focus', category: 'Focus', url: 'https://cdn.pixabay.com/audio/2023/05/15/audio_9f3a1b2c4d.mp3' },
  { title: 'Relax Piano', category: 'Study', url: 'https://cdn.pixabay.com/audio/2022/11/30/audio_8e6a30f0fa.mp3' },
  { title: 'Ocean Waves', category: 'Ambient', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_5d5a1b2c3e.mp3' },
];

type PlayMode = 'none' | 'loop' | 'next';

export default function MusicPlayer({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState<string>('');
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [loop, setLoop] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode>('none');
  const [activeCategory, setActiveCategory] = useState('Barchasi');
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) { setLoadingFiles(false); return; }
      const { data } = await supabase.from('audio_files').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setFiles((data as AudioFile[]) ?? []);
      setLoadingFiles(false);
    })();
  }, [user]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const categories = ['Barchasi', ...Array.from(new Set(FOCUS_TRACKS.map((t) => t.category)))];
  const filteredTracks = activeCategory === 'Barchasi' ? FOCUS_TRACKS : FOCUS_TRACKS.filter((t) => t.category === activeCategory);

  const playTrack = (url: string, title: string) => {
    if (currentUrl === url && playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    setCurrentUrl(url);
    setCurrentTitle(title);
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.loop = loop;
      audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentUrl) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().then(() => setPlaying(true)).catch(() => {}); }
  };

  const onEnded = () => {
    setPlaying(false);
    if (playMode === 'next') {
      const idx = filteredTracks.findIndex((t) => t.url === currentUrl);
      const next = filteredTracks[(idx + 1) % filteredTracks.length];
      if (next) playTrack(next.url, next.title);
    }
  };

  const toggleLoop = () => {
    const newVal = !loop;
    setLoop(newVal);
    if (audioRef.current) audioRef.current.loop = newVal;
  };

  const cyclePlayMode = () => {
    setPlayMode((m) => (m === 'none' ? 'next' : m === 'next' ? 'loop' : 'none'));
  };

  const nextTrack = () => {
    if (!currentUrl) return;
    const idx = filteredTracks.findIndex((t) => t.url === currentUrl);
    const next = filteredTracks[(idx + 1) % filteredTracks.length];
    if (next) playTrack(next.url, next.title);
  };

  const upload = async (file: File) => {
    if (!user) return;
    if (file.size > 20 * 1024 * 1024) { alert('MP3 fayl 20MB dan kichik bo\'lishi kerak.'); return; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['mp3', 'wav', 'ogg', 'm4a'].includes(ext ?? '')) { alert('Faqat MP3, WAV, OGG yoki M4A ruxsat etiladi.'); return; }
    setUploading(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from('audio-files').upload(path, file);
    if (upErr) { alert('Yuklash xatosi: ' + upErr.message); setUploading(false); return; }
    const { error: dbErr } = await supabase.from('audio_files').insert({
      user_id: user.id, title: file.name.replace(/\.[^/.]+$/, ''), file_path: path, file_type: `audio/${ext}`, file_size: file.size,
    });
    setUploading(false);
    if (dbErr) { alert('Saqlash xatosi: ' + dbErr.message); return; }
    const { data } = await supabase.from('audio_files').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setFiles((data as AudioFile[]) ?? []);
  };

  const removeFile = async (f: AudioFile) => {
    if (!confirm('Audio fayl o\'chirilsinmi?')) return;
    await supabase.storage.from('audio-files').remove([f.file_path]);
    await supabase.from('audio_files').delete().eq('id', f.id);
    if (currentUrl === f.file_path) { audioRef.current?.pause(); setCurrentUrl(null); setPlaying(false); }
    const { data } = await supabase.from('audio_files').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
    setFiles((data as AudioFile[]) ?? []);
  };

  const playUserFile = async (f: AudioFile) => {
    const { data } = await supabase.storage.from('audio-files').createSignedUrl(f.file_path, 3600);
    if (!data) { alert('Audio faylni ochib bo\'lmadi.'); return; }
    playTrack(data.signedUrl, f.title);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-strong rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-slate-200">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-tr from-blue-600 to-indigo-500">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Musiqa Pleyeri</h2>
            <p className="text-xs text-slate-400">Diqqatni jamlovchi musiqa va shaxsiy audio</p>
          </div>
        </div>

        <audio ref={audioRef} onEnded={onEnded} />

        {/* Now playing bar */}
        {currentUrl && (
          <div className="glass rounded-xl p-3 mb-5 flex items-center gap-3">
            <button onClick={togglePlay} className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 bg-blue-600 hover:bg-blue-500">
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{currentTitle}</div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                {playing ? (
                  <span className="flex items-end gap-0.5 h-3">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className="w-0.5 bg-blue-400 rounded-full" style={{ animation: `eqbar 0.6s ${i * 0.15}s ease-in-out infinite alternate`, height: '100%' }} />
                    ))}
                  </span>
                ) : null}
                {playing ? 'Ijro etilmoqda...' : 'Pauza'}
              </div>
            </div>
            <button onClick={nextTrack} className="p-2 text-slate-400 hover:text-slate-100" title="Keyingi trek">
              <SkipForward className="w-4 h-4" />
            </button>
            <button onClick={toggleLoop} className={`p-2 transition ${loop ? 'text-blue-400' : 'text-slate-400 hover:text-slate-100'}`} title="Takrorlash (loop)">
              {loop ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {categories.map((c) => (
            <button key={c} onClick={() => setActiveCategory(c)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${activeCategory === c ? 'bg-blue-600 text-white' : 'glass text-slate-400 hover:border-slate-600'}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Built-in focus tracks */}
        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-slate-200">
            <Music className="w-4 h-4 text-blue-400" /> Tayyor soundtracklar
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {filteredTracks.map((t) => (
              <button key={t.url} onClick={() => playTrack(t.url, t.title)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${currentUrl === t.url ? 'text-white border-transparent bg-blue-600' : 'glass text-slate-200 hover:border-slate-600'}`}>
                {currentUrl === t.url && playing ? <Pause className="w-4 h-4 shrink-0" /> : <Play className="w-4 h-4 shrink-0" />}
                <span className="truncate">{t.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User uploads */}
        {user && (
          <div>
            <h3 className="font-semibold text-sm mb-3 text-slate-200">Shaxsiy audio fayllar</h3>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:bg-slate-800/40 transition-colors mb-3">
              {uploading ? (
                <span className="text-sm text-slate-400">Yuklanmoqda...</span>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-slate-500 mb-1" />
                  <span className="text-xs text-slate-400">MP3, WAV, OGG yoki M4A (max 20MB)</span>
                </>
              )}
              <input type="file" accept=".mp3,.wav,.ogg,.m4a" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} disabled={uploading} />
            </label>

            {loadingFiles ? (
              <p className="text-xs text-slate-500">Yuklanmoqda...</p>
            ) : files.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-3">Hozircha shaxsiy audio yo'q.</p>
            ) : (
              <div className="space-y-2">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-2.5 p-2.5 bg-slate-800/40 rounded-xl">
                    <button onClick={() => playUserFile(f)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 bg-blue-600 hover:bg-blue-500">
                      {currentUrl === f.file_path && playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <span className="flex-1 text-sm truncate text-slate-200">{f.title}</span>
                    <button onClick={() => removeFile(f)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Volume + play mode */}
        <div className="mt-5 flex items-center gap-3">
          <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
          <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="flex-1 accent-blue-500" />
          <button onClick={cyclePlayMode} className={`p-1.5 rounded-lg transition ${playMode !== 'none' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-200'}`} title={playMode === 'none' ? 'Avto-keyingi off' : playMode === 'next' ? 'Avto-keyingi' : 'Loop'}>
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
