import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  Headphones,
  Maximize2,
  Minimize2,
  X,
  Music,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Check,
  Timer,
  CloudRain,
  Wind,
  Flame,
  Coffee,
  Sliders,
  BellRing,
} from 'lucide-react';
import { useAudio, SoundtrackTrack, SoundtrackCategory } from '@/lib/audio';

// --- Ambient Sound Synthesis Helpers (Web Audio API) ---
class AmbientSoundManager {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private rainNode: AudioNode | null = null;
  private windNode: AudioNode | null = null;
  private flameNode: AudioNode | null = null;

  private rainGain: GainNode | null = null;
  private windGain: GainNode | null = null;
  private flameGain: GainNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Precomputed pink noise buffer (cached so we don't recalculate 100k samples repeatedly)
  private getNoiseBuffer(): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    this.initCtx();
    const sampleRate = Math.min(this.ctx!.sampleRate, 44100);
    const bufferSize = sampleRate * 1; // 1 second loop is plenty and lightweight
    const buffer = this.ctx!.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    this.noiseBuffer = buffer;
    return buffer;
  }

  private checkIdle() {
    const rainZero = !this.rainGain || this.rainGain.gain.value <= 0.01;
    const windZero = !this.windGain || this.windGain.gain.value <= 0.01;
    const flameZero = !this.flameGain || this.flameGain.gain.value <= 0.01;
    if (rainZero && windZero && flameZero && this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  public setRain(volume: number) {
    if (volume <= 0) {
      if (this.rainGain && this.ctx) {
        this.rainGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      }
      this.checkIdle();
      return;
    }
    this.initCtx();
    if (!this.rainNode) {
      const noise = this.ctx!.createBufferSource();
      noise.buffer = this.getNoiseBuffer();
      noise.loop = true;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 850;

      this.rainGain = this.ctx!.createGain();
      noise.connect(filter);
      filter.connect(this.rainGain);
      this.rainGain.connect(this.ctx!.destination);
      noise.start();
      this.rainNode = noise;
    }
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.setTargetAtTime(volume * 0.45, this.ctx.currentTime, 0.1);
    }
  }

  public setWind(volume: number) {
    if (volume <= 0) {
      if (this.windGain && this.ctx) {
        this.windGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      }
      this.checkIdle();
      return;
    }
    this.initCtx();
    if (!this.windNode) {
      const noise = this.ctx!.createBufferSource();
      noise.buffer = this.getNoiseBuffer();
      noise.loop = true;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 420;
      filter.Q.value = 1.8;

      this.windGain = this.ctx!.createGain();
      noise.connect(filter);
      filter.connect(this.windGain);
      this.windGain.connect(this.ctx!.destination);
      noise.start();
      this.windNode = noise;
    }
    if (this.windGain && this.ctx) {
      this.windGain.gain.setTargetAtTime(volume * 0.4, this.ctx.currentTime, 0.1);
    }
  }

  public setFlame(volume: number) {
    if (volume <= 0) {
      if (this.flameGain && this.ctx) {
        this.flameGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      }
      this.checkIdle();
      return;
    }
    this.initCtx();
    if (!this.flameNode) {
      const noise = this.ctx!.createBufferSource();
      noise.buffer = this.getNoiseBuffer();
      noise.loop = true;

      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;

      this.flameGain = this.ctx!.createGain();
      noise.connect(filter);
      filter.connect(this.flameGain);
      this.flameGain.connect(this.ctx!.destination);
      noise.start();
      this.flameNode = noise;
    }
    if (this.flameGain && this.ctx) {
      this.flameGain.gain.setTargetAtTime(volume * 0.35, this.ctx.currentTime, 0.1);
    }
  }

  public playChime() {
    this.initCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.3); // A5

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);
  }
}

const ambientManager = new AmbientSoundManager();

