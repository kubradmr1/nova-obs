import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MessagingContext } from '@/context/messaging-context';
import { findAcademicianById } from '@/data/academicians';
import { supabase } from '@/lib/supabase';
import type { SessionUser } from '@/types/auth';
import type { Chat, ChatMessage, MessageSide, StartConversationInput } from '@/types/messaging';
import type {
  ConversationReadRecord,
  ConversationRecord,
  MessageRecord,
} from '@/types/supabase';
import { translateStored } from '@/utils/i18nRuntime';

const READ_DEBOUNCE_MS = 350;
const REFRESH_DEBOUNCE_MS = 300;

function mapMessage(row: MessageRecord): ChatMessage {
  return {
    id: row.id,
    from: row.sender_role,
    text: row.body,
    sentAt: row.created_at,
  };
}

function countUnread(
  messages: ChatMessage[],
  lastReadAt: string | undefined,
  viewer: MessageSide,
): number {
  const threshold = lastReadAt ? new Date(lastReadAt).getTime() : 0;

  return messages.filter(
    (message) =>
      message.from !== viewer && new Date(message.sentAt).getTime() > threshold,
  ).length;
}

function describeLoadError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : '';

  if (/row-level security|permission denied/i.test(message)) {
    return translateStored('msg.error.permissionRead');
  }

  if (/relation .* does not exist|schema cache|does not exist/i.test(message)) {
    return translateStored('msg.error.tablesMissing');
  }

  if (/failed to fetch|network/i.test(message)) {
    return translateStored('msg.error.network');
  }

  return translateStored('msg.error.loadFailed');
}

function describeSendError(message: string): string {
  if (/row-level security|permission denied/i.test(message)) {
    return translateStored('msg.error.sendPermission');
  }

  if (/failed to fetch|network/i.test(message)) {
    return translateStored('msg.error.connect');
  }

  if (/check constraint|char_length/i.test(message)) {
    return translateStored('msg.error.length');
  }

  return translateStored('msg.error.sendFailed');
}

interface SupabaseMessagingProviderProps {
  session: SessionUser;
  children: ReactNode;
}

