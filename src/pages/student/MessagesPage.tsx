import { ChevronRight, Loader2, MessagesSquare, Plus, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MessageThread } from '@/components/messaging/MessageThread';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Notice } from '@/components/ui/Notice';
import { PageHeader } from '@/components/ui/PageHeader';
import { findAcademicianById, findAcademicianByName } from '@/data/academicians';
import { COURSES, STUDENT } from '@/data/student';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { useMessaging } from '@/hooks/useMessaging';
import type { Chat } from '@/types/messaging';
import { cx } from '@/utils/cx';

function lastActivity(chat: Chat): number {
  const last = chat.messages[chat.messages.length - 1];
  return last ? new Date(last.sentAt).getTime() : 0;
}

export function StudentMessagesPage() {
  const { t, formatDate, formatTime } = useI18n();
  const { session } = useAuth();
  const {
    chats,
    sendMessage,
    markRead,
    startConversation,
    isLoading,
    error,
  } = useMessaging();
  const [search, setSearch] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const formatListTime = (iso: string): string => {
    const date = new Date(iso);
    return date.toDateString() === new Date().toDateString()
      ? formatTime(date)
      : formatDate(date, { day: '2-digit', month: '2-digit' });
  };

  const studentKey =
    session?.provider === 'supabase' ? (session.profileId ?? '') : STUDENT.identifier;

  const studentChats = useMemo(
    () =>
      chats
        .filter((chat) => chat.studentId === studentKey)
        .sort((a, b) => lastActivity(b) - lastActivity(a)),
    [chats, studentKey],
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

  const openConversation = async (courseCode: string) => {
    const course = COURSES.find((item) => item.code === courseCode);
    const academician = course ? findAcademicianByName(course.instructor) : undefined;

    if (!course || !academician) {
      return;
    }

    setActionError(null);

    try {
      const chatId = await startConversation({
        studentId: studentKey,
        studentName: session?.provider === 'supabase' ? session.name : STUDENT.name,
        studentNumber:
          session?.provider === 'supabase' ? session.identifier : STUDENT.identifier,
        academicianId: academician.id,
        courseCode: course.code,
        courseName: course.name,
      });

      setActiveChatId(chatId);
      setIsNewChatOpen(false);
      setSearch('');
    } catch (startError) {
      setActionError(
        startError instanceof Error
          ? startError.message
          : t('msg.start.failed'),
      );
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={t('msg.student.eyebrow')}
        title={t('msg.student.title')}
        description={t('msg.student.description')}
        actions={
          <Button
            type="button"
            onClick={() => {
              setActionError(null);
              setIsNewChatOpen(true);
            }}
            className="px-4 py-2.5 text-[12px]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('msg.newChat')}
          </Button>
        }
      />

      {error ? (
        <Notice tone="danger" title={t('msg.connection')}>
          {error}
        </Notice>
      ) : null}

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
                  {t('msg.list.student')}
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
                  placeholder={t('msg.search.placeholder')}
                  aria-label={t('msg.search.label')}
                  className="h-9 w-full rounded-xl border border-slate-200/90 bg-white/80 pl-9 pr-3 text-[11px] font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-500 dark:text-brand-300" aria-hidden />
                  <p className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500">
                    {t('msg.loading.student')}
                  </p>
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-[11.5px] font-semibold text-slate-600 dark:text-slate-300">
                    {t('msg.empty.student.title')}
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
                    {t('msg.empty.student.hint')}
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
                            {academician?.name ?? t('msg.fallback.academician')}
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
                              ? `${last.from === 'student' ? `${t('msg.preview.you')}: ` : ''}${last.text}`
                              : t('msg.preview.empty')}
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
              activeChat ? 'flex' : 'hidden lg:flex',
            )}
          >
            {activeChat ? (
              <MessageThread
                chat={activeChat}
                viewer="student"
                peerName={activeAcademician?.name ?? t('msg.fallback.academician')}
                peerSubtitle={`${activeChat.courseCode} · ${activeChat.courseName}`}
                quickReplies={[
                  t('msg.quick.student.thanks'),
                  t('msg.quick.student.meet'),
                  t('msg.quick.student.project'),
                ]}
                onSend={(text) => sendMessage(activeChat.id, 'student', text)}
                onBack={() => setActiveChatId(null)}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
                  <MessagesSquare className="h-6 w-6" aria-hidden />
                </span>
                <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
                  {t('msg.select.student.title')}
                </p>
                <p className="max-w-[280px] text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                  {t('msg.select.student.hint')}
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
            aria-label={t('msg.newChat.close')}
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
                  {t('msg.newChat')}
                </h2>
                <p className="mt-0.5 text-[10.5px] text-slate-400 dark:text-slate-500">
                  {t('msg.newChat.hint')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewChatOpen(false)}
                aria-label={t('common.close')}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
              {actionError ? (
                <div className="p-1.5">
                  <Notice tone="danger">{actionError}</Notice>
                </div>
              ) : null}
              {COURSES.map((course) => {
                const academician = findAcademicianByName(course.instructor);
                const existing = chats.find(
                  (chat) =>
                    chat.studentId === studentKey &&
                    chat.academicianId === academician?.id &&
                    chat.courseCode === course.code,
                );

                return (
                  <button
                    key={course.code}
                    type="button"
                    onClick={() => void openConversation(course.code)}
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
                      {existing ? t('msg.newChat.ongoing') : t('msg.newChat.new')}
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
