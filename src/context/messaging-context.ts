import { createContext } from 'react';
import type { Chat, MessageSide, StartConversationInput } from '@/types/messaging';

export interface MessagingContextValue {
  chats: Chat[];
  sendMessage: (chatId: string, from: MessageSide, text: string) => void;
  markRead: (chatId: string, viewer: MessageSide) => void;
  markAllReadForAcademician: (academicianId: string) => void;
  startConversation: (input: StartConversationInput) => string;
}

export const MessagingContext = createContext<MessagingContextValue | null>(null);
