import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

export type SoundtrackCategory = 'Lo-Fi' | 'Classical' | 'Focus' | 'Ambient' | 'Nature' | 'Synthwave';

export type SoundtrackTrack = {
  id: string;
  title: string;
  category: SoundtrackCategory;
  artist: string;
  url: string;
  duration?: string;
};

export const DEFAULT_SOUNDTRACK_LIBRARY: SoundtrackTrack[] = [
  // Lo-Fi (5 tracks)
  {
    id: 'lofi-1',
    title: 'Midnight Focus Beats',
    category: 'Lo-Fi',
    artist: 'Chill Academy',
    url: 'https://cdn.pixabay.com/audio/2024/02/05/audio_22e3e0d7c8.mp3',
    duration: '2:45',
  },
  {
    id: 'lofi-2',
    title: 'Warm Study Vibes',
    category: 'Lo-Fi',
    artist: 'Lofi Room',
    url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_4c2c7d0e14.mp3',
    duration: '3:10',
  },
  {
    id: 'lofi-3',
    title: 'Tokyo Rain Lofi',
    category: 'Lo-Fi',
    artist: 'Neo Beats',
    url: 'https://cdn.pixabay.com/audio/2023/07/30/audio_1456a12b3c.mp3',
    duration: '2:55',
  },
  {
    id: 'lofi-4',
    title: 'Coffee & Code Morning',
    category: 'Lo-Fi',
    artist: 'Study Brew',
    url: 'https://cdn.pixabay.com/audio/2023/11/14/audio_3321ef88ab.mp3',
    duration: '3:05',
  },
  {
    id: 'lofi-5',
    title: 'Night Desk Illumination',
    category: 'Lo-Fi',
    artist: 'Quiet Cadet',
    url: 'https://cdn.pixabay.com/audio/2023/04/10/audio_55a2c4e611.mp3',
    duration: '2:38',
  },

  // Focus (4 tracks)
  {
    id: 'focus-1',
    title: 'Deep Alpha Mindset',
    category: 'Focus',
    artist: 'Neuro Sound',
    url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
    duration: '3:30',
  },
  {
    id: 'focus-2',
    title: 'Concentration Flow',
    category: 'Focus',
    artist: 'Mind Wave',
    url: 'https://cdn.pixabay.com/audio/2023/05/15/audio_9f3a1b2c4d.mp3',
    duration: '3:15',
  },
  {
    id: 'focus-3',
    title: 'Gamma Memory Waves',
    category: 'Focus',
    artist: 'Synapse Lab',
    url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_8812c4b1a2.mp3',
    duration: '4:10',
  },
  {
    id: 'focus-4',
    title: 'Deep Problem Solving Flow',
    category: 'Focus',
    artist: 'Cognitive Boost',
    url: 'https://cdn.pixabay.com/audio/2023/03/12/audio_7719aa3342.mp3',
    duration: '3:45',
  },

  // Classical (4 tracks)
  {
    id: 'classical-1',
    title: 'Moonlight Piano & Strings',
    category: 'Classical',
    artist: 'Acoustic Studio',
    url: 'https://cdn.pixabay.com/audio/2022/11/30/audio_8e6a30f0fa.mp3',
    duration: '4:02',
  },
  {
    id: 'classical-2',
    title: 'Chopin Nocturne Harmonic',
    category: 'Classical',
    artist: 'Grand Philharmonia',
    url: 'https://cdn.pixabay.com/audio/2021/09/06/audio_7d2f9b12a3.mp3',
    duration: '3:50',
  },
  {
    id: 'classical-3',
    title: 'Academic Grand Piano Solo',
    category: 'Classical',
    artist: 'Virtuoso Ensemble',
    url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_6633b1e42f.mp3',
    duration: '3:22',
  },
  {
    id: 'classical-4',
    title: 'Cello & Piano Contemplation',
    category: 'Classical',
    artist: 'Serene Chamber',
    url: 'https://cdn.pixabay.com/audio/2023/02/10/audio_9944bb11cc.mp3',
    duration: '4:18',
  },

  // Nature (3 tracks)
  {
    id: 'nature-1',
    title: 'Forest Breeze & Leaves',
    category: 'Nature',
    artist: 'Peaceful Woods',
    url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_8e6a30f0fa.mp3',
    duration: '3:20',
  },
  {
    id: 'nature-2',
    title: 'Gentle Ocean Shore',
    category: 'Nature',
    artist: 'Pacific Waves',
    url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_5d5a1b2c3e.mp3',
    duration: '4:15',
  },
  {
    id: 'nature-3',
    title: 'Mountain Creek & Birdsong',
    category: 'Nature',
    artist: 'Alpine Sounds',
    url: 'https://cdn.pixabay.com/audio/2022/04/18/audio_2288dd7766.mp3',
    duration: '3:40',
  },

  // Ambient (3 tracks)
  {
    id: 'ambient-1',
    title: 'Quiet Study Rain',
    category: 'Ambient',
    artist: 'Nature Calm',
    url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_2c2c7d0e14.mp3',
    duration: '3:50',
  },
  {
    id: 'ambient-2',
    title: 'Atmospheric Warm Drone',
    category: 'Ambient',
    artist: 'Ethereal Space',
    url: 'https://cdn.pixabay.com/audio/2023/06/20/audio_1122aabb33.mp3',
    duration: '4:30',
  },
  {
    id: 'ambient-3',
    title: 'Night Window Raindrops',
    category: 'Ambient',
    artist: 'Cozy Atmosphere',
    url: 'https://cdn.pixabay.com/audio/2022/09/14/audio_3344cc55dd.mp3',
    duration: '3:15',
  },

  // Synthwave & IT (3 tracks)
  {
    id: 'synth-1',
    title: 'Cyberpunk Code Sprint',
    category: 'Synthwave',
    artist: 'Neon Terminal',
    url: 'https://cdn.pixabay.com/audio/2023/09/12/audio_7788ffee11.mp3',
    duration: '3:25',
  },
  {
    id: 'synth-2',
    title: 'Retrowave Hacker Flow',
    category: 'Synthwave',
    artist: '80s Grid',
    url: 'https://cdn.pixabay.com/audio/2023/08/04/audio_4455aa22bb.mp3',
    duration: '3:40',
  },
  {
    id: 'synth-3',
    title: 'Midnight System Architect',
    category: 'Synthwave',
    artist: 'Synth Academy',
    url: 'https://cdn.pixabay.com/audio/2024/01/15/audio_9900dd22cc.mp3',
    duration: '2:58',
  },
];

