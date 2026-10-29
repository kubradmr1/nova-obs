import { ArrowLeft, CheckCheck, MessagesSquare, Send, Sparkles } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Avatar } from '@/components/ui/Avatar';
import type { Chat, MessageSide } from '@/types/messaging';
import { cx } from '@/utils/cx';

const timeFormatter = new Intl.DateTimeFormat('tr-TR', {
  hour: '2-digit',
  minute: '2-digit',
});

const dayFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = startOfDay(new Date());
  const day = startOfDay(date);

  if (day === today) {
    return 'Bugün';
  }

  if (today - day === 86_400_000) {
    return 'Dün';
  }

  return dayFormatter.format(date);
}

interface MessageThreadProps {
  chat: Chat;
  viewer: MessageSide;
  peerName: string;
  peerSubtitle: string;
  onSend: (text: string) => void;
  onBack?: () => void;
  quickReplies?: readonly string[];
}

export function MessageThread({
  chat,
  viewer,
  peerName,
  peerSubtitle,
  onSend,
  onBack,
  quickReplies = [],
}: MessageThreadProps) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft('');
  }, [chat.id]);

  useEffect(() => {
    const node = scrollRef.current;

    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [chat.id, chat.messages.length]);

  const submit = () => {
    const text = draft.trim();

    if (!text) {
      return;
    }

    onSend(text);
    setDraft('');
    inputRef.current?.focus();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  const applyQuickReply = (reply: string) => {
    setDraft(reply);
    inputRef.current?.focus();
  };

  const bubbles: ReactNode[] = [];
  let lastDayKey = '';

  for (const message of chat.messages) {
    const dayKey = new Date(message.sentAt).toDateString();

    if (dayKey !== lastDayKey) {
      bubbles.push(
        <div key={`day-${message.id}`} className="flex justify-center py-1">
          <span className="rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1 text-[8.5px] font-semibold uppercase tracking-[0.12em] text-slate-400 backdrop-blur dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-500">
            {dayLabel(message.sentAt)}
          </span>
        </div>,
      );
      lastDayKey = dayKey;
    }

    const isMine = message.from === viewer;

    bubbles.push(
      <div key={message.id} className={cx('flex', isMine ? 'justify-end' : 'justify-start')}>
        <div
          className={cx(
            'max-w-[85%] rounded-[20px] px-3.5 py-2 text-[11.5px] leading-relaxed shadow-sm sm:max-w-[72%]',
            isMine
              ? 'rounded-br-md bg-[linear-gradient(135deg,#7c5cff,#5f6bff)] text-white shadow-[0_12px_28px_-18px_rgba(124,92,255,0.9)]'
              : 'rounded-bl-md border border-slate-200/80 bg-white/90 text-slate-700 dark:border-white/[0.08] dark:bg-white/[0.07] dark:text-slate-100',
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
          <div
            className={cx(
              'mt-1 flex items-center justify-end gap-1 text-[8.5px]',
              isMine ? 'text-white/70' : 'text-slate-400 dark:text-slate-500',
            )}
          >
            {timeFormatter.format(new Date(message.sentAt))}
            {isMine ? <CheckCheck className="h-3 w-3" aria-hidden /> : null}
          </div>
        </div>
      </div>,
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-slate-200/70 px-3 py-2.5 dark:border-white/[0.07] lg:px-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Görüşme listesine dön"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
        <Avatar name={peerName} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-semibold text-slate-900 dark:text-white">
            {peerName}
          </p>
          <p className="flex items-center gap-1.5 truncate text-[9.5px] text-slate-400 dark:text-slate-500">
            <span className="h-1 w-1 shrink-0 rounded-full bg-emerald-500" aria-hidden />
            {peerSubtitle}
          </p>
        </div>
        <span className="hidden rounded-full border border-brand-200/70 bg-brand-50/80 px-2 py-0.5 text-[9px] font-bold tracking-[0.06em] text-brand-600 md:inline-flex dark:border-brand-400/20 dark:bg-brand-500/10 dark:text-brand-300">
          {chat.courseCode}
        </span>
      </div>

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label={`${peerName} ile sohbet`}
        className="flex-1 space-y-2 overflow-y-auto px-3 py-3 sm:px-4 dark:bg-white/[0.01]"
      >
        {chat.messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
              <MessagesSquare className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
              Bu sohbet henüz başlamadı
            </p>
            <p className="max-w-[260px] text-[10.5px] leading-relaxed text-slate-400 dark:text-slate-500">
              {viewer === 'student'
                ? 'İlk mesajı yazarak hocanla iletişime geçebilirsin.'
                : 'Öğrenciye ilk mesajı sen yazarak görüşmeyi başlatabilirsin.'}
            </p>
          </div>
        ) : (
          bubbles
        )}
      </div>

      <form onSubmit={handleSubmit} className="shrink-0 border-t border-slate-200/70 px-3 py-2.5 dark:border-white/[0.07] sm:px-4">
        {quickReplies.length > 0 ? (
          <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <Sparkles className="h-3 w-3 shrink-0 text-brand-500 dark:text-brand-300" aria-hidden />
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => applyQuickReply(reply)}
                className="shrink-0 rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1 text-[9.5px] font-medium text-slate-500 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-400 dark:hover:border-brand-400/40 dark:hover:text-brand-300"
              >
                {reply}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex items-end gap-2 rounded-2xl border border-slate-200/90 bg-white/80 p-1.5 pl-3 transition-all duration-200 focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/10 dark:border-white/10 dark:bg-white/[0.04]">
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesajını yaz…"
            aria-label="Mesaj yaz"
            className="max-h-28 min-h-[36px] flex-1 resize-none bg-transparent py-2 text-[12px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={draft.trim().length === 0}
            aria-label="Mesajı gönder"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#7c5cff,#5f6bff)] text-white shadow-[0_10px_24px_-12px_rgba(124,92,255,0.9)] transition-all duration-200 hover:scale-[1.04] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
          >
            <Send className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[8.5px] text-slate-300 dark:text-slate-600">
          Enter ile gönder · Shift + Enter yeni satır
        </p>
      </form>
    </div>
  );
}
