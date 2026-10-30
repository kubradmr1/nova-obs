import { useEffect, useRef } from 'react';
import { useI18n } from '@/hooks/useI18n';

export type ScannerError = 'unsupported' | 'permission' | 'camera';

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

function getDetectorConstructor(): BarcodeDetectorConstructor | null {
  const candidate = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor })
    .BarcodeDetector;

  return candidate ?? null;
}

interface QrScannerProps {
  onDetected: (value: string) => void;
  onError: (reason: ScannerError) => void;
}

export function QrScanner({ onDetected, onError }: QrScannerProps) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectedRef = useRef(false);

  useEffect(() => {
    const Detector = getDetectorConstructor();

    if (!navigator.mediaDevices?.getUserMedia || !Detector) {
      onError('unsupported');
      return;
    }

    let cancelled = false;
    let stream: MediaStream | null = null;
    let detector: BarcodeDetectorLike | null = null;
    let timer = 0;

    const stopStream = () => {
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
    };

    const scan = async () => {
      const video = videoRef.current;

      if (cancelled || !video || !detector || video.readyState < 2) {
        return;
      }

      try {
        const codes = await detector.detect(video);
        const raw = codes.find((code) => code.rawValue)?.rawValue;

        if (raw && !detectedRef.current) {
          detectedRef.current = true;
          onDetected(raw);
        }
      } catch {
        // Kamera karesi okunamadığında bir sonraki turda yeniden denenir.
      }
    };

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });

        if (cancelled) {
          stopStream();
          return;
        }

        const video = videoRef.current;

        if (video) {
          video.srcObject = stream;
          await video.play();
        }

        detector = new Detector({ formats: ['qr_code'] });
        timer = window.setInterval(() => void scan(), 350);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const name = error instanceof DOMException ? error.name : '';
        onError(name === 'NotAllowedError' || name === 'SecurityError' ? 'permission' : 'camera');
      }
    };

    void start();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      stopStream();
    };
  }, [onDetected, onError]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-900 dark:border-white/10">
      <video
        ref={videoRef}
        muted
        playsInline
        className="h-56 w-full object-cover sm:h-64"
        aria-label={t('attendance.scan.searching')}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="relative h-36 w-36 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(8,8,20,0.35)]">
          <span className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 animate-pulse bg-brand-300/90" />
        </div>
      </div>
      <p className="absolute inset-x-0 bottom-3 text-center text-[10.5px] font-medium text-white/80">
        {t('attendance.scan.searching')}
      </p>
    </div>
  );
}
