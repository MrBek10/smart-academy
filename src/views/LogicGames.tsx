import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Chess, Square } from 'chess.js';
import {
  ArrowLeft,
  Trophy,
  Brain,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Sparkles,
  ChevronRight,
  BookOpen,
  Sword,
  Bot,
  Palette,
  Play,
  Shuffle,
  Flag,
  Share2,
  Plus,
  Users,
  Clock,
  Award,
  Sliders,
  Eye,
  Settings2,
  Zap,
  Info,
} from 'lucide-react';
import { supabase, MindChallenge } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface LogicGamesProps {
  onBack: () => void;
}

// ---------------- SOUND SYNTHESIS (Zero-Lag Web Audio) ----------------
class ChessSoundPlayer {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playMove() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      /* ignore audio error */
    }
  }

  playCapture() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      /* ignore audio error */
    }
  }

  playCheck() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime); // E5
      osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.09); // A5
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch {
      /* ignore audio error */
    }
  }

  playSuccess() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.25, this.ctx!.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.07 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + idx * 0.07);
        osc.stop(this.ctx!.currentTime + idx * 0.07 + 0.25);
      });
    } catch {
      /* ignore audio error */
    }
  }
}

const soundPlayer = new ChessSoundPlayer();

// ---------------- BOARD THEMES (Chess.com, Wood, Slate, Midnight, Ocean) ----------------
export type BoardThemeId = 'chess_green' | 'wood' | 'slate' | 'midnight' | 'ocean';

interface BoardTheme {
  id: BoardThemeId;
  name: string;
  lightBg: string;
  darkBg: string;
  borderCls: string;
  highlightSelected: string;
  highlightLast: string;
}

const BOARD_THEMES: Record<BoardThemeId, BoardTheme> = {
  chess_green: {
    id: 'chess_green',
    name: "Chess.com Yashil (Emerald)",
    lightBg: '#eeeed2',
    darkBg: '#769656',
    borderCls: 'border-emerald-600/40 shadow-emerald-950/50',
    highlightSelected: 'rgba(255, 235, 59, 0.55)',
    highlightLast: 'rgba(186, 202, 68, 0.65)',
  },
  wood: {
    id: 'wood',
    name: "Klassik Yog'och (Walnut)",
    lightBg: '#f0d9b5',
    darkBg: '#b58863',
    borderCls: 'border-amber-700/50 shadow-amber-950/50',
    highlightSelected: 'rgba(246, 214, 117, 0.6)',
    highlightLast: 'rgba(205, 158, 107, 0.7)',
  },
  slate: {
    id: 'slate',
    name: "Qorong'i Grafit (Slate)",
    lightBg: '#cbd5e1',
    darkBg: '#475569',
    borderCls: 'border-slate-600/50 shadow-slate-950/60',
    highlightSelected: 'rgba(148, 163, 184, 0.7)',
    highlightLast: 'rgba(100, 116, 139, 0.7)',
  },
  midnight: {
    id: 'midnight',
    name: "Midnight Kosmik (Neon)",
    lightBg: '#334155',
    darkBg: '#0f172a',
    borderCls: 'border-indigo-500/50 shadow-indigo-950/80',
    highlightSelected: 'rgba(99, 102, 241, 0.5)',
    highlightLast: 'rgba(129, 140, 248, 0.4)',
  },
  ocean: {
    id: 'ocean',
    name: "Moviy Okean (Royal Blue)",
    lightBg: '#dbeafe',
    darkBg: '#2563eb',
    borderCls: 'border-blue-500/40 shadow-blue-950/60',
    highlightSelected: 'rgba(96, 165, 250, 0.6)',
    highlightLast: 'rgba(59, 130, 246, 0.65)',
  },
};

