// WITTI 플랫폼 TypeScript 타입 정의

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  phone: string | null;
  created_at: string;
}

export interface Class {
  id: number;
  title: string;
  description: string | null;
  instructor_name: string;
  instructor_role: string;
  price: number;
  duration: number;
  thumbnail_icon: string;
  rating: number;
  student_count: number;
  created_at: string;
}

export interface Enrollment {
  id: number;
  user_id: number;
  class_id: number;
  payment_id: number | null;
  status: 'enrolled' | 'completed' | 'cancelled';
  enrolled_at: string;
  completed_at: string | null;
}

export interface Payment {
  id: number;
  user_id: number;
  order_id: string;
  amount: number;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  pg_transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface Review {
  id: number;
  user_id: number;
  class_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

// Cloudflare Workers 환경 바인딩
export interface Env {
  DB: D1Database;
}