export function SupabaseMessagingProvider({
  session,
  children,
}: SupabaseMessagingProviderProps) {
  const profileId = session.profileId ?? '';
  const viewerSide: MessageSide = session.role === 'academic' ? 'academician' : 'student';

  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chatsRef = useRef<Chat[]>([]);
  const readsRef = useRef<Map<string, string>>(new Map());
  const readTimersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    const timers = readTimersRef.current;

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const loadAll = useCallback(
    async (silent = false) => {
      const client = supabase;

      if (!client || !profileId) {
        setIsLoading(false);
        return;
      }

      if (!silent) {
        setIsLoading(true);
      }

      try {
        const [conversationsResult, readsResult] = await Promise.all([
          client.from('conversations').select('*').order('created_at', { ascending: true }),
          client.from('conversation_reads').select('*').eq('profile_id', profileId),
        ]);

        if (conversationsResult.error) {
          throw conversationsResult.error;
        }

        if (readsResult.error) {
          throw readsResult.error;
        }

        const conversationRows = (conversationsResult.data ?? []) as ConversationRecord[];
        const readRows = (readsResult.data ?? []) as ConversationReadRecord[];
        const reads = new Map(readRows.map((row) => [row.conversation_id, row.last_read_at]));

        readsRef.current = reads;

        let messageRows: MessageRecord[] = [];

        if (conversationRows.length > 0) {
          const { data, error: messagesError } = await client
            .from('messages')
            .select('*')
            .in(
              'conversation_id',
              conversationRows.map((row) => row.id),
            )
            .order('created_at', { ascending: true });

          if (messagesError) {
            throw messagesError;
          }

          messageRows = (data ?? []) as MessageRecord[];
        }

        const messagesByConversation = new Map<string, ChatMessage[]>();

        for (const row of messageRows) {
          const list = messagesByConversation.get(row.conversation_id) ?? [];
          list.push(mapMessage(row));
          messagesByConversation.set(row.conversation_id, list);
        }

        setChats(
          conversationRows.map((row) => {
            const chatMessages = messagesByConversation.get(row.id) ?? [];
            const viewerUnread = countUnread(chatMessages, reads.get(row.id), viewerSide);

            return {
              id: row.id,
              studentId: row.student_id,
              studentName: row.student_name,
              studentNumber: row.student_number,
              academicianId: row.academician_key,
              courseCode: row.course_code,
              courseName: row.course_name,
              messages: chatMessages,
              unreadForStudent: viewerSide === 'student' ? viewerUnread : 0,
              unreadForAcademician: viewerSide === 'academician' ? viewerUnread : 0,
            };
          }),
        );
        setError(null);
      } catch (loadError) {
        setError(describeLoadError(loadError));
      } finally {
        setIsLoading(false);
      }
    },
    [profileId, viewerSide],
  );

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const client = supabase;

    if (!client || !profileId) {
      return;
    }

    let isActive = true;
    let channel: RealtimeChannel | null = null;
    let refreshTimer: number | null = null;

    const scheduleRefresh = () => {
      if (refreshTimer !== null) {
        window.clearTimeout(refreshTimer);
      }

      refreshTimer = window.setTimeout(() => {
        void loadAll(true);
      }, REFRESH_DEBOUNCE_MS);
    };

    const handleMessageInsert = (
      payload: RealtimePostgresChangesPayload<MessageRecord>,
    ) => {
      const row = payload.new as MessageRecord | null;

      if (!row?.id || !row.conversation_id) {
        return;
      }

      if (!chatsRef.current.some((chat) => chat.id === row.conversation_id)) {
        scheduleRefresh();
        return;
      }

      setChats((current) =>
        current.map((chat) => {
          if (chat.id !== row.conversation_id) {
            return chat;
          }

          if (chat.messages.some((message) => message.id === row.id)) {
            return chat;
          }

          const isViewerMessage = row.sender_role === viewerSide;

          return {
            ...chat,
            messages: [...chat.messages, mapMessage(row)],
            unreadForStudent:
              viewerSide === 'student' && !isViewerMessage
                ? chat.unreadForStudent + 1
                : chat.unreadForStudent,
            unreadForAcademician:
              viewerSide === 'academician' && !isViewerMessage
                ? chat.unreadForAcademician + 1
                : chat.unreadForAcademician,
          };
        }),
      );
    };

    const handleMessageDelete = (
      payload: RealtimePostgresChangesPayload<MessageRecord>,
    ) => {
      const old = payload.old as Partial<MessageRecord> | null;

      if (!old?.id) {
        return;
      }

      setChats((current) =>
        current.map((chat) => {
          if (!chat.messages.some((message) => message.id === old.id)) {
            return chat;
          }

          return {
            ...chat,
            messages: chat.messages.filter((message) => message.id !== old.id),
          };
        }),
      );
    };

    const handleConversationChange = () => {
      scheduleRefresh();
    };

    const start = async () => {
      const { data } = await client.auth.getSession();
      await client.realtime.setAuth(data.session?.access_token ?? null);

      if (!isActive) {
        return;
      }

      channel = client
        .channel(`nova-obs-messages-${profileId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          handleMessageInsert,
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'messages' },
          handleMessageDelete,
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'conversations' },
          handleConversationChange,
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'conversations' },
          handleConversationChange,
        )
        .subscribe();
    };

    void start();

    return () => {
      isActive = false;

      if (refreshTimer !== null) {
        window.clearTimeout(refreshTimer);
      }

      if (channel) {
        void client.removeChannel(channel);
      }
    };
  }, [loadAll, profileId, viewerSide]);

  const sendMessage = useCallback(
    async (chatId: string, from: MessageSide, text: string) => {
      const client = supabase;
      const trimmed = text.trim();

      if (!client) {
        throw new Error(translateStored('msg.error.notConfigured'));
      }

      if (!trimmed) {
        return;
      }

      const { data, error: insertError } = await client
        .from('messages')
        .insert({
          conversation_id: chatId,
          sender_id: profileId,
          sender_role: from,
          body: trimmed.slice(0, 2000),
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('Mesaj gönderilemedi:', insertError.message);
        throw new Error(describeSendError(insertError.message));
      }

      const row = data as MessageRecord;

      setChats((current) =>
        current.map((chat) => {
          if (chat.id !== chatId) {
            return chat;
          }

          if (chat.messages.some((message) => message.id === row.id)) {
            return chat;
          }

          return {
            ...chat,
            messages: [...chat.messages, mapMessage(row)],
          };
        }),
      );
    },
    [profileId],
  );

  const markRead = useCallback(
    (chatId: string, viewer: MessageSide) => {
      const client = supabase;
      const timestamp = new Date().toISOString();

      readsRef.current.set(chatId, timestamp);

      setChats((current) =>
        current.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                unreadForStudent:
                  viewer === 'student' ? 0 : chat.unreadForStudent,
                unreadForAcademician:
                  viewer === 'academician' ? 0 : chat.unreadForAcademician,
              }
            : chat,
        ),
      );

      if (!client) {
        return;
      }

      const existing = readTimersRef.current.get(chatId);

      if (existing) {
        window.clearTimeout(existing);
      }

      const timer = window.setTimeout(() => {
        readTimersRef.current.delete(chatId);

        void client
          .from('conversation_reads')
          .upsert(
            {
              conversation_id: chatId,
              profile_id: profileId,
              last_read_at: timestamp,
            },
            { onConflict: 'conversation_id,profile_id' },
          )
          .then(({ error: upsertError }) => {
            if (upsertError) {
              console.error('Okundu bilgisi kaydedilemedi:', upsertError.message);
            }
          });
      }, READ_DEBOUNCE_MS);

      readTimersRef.current.set(chatId, timer);
    },
    [profileId],
  );

  const markAllReadForAcademician = useCallback(
    (academicianId: string) => {
      chats
        .filter(
          (chat) =>
            chat.academicianId === academicianId && chat.unreadForAcademician > 0,
        )
        .forEach((chat) => markRead(chat.id, 'academician'));
    },
    [chats, markRead],
  );

  const startConversation = useCallback(
    async (input: StartConversationInput): Promise<string> => {
      const client = supabase;

      if (!client) {
        throw new Error(translateStored('msg.error.notConfigured'));
      }

      const existing = chats.find(
        (chat) =>
          chat.studentId === profileId &&
          chat.academicianId === input.academicianId &&
          chat.courseCode === input.courseCode,
      );

      if (existing) {
        return existing.id;
      }

      const academician = findAcademicianById(input.academicianId);

      if (!academician) {
        throw new Error(translateStored('msg.error.academicianNotFound'));
      }

      if (!session.email) {
        throw new Error(translateStored('msg.error.sessionEmailMissing'));
      }

      const { data, error: insertError } = await client
        .from('conversations')
        .insert({
          student_id: profileId,
          student_email: session.email.toLowerCase(),
          student_name: session.name,
          student_number: session.identifier,
          academician_email: academician.email,
          academician_key: academician.id,
          course_code: input.courseCode,
          course_name: input.courseName,
        })
        .select('*')
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          const { data: found } = await client
            .from('conversations')
            .select('id')
            .eq('student_id', profileId)
            .eq('academician_email', academician.email)
            .eq('course_code', input.courseCode)
            .maybeSingle();

          if (found) {
            await loadAll(true);
            return (found as { id: string }).id;
          }
        }

        console.error('Görüşme başlatılamadı:', insertError.message);
        throw new Error(translateStored('msg.error.conversationFailed'));
      }

      const row = data as ConversationRecord;
      const chat: Chat = {
        id: row.id,
        studentId: row.student_id,
        studentName: row.student_name,
        studentNumber: row.student_number,
        academicianId: row.academician_key,
        courseCode: row.course_code,
        courseName: row.course_name,
        messages: [],
        unreadForStudent: 0,
        unreadForAcademician: 0,
      };

      setChats((current) =>
        current.some((item) => item.id === chat.id) ? current : [...current, chat],
      );

      return row.id;
    },
    [chats, loadAll, profileId, session],
  );

  const value = useMemo(
    () => ({
      chats,
      isLoading,
      error,
      sendMessage,
      markRead,
      markAllReadForAcademician,
      startConversation,
    }),
    [
      chats,
      isLoading,
      error,
      sendMessage,
      markRead,
      markAllReadForAcademician,
      startConversation,
    ],
  );

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
}
