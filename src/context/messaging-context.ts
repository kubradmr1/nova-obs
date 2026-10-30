import { createContext } from 'react';
import type { Chat, MessageSide, StartConversationInput } from '@/types/messaging';

export interface MessagingContextValue {
  chats: Chat[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (chatId: string, from: MessageSide, text: string) => Promise<void>;
  markRead: (chatId: string, viewer: MessageSide) => void;
  markAllReadForAcademician: (academicianId: string) => void;
  startConversation: (input: StartConversationInput) => Promise<string>;
}

export const MessagingContext = createContext<MessagingContextValue | null>(null);
