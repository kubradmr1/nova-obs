export type MessageSide = 'student' | 'academician';

export interface ChatMessage {
  id: string;
  from: MessageSide;
  text: string;
  sentAt: string;
}

export interface Chat {
  id: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  academicianId: string;
  courseCode: string;
  courseName: string;
  messages: ChatMessage[];
  unreadForStudent: number;
  unreadForAcademician: number;
}

export interface StartConversationInput {
  studentId: string;
  studentName: string;
  studentNumber: string;
  academicianId: string;
  courseCode: string;
  courseName: string;
}
