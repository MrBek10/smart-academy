import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, ShieldCheck, ShieldAlert, CheckCircle2, Lock, X } from 'lucide-react';

export type CaptchaType = 'math' | 'text' | 'slide';

interface CaptchaProps {
  onVerify: (verified: boolean) => void;
  label?: string;
  defaultType?: CaptchaType;
  compact?: boolean;
}

export default function Captcha({
  onVerify,
  label = 'Xavfsizlik tekshiruvi (Botlarga qarshi)',
  defaultType = 'math',
  compact = false,
}: CaptchaProps) {
  const [type, setType] = useState<CaptchaType>(defaultType);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(false);
  const [answer, setAnswer] = useState('');

  // Math challenge state
  const [mathA, setMathA] = useState(0);
  const [mathB, setMathB] = useState(0);
  const [mathOp, setMathOp] = useState<'+' | '-' | '*'>('+');

  // Text canvas state
  const [textCode, setTextCode] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Slider puzzle state
  const [sliderPos, setSliderPos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const generate = useCallback(() => {
    setVerified(false);
    onVerify(false);
    setAnswer('');
    setError(false);
    setSliderPos(0);

    if (type === 'math') {
      const ops: ('+' | '-' | '*')[] = ['+', '-', '*'];
      const chosenOp = ops[Math.floor(Math.random() * ops.length)];
      setMathOp(chosenOp);

      if (chosenOp === '*') {
        setMathA(Math.floor(Math.random() * 8) + 2);
        setMathB(Math.floor(Math.random() * 8) + 2);
      } else if (chosenOp === '-') {
        const a = Math.floor(Math.random() * 30) + 10;
        const b = Math.floor(Math.random() * a);
        setMathA(a);
        setMathB(b);
      } else {
        setMathA(Math.floor(Math.random() * 25) + 3);
        setMathB(Math.floor(Math.random() * 25) + 3);
      }
    } else if (type === 'text') {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 5; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      setTextCode(code);
    }
  }, [type, onVerify]);

  useEffect(() => {
    generate();
  }, [generate]);

  // Render text canvas with noisy background for bot resistance
  useEffect(() => {
    if (type !== 'text' || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Dark sleek background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 160, 48);

    // Grid / noise lines
    const colors = ['#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fbbf24'];
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)] + '55';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 160, Math.random() * 48);
      ctx.lineTo(Math.random() * 160, Math.random() * 48);
      ctx.stroke();
    }

    // Letters
    for (let i = 0; i < textCode.length; i++) {
      ctx.font = `bold ${20 + Math.random() * 4}px monospace`;
      ctx.fillStyle = colors[i % colors.length];
      const x = 16 + i * 26;
      const y = 32 + (Math.random() * 6 - 3);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillText(textCode[i], 0, 0);
      ctx.restore();
    }
  }, [textCode, type]);

  const checkAnswer = () => {
    let expected = '';
    if (type === 'math') {
      let res = 0;
      if (mathOp === '+') res = mathA + mathB;
      else if (mathOp === '-') res = mathA - mathB;
      else if (mathOp === '*') res = mathA * mathB;
      expected = String(res);
    } else if (type === 'text') {
      expected = textCode.toUpperCase();
    }

    if (answer.trim().toUpperCase() === expected) {
      setVerified(true);
      setError(false);
      onVerify(true);
    } else {
      setError(true);
      onVerify(false);
      setTimeout(generate, 600);
    }
  };

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || verified) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pos = Math.max(0, Math.min(rect.width - 40, clientX - rect.left - 20));
    setSliderPos(pos);

    if (pos >= rect.width - 46) {
      setVerified(true);
      setIsDragging(false);
      setError(false);
      onVerify(true);
    }
  };

  if (verified) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm font-semibold shadow-sm animate-in fade-in">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <span>Bot tekshiruvi muvaffaqiyatli o'tdi</span>
      </div>
    );
  }

  return (
    <div className={`glass rounded-2xl p-4 border border-slate-700/70 space-y-3 ${compact ? 'max-w-sm' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setType((t) => (t === 'math' ? 'text' : t === 'text' ? 'slide' : 'math'));
            }}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 transition"
          >
            {type === 'math' ? 'Misol' : type === 'text' ? 'Kodsifat' : 'Surish'}
          </button>
          <button
            type="button"
            onClick={generate}
            className="p-1 text-slate-400 hover:text-white rounded transition"
            title="Yangilash"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {type === 'math' && (
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700 font-mono text-base font-bold text-indigo-200 tabular-nums">
            {mathA} {mathOp} {mathB} = ?
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
            placeholder="Javob"
            className="w-24 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-500 text-white font-mono text-center text-sm outline-none transition"
          />
          <button
            type="button"
            onClick={checkAnswer}
            disabled={!answer.trim()}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition shadow-sm"
          >
            Tasdiqlash
          </button>
        </div>
      )}

      {type === 'text' && (
        <div className="flex flex-wrap items-center gap-2.5">
          <canvas
            ref={canvasRef}
            width={160}
            height={48}
            className="rounded-xl border border-slate-700 shadow-inner select-none cursor-pointer"
            onClick={generate}
            title="Boshqa kod"
          />
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
            placeholder="Kodni yozing"
            className="w-28 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-indigo-500 text-white font-mono text-center uppercase tracking-wider text-sm outline-none transition"
          />
          <button
            type="button"
            onClick={checkAnswer}
            disabled={!answer.trim()}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition shadow-sm"
          >
            Tasdiqlash
          </button>
        </div>
      )}

      {type === 'slide' && (
        <div
          className="relative h-11 bg-slate-900/90 rounded-xl border border-slate-700 overflow-hidden select-none cursor-pointer flex items-center justify-center px-4"
          onMouseMove={handleSliderMove}
          onTouchMove={handleSliderMove}
          onMouseUp={() => setIsDragging(false)}
          onTouchEnd={() => setIsDragging(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 bg-indigo-600/30 transition-all pointer-events-none"
            style={{ width: `${sliderPos + 40}px` }}
          />
          <span className="text-xs font-medium text-slate-300 pointer-events-none">
            Tasdiqlash uchun o'ngga suring →
          </span>
          <div
            className="absolute left-1 top-1 bottom-1 w-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing transition-transform"
            style={{ transform: `translateX(${sliderPos}px)` }}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
          >
            <Lock className="w-4 h-4" />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium pt-1">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Noto'g'ri javob kiritildi. Qaytadan urinib ko'ring.</span>
        </div>
      )}
    </div>
  );
}

// Modal wrapper for critical actions like exam submission or entering quiet exam room
export function CaptchaModal({
  isOpen,
  title = "Xavfsizlik tekshiruvi",
  description = "Ushbu amalni bajarishdan avval siz inson ekanligingizni tasdiqlang.",
  onSuccess,
  onClose,
}: {
  isOpen: boolean;
  title?: string;
  description?: string;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [verified, setVerified] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-strong rounded-3xl max-w-md w-full p-6 shadow-2xl border border-indigo-500/30 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">{description}</p>

        <Captcha
          onVerify={(ok) => {
            setVerified(ok);
            if (ok) {
              setTimeout(() => {
                onSuccess();
              }, 400);
            }
          }}
        />

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Bekor qilish
          </button>
          {verified && (
            <button
              onClick={onSuccess}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow"
            >
              Davom etish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
