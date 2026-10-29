import { ChevronRight, MessagesSquare, Plus, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MessageThread } from '@/components/messaging/MessageThread';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { findAcademicianById, findAcademicianByName } from '@/data/academicians';
import { COURSES, STUDENT } from '@/data/student';
import { useMessaging } from '@/hooks/useMessaging';
import type { Chat } from '@/types/messaging';
import { cx } from '@/utils/cx';

const STUDENT_QUICK_REPLIES = [
  'Teşekkürler hocam!',
  'Müsait olduğunuzda görüşebilir miyiz?',
  'Proje teslimi hakkında bir sorum var.',
];

const listTimeFormatter = new Intl.DateTimeFormat('tr-TR', {
  hour: '2-digit',
  minute: '2-digit',
});

const listDateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: '2-digit',
});

function lastActivity(chat: Chat): number {
  const last = chat.messages[chat.messages.length - 1];
  return last ? new Date(last.sentAt).getTime() : 0;
}

function formatListTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  return isToday ? listTimeFormatter.format(date) : listDateFormatter.format(date);
}

export function StudentMessagesPage() {
  const { chats, sendMessage, markRead, startConversation } = useMessaging();
  const [search, setSearch] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  const studentChats = useMemo(
    () =>
      chats
        .filter((chat) => chat.studentId === STUDENT.identifier)
        .sort((a, b) => lastActivity(b) - lastActivity(a)),
    [chats],
  );

  const filteredChats = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR');

    if (!term) {
      return studentChats;
    }

    return studentChats.filter((chat) => {
      const academician = findAcademicianById(chat.academicianId);
      return [academician?.name, chat.courseCode, chat.courseName]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase('tr-TR').includes(term));
    });
  }, [studentChats, search]);

  const activeChat = studentChats.find((chat) => chat.id === activeChatId) ?? null;
  const activeAcademician = activeChat
    ? findAcademicianById(activeChat.academicianId)
    : undefined;

  useEffect(() => {
    if (activeChatId && activeChat && activeChat.unreadForStudent > 0) {
      markRead(activeChat.id, 'student');
    }
  }, [activeChatId, activeChat, markRead]);

  useEffect(() => {
    if (!isNewChatOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNewChatOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isNewChatOpen]);

  const openConversation = (courseCode: string) => {
    const course = COURSES.find((item) => item.code === courseCode);
    const academician = course ? findAcademicianByName(course.instructor) : undefined;

    if (!course || !academician) {
      return;
    }

    const chatId = startConversation({
      studentId: STUDENT.identifier,
      studentName: STUDENT.name,
      studentNumber: STUDENT.identifier,
      academicianId: academician.id,
      courseCode: course.code,
      courseName: course.name,
    });

    setActiveChatId(chatId);
    setIsNewChatOpen(false);
    setSearch('');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Danışman İletişimi"
        title="Mesajlarım"
        description="Dersin akademisyenini seç, konuşma geçmişini gör ve yeni mesaj gönder. Akademisyenlerin yanıtları bu ekrana anında düşer."
        actions={
          <Button
            type="button"
            onClick={() => setIsNewChatOpen(true)}
            className="px-4 py-2.5 text-[12px]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Yeni görüşme
          </Button>
        }
      />

      <Card className="overflow-hidden p-0">
        <div className="grid h-[calc(100dvh-18rem)] min-h-[440px] grid-rows-1 sm:min-h-[540px] lg:h-[calc(100dvh-14rem)] lg:grid-cols-[320px_minmax(0,1fr)]">
          <div
            className={cx(
              'min-h-0 flex-col border-slate-200/70 lg:border-r dark:border-white/[0.07]',
              activeChat ? 'hidden lg:flex' : 'flex',
            )}
          >
            <div className="shrink-0 border-b border-slate-200/70 px-3 py-3 dark:border-white/[0.07]">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                  Görüşmeler
                </p>
                <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[9px] font-bold text-brand-600 dark:text-brand-300">
                  {studentChats.length}
                </span>
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
                  placeholder="Hoca veya ders ara…"
                  aria-label="Görüşme ara"
                  className="h-9 w-full rounded-xl border border-slate-200/90 bg-white/80 pl-9 pr-3 text-[11px] font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
              {filteredChats.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-[11.5px] font-semibold text-slate-600 dark:text-slate-300">
                    Görüşme bulunamadı
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
                    Aramayı temizleyebilir veya yeni bir görüşme başlatabilirsin.
                  </p>
                </div>
              ) : (
                filteredChats.map((chat) => {
                  const academician = findAcademicianById(chat.academicianId);
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
                      <Avatar name={academician?.name ?? chat.academicianId} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">
                            {academician?.name ?? 'Akademisyen'}
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
                              ? `${last.from === 'student' ? 'Sen: ' : ''}${last.text}`
                              : 'Henüz mesaj yok'}
                          </p>
                        </div>
                      </div>
                      {chat.unreadForStudent > 0 ? (
                        <span className="mt-1 flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-rose-500 px-1 text-[8.5px] font-bold text-white">
                          {chat.unreadForStudent}
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
              activeChat && activeAcademician ? 'flex' : 'hidden lg:flex',
            )}
          >
            {activeChat && activeAcademician ? (
              <MessageThread
                chat={activeChat}
                viewer="student"
                peerName={activeAcademician.name}
                peerSubtitle={`${activeChat.courseCode} · ${activeChat.courseName}`}
                quickReplies={STUDENT_QUICK_REPLIES}
                onSend={(text) => sendMessage(activeChat.id, 'student', text)}
                onBack={() => setActiveChatId(null)}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
                  <MessagesSquare className="h-6 w-6" aria-hidden />
                </span>
                <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                  Bir görüşme seç
                </p>
                <p className="max-w-[280px] text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                  Soldaki listeden bir hocayla konuşmaya devam edebilir veya yeni bir görüşme
                  başlatabilirsin.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {isNewChatOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center">
          <button
            type="button"
            aria-label="Yeni görüşme penceresini kapat"
            onClick={() => setIsNewChatOpen(false)}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-chat-title"
            className="relative flex max-h-[82vh] w-full max-w-lg animate-rise flex-col overflow-hidden rounded-[26px] border border-white/70 bg-[#f9faff] shadow-2xl dark:border-white/10 dark:bg-[#0c0b19]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 px-4 py-3.5 dark:border-white/[0.07]">
              <div>
                <h2
                  id="new-chat-title"
                  className="font-display text-[16px] font-bold text-slate-900 dark:text-white"
                >
                  Yeni görüşme
                </h2>
                <p className="mt-0.5 text-[10.5px] text-slate-400 dark:text-slate-500">
                  Bir ders seç, dersin akademisyeniyle sohbeti başlat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewChatOpen(false)}
                aria-label="Kapat"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
              {COURSES.map((course) => {
                const academician = findAcademicianByName(course.instructor);
                const existing = chats.find(
                  (chat) =>
                    chat.studentId === STUDENT.identifier &&
                    chat.academicianId === academician?.id &&
                    chat.courseCode === course.code,
                );

                return (
                  <button
                    key={course.code}
                    type="button"
                    onClick={() => openConversation(course.code)}
                    className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors hover:bg-slate-100/80 dark:hover:bg-white/[0.06]"
                  >
                    <Avatar name={course.instructor} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-semibold text-slate-800 dark:text-slate-100">
                        {course.instructor}
                      </p>
                      <p className="truncate text-[10px] text-slate-400 dark:text-slate-500">
                        {course.code} · {course.name}
                      </p>
                    </div>
                    <span
                      className={cx(
                        'shrink-0 rounded-full px-2 py-0.5 text-[8.5px] font-semibold',
                        existing
                          ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
                          : 'bg-slate-100 text-slate-400 dark:bg-white/[0.06] dark:text-slate-500',
                      )}
                    >
                      {existing ? 'Devam ediyor' : 'Yeni'}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" aria-hidden />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
