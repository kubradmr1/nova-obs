import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { cx } from '@/utils/cx';

interface QrCodeImageProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrCodeImage({ value, size = 220, className }: QrCodeImageProps) {
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void QRCode.toDataURL(value, {
      margin: 1,
      width: size * 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0e0d1f', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) {
          setSource(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSource(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  return (
    <div
      className={cx(
        'flex items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-sm',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {source ? (
        <img src={source} alt="" width={size} height={size} className="h-full w-full" />
      ) : (
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      )}
    </div>
  );
}
