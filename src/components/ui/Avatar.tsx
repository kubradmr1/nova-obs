import { cx } from '@/utils/cx';

const PALETTES = [
  'bg-[linear-gradient(140deg,#8b5cf6,#4f46e5)]',
  'bg-[linear-gradient(140deg,#06b6d4,#2563eb)]',
  'bg-[linear-gradient(140deg,#f59e0b,#ef4444)]',
  'bg-[linear-gradient(140deg,#10b981,#0ea5e9)]',
  'bg-[linear-gradient(140deg,#ec4899,#8b5cf6)]',
  'bg-[linear-gradient(140deg,#f97316,#f43f5e)]',
];

const SIZES = {
  sm: 'h-9 w-9 text-[10.5px]',
  md: 'h-10 w-10 text-[12px]',
  lg: 'h-12 w-12 text-[14px]',
} as const;

function initials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => !part.endsWith('.'));

  const selected = parts.length >= 2 ? [parts[0], parts[parts.length - 1]] : parts.slice(0, 1);

  return selected
    .map((part) => part[0]?.toLocaleUpperCase('tr-TR') ?? '')
    .join('');
}

function paletteFor(name: string): string {
  let hash = 0;

  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) % 997;
  }

  return PALETTES[hash % PALETTES.length];
}

interface AvatarProps {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-[0.02em] text-white shadow-[0_10px_24px_-14px_rgba(30,20,80,0.65)]',
        paletteFor(name),
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
