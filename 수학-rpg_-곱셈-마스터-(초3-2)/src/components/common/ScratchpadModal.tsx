import React, { useRef, useState, useEffect } from 'react';
import { Pencil, Eraser, Trash2, X, Check } from 'lucide-react';

interface ScratchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScratchpadModal: React.FC<ScratchpadModalProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#2563EB'); // Blue default
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on client rect
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown' && e.type !== 'touchstart') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = isEraser ? 24 : lineWidth;
    ctx.strokeStyle = isEraser ? '#FFFFFF' : color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
  };

  return (
    <div id="scratchpad-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex flex-col w-full max-w-2xl h-[520px] bg-white rounded-2xl shadow-2xl border-4 border-sky-400 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-sky-500 text-white font-bold">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            <span className="font-rpg text-lg tracking-wide">수학 계산 연습장 (터치/마우스 필기)</span>
          </div>
          <button
            id="btn-close-scratchpad"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-sky-600 active:scale-95 transition-transform"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-slate-100 border-b border-slate-200 text-sm">
          <div className="flex items-center gap-2">
            <button
              id="btn-scratchpad-pen"
              onClick={() => setIsEraser(false)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all ${
                !isEraser ? 'bg-sky-500 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Pencil className="w-4 h-4" />
              펜
            </button>
            <button
              id="btn-scratchpad-eraser"
              onClick={() => setIsEraser(true)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all ${
                isEraser ? 'bg-amber-500 text-white shadow-xs' : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Eraser className="w-4 h-4" />
              지우개
            </button>

            {/* Colors */}
            {!isEraser && (
              <div className="flex items-center gap-1.5 ml-2">
                {['#1E293B', '#2563EB', '#DC2626', '#16A34A'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      color === c ? 'scale-125 border-slate-800 shadow-xs' : 'border-white'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-scratchpad-clear"
              onClick={clearCanvas}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold bg-rose-100 text-rose-700 hover:bg-rose-200 active:scale-95 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              모두 지우기
            </button>
            <button
              id="btn-scratchpad-done"
              onClick={onClose}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg font-bold bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-xs"
            >
              <Check className="w-4 h-4" />
              완료
            </button>
          </div>
        </div>

        {/* Canvas Area with Math Grid Background */}
        <div className="relative flex-1 bg-white touch-none cursor-crosshair">
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(#94A3B8 1px, transparent 1px), linear-gradient(90deg, #94A3B8 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};