// High contrast Chess Piece SVG Components
function ChessPieceIcon({ type, color, size = 'w-10 h-10' }: { type: string; color: 'w' | 'b'; size?: string }) {
  const isWhite = color === 'w';
  const fill = isWhite ? '#ffffff' : '#1e293b';
  const stroke = isWhite ? '#0f172a' : '#f8fafc';

  switch (type.toLowerCase()) {
    case 'p':
      return (
        <svg viewBox="0 0 45 45" className={`${size} drop-shadow-md select-none pointer-events-none`}>
          <path
            d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'r':
      return (
        <svg viewBox="0 0 45 45" className={`${size} drop-shadow-md select-none pointer-events-none`}>
          <path
            d="m 9,39 27,0 c 0,-2 -2,-3 -2,-3 L 11,36 c 0,0 -2,1 -2,3 z m 3,-6 21,0 0,-4 -21,0 0,4 z m -1,-7 23,0 -2,-11 -4,0 0,2 -3,0 0,-2 -5,0 0,2 -3,0 0,-2 -4,0 -2,11 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'n':
      return (
        <svg viewBox="0 0 45 45" className={`${size} drop-shadow-md select-none pointer-events-none`}>
          <path
            d="m 22,10 c -4.5,0 -8.5,3.5 -8.5,8 0,3.5 2.5,6.5 5,8.5 -1.5,1.5 -3.5,4.5 -3.5,7.5 0,3 2,5 5,5 l 10,0 c 1,0 2,-1 2,-2 0,-3 -2.5,-6 -4.5,-8.5 2,-1.5 4.5,-4 4.5,-7.5 0,-6 -4.5,-11 -10,-11 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'b':
      return (
        <svg viewBox="0 0 45 45" className={`${size} drop-shadow-md select-none pointer-events-none`}>
          <path
            d="m 9,36 c 3.39,-0.99 6.78,-1.98 10.17,-2.97 0.99,1.98 1.98,3.96 2.97,5.94 0.99,-1.98 1.98,-3.96 2.97,-5.94 3.39,0.99 6.78,1.98 10.17,2.97 -0.99,-3.96 -1.98,-7.92 -2.97,-11.88 -3.39,0 -6.78,0 -10.17,0 -3.39,0 -6.78,0 -10.17,0 -0.99,3.96 -1.98,7.92 -2.97,11.88 z M 22.5,9 C 19.5,9 17,11.5 17,14.5 c 0,1.5 0.6,2.8 1.6,3.8 C 17,20 16,22.5 16,25 c 0,3.5 2.5,6.5 6.5,6.5 4,0 6.5,-3 6.5,-6.5 0,-2.5 -1,-5 -2.6,-6.7 1,-1 1.6,-2.3 1.6,-3.8 0,-3 -2.5,-5.5 -5.5,-5.5 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'q':
      return (
        <svg viewBox="0 0 45 45" className={`${size} drop-shadow-md select-none pointer-events-none`}>
          <path
            d="m 9,26 c 8.5,-1.5 21,-1.5 27,0 l 2,-12 -7,5 -4,-8 -4.5,8 -7,-5 2.5,12 z M 9,31 l 27,0 0,3 -27,0 0,-3 z M 11,36 l 23,0 0,3 -23,0 0,-3 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'k':
      return (
        <svg viewBox="0 0 45 45" className={`${size} drop-shadow-md select-none pointer-events-none`}>
          <path
            d="m 22.5,11.5 0,-4 m -2,2 4,0 m -4,6 c 2,-1 5,-1 7,0 2,1 3,3 3,5.5 0,3 -2,6 -4.5,8 2.5,1 4.5,3 4.5,6 l -13,0 c 0,-3 2,-5 4.5,-6 -2.5,-2 -4.5,-5 -4.5,-8 0,-2.5 1,-4.5 3,-5.5 z M 11.5,37 l 22,0 0,3 -22,0 0,-3 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

// ---------------- TOURNAMENT MODEL ----------------
export interface MindTournament {
  id: string;
  gameType: 'shaxmat' | 'shashka';
  title: string;
  format: 'blitz_3_2' | 'rapid_10' | 'classical_15_10';
  formatLabel: string;
  rounds: number;
  currentRound: number;
  status: 'registration' | 'ongoing' | 'finished';
  prize: string;
  participants: { id: string; name: string; elo: number; points: number }[];
  pairings: { round: number; p1: string; p2: string; result?: string }[];
}

const DEFAULT_TOURNAMENTS: MindTournament[] = [
  {
    id: 'tour-1',
    gameType: 'shaxmat',
    title: "Smart Academy Shaxmat Grand Prix (Blitz 3+2)",
    format: 'blitz_3_2',
    formatLabel: "3 daqiqa + 2 soniya (Blitz)",
    rounds: 5,
    currentRound: 2,
    status: 'ongoing',
    prize: "200,000 so'm va Sertifikat",
    participants: [
      { id: 'p1', name: "Dilshodbek Rayimov", elo: 2150, points: 2.0 },
      { id: 'p2', name: "Bobur Mirzayev", elo: 1890, points: 1.5 },
      { id: 'p3', name: "Nodirbek Yoqubov", elo: 1980, points: 1.0 },
      { id: 'p4', name: "Malika Karimova", elo: 1750, points: 0.5 },
    ],
    pairings: [
      { round: 1, p1: "Dilshodbek Rayimov", p2: "Malika Karimova", result: '1 - 0' },
      { round: 1, p1: "Bobur Mirzayev", p2: "Nodirbek Yoqubov", result: '1/2 - 1/2' },
      { round: 2, p1: "Dilshodbek Rayimov", p2: "Bobur Mirzayev", result: '1 - 0' },
      { round: 2, p1: "Nodirbek Yoqubov", p2: "Malika Karimova", result: '1/2 - 1/2' },
    ],
  },
  {
    id: 'tour-2',
    gameType: 'shashka',
    title: "Respublika Shashka Ustasi Kubogi (Rapid)",
    format: 'rapid_10',
    formatLabel: "10 daqiqa (Rapid)",
    rounds: 5,
    currentRound: 1,
    status: 'registration',
    prize: "150,000 so'm va Diplom",
    participants: [
      { id: 'p5', name: "Sardor Ahmedov", elo: 1720, points: 0 },
      { id: 'p6', name: "Zuhra Alimova", elo: 1680, points: 0 },
      { id: 'p7', name: "Temur Po'latov", elo: 1810, points: 0 },
    ],
    pairings: [
      { round: 1, p1: "Temur Po'latov", p2: "Zuhra Alimova", result: '*' },
    ],
  },
];

// ---------------- TACTICAL POSITIONAL EXAMS ----------------
interface TacticalPuzzle {
  id: string;
  title: string;
  category: 'shaxmat' | 'shashka';
  fen: string;
  task: string;
  targetMove: string; // e.g. "Qg8+", "Rd8#", "Qh7#", "e4", etc.
  fullSolution: string;
  explanation: string;
  points: number;
}

const DEFAULT_PUZZLES: TacticalPuzzle[] = [
  {
    id: 'puz-1',
    title: "Oqlarning 2 yurishda moti (Rety Etyudi)",
    category: 'shaxmat',
    fen: "5r1k/7p/6Q1/8/2B5/8/8/7K w - - 0 1",
    task: "Oqlarning eng kutilmagan qurbonlik yurishi qaysi?",
    targetMove: "Qg8+",
    fullSolution: "1. Qg8+!! Rxg8 2. Nf7#",
    explanation: "1. Qg8+!! qurbonligi qoralar ruhini majburan g8 ga keltiradi va o'z shohining qochish yo'lini to'sib qo'yadi. Natijada bo'g'ma mot (Smothered mate) paydo bo'ladi!",
    points: 25,
  },
  {
    id: 'puz-2',
    title: "Oxirgi Gorizontal Moti (Back-Rank Mate)",
    category: 'shaxmat',
    fen: "6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1",
    task: "Oqlar 1 yurishda mot qiladi. Eng to'g'ri yurishni amalga oshiring:",
    targetMove: "Rd8#",
    fullSolution: "1. Rd8#",
    explanation: "Qoralar shohi f7, g7, h7 piyodalari orqasida qamalib qolgan. 8-gorizontaldagi Rd8# yurishi darhol g'alabani ta'minlaydi.",
    points: 15,
  },
  {
    id: 'puz-3',
    title: "Fil va Ot bilan Farzinni Yutish Kombinatsiyasi",
    category: 'shaxmat',
    fen: "r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 1 4",
    task: "Qoralar uchun markazdagi kuchli pozitsion yurish:",
    targetMove: "d5",
    fullSolution: "1... d5!",
    explanation: "1... d5 yurishi oqlarning c4 filiga zarba beradi, markazni egallaydi va qoralar uchun to'liq tashabbus yaratadi.",
    points: 20,
  },
  {
    id: 'puz-4',
    title: "Anastasiya Moti (Ot va Ruh Taktikasi)",
    category: 'shaxmat',
    fen: "5rk1/1p3ppp/8/8/3N4/8/1q3PPP/3R2K1 w - - 0 1",
    task: "Oqlarning orqa qatordagi zaiflikka qarshi faol yurishi:",
    targetMove: "Nf5",
    fullSolution: "1. Nf5!",
    explanation: "Ot f5 katagiga joylashib shoh xavfsizligini ta'minlaydi va orqa chiziqni ruh bilan bog'laydi.",
    points: 20,
  },
];

// ---------------- MAIN LOGIC GAMES COMPONENT ----------------
export default function LogicGames({ onBack }: LogicGamesProps) {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'creator';

  const [activeTab, setActiveTab] = useState<'chess_ai' | 'exams' | 'editor' | 'tournaments' | 'shashka'>('chess_ai');

  // Board theme state
  const [boardTheme, setBoardTheme] = useState<BoardThemeId>('chess_green');
  const [showCoordinates, setShowCoordinates] = useState(true);

  // Chess Engine State
  const [chessInstance, setChessInstance] = useState<Chess>(() => new Chess());
  const [fen, setFen] = useState<string>(() => chessInstance.fen());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [capturedWhite, setCapturedWhite] = useState<string[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<string[]>([]);
  const [botLevel, setBotLevel] = useState<number>(3); // 1 to 5
  const [botThinking, setBotThinking] = useState(false);
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [gameStatus, setGameStatus] = useState<string>("Sizning navbatingiz (Oqlar)");

  // Tactical Puzzle State
  const [puzzles, setPuzzles] = useState<TacticalPuzzle[]>(DEFAULT_PUZZLES);
  const [activePuzzleIdx, setActivePuzzleIdx] = useState(0);
  const [puzzleScore, setPuzzleScore] = useState(0);
  const [puzzleStatus, setPuzzleStatus] = useState<'playing' | 'solved' | 'failed'>('playing');
  const [puzzleFeedback, setPuzzleFeedback] = useState<string | null>(null);

  // Board Editor State
  const [editorFen, setEditorFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [editorPalettePiece, setEditorPalettePiece] = useState<string>('P');

  // AI Position Analysis Modal State
  const [aiAnalysisModal, setAiAnalysisModal] = useState(false);
  const [aiAnalysisText, setAiAnalysisText] = useState<string | null>(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);

  // Tournament State
  const [tournaments, setTournaments] = useState<MindTournament[]>(DEFAULT_TOURNAMENTS);
  const [showCreateTournament, setShowCreateTournament] = useState(false);
  const [newTourTitle, setNewTourTitle] = useState('');
  const [newTourType, setNewTourType] = useState<'shaxmat' | 'shashka'>('shaxmat');
  const [newTourFormat, setNewTourFormat] = useState<'blitz_3_2' | 'rapid_10' | 'classical_15_10'>('blitz_3_2');
  const [newTourPrize, setNewTourPrize] = useState("200,000 so'm va Diplom");

  // Admin Add Exam Question Modal
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamFen, setNewExamFen] = useState('');
  const [newExamTask, setNewExamTask] = useState('');
  const [newExamMove, setNewExamMove] = useState('');
  const [newExamExplanation, setNewExamExplanation] = useState('');

  // Shashka (Checkers) State
  const [shashkaBoard, setShashkaBoard] = useState<(string | null)[][]>(() => {
    const b: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) b[r][c] = 'b';
      }
    }
    for (let r = 5; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) b[r][c] = 'w';
      }
    }
    return b;
  });
  const [shashkaSelected, setShashkaSelected] = useState<[number, number] | null>(null);
  const [shashkaTurn, setShashkaTurn] = useState<'w' | 'b'>('w');
  const [shashkaMessage, setShashkaMessage] = useState("Oqlar yuradi");

  // Load custom challenges from Supabase on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('mind_challenges').select('*');
        if (data && data.length > 0) {
          const loadedPuzzles: TacticalPuzzle[] = data
            .filter((c: MindChallenge) => c.fen_state && c.category === 'shaxmat')
            .map((c: MindChallenge) => ({
              id: c.id,
              title: c.title,
              category: 'shaxmat',
              fen: c.fen_state!,
              task: c.problem_text,
              targetMove: c.correct_answer,
              fullSolution: c.correct_answer,
              explanation: c.explanation,
              points: 20,
            }));
          if (loadedPuzzles.length > 0) {
            setPuzzles((prev) => [...prev, ...loadedPuzzles]);
          }
        }
      } catch {
        /* fallback to defaults */
      }
    })();
  }, []);

  // Update Game Status Message
  const updateStatus = useCallback((c: Chess) => {
    if (c.isCheckmate()) {
      soundPlayer.playSuccess();
      setGameStatus(`Mot! ${c.turn() === 'w' ? 'Qoralar' : 'Oqlar'} g'alaba qozondi!`);
    } else if (c.isDraw()) {
      setGameStatus("Durang natija!");
    } else if (c.isCheck()) {
      soundPlayer.playCheck();
      setGameStatus(`Shohga tahdid (Shax)! ${c.turn() === 'w' ? 'Oqlar' : 'Qoralar'} yurishi`);
    } else {
      setGameStatus(`${c.turn() === 'w' ? 'Oqlar' : 'Qoralar'} yurishi`);
    }
  }, []);

  // Bot Engine Move (with 5 intelligent difficulty levels)
  const executeBotMove = useCallback((c: Chess, level: number) => {
    if (c.isGameOver()) return;
    setBotThinking(true);

    setTimeout(() => {
      try {
        const moves = c.moves({ verbose: true });
        if (moves.length === 0) {
          setBotThinking(false);
          return;
        }

        let selectedMove = moves[0];

        if (level === 1) {
          selectedMove = moves[Math.floor(Math.random() * moves.length)];
        } else if (level === 2) {
          const captures = moves.filter((m) => m.captured);
          selectedMove = captures.length > 0 ? captures[Math.floor(Math.random() * captures.length)] : moves[Math.floor(Math.random() * moves.length)];
        } else {
          const pieceVal: Record<string, number> = { p: 1, n: 3, b: 3.2, r: 5, q: 9, k: 100 };
          let bestScore = -999999;
          let bestMoves = [moves[0]];

          for (const m of moves) {
            let score = 0;
            if (m.captured) {
              score += (pieceVal[m.captured] || 1) * 10;
            }
            if (m.promotion) {
              score += 80;
            }
            if (['d4', 'd5', 'e4', 'e5'].includes(m.to)) {
              score += 4 * (level - 2);
            }
            if (m.san.includes('+')) {
              score += 6;
            }
            score += Math.random() * (6 - level);

            if (score > bestScore) {
              bestScore = score;
              bestMoves = [m];
            } else if (score === bestScore) {
              bestMoves.push(m);
            }
          }
          selectedMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
        }

        const moveResult = c.move(selectedMove);
        if (moveResult) {
          if (moveResult.captured) {
            soundPlayer.playCapture();
            setCapturedWhite((prev) => [...prev, moveResult.captured!]);
          } else {
            soundPlayer.playMove();
          }
          setLastMove({ from: moveResult.from as Square, to: moveResult.to as Square });
          setFen(c.fen());
          updateStatus(c);
        }
      } catch (err) {
        console.warn('Bot error:', err);
      } finally {
        setBotThinking(false);
      }
    }, 450 + Math.random() * 250);
  }, [updateStatus]);

  // Handle Square Click on Main Chess Board
  const handleSquareClick = (square: Square) => {
    if (botThinking || chessInstance.isGameOver()) return;

    const currentTurn = chessInstance.turn();
    if (currentTurn !== playerColor) return;

    const piece = chessInstance.get(square);

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      if (piece && piece.color === playerColor) {
        setSelectedSquare(square);
        const moves = chessInstance.moves({ square, verbose: true }).map((m) => m.to);
        setLegalMoves(moves);
        return;
      }

      try {
        const move = chessInstance.move({
          from: selectedSquare,
          to: square,
          promotion: 'q',
        });

        if (move) {
          if (move.captured) {
            soundPlayer.playCapture();
            setCapturedBlack((prev) => [...prev, move.captured!]);
          } else {
            soundPlayer.playMove();
          }
          setLastMove({ from: move.from as Square, to: move.to as Square });
          setSelectedSquare(null);
          setLegalMoves([]);
          setFen(chessInstance.fen());
          updateStatus(chessInstance);

          if (!chessInstance.isGameOver()) {
            executeBotMove(chessInstance, botLevel);
          }
          return;
        }
      } catch {
        /* illegal move */
      }
    }

    if (piece && piece.color === playerColor) {
      setSelectedSquare(square);
      const moves = chessInstance.moves({ square, verbose: true }).map((m) => m.to);
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  // Reset Game
  const resetGame = () => {
    const fresh = new Chess();
    setChessInstance(fresh);
    setFen(fresh.fen());
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setCapturedWhite([]);
    setCapturedBlack([]);
    setGameStatus("Yangi o'yin boshlandi! Oqlar yurishi.");
    if (playerColor === 'b') {
      executeBotMove(fresh, botLevel);
    }
  };

  // Switch player color
  const togglePlayerColor = () => {
    const nextCol = playerColor === 'w' ? 'b' : 'w';
    setPlayerColor(nextCol);
    const fresh = new Chess();
    setChessInstance(fresh);
    setFen(fresh.fen());
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setCapturedWhite([]);
    setCapturedBlack([]);
    if (nextCol === 'b') {
      executeBotMove(fresh, botLevel);
    } else {
      setGameStatus("Siz Oqlarsiz. Yurishingiz!");
    }
  };

  // Tactical Puzzle Move Handling
  const handlePuzzleSquareClick = (square: Square) => {
    if (puzzleStatus !== 'playing') return;
    const currentPuzzle = puzzles[activePuzzleIdx];
    if (!currentPuzzle) return;

    const piece = chessInstance.get(square);

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      if (piece && piece.color === chessInstance.turn()) {
        setSelectedSquare(square);
        setLegalMoves(chessInstance.moves({ square, verbose: true }).map((m) => m.to));
        return;
      }

      try {
        const move = chessInstance.move({
          from: selectedSquare,
          to: square,
          promotion: 'q',
        });

        if (move) {
          setSelectedSquare(null);
          setLegalMoves([]);
          setFen(chessInstance.fen());
          setLastMove({ from: move.from as Square, to: move.to as Square });

          const cleanedTarget = currentPuzzle.targetMove.replace(/[+#!?]/g, '').trim();
          const userSAN = move.san.replace(/[+#!?]/g, '').trim();

          if (userSAN === cleanedTarget || move.san === currentPuzzle.targetMove) {
            soundPlayer.playSuccess();
            setPuzzleStatus('solved');
            setPuzzleScore((s) => s + currentPuzzle.points);
            setPuzzleFeedback(`🎉 Ajoyib! To'g'ri topdingiz: ${move.san}! (+${currentPuzzle.points} ball)`);
          } else {
            soundPlayer.playCapture();
            setPuzzleStatus('failed');
            setPuzzleFeedback(`⚠️ Noto'g'ri yurish (${move.san}). To'g'ri yechim: ${currentPuzzle.targetMove}`);
          }
        }
      } catch {
        /* illegal move */
      }
    } else {
      if (piece && piece.color === chessInstance.turn()) {
        setSelectedSquare(square);
        setLegalMoves(chessInstance.moves({ square, verbose: true }).map((m) => m.to));
      }
    }
  };

  // Load Puzzle onto Board
  const loadPuzzle = (idx: number) => {
    const p = puzzles[idx];
    if (!p) return;
    setActivePuzzleIdx(idx);
    const c = new Chess(p.fen);
    setChessInstance(c);
    setFen(c.fen());
    setSelectedSquare(null);
    setLegalMoves([]);
    setLastMove(null);
    setPuzzleStatus('playing');
    setPuzzleFeedback(null);
  };

  useEffect(() => {
    if (activeTab === 'exams' && puzzles.length > 0) {
      loadPuzzle(activePuzzleIdx);
    }
  }, [activeTab]);

  // AI Grandmaster Position Analysis
  const requestAIAnalysis = async () => {
    setAiAnalysisModal(true);
    setAiAnalysisLoading(true);
    setAiAnalysisText(null);

    const currentFen = fen;
    const historyMoves = chessInstance.history().join(' ') || 'Boshlang\'ich pozitsiya';

    const prompt = `Siz xalqaro darajadagi grossmeyster va tajribali shaxmat murabbiyisiz.
Quyidagi shaxmat pozitsiyasini chuqur tahlil qiling va o'quvchi uchun o'zbek tilida tushuntirib bering:

FEN kodi: "${currentFen}"
Yurishlar tarixi: "${historyMoves}"
Navbat: ${chessInstance.turn() === 'w' ? 'Oqlar' : 'Qoralar'}

Quyidagi tuzilmada aniq va qiziqarli qilib tahlil qiling:
1. 🎯 POZITSIYA BAHOSI VA FAOLIYAT: Materiallar balansi, kimning holati faolroq va ustunroq?
2. ⚔️ TAKTIK IMKONIYATLAR: Shohga tahdid, bog'lanishlar (pin), vilkalar (fork) yoki ochiq yo'laklar bormi?
3. 💡 ENG KUCHLI 3 TA TAVSIYA ETILADIGAN YURISH (masalan: 1. ... 2. ... 3. ...) va har birining maqsadi.
4. 🏁 STRATEGIK REJA: Qanday qilib reja tuzish va g'alabaga erishish kerak?`;

    try {
      const res = await fetch('/api/gemini/generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      });

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      setAiAnalysisText(rawText || "Kechirasiz, tahlil natijasini olishda xatolik yuz berdi.");
    } catch {
      setAiAnalysisText("AI xizmati bilan bog'lanishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  // Shashka (Checkers) Click Handling
  const handleShashkaClick = (r: number, c: number) => {
    if ((r + c) % 2 === 0) return;

    const piece = shashkaBoard[r][c];

    if (!shashkaSelected) {
      if (piece && piece.startsWith(shashkaTurn)) {
        setShashkaSelected([r, c]);
      }
      return;
    }

    const [fr, fc] = shashkaSelected;
    if (fr === r && fc === c) {
      setShashkaSelected(null);
      return;
    }

    const dr = r - fr;
    const dc = c - fc;
    const dist = Math.abs(dr);

    const isWhite = shashkaBoard[fr][fc]?.startsWith('w');
    const isKing = shashkaBoard[fr][fc]?.includes('K');
    const validDir = isKing ? true : isWhite ? dr < 0 : dr > 0;

    const newBoard = shashkaBoard.map((row) => [...row]);

    // Simple 1-step move
    if (dist === 1 && Math.abs(dc) === 1 && validDir && !piece) {
      newBoard[r][c] = newBoard[fr][fc];
      newBoard[fr][fc] = null;
      if (isWhite && r === 0) newBoard[r][c] = 'wK';
      if (!isWhite && r === 7) newBoard[r][c] = 'bK';

      soundPlayer.playMove();
      setShashkaBoard(newBoard);
      setShashkaSelected(null);
      setShashkaTurn(shashkaTurn === 'w' ? 'b' : 'w');
      setShashkaMessage(shashkaTurn === 'w' ? "Qoralar (Bot) yurishi" : "Oqlar yurishi");
      return;
    }

    // Capture (Jump)
    if (dist === 2 && Math.abs(dc) === 2 && !piece) {
      const midR = fr + dr / 2;
      const midC = fc + dc / 2;
      const midPiece = newBoard[midR][midC];

      if (midPiece && midPiece.startsWith(shashkaTurn === 'w' ? 'b' : 'w')) {
        newBoard[r][c] = newBoard[fr][fc];
        newBoard[fr][fc] = null;
        newBoard[midR][midC] = null;

        if (isWhite && r === 0) newBoard[r][c] = 'wK';
        if (!isWhite && r === 7) newBoard[r][c] = 'bK';

        soundPlayer.playCapture();
        setShashkaBoard(newBoard);
        setShashkaSelected(null);
        setShashkaTurn(shashkaTurn === 'w' ? 'b' : 'w');
        setShashkaMessage(shashkaTurn === 'w' ? "Qoralar (Bot) yurishi" : "Oqlar yurishi");
        return;
      }
    }

    if (piece && piece.startsWith(shashkaTurn)) {
      setShashkaSelected([r, c]);
    }
  };

  // Join Tournament
  const handleJoinTournament = (tourId: string) => {
    setTournaments((prev) =>
      prev.map((t) => {
        if (t.id !== tourId) return t;
        const myName = profile?.display_name || user?.email?.split('@')[0] || "Mehmon O'yinchi";
        if (t.participants.some((p) => p.name === myName)) return t;
        return {
          ...t,
          participants: [
            ...t.participants,
            { id: `p-${Date.now()}`, name: myName, elo: 1600, points: 0 },
          ],
        };
      })
    );
    soundPlayer.playSuccess();
  };

  // Create Tournament
  const handleCreateTournamentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTourTitle.trim()) return;
    const newT: MindTournament = {
      id: `tour-${Date.now()}`,
      gameType: newTourType,
      title: newTourTitle.trim(),
      format: newTourFormat,
      formatLabel:
        newTourFormat === 'blitz_3_2'
          ? "3 daqiqa + 2 soniya (Blitz)"
          : newTourFormat === 'rapid_10'
          ? "10 daqiqa (Rapid)"
          : "15 daqiqa + 10 soniya (Klassik)",
      rounds: 5,
      currentRound: 1,
      status: 'registration',
      prize: newTourPrize.trim(),
      participants: [
        {
          id: 'p-creator',
          name: profile?.display_name || "Turnir Tashkilotchisi",
          elo: 1850,
          points: 0,
        },
      ],
      pairings: [],
    };
    setTournaments([newT, ...tournaments]);
    setShowCreateTournament(false);
    setNewTourTitle('');
    soundPlayer.playSuccess();
  };

  // Board 8x8 squares generator
  const boardMatrix = useMemo(() => {
    return chessInstance.board();
  }, [fen, chessInstance]);

  const currentTheme = BOARD_THEMES[boardTheme];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <Sword className="w-7 h-7 text-indigo-400" />
              <span>Shaxmat & Intellektual O'yinlar Arenasi</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              FIDE va Chess.com standarti, Taktik imtihonlar, Turnirlar va Gemini AI Grossmeyster tahlili
            </p>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Theme Switcher Button */}
          <div className="relative group">
            <button
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 transition"
              title="Doska dizaynini o'zgartirish"
            >
              <Palette className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Dizayn:</span>
              <span className="text-emerald-400">{currentTheme.name.split(' ')[0]}</span>
            </button>
            <div className="absolute right-0 mt-1 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 hidden group-hover:block z-50">
              {Object.values(BOARD_THEMES).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setBoardTheme(t.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition ${
                    boardTheme === t.id ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{t.name}</span>
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/20"
                    style={{ backgroundColor: t.darkBg }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* AI Analysis Button */}
          <button
            onClick={requestAIAnalysis}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-purple-950/40 transition active:scale-95"
            title="Gemini AI Grossmeyster pozitsiya tahlili"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            <span>AI Tahlili</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('chess_ai')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shrink-0 transition ${
            activeTab === 'chess_ai'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Bot className="w-4 h-4 text-indigo-300" />
          <span>Shaxmat (Botga Qarshi)</span>
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shrink-0 transition ${
            activeTab === 'exams'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Award className="w-4 h-4 text-amber-400" />
          <span>Taktik Imtihonlar</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono">
            {puzzleScore} b
          </span>
        </button>

        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shrink-0 transition ${
            activeTab === 'editor'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Pozitsiya Muharriri (FEN)</span>
        </button>

        <button
          onClick={() => setActiveTab('tournaments')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shrink-0 transition ${
            activeTab === 'tournaments'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span>Turnirlar (Shaxmat & Shashka)</span>
        </button>

        <button
          onClick={() => setActiveTab('shashka')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shrink-0 transition ${
            activeTab === 'shashka'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-4 h-4 text-rose-400" />
          <span>Shashka</span>
        </button>
      </div>

      {/* ================= TAB 1: CHESS VS AI ================= */}
      {activeTab === 'chess_ai' && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left / Center: Interactive Chess Board */}
          <div className="lg:col-span-8 flex flex-col items-center">
            {/* Captured Pieces Bar (Opponent / Black) */}
            <div className="w-full max-w-[540px] flex items-center justify-between px-3 py-2 bg-slate-900/80 rounded-t-2xl border-t border-x border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="font-bold text-slate-300">
                  {playerColor === 'w' ? `Smart Bot (Daraja ${botLevel})` : profile?.display_name || "Siz"}
                </span>
                {botThinking && (
                  <span className="text-[11px] text-amber-400 animate-pulse font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    yurishni hisoblamoqda...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-slate-400 font-mono">
                {capturedWhite.map((p, idx) => (
                  <span key={idx} className="text-sm">
                    {p.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* The 8x8 Chess Board */}
            <div
              className={`relative w-full max-w-[540px] aspect-square rounded-b-2xl border-4 ${currentTheme.borderCls} shadow-2xl overflow-hidden`}
              style={{ userSelect: 'none' }}
            >
              <div className="w-full h-full grid grid-rows-8 grid-cols-8">
                {boardMatrix.map((row, r) =>
                  row.map((squareData, c) => {
                    const fileChar = String.fromCharCode(97 + c);
                    const rankNum = 8 - r;
                    const squareKey = `${fileChar}${rankNum}` as Square;
                    const isDark = (r + c) % 2 === 1;
                    const bg = isDark ? currentTheme.darkBg : currentTheme.lightBg;

                    const isSelected = selectedSquare === squareKey;
                    const isLegal = legalMoves.includes(squareKey);
                    const isLast =
                      lastMove && (lastMove.from === squareKey || lastMove.to === squareKey);

                    return (
                      <div
                        key={squareKey}
                        onClick={() => handleSquareClick(squareKey)}
                        className="relative w-full h-full flex items-center justify-center cursor-pointer transition-colors"
                        style={{
                          backgroundColor: isSelected
                            ? currentTheme.highlightSelected
                            : isLast
                            ? currentTheme.highlightLast
                            : bg,
                        }}
                      >
                        {/* Square Coordinates (File & Rank labels) */}
                        {showCoordinates && c === 0 && (
                          <span
                            className="absolute top-0.5 left-1 text-[9px] font-bold pointer-events-none select-none opacity-60"
                            style={{ color: isDark ? currentTheme.lightBg : currentTheme.darkBg }}
                          >
                            {rankNum}
                          </span>
                        )}
                        {showCoordinates && r === 7 && (
                          <span
                            className="absolute bottom-0.5 right-1 text-[9px] font-bold pointer-events-none select-none opacity-60"
                            style={{ color: isDark ? currentTheme.lightBg : currentTheme.darkBg }}
                          >
                            {fileChar}
                          </span>
                        )}

                        {/* Piece Icon */}
                        {squareData && (
                          <ChessPieceIcon
                            type={squareData.type}
                            color={squareData.color}
                            size="w-8 h-8 sm:w-12 sm:h-12"
                          />
                        )}

                        {/* Legal Move Circle Dot / Capture Ring */}
                        {isLegal && !squareData && (
                          <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-900/35 pointer-events-none" />
                        )}
                        {isLegal && squareData && (
                          <div className="absolute inset-1 rounded-full border-3 sm:border-4 border-slate-900/40 pointer-events-none" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Captured Pieces Bar (Player / White) */}
            <div className="w-full max-w-[540px] flex items-center justify-between px-3 py-2 bg-slate-900/80 rounded-b-2xl border-b border-x border-slate-800 text-xs mt-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                <span className="font-bold text-white">
                  {playerColor === 'w' ? profile?.display_name || "Siz (Oqlar)" : `Smart Bot (Daraja ${botLevel})`}
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  {gameStatus}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-300 font-mono">
                {capturedBlack.map((p, idx) => (
                  <span key={idx} className="text-sm">
                    {p.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Game Controls & Engine Info */}
          <div className="lg:col-span-4 space-y-5">
            {/* Match Status Card */}
            <div className="glass-strong rounded-2xl p-5 border border-slate-700/60 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  O'yin Holati
                </span>
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                  FIDE 100% Qoidalari
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-sm font-extrabold text-white mb-1">{gameStatus}</div>
                <div className="text-xs text-slate-400 font-mono">
                  Navbat: {chessInstance.turn() === 'w' ? 'Oqlar' : 'Qoralar'} | Yurishlar soni: {chessInstance.history().length}
                </div>
              </div>

              {/* Bot Difficulty Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2 flex items-center justify-between">
                  <span>Bot Qiyinlik Darajasi:</span>
                  <span className="text-indigo-400 font-mono font-bold">
                    {botLevel === 1 && "Elo 800 (Boshlang'ich)"}
                    {botLevel === 2 && "Elo 1200 (Havaskor)"}
                    {botLevel === 3 && "Elo 1600 (Klub O'yinchisi)"}
                    {botLevel === 4 && "Elo 2000 (Usta)"}
                    {botLevel === 5 && "Elo 2300+ (Grossmeyster)"}
                  </span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={botLevel}
                  onChange={(e) => setBotLevel(parseInt(e.target.value))}
                  className="w-full h-2 accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>1 (Oson)</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5 (Kuchli)</span>
                </div>
              </div>

              {/* Controls Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={resetGame}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition"
                >
                  <RotateCcw className="w-4 h-4 text-indigo-400" />
                  <span>Qaytadan</span>
                </button>

                <button
                  onClick={togglePlayerColor}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition"
                >
                  <Shuffle className="w-4 h-4 text-emerald-400" />
                  <span>Rang: {playerColor === 'w' ? 'Oqlar' : 'Qoralar'}</span>
                </button>

                <button
                  onClick={() => setShowCoordinates((v) => !v)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition"
                >
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>Koordinata</span>
                </button>

                <button
                  onClick={requestAIAnalysis}
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>AI Tahlil</span>
                </button>
              </div>
            </div>

            {/* Move History Log */}
            <div className="glass-strong rounded-2xl p-5 border border-slate-700/60 shadow-xl space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Yurishlar Notatsiyasi (PGN)
              </span>
              <div className="max-h-44 overflow-y-auto p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                {chessInstance.history().length === 0 ? (
                  <span className="text-slate-500 italic">Hali yurishlar amalga oshirilmadi</span>
                ) : (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {chessInstance.history().map((m, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-slate-500 font-bold">{Math.floor(idx / 2) + 1}.</span>
                        <span className="text-white font-semibold">{m}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: TACTICAL POSITIONAL EXAMS ================= */}
      {activeTab === 'exams' && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Tactical Chess Board */}
          <div className="lg:col-span-8 flex flex-col items-center">
            <div className="w-full max-w-[540px] flex items-center justify-between px-4 py-2.5 bg-slate-900 rounded-t-2xl border-t border-x border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="font-extrabold text-white">
                  Imtihon #{activePuzzleIdx + 1}: {puzzles[activePuzzleIdx]?.title}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                +{puzzles[activePuzzleIdx]?.points} Ball
              </span>
            </div>

            <div
              className={`relative w-full max-w-[540px] aspect-square rounded-b-2xl border-4 ${currentTheme.borderCls} shadow-2xl overflow-hidden`}
              style={{ userSelect: 'none' }}
            >
              <div className="w-full h-full grid grid-rows-8 grid-cols-8">
                {boardMatrix.map((row, r) =>
                  row.map((squareData, c) => {
                    const fileChar = String.fromCharCode(97 + c);
                    const rankNum = 8 - r;
                    const squareKey = `${fileChar}${rankNum}` as Square;
                    const isDark = (r + c) % 2 === 1;
                    const bg = isDark ? currentTheme.darkBg : currentTheme.lightBg;

                    const isSelected = selectedSquare === squareKey;
                    const isLegal = legalMoves.includes(squareKey);
                    const isLast =
                      lastMove && (lastMove.from === squareKey || lastMove.to === squareKey);

                    return (
                      <div
                        key={squareKey}
                        onClick={() => handlePuzzleSquareClick(squareKey)}
                        className="relative w-full h-full flex items-center justify-center cursor-pointer transition-colors"
                        style={{
                          backgroundColor: isSelected
                            ? currentTheme.highlightSelected
                            : isLast
                            ? currentTheme.highlightLast
                            : bg,
                        }}
                      >
                        {showCoordinates && c === 0 && (
                          <span
                            className="absolute top-0.5 left-1 text-[9px] font-bold pointer-events-none select-none opacity-60"
                            style={{ color: isDark ? currentTheme.lightBg : currentTheme.darkBg }}
                          >
                            {rankNum}
                          </span>
                        )}
                        {showCoordinates && r === 7 && (
                          <span
                            className="absolute bottom-0.5 right-1 text-[9px] font-bold pointer-events-none select-none opacity-60"
                            style={{ color: isDark ? currentTheme.lightBg : currentTheme.darkBg }}
                          >
                            {fileChar}
                          </span>
                        )}

                        {squareData && (
                          <ChessPieceIcon
                            type={squareData.type}
                            color={squareData.color}
                            size="w-8 h-8 sm:w-12 sm:h-12"
                          />
                        )}

                        {isLegal && !squareData && (
                          <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-slate-900/35 pointer-events-none" />
                        )}
                        {isLegal && squareData && (
                          <div className="absolute inset-1 rounded-full border-3 sm:border-4 border-slate-900/40 pointer-events-none" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Puzzle Feedback Alert */}
            {puzzleFeedback && (
              <div
                className={`w-full max-w-[540px] mt-4 p-4 rounded-2xl border text-sm font-bold flex items-center justify-between ${
                  puzzleStatus === 'solved'
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                    : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                }`}
              >
                <span>{puzzleFeedback}</span>
                {puzzleStatus === 'solved' && activePuzzleIdx + 1 < puzzles.length && (
                  <button
                    onClick={() => loadPuzzle(activePuzzleIdx + 1)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs inline-flex items-center gap-1 transition"
                  >
                    <span>Keyingi Masala</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Puzzle Details & List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="glass-strong rounded-2xl p-5 border border-slate-700/60 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Imtihon Sharti
                </span>
                <span className="text-xs text-amber-400 font-mono font-bold">
                  Jami To'plangan: {puzzleScore} ball
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <h3 className="text-base font-extrabold text-white">
                  {puzzles[activePuzzleIdx]?.task}
                </h3>
                <p className="text-xs text-slate-400">
                  Doskadagi toshni siljitish orqali to'g'ri taktik yurishni toping.
                </p>
              </div>

              {/* Show Explanation if solved or failed */}
              {(puzzleStatus === 'solved' || puzzleStatus === 'failed') && (
                <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-500/40 text-xs text-indigo-200 space-y-1.5">
                  <div className="font-extrabold flex items-center gap-1 text-white">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>Yechim va Taktik Tahlil:</span>
                  </div>
                  <p className="leading-relaxed">{puzzles[activePuzzleIdx]?.explanation}</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => loadPuzzle(activePuzzleIdx)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition"
                >
                  <RotateCcw className="w-4 h-4 text-indigo-400" />
                  <span>Qaytadan Urinish</span>
                </button>

                <button
                  onClick={requestAIAnalysis}
                  className="px-3.5 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-bold border border-purple-500/40 flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-4 h-4 text-purple-300" />
                  <span>AI Maslahati</span>
                </button>
              </div>
            </div>

            {/* Puzzle List Selector */}
            <div className="glass-strong rounded-2xl p-5 border border-slate-700/60 shadow-xl space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Barcha Taktik Imtihonlar ({puzzles.length})
              </span>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {puzzles.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => loadPuzzle(idx)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                      activePuzzleIdx === idx
                        ? 'bg-indigo-600/30 text-white border border-indigo-500/40'
                        : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate max-w-[200px]">
                      {idx + 1}. {p.title}
                    </span>
                    <span className="text-[11px] text-amber-400 font-mono shrink-0">
                      +{p.points} b
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: BOARD EDITOR & CUSTOM FEN ================= */}
      {activeTab === 'editor' && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Board Setup Editor */}
          <div className="lg:col-span-8 flex flex-col items-center">
            {/* Palette Bar */}
            <div className="w-full max-w-[540px] flex items-center justify-between px-3 py-2 bg-slate-900 rounded-t-2xl border-t border-x border-slate-800 text-xs">
              <span className="font-bold text-slate-300">Toshni tanlang va doskaga bosing:</span>
              <div className="flex items-center gap-1">
                {['P', 'N', 'B', 'R', 'Q', 'K'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setEditorPalettePiece(p)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition ${
                      editorPalettePiece === p ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                {['p', 'n', 'b', 'r', 'q', 'k'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setEditorPalettePiece(p)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition ${
                      editorPalettePiece === p ? 'bg-indigo-600 text-white shadow' : 'bg-slate-950 text-slate-400'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Board */}
            <div
              className={`relative w-full max-w-[540px] aspect-square rounded-b-2xl border-4 ${currentTheme.borderCls} shadow-2xl overflow-hidden`}
              style={{ userSelect: 'none' }}
            >
              <div className="w-full h-full grid grid-rows-8 grid-cols-8">
                {boardMatrix.map((row, r) =>
                  row.map((squareData, c) => {
                    const fileChar = String.fromCharCode(97 + c);
                    const rankNum = 8 - r;
                    const squareKey = `${fileChar}${rankNum}` as Square;
                    const isDark = (r + c) % 2 === 1;
                    const bg = isDark ? currentTheme.darkBg : currentTheme.lightBg;

                    return (
                      <div
                        key={squareKey}
                        onClick={() => {
                          const pieceColor = editorPalettePiece === editorPalettePiece.toUpperCase() ? 'w' : 'b';
                          const pieceType = editorPalettePiece.toLowerCase() as any;
                          chessInstance.put({ type: pieceType, color: pieceColor }, squareKey);
                          setFen(chessInstance.fen());
                          setEditorFen(chessInstance.fen());
                          soundPlayer.playMove();
                        }}
                        className="relative w-full h-full flex items-center justify-center cursor-pointer transition-colors hover:opacity-85"
                        style={{ backgroundColor: bg }}
                      >
                        {squareData && (
                          <ChessPieceIcon
                            type={squareData.type}
                            color={squareData.color}
                            size="w-8 h-8 sm:w-12 sm:h-12"
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Editor Action Controls */}
          <div className="lg:col-span-4 space-y-4">
            <div className="glass-strong rounded-2xl p-5 border border-slate-700/60 shadow-xl space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                FEN Kodi & Pozitsiya Boshqaruvi
              </span>

              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-semibold block">FEN Satri:</label>
                <textarea
                  rows={3}
                  value={editorFen}
                  onChange={(e) => {
                    setEditorFen(e.target.value);
                    try {
                      const c = new Chess(e.target.value);
                      setChessInstance(c);
                      setFen(c.fen());
                    } catch {
                      /* invalid fen */
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 block">Tezkor Andazalar:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const c = new Chess();
                      setChessInstance(c);
                      setFen(c.fen());
                      setEditorFen(c.fen());
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold text-center transition"
                  >
                    Boshlang'ich Holat
                  </button>
                  <button
                    onClick={() => {
                      chessInstance.clear();
                      setFen(chessInstance.fen());
                      setEditorFen(chessInstance.fen());
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold text-center transition"
                  >
                    Bo'sh Doska
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    setActiveTab('chess_ai');
                    setGameStatus("Maxsus pozitsiyadan Botga qarshi o'yin boshlandi!");
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Play className="w-4 h-4" />
                  <span>▶ Ushbu Pozitsiyadan Botga Qarshi O'ynash</span>
                </button>

                <button
                  onClick={requestAIAnalysis}
                  className="w-full py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-purple-500/40 transition"
                >
                  <Sparkles className="w-4 h-4 text-purple-300" />
                  <span>🤖 Pozitsiyani AI orqali tahlil qilish</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setNewExamFen(fen);
                      setShowAddExamModal(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-500/40 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>💾 Taktik Savol Sifatida Saqlash</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: TOURNAMENTS (SHAXMAT & SHASHKA) ================= */}
      {activeTab === 'tournaments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span>Shaxmat va Shashka Chempionatlari</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                O'quvchilar o'rtasidagi onlayn turnirlarda qatnashing va reyting ballarini qo'lga kiriting
              </p>
            </div>

            <button
              onClick={() => setShowCreateTournament(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi Turnir Tashkil Qilish</span>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {tournaments.map((t) => (
              <div
                key={t.id}
                className="glass-strong rounded-2xl p-6 border border-slate-700/60 shadow-xl space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${
                        t.gameType === 'shaxmat'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {t.gameType === 'shaxmat' ? 'Shaxmat' : 'Shashka'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'registration'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : t.status === 'ongoing'
                          ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {t.status === 'registration'
                        ? "Ro'yxatga olish ochiq"
                        : t.status === 'ongoing'
                        ? 'Davom etmoqda'
                        : 'Yakunlangan'}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white">{t.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {t.formatLabel}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {t.participants.length} ishtirokchi
                    </span>
                    <span className="flex items-center gap-1 text-amber-400 font-semibold">
                      <Award className="w-3.5 h-3.5" />
                      {t.prize}
                    </span>
                  </div>
                </div>

                {/* Standings Table Preview */}
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Turnir Jadvali (Yetakchilar):
                  </span>
                  {t.participants.slice(0, 3).map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 text-center font-bold text-slate-500">
                          {idx + 1}.
                        </span>
                        <span className="font-semibold text-slate-200">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({p.elo})</span>
                      </div>
                      <span className="font-bold text-indigo-400">{p.points} ochko</span>
                    </div>
                  ))}
                </div>

                {/* Join Button */}
                <button
                  onClick={() => handleJoinTournament(t.id)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Award className="w-4 h-4 text-yellow-300" />
                  <span>Turnirga Yozilish (Qatnashish)</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: SHASHKA (CHECKERS) ================= */}
      {activeTab === 'shashka' && (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col items-center">
            <div className="w-full max-w-[500px] flex items-center justify-between px-3 py-2 bg-slate-900 rounded-t-2xl border-t border-x border-slate-800 text-xs">
              <span className="font-bold text-white">Shashka (Urish majburiy qoidasi)</span>
              <span className="text-amber-400 font-mono font-bold">{shashkaMessage}</span>
            </div>

            <div className="w-full max-w-[500px] aspect-square rounded-b-2xl border-4 border-slate-700 shadow-2xl overflow-hidden grid grid-rows-8 grid-cols-8">
              {shashkaBoard.map((row, r) =>
                row.map((cell, c) => {
                  const isDark = (r + c) % 2 === 1;
                  const isSelected = shashkaSelected && shashkaSelected[0] === r && shashkaSelected[1] === c;

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleShashkaClick(r, c)}
                      className={`relative w-full h-full flex items-center justify-center cursor-pointer transition ${
                        isDark ? 'bg-amber-900/70' : 'bg-amber-100'
                      } ${isSelected ? 'ring-4 ring-indigo-500 inset-0' : ''}`}
                    >
                      {cell && (
                        <div
                          className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 border-2 ${
                            cell.startsWith('w')
                              ? 'bg-slate-100 border-slate-300 text-slate-900 shadow-black/40'
                              : 'bg-rose-700 border-rose-900 text-white shadow-black/60'
                          }`}
                        >
                          {cell.includes('K') && <span className="font-black text-sm">👑</span>}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="glass-strong rounded-2xl p-5 border border-slate-700/60 shadow-xl space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Shashka Qoidalari
              </span>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>Har bir tosh faqat qora kataklar bo'ylab diagonal siljiydi.</li>
                <li>Raqib toshini urish (sakrab o'tish) <strong>majburiydir</strong>.</li>
                <li>Doskaning oxirgi qatoriga yetgan tosh Damka (👑) bo'ladi.</li>
              </ul>

              <button
                onClick={() => {
                  const b: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
                  for (let r = 0; r < 3; r++) {
                    for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) b[r][c] = 'b';
                  }
                  for (let r = 5; r < 8; r++) {
                    for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) b[r][c] = 'w';
                  }
                  setShashkaBoard(b);
                  setShashkaSelected(null);
                  setShashkaTurn('w');
                  setShashkaMessage("O'yin qaytadan boshlandi!");
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition"
              >
                <RotateCcw className="w-4 h-4 text-indigo-400" />
                <span>Doskani Yangilash</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: GEMINI AI GRANDMASTER ANALYSIS ================= */}
      {aiAnalysisModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-strong max-w-2xl w-full rounded-3xl p-6 sm:p-8 border border-purple-500/40 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-white">
                    Gemini Grossmeyster Tahlili
                  </h3>
                  <p className="text-xs text-purple-300">
                    Pozitsiyaning chuqur taktik va strategik ekspertizasi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAiAnalysisModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {aiAnalysisLoading ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-purple-200 font-medium">
                  AI Grossmeyster pozitsiya variantlarini hisoblamoqda...
                </p>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                {aiAnalysisText}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setAiAnalysisModal(false)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
              >
                Tushundim, davom etish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE TOURNAMENT ================= */}
      {showCreateTournament && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-strong max-w-lg w-full rounded-3xl p-6 border border-amber-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Yangi Turnir Tashkil Qilish</span>
              </h3>
              <button
                onClick={() => setShowCreateTournament(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTournamentSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Turnir Nomi:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Yosh Shaxmatchilar Bahor Chempionati"
                  value={newTourTitle}
                  onChange={(e) => setNewTourTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    O'yin Turi:
                  </label>
                  <select
                    value={newTourType}
                    onChange={(e) => setNewTourType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="shaxmat">Shaxmat</option>
                    <option value="shashka">Shashka</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold block mb-1">
                    Vaqt Nazorati:
                  </label>
                  <select
                    value={newTourFormat}
                    onChange={(e) => setNewTourFormat(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="blitz_3_2">3 min + 2 sek (Blitz)</option>
                    <option value="rapid_10">10 min (Rapid)</option>
                    <option value="classical_15_10">15 min + 10 sek (Klassik)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Mukofot Jamg'armasi / Sovg'a:
                </label>
                <input
                  type="text"
                  value={newTourPrize}
                  onChange={(e) => setNewTourPrize(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTournament(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-xs shadow-md"
                >
                  Turnirni E'lon Qilish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADMIN ADD EXAM QUESTION ================= */}
      {showAddExamModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-strong max-w-lg w-full rounded-3xl p-6 border border-amber-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Yangi Taktik Savol Qo'shish</span>
              </h3>
              <button
                onClick={() => setShowAddExamModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newExamTitle.trim() || !newExamMove.trim()) return;
                const newP: TacticalPuzzle = {
                  id: `puz-${Date.now()}`,
                  title: newExamTitle.trim(),
                  category: 'shaxmat',
                  fen: newExamFen || fen,
                  task: newExamTask.trim() || "Eng to'g'ri taktik yurishni toping:",
                  targetMove: newExamMove.trim(),
                  fullSolution: newExamMove.trim(),
                  explanation: newExamExplanation.trim() || "Taktik kombinatsiya orqali ustunlik qo'lga kiritiladi.",
                  points: 20,
                };
                setPuzzles((prev) => [newP, ...prev]);
                setShowAddExamModal(false);
                soundPlayer.playSuccess();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Mavzu / Savol Nomi:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Oxirgi gorizontal moti"
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  FEN Kodi:
                </label>
                <input
                  type="text"
                  required
                  value={newExamFen}
                  onChange={(e) => setNewExamFen(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-indigo-300"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Kutilayotgan To'g'ri Yurish (SAN, masalan Rd8# yoki Qh7+):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rd8#"
                  value={newExamMove}
                  onChange={(e) => setNewExamMove(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold block mb-1">
                  Tushuntirish / Yechim tahlili:
                </label>
                <textarea
                  rows={2}
                  value={newExamExplanation}
                  onChange={(e) => setNewExamExplanation(e.target.value)}
                  placeholder="Nima uchun bu yurish to'g'ri ekanligini yozing..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExamModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md"
                >
                  Savolni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
