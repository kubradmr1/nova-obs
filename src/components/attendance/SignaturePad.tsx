import { Eraser } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { cx } from '@/utils/cx';

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
}

export function SignaturePad({ onChange, disabled = false }: SignaturePadProps) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const prepareCanvas = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    context.scale(ratio, ratio);
    context.lineWidth = 2.4;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#1c2236';
  }, []);

  useEffect(() => {
    prepareCanvas();

    const handleResize = () => {
      prepareCanvas();
      setHasInk(false);
      onChangeRef.current(null);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [prepareCanvas]);

  const pointFrom = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled) {
      return;
    }

    const context = event.currentTarget.getContext('2d');

    if (!context) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;

    const { x, y } = pointFrom(event);
    context.beginPath();
    context.arc(x, y, 1.1, 0, Math.PI * 2);
    context.fillStyle = '#1c2236';
    context.fill();
    context.beginPath();
    context.moveTo(x, y);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) {
      return;
    }

    const context = event.currentTarget.getContext('2d');

    if (!context) {
      return;
    }

    const { x, y } = pointFrom(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const finishStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) {
      return;
    }

    drawingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setHasInk(true);
    onChangeRef.current(event.currentTarget.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    prepareCanvas();
    setHasInk(false);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[inset_0_1px_2px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#f8f9ff]">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={t('attendance.signaturePad')}
          className={cx(
            'block h-40 w-full touch-none select-none',
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-crosshair',
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
        />
        {hasInk ? null : (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] font-medium text-slate-400">
            {t('attendance.signatureHint')}
          </span>
        )}
        <span className="pointer-events-none absolute inset-x-4 bottom-5 border-b border-dashed border-slate-300/80" />
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
          {t('attendance.signatureNote')}
        </p>
        <button
          type="button"
          onClick={clear}
          disabled={disabled || !hasInk}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[10.5px] font-semibold text-slate-500 transition-colors hover:text-rose-500 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-slate-400 dark:hover:text-rose-300 dark:disabled:text-slate-600"
        >
          <Eraser className="h-3.5 w-3.5" aria-hidden />
          {t('attendance.clearSignature')}
        </button>
      </div>
    </div>
  );
}