// ---------------- MINI PLAYER BAR ----------------
export function SoundtrackMiniBar() {
  const {
    currentTrack,
    isPlaying,
    volume,
    isLoop,
    togglePlay,
    setVolume,
    toggleLoop,
    nextTrack,
    prevTrack,
    showFullPlayer,
    setShowFullPlayer,
    showMiniBar,
    setShowMiniBar,
  } = useAudio();

  const [prevVol, setPrevVol] = useState(volume || 0.6);

  if (!showMiniBar) {
    return (
      <button
        onClick={() => setShowMiniBar(true)}
        className="fixed bottom-5 right-5 z-40 p-3 rounded-2xl bg-indigo-600/90 text-white shadow-xl shadow-indigo-950/60 hover:bg-indigo-500 hover:scale-105 transition-all flex items-center gap-2 border border-indigo-400/30 backdrop-blur-md"
        title="Soundtrack pleerini ochish"
      >
        <Headphones className="w-5 h-5" />
        <span className="text-xs font-semibold hidden sm:inline">Fokus Musiqa</span>
        {isPlaying && (
          <span className="flex items-end gap-0.5 h-3">
            <span className="w-1 bg-white rounded-full eq-bar-1"></span>
            <span className="w-1 bg-white rounded-full eq-bar-2"></span>
            <span className="w-1 bg-white rounded-full eq-bar-3"></span>
          </span>
        )}
      </button>
    );
  }

  const toggleMute = () => {
    if (volume > 0) {
      setPrevVol(volume);
      setVolume(0);
    } else {
      setVolume(prevVol || 0.6);
    }
  };

  return (
    <>
      <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-5 z-40 sm:max-w-md w-auto">
        <div className="glass-strong rounded-2xl px-4 py-3 shadow-2xl border border-indigo-500/30 flex items-center gap-3 backdrop-blur-xl">
          {/* Animated visualizer / Vinyl cover */}
          <button
            onClick={() => setShowFullPlayer(true)}
            className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-700 to-purple-600 flex items-center justify-center shrink-0 shadow-md group overflow-hidden border border-indigo-400/30"
          >
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-5">
                <span className="w-1 bg-white rounded-full eq-bar-1"></span>
                <span className="w-1 bg-white rounded-full eq-bar-2"></span>
                <span className="w-1 bg-white rounded-full eq-bar-3"></span>
                <span className="w-1 bg-white rounded-full eq-bar-4"></span>
              </div>
            ) : (
              <Music className="w-5 h-5 text-indigo-100 group-hover:scale-110 transition-transform" />
            )}
          </button>

          {/* Track Info */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowFullPlayer(true)}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate block">
                {currentTrack?.title || 'Fokus Trek'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30 shrink-0">
                {currentTrack?.category || 'Focus'}
              </span>
            </div>
            <p className="text-xs text-slate-300 truncate">
              {currentTrack?.artist || 'Smart Academy Soundtrack'}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              onClick={prevTrack}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/60 transition"
              title="Oldingi"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-md transition-transform active:scale-95"
              title={isPlaying ? "To'xtatish" : 'Ijro etish'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={nextTrack}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/60 transition"
              title="Keyingi"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Loop button */}
            <button
              onClick={toggleLoop}
              className={`p-1.5 rounded-lg transition ${
                isLoop ? 'text-indigo-400 bg-indigo-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
              title={isLoop ? "Takrorlash: Yoqilgan" : "Takrorlash: O'chirilgan"}
            >
              <Repeat className="w-4 h-4" />
            </button>

            {/* Volume slider (desktop) */}
            <div className="hidden md:flex items-center gap-1.5 pl-1">
              <button
                onClick={toggleMute}
                className="text-slate-300 hover:text-white p-1 transition"
                title="Ovoz"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 h-1.5 accent-indigo-500 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Expand / Minimize */}
            <button
              onClick={() => setShowFullPlayer(true)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition ml-0.5"
              title="Kattalashtirish"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowMiniBar(false)}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/60 transition"
              title="Kichraytirish"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showFullPlayer && <SoundtrackFullModal onClose={() => setShowFullPlayer(false)} />}
    </>
  );
}

// ---------------- FULL MODAL PLAYER ----------------
export function SoundtrackFullModal({ onClose }: { onClose: () => void }) {
  const {
    currentTrack,
    isPlaying,
    volume,
    isLoop,
    playTrack,
    togglePlay,
    setVolume,
    toggleLoop,
    nextTrack,
    prevTrack,
    library,
    addTrack,
    updateTrack,
    deleteTrack,
    resetLibrary,
  } = useAudio();

  const [activeTab, setActiveTab] = useState<'tracks' | 'pomodoro' | 'ambient'>('tracks');
  const [categoryFilter, setCategoryFilter] = useState<string>('Barchasi');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTrack, setEditingTrack] = useState<SoundtrackTrack | null>(null);

  // New track form
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newCategory, setNewCategory] = useState<SoundtrackCategory>('Lo-Fi');
  const [newUrl, setNewUrl] = useState('');
  const [newDuration, setNewDuration] = useState('3:00');

  // Pomodoro state
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'break'>('focus');
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);

  // Ambient sound state (0 to 1)
  const [rainVol, setRainVol] = useState(0);
  const [windVol, setWindVol] = useState(0);
  const [flameVol, setFlameVol] = useState(0);

  const [pomodoroToast, setPomodoroToast] = useState<string | null>(null);

  // Pomodoro timer effect (runs smoothly without rebuilding interval every second)
  useEffect(() => {
    if (!pomodoroRunning) return;
    const timer = setInterval(() => {
      setPomodoroSeconds((sec) => {
        if (sec <= 1) {
          ambientManager.playChime();
          setPomodoroRunning(false);
          setPomodoroMode((prevMode) => {
            if (prevMode === 'focus') {
              setPomodoroToast("🎉 25 daqiqalik fokus yakunlandi! 5 daqiqa dam oling.");
              setPomodoroSeconds(5 * 60);
              return 'break';
            } else {
              setPomodoroToast("✨ Tanaffus tugadi! Yangi o'rganish sessiyasiga tayyormisiz?");
              setPomodoroSeconds(25 * 60);
              return 'focus';
            }
          });
          return 0;
        }
        return sec - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pomodoroRunning]);

  // Ambient changes
  const handleRainChange = (val: number) => {
    setRainVol(val);
    ambientManager.setRain(val);
  };
  const handleWindChange = (val: number) => {
    setWindVol(val);
    ambientManager.setWind(val);
  };
  const handleFlameChange = (val: number) => {
    setFlameVol(val);
    ambientManager.setFlame(val);
  };

  const categories: Array<'Barchasi' | SoundtrackCategory> = [
    'Barchasi',
    'Lo-Fi',
    'Focus',
    'Classical',
    'Ambient',
    'Nature',
    'Synthwave',
  ];

  const filteredTracks =
    categoryFilter === 'Barchasi' ? library : library.filter((t) => t.category === categoryFilter);

  const handleCreateTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) {
      alert("Iltimos sarlavha va audio URL manzilini kiriting.");
      return;
    }
    addTrack({
      title: newTitle.trim(),
      artist: newArtist.trim() || 'Smart Academy Musician',
      category: newCategory,
      url: newUrl.trim(),
      duration: newDuration.trim() || '3:00',
    });
    setNewTitle('');
    setNewArtist('');
    setNewUrl('');
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack) return;
    updateTrack(editingTrack.id, {
      title: editingTrack.title,
      artist: editingTrack.artist,
      category: editingTrack.category,
      url: editingTrack.url,
      duration: editingTrack.duration,
    });
    setEditingTrack(null);
  };

  const formatPomoTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="glass-strong rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-indigo-500/30 relative max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Fokus Soundtrack & Pomodoro</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {library.length} ta trek
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Lo-Fi, Pomodoro taymer va tabiat ovozlari bilan diqqatni jamlang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetLibrary}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition"
              title="Standart kutubxonaga qaytarish"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 glass rounded-2xl border border-slate-800 mb-4">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'tracks' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Music className="w-4 h-4" /> Soundtracklar
          </button>
          <button
            onClick={() => setActiveTab('pomodoro')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'pomodoro' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Timer className="w-4 h-4" /> Pomodoro Taymer
          </button>
          <button
            onClick={() => setActiveTab('ambient')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'ambient' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" /> Atmosfera Ovozlar
          </button>
        </div>

        {/* Tab 1: Tracks List */}
        {activeTab === 'tracks' && (
          <>
            {/* Currently playing hero box */}
            <div className="rounded-2xl p-4 mb-4 bg-gradient-to-r from-indigo-950/90 via-purple-950/70 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-xl shrink-0 relative overflow-hidden">
                {isPlaying ? (
                  <div className="flex items-end gap-1 h-8">
                    <span className="w-1.5 bg-white rounded-full eq-bar-1"></span>
                    <span className="w-1.5 bg-white rounded-full eq-bar-2"></span>
                    <span className="w-1.5 bg-white rounded-full eq-bar-3"></span>
                    <span className="w-1.5 bg-white rounded-full eq-bar-4"></span>
                  </div>
                ) : (
                  <Music className="w-8 h-8" />
                )}
              </div>

              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="font-bold text-white text-base truncate">
                    {currentTrack?.title || 'Fokus Trek'}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-medium">
                    {currentTrack?.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {currentTrack?.artist} {currentTrack?.duration ? `• ${currentTrack.duration}` : ''}
                </p>
              </div>

              {/* Quick controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prevTrack}
                  className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800/80 transition"
                  title="Oldingi trek"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                </button>
                <button
                  onClick={nextTrack}
                  className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800/80 transition"
                  title="Keyingi trek"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleLoop}
                  className={`p-2 rounded-xl transition ${
                    isLoop ? 'text-indigo-400 bg-indigo-500/20' : 'text-slate-400 hover:text-white'
                  }`}
                  title={isLoop ? "Avto-takrorlash: Faol" : "Avto-takrorlash: O'chirilgan"}
                >
                  <Repeat className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Volume controls */}
            <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800 mb-3">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-2 accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-300 w-9 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-[80%]">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      categoryFilter === cat
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-2.5 py-1 rounded-xl bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 hover:text-white text-xs font-bold flex items-center gap-1 border border-indigo-500/30 transition shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Trek
              </button>
            </div>

            {/* Track List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {filteredTracks.map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                const isCurrentPlaying = isCurrent && isPlaying;
                return (
                  <div
                    key={track.id}
                    className={`p-3 rounded-2xl flex items-center justify-between gap-3 transition border ${
                      isCurrent
                        ? 'bg-indigo-950/70 border-indigo-500/60 shadow-md'
                        : 'glass hover:border-slate-600/70'
                    }`}
                  >
                    <div
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      onClick={() => playTrack(track)}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {isCurrentPlaying ? (
                          <div className="flex items-end gap-0.5 h-4">
                            <span className="w-1 bg-white rounded-full eq-bar-1"></span>
                            <span className="w-1 bg-white rounded-full eq-bar-2"></span>
                            <span className="w-1 bg-white rounded-full eq-bar-3"></span>
                          </div>
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4
                          className={`text-sm font-semibold truncate ${
                            isCurrent ? 'text-indigo-200' : 'text-white'
                          }`}
                        >
                          {track.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="truncate">{track.artist}</span>
                          <span>•</span>
                          <span className="text-indigo-300/80">{track.category}</span>
                          {track.duration && (
                            <>
                              <span>•</span>
                              <span>{track.duration}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingTrack(track)}
                        className="p-1.5 text-slate-500 hover:text-indigo-300 rounded-lg transition"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTrack(track.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Tab 2: Pomodoro Timer */}
        {activeTab === 'pomodoro' && (
          <div className="flex-1 flex flex-col items-center justify-center py-6 space-y-6 text-center animate-in fade-in duration-200">
            <div className="flex gap-2 p-1.5 glass rounded-2xl border border-slate-800">
              <button
                onClick={() => {
                  setPomodoroMode('focus');
                  setPomodoroSeconds(25 * 60);
                  setPomodoroRunning(false);
                }}
                className={`py-1.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  pomodoroMode === 'focus'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> 25 Daqiqa Fokus
              </button>
              <button
                onClick={() => {
                  setPomodoroMode('break');
                  setPomodoroSeconds(5 * 60);
                  setPomodoroRunning(false);
                }}
                className={`py-1.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  pomodoroMode === 'break'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" /> 5 Daqiqa Tanaffus
              </button>
            </div>

            {/* Huge Timer Clock */}
            <div className="relative w-56 h-56 rounded-full glass border-2 border-indigo-500/40 flex flex-col items-center justify-center shadow-2xl bg-slate-900/40">
              <span className="text-5xl font-black text-white font-mono tracking-tight">
                {formatPomoTime(pomodoroSeconds)}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mt-2">
                {pomodoroMode === 'focus' ? 'O\'qish & Masala Ishlash' : 'Dam Olish Vaqti'}
              </span>
              {pomodoroRunning && (
                <div className="absolute inset-0 rounded-full border-2 border-indigo-500 animate-ping opacity-20 pointer-events-none" />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPomodoroRunning(!pomodoroRunning)}
                className={`px-8 py-3 rounded-2xl font-bold text-sm text-white shadow-lg transition flex items-center gap-2 ${
                  pomodoroRunning
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40'
                }`}
              >
                {pomodoroRunning ? (
                  <>
                    <Pause className="w-4 h-4" /> To'xtatib turish
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 ml-0.5" /> Taymerni Boshlash
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setPomodoroRunning(false);
                  setPomodoroSeconds(pomodoroMode === 'focus' ? 25 * 60 : 5 * 60);
                }}
                className="p-3 rounded-2xl glass hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
                title="Qayta o'rnatish"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 max-w-sm">
              Pomodoro uslubi miya charchashining oldini oladi va o'rganilgan materialning 85% ko'proq esda qolishiga yordam beradi.
            </p>
          </div>
        )}

        {/* Tab 3: Ambient Atmosphere Sounds */}
        {activeTab === 'ambient' && (
          <div className="flex-1 py-4 space-y-4 animate-in fade-in duration-200">
            <p className="text-xs text-slate-300 mb-2">
              Tabiiy tovushlar fon shovqinlarini to'sib, konsentratsiyani 40% ga oshiradi. Musiqa bilan birgalikda aralashtirib tinglashingiz mumkin.
            </p>

            {/* Rain Card */}
            <div className="glass rounded-2xl p-4 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <CloudRain className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Mayin Yomg'ir</h4>
                  <p className="text-[11px] text-slate-400">Yumshoq yomg'ir tomchilari ovozi</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-44">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={rainVol}
                  onChange={(e) => handleRainChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 accent-blue-500 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300 w-8 text-right">
                  {Math.round(rainVol * 100)}%
                </span>
              </div>
            </div>

            {/* Wind Card */}
            <div className="glass rounded-2xl p-4 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Yengil Shamol</h4>
                  <p className="text-[11px] text-slate-400">Tog'li tabiat shabbodasi</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-44">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={windVol}
                  onChange={(e) => handleWindChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 accent-teal-500 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300 w-8 text-right">
                  {Math.round(windVol * 100)}%
                </span>
              </div>
            </div>

            {/* Fireplace Card */}
            <div className="glass rounded-2xl p-4 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Tungi Gulxan / Olov</h4>
                  <p className="text-[11px] text-slate-400">Issiq kamin va qarsillagan olov ovozi</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-44">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={flameVol}
                  onChange={(e) => handleFlameChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-300 w-8 text-right">
                  {Math.round(flameVol * 100)}%
                </span>
              </div>
            </div>

            {/* Quick Mute All Ambient */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  handleRainChange(0);
                  handleWindChange(0);
                  handleFlameChange(0);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 flex items-center gap-1.5 transition"
              >
                <VolumeX className="w-3.5 h-3.5 text-slate-400" /> Barcha fon tovushlarini o'chirish
              </button>
            </div>
          </div>
        )}

        {/* Modal: Add Track */}
        {showAddModal && (
          <div className="absolute inset-0 bg-slate-950/90 rounded-3xl p-6 flex flex-col justify-center animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-white mb-4">Yangi Soundtrack Qo'shish</h3>
            <form onSubmit={handleCreateTrack} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Trek Nomi</label>
                <input
                  type="text"
                  placeholder="masalan: Night City Focus"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ijrochi</label>
                  <input
                    type="text"
                    placeholder="masalan: Lofi Studio"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kategoriya</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as SoundtrackCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="Lo-Fi">Lo-Fi</option>
                    <option value="Focus">Focus</option>
                    <option value="Classical">Classical</option>
                    <option value="Ambient">Ambient</option>
                    <option value="Nature">Nature</option>
                    <option value="Synthwave">Synthwave</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Audio MP3 Havolasi</label>
                <input
                  type="url"
                  placeholder="https://.../audio.mp3"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Bekor
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Qo'shish
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal: Edit Track */}
        {editingTrack && (
          <div className="absolute inset-0 bg-slate-950/90 rounded-3xl p-6 flex flex-col justify-center animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-white mb-4">Soundtrackni O'zgartirish</h3>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Trek Nomi</label>
                <input
                  type="text"
                  value={editingTrack.title}
                  onChange={(e) => setEditingTrack({ ...editingTrack, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ijrochi</label>
                  <input
                    type="text"
                    value={editingTrack.artist}
                    onChange={(e) => setEditingTrack({ ...editingTrack, artist: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kategoriya</label>
                  <select
                    value={editingTrack.category}
                    onChange={(e) =>
                      setEditingTrack({
                        ...editingTrack,
                        category: e.target.value as SoundtrackCategory,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="Lo-Fi">Lo-Fi</option>
                    <option value="Focus">Focus</option>
                    <option value="Classical">Classical</option>
                    <option value="Ambient">Ambient</option>
                    <option value="Nature">Nature</option>
                    <option value="Synthwave">Synthwave</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Audio MP3 Havolasi</label>
                <input
                  type="url"
                  value={editingTrack.url}
                  onChange={(e) => setEditingTrack({ ...editingTrack, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingTrack(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Bekor
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
