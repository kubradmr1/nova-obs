import { CheckCheck, Inbox, MessageSquare, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MessageThread } from '@/components/messaging/MessageThread';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { DEFAULT_ACADEMICIAN_ID, getAcademicianIdForSession } from '@/data/academicians';
import { useAuth } from '@/hooks/useAuth';
import { useMessaging } from '@/hooks/useMessaging';
import type { Chat } from '@/types/messaging';
import { cx } from '@/utils/cx';

const ACADEMICIAN_QUICK_REPLIES = [
  'Merhaba, mesajını aldım. En kısa sürede dönüş yapacağım.',
  'Görüşme saatim Salı 14.00–16.00, ofisime uğrayabilirsin.',
  'Notlarını kontrol ettim, teşekkürler.',
];

const timeFormatter = new Intl.DateTimeFormat('tr-TR', {
  hour: '2-digit',
  minute: '2-digit',
});

const shortDateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: '2-digit',
});

function lastActivity(chat: Chat): number {
  const last = chat.messages[chat.messages.length - 1];
  return last ? new Date(last.sentAt).getTime() : 0;
}

function formatListTime(iso: string): string {
  const date = new Date(iso);
  return date.toDateString() === new Date().toDateString()
    ? timeFormatter.format(date)
    : shortDateFormatter.format(date);
}

type InboxFilter = 'all' | 'unread';

