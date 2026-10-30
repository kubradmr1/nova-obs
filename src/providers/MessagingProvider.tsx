import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { MessagingContext } from '@/context/messaging-context';
import { createSeedChats } from '@/data/messaging';
import { useAuth } from '@/hooks/useAuth';
import { SupabaseMessagingProvider } from '@/providers/SupabaseMessagingProvider';
import type { Chat, MessageSide, StartConversationInput } from '@/types/messaging';
import { readJson, writeJson } from '@/utils/storage';

const STORAGE_KEY = 'obs.chats.v1';

function isChat(value: unknown): value is Chat {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const chat = value as Partial<Chat>;

  return (
    typeof chat.id === 'string' &&
    typeof chat.studentId === 'string' &&
    typeof chat.academicianId === 'string' &&
    Array.isArray(chat.messages) &&
    typeof chat.unreadForStudent === 'number' &&
    typeof chat.unreadForAcademician === 'number'
  );
}

function readStoredChats(): Chat[] {
  const stored = readJson<unknown[]>(STORAGE_KEY);

  if (Array.isArray(stored) && stored.every(isChat)) {
    return stored;
  }

  return createSeedChats();
}

function createMessageId(): string {
  return `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function DemoMessagingProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>(readStoredChats);

  useEffect(() => {
    writeJson(STORAGE_KEY, chats);
  }, [chats]);

  const sendMessage = useCallback(
    async (chatId: string, from: MessageSide, text: string) => {
      const trimmed = text.trim();

      if (!trimmed) {
        return;
      }

      setChats((current) =>
        current.map((chat) => {
          if (chat.id !== chatId) {
            return chat;
          }

          const message = {
            id: createMessageId(),
            from,
            text: trimmed,
            sentAt: new Date().toISOString(),
          };

          return from === 'student'
            ? {
                ...chat,
                messages: [...chat.messages, message],
                unreadForStudent: 0,
                unreadForAcademician: chat.unreadForAcademician + 1,
              }
            : {
                ...chat,
                messages: [...chat.messages, message],
                unreadForAcademician: 0,
                unreadForStudent: chat.unreadForStudent + 1,
              };
        }),
      );
    },
    [],
  );

  const markRead = useCallback((chatId: string, viewer: MessageSide) => {
    setChats((current) =>
      current.map((chat) => {
        if (chat.id !== chatId) {
          return chat;
        }

        if (viewer === 'student') {
          return chat.unreadForStudent === 0
            ? chat
            : { ...chat, unreadForStudent: 0 };
        }

        return chat.unreadForAcademician === 0
          ? chat
          : { ...chat, unreadForAcademician: 0 };
      }),
    );
  }, []);

  const markAllReadForAcademician = useCallback((academicianId: string) => {
    setChats((current) =>
      current.map((chat) =>
        chat.academicianId === academicianId && chat.unreadForAcademician > 0
          ? { ...chat, unreadForAcademician: 0 }
          : chat,
      ),
    );
  }, []);

  const startConversation = useCallback(
    async (input: StartConversationInput): Promise<string> => {
      const existing = chats.find(
        (chat) =>
          chat.studentId === input.studentId &&
          chat.academicianId === input.academicianId &&
          chat.courseCode === input.courseCode,
      );

      if (existing) {
        return existing.id;
      }

      const id = `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

      setChats((current) => [
        ...current,
        { id, ...input, messages: [], unreadForStudent: 0, unreadForAcademician: 0 },
      ]);

      return id;
    },
    [chats],
  );

  const value = useMemo(
    () => ({
      chats,
      isLoading: false,
      error: null,
      sendMessage,
      markRead,
      markAllReadForAcademician,
      startConversation,
    }),
    [chats, sendMessage, markRead, markAllReadForAcademician, startConversation],
  );

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
}

export function MessagingProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();

  if (session?.provider === 'supabase' && session.profileId) {
    return (
      <SupabaseMessagingProvider key={session.profileId} session={session}>
        {children}
      </SupabaseMessagingProvider>
    );
  }

  return <DemoMessagingProvider>{children}</DemoMessagingProvider>;
}
