export type ProfileRole = 'student' | 'academician' | 'admin';

export interface ProfileRecord {
  id: string;
  email: string;
  full_name: string;
  role: ProfileRole;
  student_number: string | null;
  academician_key: string | null;
  department: string;
  created_at: string;
}

export interface ConversationRecord {
  id: string;
  student_id: string;
  student_email: string;
  student_name: string;
  student_number: string;
  academician_id: string | null;
  academician_email: string;
  academician_key: string;
  course_code: string;
  course_name: string;
  created_at: string;
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: 'student' | 'academician';
  body: string;
  created_at: string;
}

export interface ConversationReadRecord {
  conversation_id: string;
  profile_id: string;
  last_read_at: string;
}
