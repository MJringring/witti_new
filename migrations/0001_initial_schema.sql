-- WITTI 플랫폼 초기 데이터베이스 스키마
-- 생성일: 2025-01-14

-- ============================================
-- 사용자 (회원) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 이메일 인덱스 (로그인 성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- 클래스 (강의) 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  instructor_name TEXT NOT NULL,
  instructor_role TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL,
  thumbnail_icon TEXT NOT NULL DEFAULT '🎓',
  rating REAL DEFAULT 0.0,
  student_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 평점 인덱스 (인기 클래스 정렬)
CREATE INDEX IF NOT EXISTS idx_classes_rating ON classes(rating DESC);

-- ============================================
-- 수강 내역 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  payment_id INTEGER,
  status TEXT NOT NULL DEFAULT 'enrolled',
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
);

-- 사용자별 수강 내역 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- ============================================
-- 결제 내역 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  order_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  pg_transaction_id TEXT,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 주문번호 인덱스 (결제 조회)
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);

-- ============================================
-- 리뷰 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- 클래스별 리뷰 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_class_id ON reviews(class_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- ============================================
-- 초기 데이터: 샘플 클래스
-- ============================================
INSERT OR IGNORE INTO classes (id, title, description, instructor_name, instructor_role, price, duration, thumbnail_icon, rating, student_count) VALUES
  (1, 'AI로 부모면담 정리하기', 'AI를 활용한 부모면담 요약 및 정리 노하우를 배웁니다. 면담 내용을 체계적으로 정리하고 후속 조치를 효율적으로 관리하세요.', '김민지', 'teacher', 19900, 15, '🎓', 4.9, 1234),
  (2, '학급 운영 자동화 시스템', '반복되는 학급 운영 업무를 자동화하는 실용적인 도구와 방법을 소개합니다. 출결 관리, 알림장, 학부모 소통을 한 번에!', '박수진', 'teacher', 29900, 20, '⚙️', 4.8, 987),
  (3, '학생 상담 기록 작성법', '효과적인 상담 기록 작성 방법과 학생 이해를 돕는 상담 기법을 배웁니다. 상담 내용을 체계적으로 정리하고 학생 변화를 추적하세요.', '이지은', 'counselor', 24900, 18, '💬', 4.7, 856),
  (4, '학급 긍정훈육 실천하기', '학생들의 자율성과 책임감을 키우는 긍정훈육 방법을 실제 사례와 함께 배웁니다.', '정다은', 'expert', 34900, 25, '🌱', 4.9, 1567);