export function AcademicianMessagesPage() {
  const { session } = useAuth();
  const { chats, sendMessage, markRead, markAllReadForAcademician } = useMessaging();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InboxFilter>('all');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const academicianId = session
    ? getAcademicianIdForSession(session)
    : DEFAULT_ACADEMICIAN_ID;

  const inboxChats = useMemo(
    () =>
      chats
        .filter((chat) => chat.academicianId === academicianId)
        .sort((a, b) => lastActivity(b) - lastActivity(a)),
    [chats, academicianId],
  );

  const unreadCount = inboxChats.reduce(
    (total, chat) => total + chat.unreadForAcademician,
    0,
  );

  const filteredChats = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR');

    return inboxChats.filter((chat) => {
      if (filter === 'unread' && chat.unreadForAcademician === 0) {
        return false;
      }

      if (!term) {
        return true;
      }

      return [chat.studentName, chat.studentNumber, chat.courseCode, chat.courseName]
        .some((value) => value.toLocaleLowerCase('tr-TR').includes(term));
    });
  }, [inboxChats, filter, search]);

  const activeChat = inboxChats.find((chat) => chat.id === activeChatId) ?? null;

  useEffect(() => {
    if (activeChatId && activeChat && activeChat.unreadForAcademician > 0) {
      markRead(activeChat.id, 'academician');
    }
  }, [activeChatId, activeChat, markRead]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Öğrenci İletişimi"
        title="Mesajlar"
        description="Öğrencilerden gelen soruları buradan yanıtla. Okunmamış mesajlar bildirim olarak işaretlenir; görüşmeyi açtığında otomatik okundu sayılır."
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => markAllReadForAcademician(academicianId)}
            disabled={unreadCount === 0}
            className="px-4 py-2.5 text-[11.5px]"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden />
            Tümünü okundu işaretle
          </Button>
        }
      />

      <Card className="overflow-hidden p-0">
        <div className="grid h-[calc(100dvh-18rem)] min-h-[440px] grid-rows-1 sm:min-h-[540px] lg:h-[calc(100dvh-14rem)] lg:grid-cols-[340px_minmax(0,1fr)]">
          <div
            className={cx(
              'min-h-0 flex-col border-slate-200/70 lg:border-r dark:border-white/[0.07]',
              activeChat ? 'hidden lg:flex' : 'flex',
            )}
          >
            <div className="shrink-0 border-b border-slate-200/70 px-3 py-3 dark:border-white/[0.07]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  Gelen kutusu
                </p>
                {unreadCount > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[8.5px] font-bold text-rose-600 dark:text-rose-300">
                    <span className="h-1 w-1 rounded-full bg-rose-500" aria-hidden />
                    {unreadCount} yeni
                  </span>
                ) : (
                  <span className="text-[8.5px] font-medium text-slate-400 dark:text-slate-500">
                    Tümü okundu
                  </span>
                )}
              </div>

              <div className="mt-2 flex gap-1 rounded-xl bg-slate-100/70 p-1 dark:bg-white/[0.05]">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  aria-pressed={filter === 'all'}
                  className={cx(
                    'flex-1 rounded-lg px-2 py-1 text-[9.5px] font-semibold transition-all',
                    filter === 'all'
                      ? 'bg-white text-slate-800 shadow-sm dark:bg-white/10 dark:text-white'
                      : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300',
                  )}
                >
                  Tümü ({inboxChats.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('unread')}
                  aria-pressed={filter === 'unread'}
                  className={cx(
                    'flex-1 rounded-lg px-2 py-1 text-[9.5px] font-semibold transition-all',
                    filter === 'unread'
                      ? 'bg-white text-slate-800 shadow-sm dark:bg-white/10 dark:text-white'
                      : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300',
                  )}
                >
                  Okunmamış ({unreadCount})
                </button>
              </div>

              <div className="relative mt-2">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  aria-hidden
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Öğrenci veya ders ara…"
                  aria-label="Mesaj kutusunda ara"
                  className="h-9 w-full rounded-xl border border-slate-200/90 bg-white/80 pl-9 pr-3 text-[11px] font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
              {filteredChats.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center">
                  <Inbox className="h-5 w-5 text-slate-300 dark:text-slate-600" aria-hidden />
                  <p className="text-[11.5px] font-semibold text-slate-600 dark:text-slate-300">
                    Mesaj bulunamadı
                  </p>
                  <p className="text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
                    {filter === 'unread'
                      ? 'Okunmamış mesaj kalmadı. Tüm gelen kutusuna göz atabilirsin.'
                      : 'Arama kriterlerine uygun görüşme yok.'}
                  </p>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const last = chat.messages[chat.messages.length - 1];
                  const isActive = chat.id === activeChatId;

                  return (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => setActiveChatId(chat.id)}
                      className={cx(
                        'flex w-full items-start gap-2.5 rounded-2xl px-2.5 py-2.5 text-left transition-colors',
                        isActive
                          ? 'bg-brand-500/10 dark:bg-brand-500/15'
                          : 'hover:bg-slate-100/70 dark:hover:bg-white/[0.05]',
                      )}
                    >
                      <Avatar name={chat.studentName} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">
                            {chat.studentName}
                          </p>
                          {last ? (
                            <span className="shrink-0 text-[8.5px] font-medium text-slate-400 dark:text-slate-500">
                              {formatListTime(last.sentAt)}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="shrink-0 rounded bg-brand-500/10 px-1 py-0.5 text-[8px] font-bold tracking-[0.04em] text-brand-600 dark:text-brand-300">
                            {chat.courseCode}
                          </span>
                          <p className="truncate text-[10px] text-slate-400 dark:text-slate-500">
                            {last
                              ? `${last.from === 'academician' ? 'Sen: ' : ''}${last.text}`
                              : 'Henüz mesaj yok'}
                          </p>
                        </div>
                      </div>
                      {chat.unreadForAcademician > 0 ? (
                        <span className="mt-1 flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-rose-500 px-1 text-[8.5px] font-bold text-white">
                          {chat.unreadForAcademician}
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div
            className={cx(
              'min-h-0 flex-col',
              activeChat ? 'flex' : 'hidden lg:flex',
            )}
          >
            {activeChat ? (
              <MessageThread
                chat={activeChat}
                viewer="academician"
                peerName={activeChat.studentName}
                peerSubtitle={`${activeChat.studentNumber} · ${activeChat.courseName}`}
                quickReplies={ACADEMICIAN_QUICK_REPLIES}
                onSend={(text) => sendMessage(activeChat.id, 'academician', text)}
                onBack={() => setActiveChatId(null)}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
                  <MessageSquare className="h-6 w-6" aria-hidden />
                </span>
                <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                  Bir öğrenci mesajı seç
                </p>
                <p className="max-w-[280px] text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                  Soldaki gelen kutusundan bir görüşme açarak öğrenciye yanıt verebilirsin.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