const TRACKS_STORAGE_KEY = 'smart_academy_soundtracks_v2';

type AudioContextType = {
  currentTrack: SoundtrackTrack | null;
  isPlaying: boolean;
  volume: number;
  isLoop: boolean;
  playTrack: (track: SoundtrackTrack) => void;
  togglePlay: () => void;
  setVolume: (vol: number) => void;
  toggleLoop: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  library: SoundtrackTrack[];
  addTrack: (track: Omit<SoundtrackTrack, 'id'>) => void;
  updateTrack: (id: string, updated: Partial<SoundtrackTrack>) => void;
  deleteTrack: (id: string) => void;
  resetLibrary: () => void;
  showFullPlayer: boolean;
  setShowFullPlayer: (show: boolean) => void;
  showMiniBar: boolean;
  setShowMiniBar: (show: boolean) => void;
};

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load tracks with localStorage persistence
  const [library, setLibrary] = useState<SoundtrackTrack[]>(() => {
    try {
      const saved = localStorage.getItem(TRACKS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_SOUNDTRACK_LIBRARY;
  });

  const [currentTrack, setCurrentTrack] = useState<SoundtrackTrack | null>(() => library[0] || null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.6);
  const [isLoop, setIsLoop] = useState<boolean>(true);
  const [showFullPlayer, setShowFullPlayer] = useState<boolean>(false);
  const [showMiniBar, setShowMiniBar] = useState<boolean>(true);

  const saveLibrary = (newLib: SoundtrackTrack[]) => {
    setLibrary(newLib);
    localStorage.setItem(TRACKS_STORAGE_KEY, JSON.stringify(newLib));
  };

  // Initialize audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0.6;
    audioRef.current = audio;

    const handleEnded = () => {
      if (!audio.loop) {
        nextTrack();
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
      audio.src = '';
    };
  }, []);

  const playTrack = (track: SoundtrackTrack) => {
    if (!audioRef.current) return;
    if (currentTrack?.id === track.id && isPlaying) {
      audioRef.current.pause();
      return;
    }
    setCurrentTrack(track);
    audioRef.current.src = track.url;
    audioRef.current.loop = isLoop;
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        console.warn('Playback error:', err);
        setIsPlaying(false);
      });
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (!currentTrack) {
      if (library.length > 0) playTrack(library[0]);
      return;
    }
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (!audioRef.current.src || audioRef.current.src === '') {
        audioRef.current.src = currentTrack.url;
      }
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  };

  const toggleLoop = () => {
    const nextVal = !isLoop;
    setIsLoop(nextVal);
    if (audioRef.current) {
      audioRef.current.loop = nextVal;
    }
  };

  const nextTrack = () => {
    if (!currentTrack || library.length === 0) return;
    const currentIndex = library.findIndex((t) => t.id === currentTrack.id);
    const nextIdx = (currentIndex + 1) % library.length;
    playTrack(library[nextIdx]);
  };

  const prevTrack = () => {
    if (!currentTrack || library.length === 0) return;
    const currentIndex = library.findIndex((t) => t.id === currentTrack.id);
    const prevIdx = (currentIndex - 1 + library.length) % library.length;
    playTrack(library[prevIdx]);
  };

  const addTrack = (track: Omit<SoundtrackTrack, 'id'>) => {
    const newTrack: SoundtrackTrack = {
      ...track,
      id: `custom-track-${Date.now()}`,
    };
    saveLibrary([...library, newTrack]);
  };

  const updateTrack = (id: string, updated: Partial<SoundtrackTrack>) => {
    const newLib = library.map((t) => (t.id === id ? { ...t, ...updated } : t));
    saveLibrary(newLib);
    if (currentTrack?.id === id) {
      setCurrentTrack((prev) => (prev ? { ...prev, ...updated } : null));
    }
  };

  const deleteTrack = (id: string) => {
    if (library.length <= 1) {
      console.warn("Kamida bitta soundtrack bo'lishi kerak.");
      return;
    }
    const newLib = library.filter((t) => t.id !== id);
    saveLibrary(newLib);
    if (currentTrack?.id === id) {
      playTrack(newLib[0]);
    }
  };

  const resetLibrary = () => {
    saveLibrary(DEFAULT_SOUNDTRACK_LIBRARY);
    setCurrentTrack(DEFAULT_SOUNDTRACK_LIBRARY[0]);
  };

  return (
    <AudioContext.Provider
      value={{
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
        showFullPlayer,
        setShowFullPlayer,
        showMiniBar,
        setShowMiniBar,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
