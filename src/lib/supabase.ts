import { createClient } from '@supabase/supabase-js';

const fallbackUrl = 'https://svvkpjrhusushyqwwnrc.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dmtwanJodXN1c2h5cXd3bnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5MjI1MDYsImV4cCI6MjEwODQ5ODUwNn0.DJhzQrmogDW_jiYPbC00r8366JUYcJ_miFQLZcjaE24';

const url = (import.meta.env.VITE_SUPABASE_URL as string) || fallbackUrl;
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || fallbackKey;

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export type Role = 'creator' | 'admin' | 'student';

export type Profile = {
  id: string;
  email: string;
  role: Role;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type UserTheme = {
  user_id: string;
  primary_color: string;
  accent_color: string;
  board_bg: string;
  board_text: string;
  updated_at: string;
};

export type TestFile = {
  id: string;
  topic_id: string | null;
  title: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string;
  created_at: string;
};

export type AdminCode = {
  id: string;
  code: string;
  target_email: string;
  created_by: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
};

export type Subject = {
  id: string;
  title: string;
  description: string | null;
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
};

export type Topic = {
  id: string;
  subject_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
};

export type Lesson = {
  id: string;
  topic_id: string;
  title: string;
  content: string;
  created_at: string;
};

export type Question = {
  id: string;
  topic_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'a' | 'b' | 'c' | 'd';
  explanation: string | null;
  created_at: string;
};

export type ExamType = 'dtm' | 'milliy_sertifikat' | 'mavzuviy';

export type Exam = {
  id: string;
  title: string;
  subject_id: string;
  duration_minutes: number;
  exam_type: ExamType;
  created_at: string;
};

export type ExamQuestion = {
  id: string;
  exam_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'a' | 'b' | 'c' | 'd';
  explanation: string | null;
  recommended_topic?: string | null;
  created_at: string;
};

export type SimpleUser = {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  role: 'student' | 'admin' | 'creator';
  rating: number;
  created_at: string;
};

export type UserSessionHistory = {
  id: string;
  user_id: string;
  action: 'kirish' | 'chiqish' | 'parol_ozgartirildi' | string;
  device_info: string | null;
  ip_address: string | null;
  created_at: string;
};

export type CodingLesson = {
  id: string;
  language: string;
  title: string;
  description: string | null;
  theory_content: string;
  initial_code: string | null;
  expected_output: string | null;
  sort_order: number;
  created_at: string;
};

export type MindChallenge = {
  id: string;
  category: 'mantiq' | 'shaxmat' | 'shashka';
  title: string;
  problem_text: string;
  image_url: string | null;
  fen_state: string | null;
  correct_answer: string;
  explanation: string;
  recommended_topic: string | null;
  created_at: string;
};

export type Tournament = {
  id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'upcoming' | 'active' | 'completed';
  created_at: string;
};

export type ThemeSettings = {
  id: number;
  site_name: string;
  primary_color: string;
  accent_color: string;
  board_bg: string;
  board_text: string;
};

export const CREATOR_EMAIL = 'dilshodbekrayimov6@gmail.com';

export type ActivityLog = {
  id: string;
  user_id: string;
  action: string;
  description: string | null;
  duration_seconds: number | null;
  created_at: string;
};

export type Book = {
  id: string;
  subject_id: string | null;
  category_id: string | null;
  title: string;
  author: string | null;
  description: string | null;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  cover_url: string | null;
  is_audio: boolean;
  audio_path: string | null;
  uploaded_by: string;
  created_at: string;
};

export type BookCategory = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
};

export type AudioFile = {
  id: string;
  user_id: string;
  title: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
};

export type ExamResult = {
  id: string;
  user_id: string;
  exam_id: string;
  score: number;
  total: number;
  percent: number;
  cert_score: number;
  created_at: string;
};

export type Course = {
  id: string;
  title: string;
  description: string | null;
  instructor_name: string;
  price: number;
  duration_hours: number;
  level: 'Boshlangich' | 'Orta' | 'Yuqori';
  category: string | null;
  thumbnail_url: string | null;
  is_published: boolean;
  created_at: string;
};

export type CourseEnrollment = {
  id: string;
  user_id: string | null;
  course_id: string;
  full_name: string;
  phone: string;
  payment_method: 'cash' | 'card' | 'click' | 'payme';
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
};

export type VideoLesson = {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  category: string;
  playlist: string | null;
  duration_seconds: number;
  thumbnail_url: string | null;
  sort_order: number;
  created_at: string;
};

export type VideoProgress = {
  id: string;
  user_id: string;
  video_id: string;
  watched_seconds: number;
  completed: boolean;
  updated_at: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  created_at: string;
};

export const CERT_MAX_SCORE = 189;

export async function logActivity(action: string, description?: string, durationSeconds?: number) {
  const { error } = await supabase.from('activity_log').insert({
    action,
    description: description ?? null,
    duration_seconds: durationSeconds ?? null,
  });
  if (error) console.warn('activity log failed:', error.message);
}
