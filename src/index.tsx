import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Env } from './types'
import { hashPassword, isValidEmail, validatePassword, validateName, validatePhone, verifyPassword, createToken, verifyToken } from './utils/crypto'

const app = new Hono<{ Bindings: Env }>()

// JWT 비밀키 (실제 프로덕션에서는 환경변수로 관리)
const JWT_SECRET = 'witti-secret-key-2025'

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files from public/static directory
app.use('/static/*', serveStatic({ root: './public' }))

// API routes
app.get('/api/hello', (c) => {
  return c.json({ 
    message: 'Welcome to WITTI API',
    version: '1.0.0',
    status: 'active'
  })
})

// 데이터베이스 테스트 - 모든 클래스 조회
app.get('/api/test/classes', async (c) => {
  try {
    const { DB } = c.env
    const { results } = await DB.prepare(`
      SELECT id, title, instructor_name, instructor_role, price, duration, 
             thumbnail_icon, rating, student_count, created_at
      FROM classes
      ORDER BY rating DESC
    `).all()
    
    return c.json({ 
      success: true,
      count: results.length,
      classes: results 
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// 데이터베이스 테스트 - 모든 사용자 조회 (비밀번호 제외)
app.get('/api/test/users', async (c) => {
  try {
    const { DB } = c.env
    const { results } = await DB.prepare(`
      SELECT id, email, name, phone, created_at
      FROM users
      ORDER BY created_at DESC
    `).all()
    
    return c.json({ 
      success: true,
      count: results.length,
      users: results 
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// 데이터베이스 테스트 - 특정 클래스 조회
app.get('/api/test/classes/:id', async (c) => {
  try {
    const { DB } = c.env
    const id = c.req.param('id')
    
    const { results } = await DB.prepare(`
      SELECT * FROM classes WHERE id = ?
    `).bind(id).all()
    
    if (results.length === 0) {
      return c.json({ 
        success: false, 
        error: 'Class not found' 
      }, 404)
    }
    
    return c.json({ 
      success: true,
      class: results[0]
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

app.get('/api/insights', (c) => {
  const insights = [
    {
      id: 1,
      title: "오늘의 인사이트",
      quote: "완벽한 수업보다 완벽한 관심이 학생들에게 더 큰 영향을 줍니다.",
      message: "학생 한 명 한 명의 작은 변화를 알아차리는 것, 그것이 진짜 교육의 시작입니다.",
      author: "― 교육 심리학자 김민정"
    },
    {
      id: 2,
      title: "마음을 채우는 한 마디",
      quote: "가르침은 두 번의 학습이다.",
      message: "가르치면서 우리도 함께 성장합니다. 오늘 하루도 학생들과 함께 배우는 시간이었습니다.",
      author: "― 조셉 주베르"
    },
    {
      id: 3,
      title: "교사의 지혜",
      quote: "학생들은 당신이 얼마나 아는지 상관하지 않습니다. 당신이 얼마나 관심을 가지는지를 알 때까지는.",
      message: "오늘 하루, 한 명의 학생에게라도 진심 어린 관심을 보여주셨나요?",
      author: "― 존 맥스웰"
    }
  ]
  
  return c.json({ insights })
})

// ============================================
// 회원 인증 API
// ============================================

// 이메일 중복 체크
app.post('/api/auth/check-email', async (c) => {
  try {
    const { email } = await c.req.json()
    
    if (!email || !isValidEmail(email)) {
      return c.json({ 
        success: false, 
        available: false,
        message: '유효하지 않은 이메일 형식입니다' 
      }, 400)
    }
    
    const { DB } = c.env
    const { results } = await DB.prepare(`
      SELECT id FROM users WHERE email = ? LIMIT 1
    `).bind(email).all()
    
    const available = results.length === 0
    
    return c.json({ 
      success: true,
      available,
      message: available ? '사용 가능한 이메일입니다' : '이미 사용 중인 이메일입니다'
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// 회원가입
app.post('/api/auth/signup', async (c) => {
  try {
    const { email, password, name, phone } = await c.req.json()
    
    // 입력값 검증
    if (!email || !isValidEmail(email)) {
      return c.json({ 
        success: false, 
        message: '유효하지 않은 이메일 형식입니다' 
      }, 400)
    }
    
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return c.json({ 
        success: false, 
        message: passwordValidation.message 
      }, 400)
    }
    
    const nameValidation = validateName(name)
    if (!nameValidation.valid) {
      return c.json({ 
        success: false, 
        message: nameValidation.message 
      }, 400)
    }
    
    if (phone) {
      const phoneValidation = validatePhone(phone)
      if (!phoneValidation.valid) {
        return c.json({ 
          success: false, 
          message: phoneValidation.message 
        }, 400)
      }
    }
    
    const { DB } = c.env
    
    // 이메일 중복 체크
    const { results: existingUsers } = await DB.prepare(`
      SELECT id FROM users WHERE email = ? LIMIT 1
    `).bind(email).all()
    
    if (existingUsers.length > 0) {
      return c.json({ 
        success: false, 
        message: '이미 사용 중인 이메일입니다' 
      }, 409)
    }
    
    // 비밀번호 해싱
    const passwordHash = await hashPassword(password)
    
    // 사용자 생성
    const result = await DB.prepare(`
      INSERT INTO users (email, password_hash, name, phone)
      VALUES (?, ?, ?, ?)
    `).bind(email, passwordHash, name, phone || null).run()
    
    if (!result.success) {
      throw new Error('Failed to create user')
    }
    
    return c.json({ 
      success: true,
      message: '회원가입이 완료되었습니다',
      user: {
        id: result.meta.last_row_id,
        email,
        name
      }
    }, 201)
  } catch (error) {
    console.error('Signup error:', error)
    return c.json({ 
      success: false, 
      message: '회원가입 처리 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// 로그인
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    // 입력값 검증
    if (!email || !password) {
      return c.json({ 
        success: false, 
        message: '이메일과 비밀번호를 입력해주세요' 
      }, 400)
    }
    
    if (!isValidEmail(email)) {
      return c.json({ 
        success: false, 
        message: '유효하지 않은 이메일 형식입니다' 
      }, 400)
    }
    
    const { DB } = c.env
    
    // 사용자 조회
    const { results } = await DB.prepare(`
      SELECT id, email, password_hash, name, phone, created_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `).bind(email).all()
    
    if (results.length === 0) {
      return c.json({ 
        success: false, 
        message: '이메일 또는 비밀번호가 올바르지 않습니다' 
      }, 401)
    }
    
    const user = results[0] as any
    
    // 비밀번호 검증
    const isPasswordValid = await verifyPassword(password, user.password_hash)
    
    if (!isPasswordValid) {
      return c.json({ 
        success: false, 
        message: '이메일 또는 비밀번호가 올바르지 않습니다' 
      }, 401)
    }
    
    // JWT 토큰 생성 (7일 만료)
    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7일
    }, JWT_SECRET)
    
    return c.json({ 
      success: true,
      message: '로그인 성공',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        created_at: user.created_at
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ 
      success: false, 
      message: '로그인 처리 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// 토큰 검증 (현재 로그인 사용자 정보 조회)
app.get('/api/auth/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ 
        success: false, 
        message: '인증 토큰이 필요합니다' 
      }, 401)
    }
    
    const token = authHeader.substring(7)
    const payload = await verifyToken(token, JWT_SECRET)
    
    if (!payload) {
      return c.json({ 
        success: false, 
        message: '유효하지 않거나 만료된 토큰입니다' 
      }, 401)
    }
    
    const { DB } = c.env
    
    // 최신 사용자 정보 조회
    const { results } = await DB.prepare(`
      SELECT id, email, name, phone, created_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `).bind(payload.userId).all()
    
    if (results.length === 0) {
      return c.json({ 
        success: false, 
        message: '사용자를 찾을 수 없습니다' 
      }, 404)
    }
    
    return c.json({ 
      success: true,
      user: results[0]
    })
  } catch (error) {
    console.error('Auth verification error:', error)
    return c.json({ 
      success: false, 
      message: '인증 확인 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// ============================================
// 결제 API
// ============================================

// 결제 생성
app.post('/api/payment/create', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, message: '인증 필요' }, 401)
    }
    
    const token = authHeader.substring(7)
    const payload = await verifyToken(token, JWT_SECRET)
    if (!payload) {
      return c.json({ success: false, message: '유효하지 않은 토큰' }, 401)
    }
    
    const { order_id, amount, payment_method, items } = await c.req.json()
    const { DB } = c.env
    
    // 결제 기록 생성
    const paymentResult = await DB.prepare(`
      INSERT INTO payments (user_id, order_id, amount, payment_method, payment_status, paid_at)
      VALUES (?, ?, ?, ?, 'completed', datetime('now'))
    `).bind(payload.userId, order_id, amount, payment_method).run()
    
    const paymentId = paymentResult.meta.last_row_id
    
    // 수강 내역 생성
    for (const item of items) {
      await DB.prepare(`
        INSERT INTO enrollments (user_id, class_id, payment_id, status, enrolled_at)
        VALUES (?, ?, ?, 'enrolled', datetime('now'))
      `).bind(payload.userId, item.id, paymentId).run()
    }
    
    return c.json({ 
      success: true, 
      message: '결제 완료',
      payment_id: paymentId,
      order_id 
    })
  } catch (error) {
    console.error('Payment error:', error)
    return c.json({ 
      success: false, 
      message: '결제 처리 실패',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// 내 수강내역 조회
app.get('/api/my/enrollments', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, message: '인증 필요' }, 401)
    }
    
    const token = authHeader.substring(7)
    const payload = await verifyToken(token, JWT_SECRET)
    if (!payload) {
      return c.json({ success: false, message: '유효하지 않은 토큰' }, 401)
    }
    
    const { DB } = c.env
    const { results } = await DB.prepare(`
      SELECT 
        e.id, e.status, e.enrolled_at, e.completed_at,
        c.id as class_id, c.title, c.instructor_name, c.duration, c.thumbnail_icon
      FROM enrollments e
      JOIN classes c ON e.class_id = c.id
      WHERE e.user_id = ?
      ORDER BY e.enrolled_at DESC
    `).bind(payload.userId).all()
    
    return c.json({ success: true, enrollments: results })
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

// 내 결제내역 조회 (강의 정보 포함)
app.get('/api/my/payments', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, message: '인증 필요' }, 401)
    }
    
    const token = authHeader.substring(7)
    const payload = await verifyToken(token, JWT_SECRET)
    if (!payload) {
      return c.json({ success: false, message: '유효하지 않은 토큰' }, 401)
    }
    
    const { DB } = c.env
    
    // 결제 내역 조회
    const { results: payments } = await DB.prepare(`
      SELECT id, order_id, amount, payment_method, payment_status, paid_at, created_at
      FROM payments
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).bind(payload.userId).all()
    
    // 각 결제에 포함된 강의 목록 조회
    const paymentsWithClasses = await Promise.all(
      payments.map(async (payment: any) => {
        const { results: classes } = await DB.prepare(`
          SELECT c.id, c.title, c.instructor_name, c.price, c.thumbnail_icon
          FROM enrollments e
          JOIN classes c ON e.class_id = c.id
          WHERE e.payment_id = ?
        `).bind(payment.id).all()
        
        return {
          ...payment,
          classes: classes
        }
      })
    )
    
    return c.json({ success: true, payments: paymentsWithClasses })
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

// ============================================
// 클래스 API
// ============================================

// 모든 클래스 조회
app.get('/api/classes', async (c) => {
  try {
    const { DB } = c.env
    const { results } = await DB.prepare(`
      SELECT id, title, description, instructor_name, instructor_role, 
             price, duration, thumbnail_icon, rating, student_count, created_at
      FROM classes
      ORDER BY rating DESC, student_count DESC
    `).all()
    
    return c.json({ 
      success: true,
      count: results.length,
      classes: results 
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// 특정 클래스 상세 조회
app.get('/api/classes/:id', async (c) => {
  try {
    const { DB } = c.env
    const id = c.req.param('id')
    
    const { results } = await DB.prepare(`
      SELECT * FROM classes WHERE id = ?
    `).bind(id).all()
    
    if (results.length === 0) {
      return c.json({ 
        success: false, 
        error: 'Class not found' 
      }, 404)
    }
    
    return c.json({ 
      success: true,
      class: results[0]
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Main page route
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WITTI - 교사의 하루를 덜어주는 플랫폼</title>
      <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <link rel="stylesheet" href="/static/style.css">
      <style>
        /* 반응형 헤더 스타일 */
        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
        }
        
        .mobile-nav {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }
        
        .mobile-nav.active {
          display: block;
        }
        
        .mobile-nav-content {
          position: absolute;
          top: 0;
          right: 0;
          width: 80%;
          max-width: 300px;
          height: 100%;
          background: white;
          padding: 2rem 1.5rem;
          box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
          transform: translateX(100%);
          transition: transform 0.3s ease;
        }
        
        .mobile-nav.active .mobile-nav-content {
          transform: translateX(0);
        }
        
        .mobile-nav-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
        }
        
        .mobile-nav-links {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 3rem;
        }
        
        .mobile-nav-links a {
          text-decoration: none;
          color: #333;
          font-size: 1.2rem;
          font-weight: 600;
          padding: 1rem;
          border-radius: 8px;
          transition: background 0.2s;
        }
        
        .mobile-nav-links a:hover {
          background: #f5f5f5;
        }
        
        .mobile-nav-links a.active {
          color: #ff8566;
          background: #fff0e6;
        }
        
        .mobile-nav-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #f0f0f0;
        }
        
        @media (max-width: 968px) {
          .mobile-menu-btn {
            display: block;
          }
          
          .desktop-nav {
            display: none !important;
          }
          
          .header-actions {
            gap: 0.5rem !important;
          }
          
          .header-actions > button {
            font-size: 1rem !important;
          }
          
          .auth-buttons {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>

      <header style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid #f0f0f0; position: relative;">
        <div style="display: flex; align-items: center; gap: 2.5rem;">
          <h1 style="margin: 0; cursor: pointer; font-size: 1.5rem; font-weight: 700; color: #333;" onclick="window.location.href='/'">🌿 WITTI</h1>
          <nav class="desktop-nav" style="display: flex; gap: 2rem; align-items: center;">
            <a href="/" class="active" style="text-decoration: none; color: #ff8566; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; border-radius: 8px; background: #fff0e6; transition: all 0.3s;">New</a>
            <a href="/learn" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Learn</a>
            <a href="/story" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Story</a>
            <a href="/talk" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Talk</a>
            <a href="/tools" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Tools</a>
          </nav>
        </div>
        <div class="header-actions" style="display: flex; gap: 1rem; align-items: center;">
          <button class="mobile-menu-btn" onclick="toggleMobileMenu()">☰</button>
          <button onclick="window.location.href='/cart'" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; position: relative;" title="장바구니">
            🛒
            <span id="cartBadge" style="position: absolute; top: -5px; right: -5px; background: #ff8566; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: none; align-items: center; justify-content: center;">0</span>
          </button>
          <button onclick="alert('검색 기능 준비 중')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem;" title="검색">🔍</button>
          <button onclick="alert('알림이 없습니다')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; position: relative;" title="알림">
            🔔
            <span style="position: absolute; top: -5px; right: -5px; background: #ff8566; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center;">3</span>
          </button>
          <div id="userMenu" style="display: none; gap: 0.5rem; align-items: center;">
            <a href="/mywitti" style="background: #ff8566; color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">내 강의실</a>
            <button id="logoutBtn" style="background: #f5f5f5; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">로그아웃</button>
          </div>
          <div id="authMenu" class="auth-buttons" style="display: flex; gap: 0.5rem;">
            <a href="/login" style="background: #f5f5f5; color: #333; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">로그인</a>
            <a href="/signup" style="background: #ff8566; color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">회원가입</a>
          </div>
        </div>
      </header>
      
      <!-- 모바일 메뉴 -->
      <div class="mobile-nav" id="mobileNav" onclick="if(event.target === this) toggleMobileMenu()">
        <div class="mobile-nav-content">
          <button class="mobile-nav-close" onclick="toggleMobileMenu()">✕</button>
          <div class="mobile-nav-links">
            <a href="/" class="active">New</a>
            <a href="/learn">Learn</a>
            <a href="/story">Story</a>
            <a href="/talk">Talk</a>
            <a href="/tools">Tools</a>
          </div>
          <div class="mobile-nav-actions">
            <div id="mobileUserMenu" style="display: none; flex-direction: column; gap: 0.5rem;">
              <a href="/mywitti" style="background: #ff8566; color: white; padding: 0.75rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">내 강의실</a>
              <button id="mobileLogoutBtn" style="background: #f5f5f5; border: none; padding: 0.75rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; width: 100%;">로그아웃</button>
            </div>
            <div id="mobileAuthMenu" style="display: flex; flex-direction: column; gap: 0.5rem;">
              <a href="/login" style="background: #f5f5f5; color: #333; padding: 0.75rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">로그인</a>
              <a href="/signup" style="background: #ff8566; color: white; padding: 0.75rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center;">회원가입</a>
            </div>
          </div>
        </div>
      </div>
      
      <script>
        // 모바일 메뉴 토글
        function toggleMobileMenu() {
          const mobileNav = document.getElementById('mobileNav');
          mobileNav.classList.toggle('active');
        }
        
        // 로그인 상태 확인 및 메뉴 표시
        (function() {
          const token = localStorage.getItem('witti_token');
          
          // 데스크톱 메뉴
          const userMenu = document.getElementById('userMenu');
          const authMenu = document.getElementById('authMenu');
          
          // 모바일 메뉴
          const mobileUserMenu = document.getElementById('mobileUserMenu');
          const mobileAuthMenu = document.getElementById('mobileAuthMenu');
          
          if (token) {
            userMenu.style.display = 'flex';
            authMenu.style.display = 'none';
            mobileUserMenu.style.display = 'flex';
            mobileAuthMenu.style.display = 'none';
          } else {
            userMenu.style.display = 'none';
            authMenu.style.display = 'flex';
            mobileUserMenu.style.display = 'none';
            mobileAuthMenu.style.display = 'flex';
          }
          
          // 로그아웃 버튼 (데스크톱 + 모바일)
          const logoutHandler = function() {
            localStorage.removeItem('witti_token');
            localStorage.removeItem('witti_user');
            alert('로그아웃되었습니다.');
            window.location.href = '/';
          };
          
          document.getElementById('logoutBtn').addEventListener('click', logoutHandler);
          document.getElementById('mobileLogoutBtn').addEventListener('click', logoutHandler);
          
          // 장바구니 아이템 수 표시
          const cart = JSON.parse(localStorage.getItem('witti_cart') || '[]');
          const cartBadge = document.getElementById('cartBadge');
          if (cart.length > 0) {
            cartBadge.textContent = cart.length;
            cartBadge.style.display = 'flex';
          }
          
          // 뷰 모드 전환 버튼 표시 (모바일에서만)
          function checkViewMode() {
            const viewModeToggle = document.getElementById('viewModeToggle');
            const toggleBtn = document.getElementById('toggleViewMode');
            const viewMode = localStorage.getItem('witti_view_mode') || 'auto';
            
            // 모바일 기기 감지 (화면 크기 기준)
            const isMobileDevice = window.innerWidth <= 968;
            
            if (isMobileDevice) {
              viewModeToggle.style.display = 'block';
              
              // 현재 모드에 따라 버튼 텍스트 변경
              if (viewMode === 'desktop') {
                toggleBtn.innerHTML = '📱 모바일 모드로 보기';
              } else {
                toggleBtn.innerHTML = '💻 PC 모드로 보기';
              }
            } else {
              viewModeToggle.style.display = 'none';
            }
          }
          
          // 초기 체크
          checkViewMode();
          
          // 창 크기 변경 시 체크
          window.addEventListener('resize', checkViewMode);
          
          // 저장된 뷰 모드 적용
          const savedViewMode = localStorage.getItem('witti_view_mode');
          if (savedViewMode === 'desktop') {
            const viewport = document.querySelector('meta[name="viewport"]');
            viewport.setAttribute('content', 'width=1200');
          }
        })();
        
        // 뷰 모드 전환 함수
        function toggleViewMode() {
          const viewMode = localStorage.getItem('witti_view_mode') || 'auto';
          const viewport = document.querySelector('meta[name="viewport"]');
          
          if (viewMode === 'desktop') {
            // 모바일 모드로 전환
            localStorage.setItem('witti_view_mode', 'auto');
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
            alert('모바일 모드로 전환되었습니다.');
          } else {
            // PC 모드로 전환
            localStorage.setItem('witti_view_mode', 'desktop');
            viewport.setAttribute('content', 'width=1200');
            alert('PC 모드로 전환되었습니다.\\n화면을 확대/축소하여 조절할 수 있습니다.');
          }
          
          // 페이지 새로고침하여 적용
          window.location.reload();
        }
      </script>

      <section id="hero">
        <h2>선생님을 위한 5분의 여유</h2>
        <p>WITTI로 하루를 시작하세요</p>
        <button id="viewInsight">
          오늘의 인사이트 보기
        </button>
      </section>

      <!-- AI 추천 카드 영역 -->
      <section id="content">
        <h3 style="text-align: center; margin-bottom: 1rem;">🎯 오늘의 추천 콘텐츠</h3>
        <p style="text-align: center; color: #666; margin-bottom: 2rem; font-size: 0.95rem;">AI가 김민지님을 위해 큐레이션한 콘텐츠</p>
        <div class="cards">
          <div class="card" onclick="window.location.href='/learn'">
            <div class="card-icon">🎓</div>
            <div class="card-title">AI로 부모면담 정리하기</div>
            <div class="card-meta">
              <span class="card-rating">⭐ 4.9</span>
              <span class="card-students">1,234명 수강</span>
              <span class="card-duration">15분</span>
            </div>
            <div class="card-instructor instructor-kim">👩‍🏫 김민지 선생님</div>
          </div>
          <div class="card" onclick="window.location.href='/learn'">
            <div class="card-icon">📋</div>
            <div class="card-title">놀이일지 10분 완성법</div>
            <div class="card-meta">
              <span class="card-rating">⭐ 4.8</span>
              <span class="card-students">892명 수강</span>
              <span class="card-duration">12분</span>
            </div>
            <div class="card-instructor instructor-park">👩‍🏫 박수진 선생님</div>
          </div>
          <div class="card" onclick="window.location.href='/learn'">
            <div class="card-icon">💬</div>
            <div class="card-title">감정케어 & 회복 클래스</div>
            <div class="card-meta">
              <span class="card-rating">⭐ 5.0</span>
              <span class="card-students">567명 수강</span>
              <span class="card-duration">20분</span>
            </div>
            <div class="card-instructor instructor-lee">💼 이지은 상담사</div>
          </div>
        </div>
      </section>

      <!-- 지금 인기 클래스 (가로 스크롤) -->
      <section id="content" style="background-color: #fff0e6; padding: 3rem 2rem; margin-top: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
          <h3 style="margin: 0;">🔥 지금 인기 클래스</h3>
          <a href="/learn" style="color: #ff8566; text-decoration: none; font-weight: 600; font-size: 0.95rem;">전체보기 →</a>
        </div>
        <div style="display: flex; gap: 1.5rem; overflow-x: auto; padding-bottom: 1rem; scroll-behavior: smooth;">
          <div class="card" onclick="window.location.href='/learn'" style="min-width: 280px; cursor: pointer;">
            <div style="width: 100%; height: 140px; background: linear-gradient(135deg, #ff8566 0%, #ff9f80 100%); border-radius: 12px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">🎓</div>
            <b>AI로 부모면담 정리하기</b><br>
            <small>⭐ 4.9 | 1,234명 수강</small><br>
            <span style="color: #ff8566; font-size: 0.85rem; font-weight: 600;">👩‍🏫 김민지 선생님</span>
          </div>
          <div class="card" onclick="window.location.href='/learn'" style="min-width: 280px; cursor: pointer;">
            <div style="width: 100%; height: 140px; background: linear-gradient(135deg, #ff8566 0%, #ff9f80 100%); border-radius: 12px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">📋</div>
            <b>놀이일지 10분 완성법</b><br>
            <small>⭐ 4.8 | 892명 수강</small><br>
            <span style="color: #ff8566; font-size: 0.85rem; font-weight: 600;">👩‍🏫 박수진 선생님</span>
          </div>
          <div class="card" onclick="window.location.href='/learn'" style="min-width: 280px; cursor: pointer;">
            <div style="width: 100%; height: 140px; background: linear-gradient(135deg, #ff8566 0%, #ff9f80 100%); border-radius: 12px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">💬</div>
            <b>감정케어 & 회복 클래스</b><br>
            <small>⭐ 5.0 | 567명 수강</small><br>
            <span style="color: #ff8566; font-size: 0.85rem; font-weight: 600;">💼 이지은 상담사</span>
          </div>
          <div class="card" onclick="window.location.href='/learn'" style="min-width: 280px; cursor: pointer;">
            <div style="width: 100%; height: 140px; background: linear-gradient(135deg, #ff8566 0%, #ff9f80 100%); border-radius: 12px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">🎯</div>
            <b>효과적인 부모 소통 전략</b><br>
            <small>⭐ 4.9 | 432명 수강</small><br>
            <span style="color: #ff8566; font-size: 0.85rem; font-weight: 600;">🎓 정미영 전문가</span>
          </div>
        </div>
      </section>

      <!-- 교사 인터뷰 (짧은 영상형 썸네일) -->
      <section id="content" style="background: #fff0e6; padding: 3rem 2rem; margin-top: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
          <h3 style="margin: 0;">🎤 지금 주목받는 인터뷰</h3>
          <a href="/story" style="color: #ff8566; text-decoration: none; font-weight: 600; font-size: 0.95rem;">전체보기 →</a>
        </div>
        <div class="cards">
          <div class="card" onclick="window.location.href='/story'" style="cursor: pointer; position: relative;">
            <div style="width: 100%; height: 160px; background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%); border-radius: 12px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; position: relative;">
              <div style="font-size: 3rem;">🎬</div>
              <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem;">05:23</div>
            </div>
            <b>"첫 출근, 그리고 첫 눈물"</b><br>
            <small style="color: #666;">신규 교사 김민지 선생님 | 조회수 3.2K</small>
          </div>
          <div class="card" onclick="window.location.href='/story'" style="cursor: pointer; position: relative;">
            <div style="width: 100%; height: 160px; background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%); border-radius: 12px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; position: relative;">
              <div style="font-size: 3rem;">🎬</div>
              <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem;">07:45</div>
            </div>
            <b>"AI 시대, 교사의 역할은?"</b><br>
            <small style="color: #666;">교육학과 정민수 교수님 | 조회수 8.3K</small>
          </div>
          <div class="card" onclick="window.location.href='/story'" style="cursor: pointer; position: relative;">
            <div style="width: 100%; height: 160px; background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%); border-radius: 12px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; position: relative;">
              <div style="font-size: 3rem;">🎬</div>
              <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem;">06:12</div>
            </div>
            <b>"예비교사가 꼭 알아야 할 것"</b><br>
            <small style="color: #666;">교대 4학년 박지혜 | 조회수 6.1K</small>
          </div>
        </div>
      </section>

      <!-- 공감 많이 받은 이야기 (커뮤니티 Top3) -->
      <section id="content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
          <h3 style="margin: 0;">❤️ 공감 많이 받은 이야기</h3>
          <a href="/talk" style="color: #ff8566; text-decoration: none; font-weight: 600; font-size: 0.95rem;">더보기 →</a>
        </div>
        <div class="cards">
          <div class="card" onclick="window.location.href='/talk'" style="cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.8rem;">
              <span style="background: #ff8566; color: white; padding: 4px 8px; border-radius: 8px; font-size: 0.75rem; font-weight: 600;">1위</span>
              <span style="color: #ff8566; font-size: 1.2rem;">❤️ 234</span>
            </div>
            <b>"신규교사인데 부모님과 대화가 너무 어려워요"</b><br>
            <small style="color: #666;">김민지 | 댓글 45개</small><br>
            <p style="color: #999; font-size: 0.85rem; margin-top: 0.5rem; line-height: 1.5;">첫 면담이 다가오는데 어떻게 준비해야 할지 막막합니다. 선배님들의 조언 부탁드려요...</p>
          </div>
          <div class="card" onclick="window.location.href='/talk'" style="cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.8rem;">
              <span style="background: #ffb396; color: white; padding: 4px 8px; border-radius: 8px; font-size: 0.75rem; font-weight: 600;">2위</span>
              <span style="color: #ff8566; font-size: 1.2rem;">❤️ 189</span>
            </div>
            <b>"요즘 번아웃이 심한데 어떻게 극복하셨나요?"</b><br>
            <small style="color: #666;">박수진 | 댓글 67개</small><br>
            <p style="color: #999; font-size: 0.85rem; margin-top: 0.5rem; line-height: 1.5;">5년차인데 최근 들어 힘이 드네요. 같은 경험 하신 분들 계신가요?</p>
          </div>
          <div class="card" onclick="window.location.href='/talk'" style="cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.8rem;">
              <span style="background: #ffc9b8; color: white; padding: 4px 8px; border-radius: 8px; font-size: 0.75rem; font-weight: 600;">3위</span>
              <span style="color: #ff8566; font-size: 1.2rem;">❤️ 156</span>
            </div>
            <b>"작은 칭찬 하나가 아이를 변화시켰어요"</b><br>
            <small style="color: #666;">이지은 | 댓글 34개</small><br>
            <p style="color: #999; font-size: 0.85rem; margin-top: 0.5rem; line-height: 1.5;">6개월 동안 말이 없던 아이가 오늘 처음으로 웃었어요. 정말 감동이에요...</p>
          </div>
        </div>
      </section>

      <!-- 오늘의 질문 (공감 참여형 CTA) -->
      <section id="content" style="background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%); padding: 3rem 2rem; margin-top: 2rem; text-align: center;">
        <h3 style="margin-bottom: 1rem;">💭 오늘의 질문</h3>
        <p style="font-size: 1.3rem; color: #333; margin-bottom: 2rem;">
          "요즘 가장 힘든 순간은 언제인가요?"
        </p>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <button onclick="window.location.href='/talk'" style="background-color: #ff8566; border: none; color: white; padding: 12px 30px; border-radius: 10px; font-size: 16px; cursor: pointer; font-weight: 600;">
            공감하기 & 이야기 나누기
          </button>
        </div>
        <p style="margin-top: 1rem; color: #666; font-size: 0.9rem;">
          💬 현재 234명의 교사가 함께 이야기를 나누고 있어요
        </p>
      </section>

      <!-- Modal -->
      <div id="insightModal" class="modal">
        <div class="modal-content">
          <span class="close">&times;</span>
          <div class="insight-content">
            <!-- Dynamic content will be inserted here -->
          </div>
        </div>
      </div>

      <!-- 푸터 특별 섹션 -->
      <section id="content" style="background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%); padding: 3rem 2rem; margin-top: 3rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; max-width: 1000px; margin: 0 auto;">
          <!-- 도담서가 큐레이션 -->
          <div style="text-align: center;">
            <h4 style="color: #ff8566; margin-bottom: 1rem;">📚 도담서가 큐레이션</h4>
            <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">교사를 위한 추천 도서</p>
            <button onclick="window.location.href='/story'" style="background: white; color: #ff8566; border: 2px solid #ff8566; padding: 8px 20px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">
              책 추천 보기
            </button>
          </div>

          <!-- 뉴스레터 구독 -->
          <div style="text-align: center;">
            <h4 style="color: #ff8566; margin-bottom: 1rem;">📬 뉴스레터 구독</h4>
            <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">매주 화요일 인사이트 받기</p>
            <button onclick="alert('뉴스레터 구독 페이지로 이동합니다')" style="background: #ff8566; color: white; border: none; padding: 8px 20px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">
              무료 구독하기
            </button>
          </div>

          <!-- 카카오 채널 -->
          <div style="text-align: center;">
            <h4 style="color: #ff8566; margin-bottom: 1rem;">💬 카카오 채널</h4>
            <p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">실시간 알림 받기</p>
            <button onclick="alert('카카오 채널 추가 페이지로 이동합니다')" style="background: #FEE500; color: #000; border: none; padding: 8px 20px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">
              채널 추가하기
            </button>
          </div>
        </div>
      </section>

      <!-- 뷰 모드 전환 버튼 (모바일 전용) -->
      <div id="viewModeToggle" style="display: none; background: #f5f5f5; padding: 1rem; text-align: center; border-top: 1px solid #e0e0e0;">
        <button id="toggleViewMode" onclick="toggleViewMode()" style="background: #ff8566; color: white; border: none; padding: 0.75rem 2rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">
          📱 PC 모드로 보기
        </button>
      </div>

      <footer style="background: #2e2e2e; color: white; text-align: center; padding: 2rem;">
        <p style="margin-bottom: 0.5rem; font-size: 0.95rem;">© 2025 WITTI | 출퇴근길 5분, 위트 있는 인사이트 한 컷.</p>
        <p style="color: #999; font-size: 0.85rem;">
          <a href="#" style="color: #999; text-decoration: none; margin: 0 0.5rem;">이용약관</a> |
          <a href="#" style="color: #999; text-decoration: none; margin: 0 0.5rem;">개인정보처리방침</a> |
          <a href="#" style="color: #999; text-decoration: none; margin: 0 0.5rem;">문의하기</a>
        </p>
      </footer>

      <script src="/static/script.js"></script>
    </body>
    </html>
  `)
})

// Learn page route
app.get('/learn', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WITTI Learn - 실전형 교사 강의</title>
      <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <link rel="stylesheet" href="/static/style.css">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    </head>
    <body>

      <header style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid #f0f0f0;">
        <div style="display: flex; align-items: center; gap: 2.5rem;">
          <h1 style="margin: 0; cursor: pointer; font-size: 1.5rem; font-weight: 700; color: #333;" onclick="window.location.href='/'">🌿 WITTI</h1>
          <nav style="display: flex; gap: 2rem; align-items: center;">
            <a href="/" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">New</a>
            <a href="/learn" class="active" style="text-decoration: none; color: #ff8566; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; border-radius: 8px; background: #fff0e6; transition: all 0.3s;">Learn</a>
            <a href="/story" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Story</a>
            <a href="/talk" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Talk</a>
            <a href="/tools" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Tools</a>
          </nav>
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <button onclick="window.location.href='/cart'" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; position: relative;" title="장바구니">
            🛒
            <span class="cartBadge" style="position: absolute; top: -5px; right: -5px; background: #ff8566; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: none; align-items: center; justify-content: center;">0</span>
          </button>
          <button onclick="alert('검색 기능 준비 중')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem;" title="검색">🔍</button>
          <button onclick="alert('알림이 없습니다')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; position: relative;" title="알림">
            🔔
            <span style="position: absolute; top: -5px; right: -5px; background: #ff8566; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center;">3</span>
          </button>
          <div class="userMenu" style="display: none; gap: 0.5rem; align-items: center;">
            <a href="/mywitti" style="background: #ff8566; color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">내 강의실</a>
            <button class="logoutBtn" style="background: #f5f5f5; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">로그아웃</button>
          </div>
          <div class="authMenu" style="display: flex; gap: 0.5rem;">
            <a href="/login" style="background: #f5f5f5; color: #333; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">로그인</a>
            <a href="/signup" style="background: #ff8566; color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">회원가입</a>
          </div>
        </div>
      </header>
      
      <script>
        // 로그인 상태 확인 및 메뉴 표시
        (function() {
          const token = localStorage.getItem('witti_token');
          const userMenu = document.querySelector('.userMenu');
          const authMenu = document.querySelector('.authMenu');
          
          if (token) {
            userMenu.style.display = 'flex';
            authMenu.style.display = 'none';
          } else {
            userMenu.style.display = 'none';
            authMenu.style.display = 'flex';
          }
          
          // 로그아웃 버튼
          document.querySelector('.logoutBtn').addEventListener('click', function() {
            localStorage.removeItem('witti_token');
            localStorage.removeItem('witti_user');
            alert('로그아웃되었습니다.');
            window.location.href = '/';
          });
          
          // 장바구니 아이템 수 표시
          const cart = JSON.parse(localStorage.getItem('witti_cart') || '[]');
          const cartBadge = document.querySelector('.cartBadge');
          if (cart.length > 0) {
            cartBadge.textContent = cart.length;
            cartBadge.style.display = 'flex';
          }
        })();
      </script>

      <section id="hero" style="padding: 60px 20px;">
        <h2>실전에서 바로 쓰는 교사 강의</h2>
        <p>5분만에 배우고, 내일 바로 써먹는 실전 콘텐츠</p>
        <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem;">
          <button onclick="window.location.href='/learn#all'" style="background-color: #ff8566; border: none; color: white; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-weight: 600;">전체 강좌 보기</button>
          <button onclick="alert('나의 성장트리 리더십 뱃지 보유시, 업로드 가능해요!')" style="background-color: white; color: #ff8566; border: 2px solid #ff8566; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-weight: 600;">내 클래스 개설하기</button>
        </div>
      </section>

      <!-- 상단 카테고리 탭 -->
      <section style="background: white; padding: 1.5rem 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 50;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap;">
          <button onclick="alert('전체 콘텐츠')" style="padding: 10px 20px; background: #ff8566; color: white; border: none; border-radius: 20px; cursor: pointer; font-weight: 600;">🔹 All</button>
          <button onclick="alert('부모상담')" style="padding: 10px 20px; background: white; border: 2px solid #ffe9d6; border-radius: 20px; cursor: pointer; font-weight: 500;">부모상담</button>
          <button onclick="alert('놀이기록')" style="padding: 10px 20px; background: white; border: 2px solid #ffe9d6; border-radius: 20px; cursor: pointer; font-weight: 500;">놀이기록</button>
          <button onclick="alert('AI활용')" style="padding: 10px 20px; background: white; border: 2px solid #ffe9d6; border-radius: 20px; cursor: pointer; font-weight: 500;">AI활용</button>
          <button onclick="alert('감정관리')" style="padding: 10px 20px; background: white; border: 2px solid #ffe9d6; border-radius: 20px; cursor: pointer; font-weight: 500;">감정관리</button>
          <button onclick="alert('커리어')" style="padding: 10px 20px; background: white; border: 2px solid #ffe9d6; border-radius: 20px; cursor: pointer; font-weight: 500;">커리어</button>
        </div>
      </section>

      <!-- 인기 강좌 -->
      <section id="content">
        <h3>🔥 인기 강좌</h3>
        <div class="cards">
          <div class="card" onclick="alert('강좌 상세 페이지로 이동')">
            🎓 <b>AI로 부모면담 정리하기</b><br>
            <small>⭐ 4.9 | 1,234명 수강 | 15분</small><br>
            <span style="color: #ff8566; font-size: 0.85rem;">김민지 선생님</span>
          </div>
          <div class="card" onclick="alert('강좌 상세 페이지로 이동')">
            📋 <b>놀이일지 10분 완성법</b><br>
            <small>⭐ 4.8 | 892명 수강 | 12분</small><br>
            <span style="color: #ff8566; font-size: 0.85rem;">박수진 선생님</span>
          </div>
          <div class="card" onclick="alert('강좌 상세 페이지로 이동')">
            💬 <b>감정케어 & 회복 클래스</b><br>
            <small>⭐ 5.0 | 567명 수강 | 20분</small><br>
            <span style="color: #ff8566; font-size: 0.85rem;">이지은 상담사</span>
          </div>
        </div>
      </section>

      <!-- 5분 강의 모음 (썸네일+재생버튼) -->
      <section id="content" style="background: #fff0e6; padding: 3rem 2rem; margin-top: 2rem;">
        <h3>⚡ 5분 강의 모음</h3>
        <p style="text-align: center; color: #666; margin-bottom: 2rem;">출퇴근 시간에 가볍게 듣는 미니 강좌</p>
        <div class="cards">
          <div class="card" onclick="alert('영상 재생')" style="position: relative; cursor: pointer;">
            <div style="background: #ffe9d6; height: 120px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; position: relative;">
              <span style="font-size: 3rem;">▶️</span>
            </div>
            <b>부모님과의 첫 만남 준비</b><br>
            <small>5분 | 조회수 2.3K | 김민지 선생님</small>
          </div>
          <div class="card" onclick="alert('영상 재생')" style="position: relative; cursor: pointer;">
            <div style="background: #ffe9d6; height: 120px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
              <span style="font-size: 3rem;">▶️</span>
            </div>
            <b>아이 칭찬하는 효과적인 방법</b><br>
            <small>5분 | 조회수 1.8K | 박수진 선생님</small>
          </div>
          <div class="card" onclick="alert('영상 재생')" style="position: relative; cursor: pointer;">
            <div style="background: #ffe9d6; height: 120px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
              <span style="font-size: 3rem;">▶️</span>
            </div>
            <b>스트레스 해소 3가지 팁</b><br>
            <small>5분 | 조회수 3.1K | 이지은 상담사</small>
          </div>
        </div>
      </section>

      <!-- 실무 꿀팁 리포트 (텍스트 카드형) -->
      <section id="content">
        <h3>📄 실무 꿀팁 리포트</h3>
        <div class="cards">
          <div class="card" onclick="downloadReport('checklist')">
            📊 <b>2025 부모면담 체크리스트</b><br>
            <small>PDF 다운로드 | 567회</small><br>
            <button style="margin-top: 0.5rem; padding: 6px 16px; background: #ff8566; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem;">무료 다운로드</button>
          </div>
          <div class="card" onclick="downloadReport('playlog')">
            📝 <b>놀이일지 작성 가이드</b><br>
            <small>PDF 다운로드 | 892회</small><br>
            <button style="margin-top: 0.5rem; padding: 6px 16px; background: #ff8566; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem;">무료 다운로드</button>
          </div>
          <div class="card" onclick="downloadReport('aitools')">
            💡 <b>AI 도구 활용 매뉴얼</b><br>
            <small>PDF 다운로드 | 1.2K회</small><br>
            <button style="margin-top: 0.5rem; padding: 6px 16px; background: #ff8566; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem;">무료 다운로드</button>
          </div>
        </div>
      </section>

      <!-- 세미나/웨비나 일정 (캘린더형 블록) -->
      <section id="content" style="background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%); padding: 3rem 2rem; margin-top: 2rem;">
        <h3>📅 세미나/웨비나 일정</h3>
        <p style="text-align: center; color: #666; margin-bottom: 2rem;">실시간으로 소통하는 교육 프로그램</p>
        <div class="cards">
          <div class="card" style="background: white;">
            <div style="background: #ff8566; color: white; padding: 8px; border-radius: 8px 8px 0 0; margin: -20px -20px 15px -20px; text-align: center; font-weight: 600;">
              2월 15일 (토) 14:00
            </div>
            <b>AI 활용 교사 워크샵</b><br>
            <small>온라인 LIVE | 선착순 50명 | 무료</small><br>
            <button style="margin-top: 0.5rem; padding: 8px 20px; background: #ff8566; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; width: 100%;">신청하기</button>
          </div>
          <div class="card" style="background: white;">
            <div style="background: #ff8566; color: white; padding: 8px; border-radius: 8px 8px 0 0; margin: -20px -20px 15px -20px; text-align: center; font-weight: 600;">
              2월 22일 (토) 10:00
            </div>
            <b>부모상담 실전 세미나</b><br>
            <small>오프라인 | 잠실 WITTI 센터 | 3만원</small><br>
            <button style="margin-top: 0.5rem; padding: 8px 20px; background: #ff8566; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; width: 100%;">신청하기</button>
          </div>
          <div class="card" style="background: white;">
            <div style="background: #ff8566; color: white; padding: 8px; border-radius: 8px 8px 0 0; margin: -20px -20px 15px -20px; text-align: center; font-weight: 600;">
              3월 1일 (토) 15:00
            </div>
            <b>신규교사 오리엔테이션</b><br>
            <small>온라인 | 신규교사 대상 | 무료</small><br>
            <button style="margin-top: 0.5rem; padding: 8px 20px; background: #ff8566; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; width: 100%;">신청하기</button>
          </div>
        </div>
      </section>

      <!-- 교사 개설형 클래스 -->
      <section id="content">
        <h3>👩‍🏫 선생님이 직접 가르치는 수업</h3>
        <p style="text-align: center; color: #666; margin-bottom: 2rem;">현장 경험이 담긴 실전 클래스</p>
        <div class="cards">
          <div class="card" onclick="alert('클래스 상세보기')">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
              <div style="width: 50px; height: 50px; background: #ffe9d6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">👩</div>
              <div style="text-align: left;">
                <b>김민지 선생님</b><br>
                <small style="color: #999;">10년차 | 주임교사</small>
              </div>
            </div>
            <b>AI로 부모면담 100% 활용하기</b><br>
            <small>⭐ 4.9 (234개 리뷰) | 1,234명 수강</small><br>
            <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 1.2rem; color: #ff8566; font-weight: 600;">₩29,000</span>
              <button style="padding: 6px 16px; background: #ff8566; color: white; border: none; border-radius: 8px; cursor: pointer;">수강하기</button>
            </div>
          </div>
          <div class="card" onclick="alert('클래스 상세보기')">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
              <div style="width: 50px; height: 50px; background: #ffe9d6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">👨</div>
              <div style="text-align: left;">
                <b>박수진 선생님</b><br>
                <small style="color: #999;">15년차 | 선임교사</small>
              </div>
            </div>
            <b>놀이관찰 & 기록의 모든 것</b><br>
            <small>⭐ 5.0 (189개 리뷰) | 892명 수강</small><br>
            <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 1.2rem; color: #ff8566; font-weight: 600;">₩35,000</span>
              <button style="padding: 6px 16px; background: #ff8566; color: white; border: none; border-radius: 8px; cursor: pointer;">수강하기</button>
            </div>
          </div>
          <div class="card" onclick="alert('클래스 상세보기')">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
              <div style="width: 50px; height: 50px; background: #ffe9d6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">👩</div>
              <div style="text-align: left;">
                <b>이지은 상담사</b><br>
                <small style="color: #999;">20년차 | 전문상담사</small>
              </div>
            </div>
            <b>교사 마음케어 프로그램</b><br>
            <small>⭐ 5.0 (312개 리뷰) | 567명 수강</small><br>
            <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 1.2rem; color: #ff8566; font-weight: 600;">₩25,000</span>
              <button style="padding: 6px 16px; background: #ff8566; color: white; border: none; border-radius: 8px; cursor: pointer;">수강하기</button>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <p>© 2025 WITTI | Learn smarter, grow warmer.</p>
      </footer>

      <script>
        // PDF 다운로드 함수
        function downloadReport(reportType) {
          // 로그인 체크
          const token = localStorage.getItem('witti_token');
          const user = JSON.parse(localStorage.getItem('witti_user') || '{}');
          
          if (!token || !user.email) {
            // 로그인되지 않은 경우
            if (confirm('리포트 다운로드는 회원 전용 서비스입니다.\\n\\n지금 로그인하시겠습니까?')) {
              window.location.href = '/login';
            }
            return;
          }
          
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF();
          
          // 한글 폰트 설정을 위한 기본 설정
          doc.setFont("helvetica");
          doc.setFontSize(16);
          
          // 리포트별 콘텐츠 정의
          const reports = {
            checklist: {
              title: "2025 부모면담 체크리스트",
              filename: "2025_부모면담_체크리스트.pdf",
              content: [
                { type: "title", text: "2025 부모면담 체크리스트", y: 20 },
                { type: "line", y: 28 },
                { type: "section", text: "면담 전 준비사항", y: 40 },
                { type: "item", text: "- 아동 관찰 기록 정리", y: 50 },
                { type: "item", text: "- 발달 평가 자료 준비", y: 58 },
                { type: "item", text: "- 학부모 질문 사항 예상", y: 66 },
                { type: "item", text: "- 면담 장소 및 시간 확인", y: 74 },
                { type: "item", text: "- 개인정보 보호 서약서 준비", y: 82 },
                { type: "section", text: "면담 중 체크리스트", y: 100 },
                { type: "item", text: "- 긍정적인 첫인상 만들기", y: 110 },
                { type: "item", text: "- 아동의 강점 먼저 이야기하기", y: 118 },
                { type: "item", text: "- 구체적인 예시 들기", y: 126 },
                { type: "item", text: "- 학부모 의견 경청하기", y: 134 },
                { type: "item", text: "- 개선 방향 함께 논의하기", y: 142 },
                { type: "item", text: "- 다음 면담 일정 안내", y: 150 },
                { type: "section", text: "면담 후 정리사항", y: 168 },
                { type: "item", text: "- 면담 내용 기록", y: 178 },
                { type: "item", text: "- 합의된 사항 정리", y: 186 },
                { type: "item", text: "- 후속 조치 계획 수립", y: 194 },
                { type: "item", text: "- 학부모 감사 메시지 발송", y: 202 },
                { type: "footer", text: "WITTI | 교사 성장 플랫폼", y: 280 }
              ]
            },
            playlog: {
              title: "놀이일지 작성 가이드",
              filename: "놀이일지_작성_가이드.pdf",
              content: [
                { type: "title", text: "놀이일지 작성 가이드", y: 20 },
                { type: "line", y: 28 },
                { type: "section", text: "관찰 포인트", y: 40 },
                { type: "item", text: "- 놀이 주제 및 활동 내용", y: 50 },
                { type: "item", text: "- 아동의 언어적/비언어적 표현", y: 58 },
                { type: "item", text: "- 또래와의 상호작용", y: 66 },
                { type: "item", text: "- 문제 해결 과정", y: 74 },
                { type: "item", text: "- 창의적 표현 방식", y: 82 },
                { type: "section", text: "기록 작성 팁", y: 100 },
                { type: "item", text: "- 객관적 사실 중심으로 기록", y: 110 },
                { type: "item", text: "- 구체적인 상황과 대화 내용 포함", y: 118 },
                { type: "item", text: "- 발달 영역 연계하여 분석", y: 126 },
                { type: "item", text: "- 교사의 상호작용 방법 기록", y: 134 },
                { type: "section", text: "활용 방법", y: 152 },
                { type: "item", text: "- 개별 아동 발달 평가 자료", y: 162 },
                { type: "item", text: "- 학부모 상담 자료", y: 170 },
                { type: "item", text: "- 교육과정 계획 수립", y: 178 },
                { type: "item", text: "- 교사 성찰 자료", y: 186 },
                { type: "footer", text: "WITTI | 교사 성장 플랫폼", y: 280 }
              ]
            },
            aitools: {
              title: "AI 도구 활용 매뉴얼",
              filename: "AI_도구_활용_매뉴얼.pdf",
              content: [
                { type: "title", text: "AI 도구 활용 매뉴얼", y: 20 },
                { type: "line", y: 28 },
                { type: "section", text: "AI 도구 종류", y: 40 },
                { type: "item", text: "- 부모면담 요약기", y: 50 },
                { type: "item", text: "- 일일일지 자동작성", y: 58 },
                { type: "item", text: "- 성장 리포트 생성기", y: 66 },
                { type: "item", text: "- 놀이관찰 분석기", y: 74 },
                { type: "section", text: "활용 단계", y: 92 },
                { type: "item", text: "1. 도구 선택 및 접속", y: 102 },
                { type: "item", text: "2. 필요한 정보 입력", y: 110 },
                { type: "item", text: "3. AI 분석 결과 확인", y: 118 },
                { type: "item", text: "4. 내용 수정 및 보완", y: 126 },
                { type: "item", text: "5. 저장 및 활용", y: 134 },
                { type: "section", text: "효과적 활용 팁", y: 152 },
                { type: "item", text: "- 구체적이고 명확한 정보 입력", y: 162 },
                { type: "item", text: "- AI 결과는 참고자료로 활용", y: 170 },
                { type: "item", text: "- 교사의 전문성과 결합", y: 178 },
                { type: "item", text: "- 개인정보 보호 준수", y: 186 },
                { type: "section", text: "시간 절약 효과", y: 204 },
                { type: "item", text: "- 면담 기록: 90% 시간 단축", y: 214 },
                { type: "item", text: "- 일지 작성: 80% 시간 단축", y: 222 },
                { type: "item", text: "- 리포트 생성: 85% 시간 단축", y: 230 },
                { type: "footer", text: "WITTI | 교사 성장 플랫폼", y: 280 }
              ]
            }
          };
          
          const report = reports[reportType];
          if (!report) {
            alert('리포트를 찾을 수 없습니다.');
            return;
          }
          
          // 콘텐츠 렌더링
          report.content.forEach(item => {
            if (item.type === 'title') {
              doc.setFontSize(20);
              doc.setFont("helvetica", "bold");
              doc.text(item.text, 105, item.y, { align: 'center' });
            } else if (item.type === 'line') {
              doc.setLineWidth(0.5);
              doc.line(20, item.y, 190, item.y);
            } else if (item.type === 'section') {
              doc.setFontSize(14);
              doc.setFont("helvetica", "bold");
              doc.text(item.text, 20, item.y);
            } else if (item.type === 'item') {
              doc.setFontSize(11);
              doc.setFont("helvetica", "normal");
              doc.text(item.text, 25, item.y);
            } else if (item.type === 'footer') {
              doc.setFontSize(10);
              doc.setFont("helvetica", "italic");
              doc.text(item.text, 105, item.y, { align: 'center' });
            }
          });
          
          // PDF 다운로드
          doc.save(report.filename);
          
          // 다운로드 횟수 증가 알림 (선택사항)
          setTimeout(() => {
            alert('PDF가 다운로드되었습니다! ✅\\n\\n다운로드한 리포트를 실무에 활용해보세요.');
          }, 100);
        }
      </script>

    </body>
    </html>
  `)
})

// Story page route - Redesigned with filters, 3-column grid, and newsletter
app.get('/story', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WITTI Story - 교사들의 이야기</title>
      <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <link rel="stylesheet" href="/static/style.css">
      <style>
        .story-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        @media (max-width: 968px) {
          .story-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 640px) {
          .story-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .story-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .story-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        }
        
        .story-thumbnail {
          width: 100%;
          height: 200px;
          background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          position: relative;
        }
        
        .ai-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #ff8566;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        }
        
        .story-content {
          padding: 1.5rem;
        }
        
        .story-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 0.75rem;
          line-height: 1.4;
        }
        
        .story-summary {
          font-size: 0.9rem;
          color: #666;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 1rem;
        }
        
        .story-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #999;
        }
        
        .newsletter-section {
          background: linear-gradient(135deg, #fff0e6 0%, #ffe9d6 100%);
          padding: 4rem 2rem;
          margin-top: 3rem;
          text-align: center;
        }
        
        .newsletter-content {
          max-width: 600px;
          margin: 0 auto;
        }
        
        .newsletter-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 1rem;
        }
        
        .newsletter-desc {
          font-size: 1.1rem;
          color: #666;
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        
        .kakao-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #FEE500;
          color: #000;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(254, 229, 0, 0.3);
        }
        
        .kakao-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(254, 229, 0, 0.4);
        }
        
        .subscriber-count {
          margin-top: 1.5rem;
          font-size: 0.95rem;
          color: #999;
        }
      </style>
    </head>
    <body>

      <header style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid #f0f0f0;">
        <div style="display: flex; align-items: center; gap: 2.5rem;">
          <h1 style="margin: 0; cursor: pointer; font-size: 1.5rem; font-weight: 700; color: #333;" onclick="window.location.href='/'">🌿 WITTI</h1>
          <nav style="display: flex; gap: 2rem; align-items: center;">
            <a href="/" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">New</a>
            <a href="/learn" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Learn</a>
            <a href="/story" style="text-decoration: none; color: #ff8566; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; border-radius: 8px; background: #fff0e6; transition: all 0.3s;">Story</a>
            <a href="/talk" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Talk</a>
            <a href="/tools" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Tools</a>
          </nav>
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <button onclick="window.location.href='/cart'" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; position: relative;" title="장바구니">
            🛒
            <span class="cartBadge" style="position: absolute; top: -5px; right: -5px; background: #ff8566; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: none; align-items: center; justify-content: center;">0</span>
          </button>
          <button onclick="alert('검색 기능 준비 중')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem;" title="검색">🔍</button>
          <button onclick="alert('알림이 없습니다')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; position: relative;" title="알림">
            🔔
            <span style="position: absolute; top: -5px; right: -5px; background: #ff8566; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center;">3</span>
          </button>
          <div class="userMenu" style="display: none; gap: 0.5rem; align-items: center;">
            <a href="/mywitti" style="background: #ff8566; color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">내 강의실</a>
            <button class="logoutBtn" style="background: #f5f5f5; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">로그아웃</button>
          </div>
          <div class="authMenu" style="display: flex; gap: 0.5rem;">
            <a href="/login" style="background: #f5f5f5; color: #333; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">로그인</a>
            <a href="/signup" style="background: #ff8566; color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">회원가입</a>
          </div>
        </div>
      </header>

      <section id="hero">
        <h2>오늘도 괜찮아요, 선생님</h2>
        <p>교사들의 진솔한 이야기와 공감의 공간</p>
      </section>

      <!-- Sticky Filter Navigation -->
      <section style="background: white; padding: 1.5rem 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 50;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap;">
          <button onclick="filterStories('all')" id="filter-all" style="padding: 10px 20px; background: #ff8566; color: white; border: none; border-radius: 20px; cursor: pointer; font-weight: 600; transition: all 0.2s;">🔹 전체</button>
          <button onclick="filterStories('interview')" id="filter-interview" style="padding: 10px 20px; background: white; border: 2px solid #ffe9d6; border-radius: 20px; cursor: pointer; font-weight: 500; transition: all 0.2s;">인터뷰</button>
          <button onclick="filterStories('column')" id="filter-column" style="padding: 10px 20px; background: white; border: 2px solid #ffe9d6; border-radius: 20px; cursor: pointer; font-weight: 500; transition: all 0.2s;">칼럼</button>
          <button onclick="filterStories('video')" id="filter-video" style="padding: 10px 20px; background: white; border: 2px solid #ffe9d6; border-radius: 20px; cursor: pointer; font-weight: 500; transition: all 0.2s;">영상</button>
          <button onclick="filterStories('newsletter')" id="filter-newsletter" style="padding: 10px 20px; background: white; border: 2px solid #ffe9d6; border-radius: 20px; cursor: pointer; font-weight: 500; transition: all 0.2s;">뉴스레터</button>
        </div>
      </section>

      <!-- Story Cards Grid -->
      <div class="story-grid" id="story-grid">
        <!-- Interview Stories -->
        <div class="story-card" data-category="interview" onclick="alert('인터뷰 상세보기 예정')">
          <div class="story-thumbnail">
            🎤
            <span class="ai-badge">AI 추천</span>
          </div>
          <div class="story-content">
            <div class="story-title">"첫 출근, 그리고 첫 눈물"</div>
            <div class="story-summary">신규 교사로서 처음 맞이한 3월. 설렘과 두려움이 교차하던 그 날의 이야기를 솔직하게 풀어봅니다.</div>
            <div class="story-meta">
              <span>김민지 선생님</span>
              <span>💬 234 · ❤️ 1.2k</span>
            </div>
          </div>
        </div>

        <div class="story-card" data-category="interview" onclick="alert('인터뷰 상세보기 예정')">
          <div class="story-thumbnail">
            🎤
          </div>
          <div class="story-content">
            <div class="story-title">"20년 차 부장님의 조언"</div>
            <div class="story-summary">교직 생활 20년, 이제는 후배 교사들에게 전하고 싶은 진심 어린 이야기들을 나눕니다.</div>
            <div class="story-meta">
              <span>박상민 선생님</span>
              <span>💬 567 · ❤️ 2.5k</span>
            </div>
          </div>
        </div>

        <div class="story-card" data-category="interview" onclick="alert('인터뷰 상세보기 예정')">
          <div class="story-thumbnail">
            🎤
            <span class="ai-badge">AI 추천</span>
          </div>
          <div class="story-content">
            <div class="story-title">"아이들과의 소통 비결"</div>
            <div class="story-summary">중학교 현장에서 아이들과 진정한 소통을 이루어낸 한 교사의 특별한 노하우를 공개합니다.</div>
            <div class="story-meta">
              <span>이수진 선생님</span>
              <span>💬 890 · ❤️ 3.1k</span>
            </div>
          </div>
        </div>

        <!-- Column Stories -->
        <div class="story-card" data-category="column" onclick="alert('칼럼 상세보기 예정')">
          <div class="story-thumbnail">
            ✍️
            <span class="ai-badge">AI 추천</span>
          </div>
          <div class="story-content">
            <div class="story-title">"번아웃에서 벗어나기"</div>
            <div class="story-summary">교직에서 찾아오는 번아웃 증후군. 이를 극복하고 다시 활력을 되찾은 과정을 심리학적 관점에서 분석합니다.</div>
            <div class="story-meta">
              <span>정신건강 전문가</span>
              <span>💬 345 · ❤️ 1.8k</span>
            </div>
          </div>
        </div>

        <div class="story-card" data-category="column" onclick="alert('칼럼 상세보기 예정')">
          <div class="story-thumbnail">
            ✍️
          </div>
          <div class="story-content">
            <div class="story-title">"디지털 시대의 교육법"</div>
            <div class="story-summary">AI와 디지털 도구가 넘쳐나는 시대, 진정한 교육의 본질은 무엇인지 교육학적 시각으로 고찰합니다.</div>
            <div class="story-meta">
              <span>교육학 박사</span>
              <span>💬 678 · ❤️ 2.2k</span>
            </div>
          </div>
        </div>

        <div class="story-card" data-category="column" onclick="alert('칼럼 상세보기 예정')">
          <div class="story-thumbnail">
            ✍️
          </div>
          <div class="story-content">
            <div class="story-title">"학부모와의 신뢰 쌓기"</div>
            <div class="story-summary">어려운 학부모 관계를 긍정적으로 전환하는 실질적인 커뮤니케이션 전략을 제시합니다.</div>
            <div class="story-meta">
              <span>상담전문가</span>
              <span>💬 423 · ❤️ 1.6k</span>
            </div>
          </div>
        </div>

        <!-- Video Stories -->
        <div class="story-card" data-category="video" onclick="alert('영상 재생 예정')">
          <div class="story-thumbnail" style="background: linear-gradient(135deg, #ff9f80 0%, #ff8566 100%);">
            ▶️
            <span class="ai-badge">AI 추천</span>
          </div>
          <div class="story-content">
            <div class="story-title">"교실 속 작은 기적들"</div>
            <div class="story-summary">교실에서 벌어지는 감동적인 순간들을 담은 5분짜리 다큐멘터리 영상입니다.</div>
            <div class="story-meta">
              <span>WITTI 제작팀</span>
              <span>👁️ 12k · ❤️ 4.5k</span>
            </div>
          </div>
        </div>

        <div class="story-card" data-category="video" onclick="alert('영상 재생 예정')">
          <div class="story-thumbnail" style="background: linear-gradient(135deg, #ff9f80 0%, #ff8566 100%);">
            ▶️
          </div>
          <div class="story-content">
            <div class="story-title">"선생님의 하루 VLOG"</div>
            <div class="story-summary">초등학교 담임선생님의 실제 하루 일과를 생생하게 따라가 봅니다.</div>
            <div class="story-meta">
              <span>최유진 선생님</span>
              <span>👁️ 8.7k · ❤️ 3.2k</span>
            </div>
          </div>
        </div>

        <div class="story-card" data-category="video" onclick="alert('영상 재생 예정')">
          <div class="story-thumbnail" style="background: linear-gradient(135deg, #ff9f80 0%, #ff8566 100%);">
            ▶️
          </div>
          <div class="story-content">
            <div class="story-title">"AI 도구 활용 실전편"</div>
            <div class="story-summary">교사들이 실제로 사용하는 AI 도구들을 직접 시연하며 소개하는 튜토리얼 영상입니다.</div>
            <div class="story-meta">
              <span>테크교사 모임</span>
              <span>👁️ 15k · ❤️ 5.8k</span>
            </div>
          </div>
        </div>

        <!-- Newsletter Stories -->
        <div class="story-card" data-category="newsletter" onclick="alert('뉴스레터 보기 예정')">
          <div class="story-thumbnail" style="background: linear-gradient(135deg, #fff0e6 0%, #ffe9d6 100%);">
            📧
          </div>
          <div class="story-content">
            <div class="story-title">"이번 주 교육 트렌드"</div>
            <div class="story-summary">2025년 1월 둘째 주, 교육계를 뜨겁게 달군 이슈들과 현장의 목소리를 담았습니다.</div>
            <div class="story-meta">
              <span>WITTI 편집팀</span>
              <span>💬 156 · ❤️ 892</span>
            </div>
          </div>
        </div>

        <div class="story-card" data-category="newsletter" onclick="alert('뉴스레터 보기 예정')">
          <div class="story-thumbnail" style="background: linear-gradient(135deg, #fff0e6 0%, #ffe9d6 100%);">
            📧
          </div>
          <div class="story-content">
            <div class="story-title">"마음을 덜어주는 월요일"</div>
            <div class="story-summary">힘든 한 주를 시작하는 선생님들께 전하는 위로와 응원의 메시지입니다.</div>
            <div class="story-meta">
              <span>WITTI 편집팀</span>
              <span>💬 234 · ❤️ 1.5k</span>
            </div>
          </div>
        </div>

        <div class="story-card" data-category="newsletter" onclick="alert('뉴스레터 보기 예정')">
          <div class="story-thumbnail" style="background: linear-gradient(135deg, #fff0e6 0%, #ffe9d6 100%);">
            📧
          </div>
          <div class="story-content">
            <div class="story-title">"추천 도서: 교사를 위한 책"</div>
            <div class="story-summary">이번 달 WITTI가 선정한 교사들을 위한 필독서 3권을 소개합니다.</div>
            <div class="story-meta">
              <span>도담서가</span>
              <span>💬 89 · ❤️ 567</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Newsletter Subscription Section -->
      <div class="newsletter-section">
        <div class="newsletter-content">
          <div class="newsletter-title">📬 매주 월요일, 교사 마음을 덜어주는 뉴스레터</div>
          <div class="newsletter-desc">
            힘든 한 주를 시작하는 선생님들께 위로와 영감을 전합니다.<br>
            교육 트렌드, 실천 팁, 감동적인 이야기를 매주 받아보세요.
          </div>
          <button class="kakao-btn" onclick="alert('카카오 로그인 연동 예정')">
            <span style="font-size: 1.5rem;">💬</span>
            <span>카카오로 3초만에 구독하기</span>
          </button>
          <div class="subscriber-count">
            이미 <strong style="color: #ff8566;">12,847명</strong>의 선생님이 구독 중입니다
          </div>
        </div>
      </div>

      <footer>
        <p>© 2025 WITTI | 출퇴근길 5분, 위트 있는 인사이트 한 컷.</p>
      </footer>

      <script>
        function filterStories(category) {
          const cards = document.querySelectorAll('.story-card');
          const buttons = document.querySelectorAll('[id^="filter-"]');
          
          // Reset all buttons
          buttons.forEach(btn => {
            btn.style.background = 'white';
            btn.style.color = '#333';
            btn.style.border = '2px solid #ffe9d6';
          });
          
          // Highlight active button
          const activeBtn = document.getElementById('filter-' + category);
          activeBtn.style.background = '#ff8566';
          activeBtn.style.color = 'white';
          activeBtn.style.border = 'none';
          
          // Filter cards
          cards.forEach(card => {
            if (category === 'all' || card.dataset.category === category) {
              card.style.display = 'block';
            } else {
              card.style.display = 'none';
            }
          });
        }
        
        // Lazy loading simulation (scroll event)
        let page = 1;
        window.addEventListener('scroll', () => {
          if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            // Load more stories (placeholder for future implementation)
            console.log('Load more stories - page', ++page);
          }
        });
      </script>

    </body>
    </html>
  `)
})

// Talk page route - Tabbed community with Feed, Projects, Meetups, Suggestions
app.get('/talk', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WITTI Talk - 교사 커뮤니티</title>
      <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <link rel="stylesheet" href="/static/style.css">
      <style>
        .tab-content {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 2rem;
        }
        
        .feed-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
        }
        
        .feed-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
        
        .feed-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .feed-avatar {
          width: 50px;
          height: 50px;
          background: #ffe9d6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }
        
        .feed-user-info h4 {
          margin: 0;
          font-size: 1rem;
          color: #333;
        }
        
        .feed-user-info p {
          margin: 0;
          font-size: 0.85rem;
          color: #999;
        }
        
        .feed-content {
          font-size: 1rem;
          line-height: 1.6;
          color: #555;
          margin-bottom: 1rem;
        }
        
        .feed-actions {
          display: flex;
          gap: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #f0f0f0;
        }
        
        .feed-action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          color: #666;
          transition: color 0.2s;
        }
        
        .feed-action-btn:hover {
          color: #ff8566;
        }
        
        .feed-action-btn.active {
          color: #ff8566;
          font-weight: 600;
        }
        
        .project-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border-left: 4px solid #ff8566;
        }
        
        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
        
        .project-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 0.5rem;
        }
        
        .project-badge {
          background: #fff0e6;
          color: #ff8566;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        
        .project-desc {
          color: #666;
          line-height: 1.6;
          margin-bottom: 1rem;
        }
        
        .project-meta {
          display: flex;
          gap: 2rem;
          margin-bottom: 1rem;
          font-size: 0.9rem;
          color: #999;
        }
        
        .project-members {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .project-join-btn {
          background: #ff8566;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        
        .project-join-btn:hover {
          background: #ff9f80;
          transform: translateY(-2px);
        }
        
        .meetup-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          display: flex;
          gap: 1.5rem;
        }
        
        .meetup-date {
          min-width: 80px;
          text-align: center;
          background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%);
          border-radius: 8px;
          padding: 1rem;
        }
        
        .meetup-month {
          font-size: 0.85rem;
          color: #ff8566;
          font-weight: 600;
        }
        
        .meetup-day {
          font-size: 2rem;
          font-weight: 700;
          color: #333;
        }
        
        .meetup-info {
          flex: 1;
        }
        
        .meetup-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 0.5rem;
        }
        
        .meetup-location {
          color: #666;
          margin-bottom: 0.5rem;
        }
        
        .meetup-attendees {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #999;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }
        
        .meetup-btn-group {
          display: flex;
          gap: 1rem;
        }
        
        .meetup-btn {
          padding: 8px 20px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        
        .meetup-btn.primary {
          background: #ff8566;
          color: white;
        }
        
        .meetup-btn.primary:hover {
          background: #ff9f80;
        }
        
        .meetup-btn.secondary {
          background: white;
          color: #ff8566;
          border: 2px solid #ff8566;
        }
        
        .meetup-btn.secondary:hover {
          background: #fff0e6;
        }
        
        .suggestion-card {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .suggestion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .suggestion-vote {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          min-width: 60px;
        }
        
        .vote-btn {
          background: white;
          border: 2px solid #ffe9d6;
          border-radius: 8px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 1.2rem;
          transition: all 0.2s;
        }
        
        .vote-btn:hover {
          background: #fff0e6;
          border-color: #ff8566;
        }
        
        .vote-count {
          font-size: 1.2rem;
          font-weight: 700;
          color: #ff8566;
        }
        
        .suggestion-content {
          flex: 1;
        }
        
        .suggestion-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 0.5rem;
        }
        
        .suggestion-desc {
          color: #666;
          line-height: 1.6;
        }
        
        .create-post-btn {
          position: fixed;
          right: 2rem;
          bottom: 2rem;
          width: 60px;
          height: 60px;
          background: #ff8566;
          color: white;
          border: none;
          border-radius: 50%;
          font-size: 1.5rem;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(255, 133, 102, 0.4);
          transition: all 0.3s;
          z-index: 100;
        }
        
        .create-post-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(255, 133, 102, 0.5);
        }
        
        @media (max-width: 768px) {
          .meetup-card {
            flex-direction: column;
          }
          
          .meetup-date {
            min-width: auto;
          }
        }
      </style>
    </head>
    <body>

      <header style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid #f0f0f0;">
        <div style="display: flex; align-items: center; gap: 2.5rem;">
          <h1 style="margin: 0; cursor: pointer; font-size: 1.5rem; font-weight: 700; color: #333;" onclick="window.location.href='/'">🌿 WITTI</h1>
          <nav style="display: flex; gap: 2rem; align-items: center;">
            <a href="/" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">New</a>
            <a href="/learn" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Learn</a>
            <a href="/story" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Story</a>
            <a href="/talk" style="text-decoration: none; color: #ff8566; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; border-radius: 8px; background: #fff0e6; transition: all 0.3s;">Talk</a>
            <a href="/tools" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Tools</a>
          </nav>
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <button onclick="window.location.href='/cart'" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; position: relative;" title="장바구니">
            🛒
            <span class="cartBadge" style="position: absolute; top: -5px; right: -5px; background: #ff8566; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: none; align-items: center; justify-content: center;">0</span>
          </button>
          <button onclick="alert('검색 기능 준비 중')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem;" title="검색">🔍</button>
          <button onclick="alert('알림이 없습니다')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; position: relative;" title="알림">
            🔔
            <span style="position: absolute; top: -5px; right: -5px; background: #ff8566; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center;">3</span>
          </button>
          <div class="userMenu" style="display: none; gap: 0.5rem; align-items: center;">
            <a href="/mywitti" style="background: #ff8566; color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">내 강의실</a>
            <button class="logoutBtn" style="background: #f5f5f5; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">로그아웃</button>
          </div>
          <div class="authMenu" style="display: flex; gap: 0.5rem;">
            <a href="/login" style="background: #f5f5f5; color: #333; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">로그인</a>
            <a href="/signup" style="background: #ff8566; color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">회원가입</a>
          </div>
        </div>
      </header>

      <section id="hero">
        <h2>함께 나누는 교사 커뮤니티</h2>
        <p>고민 상담부터 경험 공유까지, 혼자가 아닙니다</p>
      </section>

      <!-- Tab Navigation -->
      <section style="background: white; padding: 1.5rem 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); position: sticky; top: 0; z-index: 50;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap;">
          <button onclick="switchTab('feed')" id="tab-feed" style="padding: 10px 20px; background: #ff8566; color: white; border: none; border-radius: 20px; cursor: pointer; font-weight: 600; transition: all 0.2s;">🔹 공감 피드</button>
          <button onclick="switchTab('projects')" id="tab-projects" style="padding: 10px 20px; background: white; border: 2px solid #ffe9d6; border-radius: 20px; cursor: pointer; font-weight: 500; transition: all 0.2s;">실천 프로젝트</button>
          <button onclick="switchTab('meetups')" id="tab-meetups" style="padding: 10px 20px; background: white; border: 2px solid #ffe9d6; border-radius: 20px; cursor: pointer; font-weight: 500; transition: all 0.2s;">밋업</button>
          <button onclick="switchTab('suggestions')" id="tab-suggestions" style="padding: 10px 20px; background: white; border: 2px solid #ffe9d6; border-radius: 20px; cursor: pointer; font-weight: 500; transition: all 0.2s;">제안</button>
        </div>
      </section>

      <!-- Feed Tab Content -->
      <div id="content-feed" class="tab-content">
        <div class="feed-card">
          <div class="feed-header">
            <div class="feed-avatar">👩</div>
            <div class="feed-user-info">
              <h4>김민지 선생님</h4>
              <p>유치원 교사 · 3년차 · 5분 전</p>
            </div>
          </div>
          <div class="feed-content">
            오늘 아이들과 산책을 하는데, 한 아이가 갑자기 제 손을 꼭 잡고 "선생님 좋아해요"라고 하더라고요. 
            요즘 힘든 일이 많았는데 그 한마디에 다 녹아버렸어요. 이래서 교사를 계속하는구나 싶었습니다 💕
          </div>
          <div class="feed-actions">
            <button class="feed-action-btn active">
              <span>❤️</span>
              <span>공감 234</span>
            </button>
            <button class="feed-action-btn">
              <span>💬</span>
              <span>댓글 45</span>
            </button>
            <button class="feed-action-btn">
              <span>🔔</span>
              <span>팔로우</span>
            </button>
          </div>
        </div>

        <div class="feed-card">
          <div class="feed-header">
            <div class="feed-avatar">👨</div>
            <div class="feed-user-info">
              <h4>이준호 선생님</h4>
              <p>초등학교 교사 · 7년차 · 1시간 전</p>
            </div>
          </div>
          <div class="feed-content">
            부모상담 준비하면서 너무 긴장됐는데, WITTI에서 배운 대로 했더니 생각보다 잘 풀렸어요!
            특히 "아이의 강점을 먼저 말하기" 팁이 정말 유용했습니다. 학부모님도 좋아하셨어요 🙏
          </div>
          <div class="feed-actions">
            <button class="feed-action-btn">
              <span>❤️</span>
              <span>공감 156</span>
            </button>
            <button class="feed-action-btn">
              <span>💬</span>
              <span>댓글 28</span>
            </button>
            <button class="feed-action-btn">
              <span>🔔</span>
              <span>팔로우</span>
            </button>
          </div>
        </div>

        <div class="feed-card">
          <div class="feed-header">
            <div class="feed-avatar">👩</div>
            <div class="feed-user-info">
              <h4>박수진 선생님</h4>
              <p>중학교 교사 · 10년차 · 3시간 전</p>
            </div>
          </div>
          <div class="feed-content">
            오늘 한 학생이 지난번에 제가 조언해줬던 걸 실천해서 시험을 잘 봤다고 고맙다고 하더라고요.
            교사로서 정말 보람찬 순간이었습니다. 작은 관심이 큰 변화를 만들 수 있다는 걸 다시 느꼈어요 ✨
          </div>
          <div class="feed-actions">
            <button class="feed-action-btn">
              <span>❤️</span>
              <span>공감 312</span>
            </button>
            <button class="feed-action-btn">
              <span>💬</span>
              <span>댓글 67</span>
            </button>
            <button class="feed-action-btn">
              <span>🔔</span>
              <span>팔로우</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Projects Tab Content -->
      <div id="content-projects" class="tab-content" style="display: none;">
        <div class="project-card">
          <div class="project-header">
            <div>
              <div class="project-title">부모상담 개선 실험</div>
              <div class="project-badge">모집 중 · 4/6명</div>
            </div>
          </div>
          <div class="project-desc">
            부모상담을 더 효과적으로 진행하기 위한 다양한 방법을 실험하고 공유합니다. 
            AI 도구 활용, 대화 기법, 사전 준비 등을 함께 연구합니다.
          </div>
          <div class="project-meta">
            <div class="project-members">
              <span>👥</span>
              <span>4명 참여 중</span>
            </div>
            <div>
              <span>📅</span>
              <span>4주 프로젝트</span>
            </div>
            <div>
              <span>🎯</span>
              <span>주 1회 온라인 모임</span>
            </div>
          </div>
          <button class="project-join-btn" onclick="alert('프로젝트 참가 신청')">프로젝트 참가하기</button>
        </div>

        <div class="project-card">
          <div class="project-header">
            <div>
              <div class="project-title">교실 놀이연구회</div>
              <div class="project-badge">진행 중 · 6/6명</div>
            </div>
          </div>
          <div class="project-desc">
            아이들과 함께 할 수 있는 창의적인 놀이를 연구하고 개발합니다. 
            매주 새로운 놀이를 시도하고 그 결과를 공유하며 개선해나갑니다.
          </div>
          <div class="project-meta">
            <div class="project-members">
              <span>👥</span>
              <span>6명 참여 중</span>
            </div>
            <div>
              <span>📅</span>
              <span>8주 프로젝트</span>
            </div>
            <div>
              <span>🎯</span>
              <span>주 1회 실습 + 공유</span>
            </div>
          </div>
          <button class="project-join-btn" style="background: #ccc; cursor: not-allowed;" disabled>모집 완료</button>
        </div>

        <div class="project-card">
          <div class="project-header">
            <div>
              <div class="project-title">AI 도구 마스터 챌린지</div>
              <div class="project-badge">모집 중 · 2/6명</div>
            </div>
          </div>
          <div class="project-desc">
            교사 업무에 도움이 되는 AI 도구들을 하나씩 배우고 실제로 활용해봅니다. 
            ChatGPT, Notion AI, Canva 등 실용적인 도구를 함께 공부합니다.
          </div>
          <div class="project-meta">
            <div class="project-members">
              <span>👥</span>
              <span>2명 참여 중</span>
            </div>
            <div>
              <span>📅</span>
              <span>6주 프로젝트</span>
            </div>
            <div>
              <span>🎯</span>
              <span>주 2회 온라인 실습</span>
            </div>
          </div>
          <button class="project-join-btn" onclick="alert('프로젝트 참가 신청')">프로젝트 참가하기</button>
        </div>
      </div>

      <!-- Meetups Tab Content -->
      <div id="content-meetups" class="tab-content" style="display: none;">
        <div class="meetup-card">
          <div class="meetup-date">
            <div class="meetup-month">2월</div>
            <div class="meetup-day">15</div>
          </div>
          <div class="meetup-info">
            <div class="meetup-title">서울 교사 네트워킹 모임</div>
            <div class="meetup-location">📍 서울 강남구 · 카페 라운지</div>
            <div class="meetup-attendees">
              <span>👥</span>
              <span>23명 참석 예정</span>
            </div>
            <div class="meetup-btn-group">
              <button class="meetup-btn primary" onclick="alert('참가 신청')">참가 신청</button>
              <button class="meetup-btn secondary" onclick="alert('알림 설정')">🔔 알림 받기</button>
            </div>
          </div>
        </div>

        <div class="meetup-card">
          <div class="meetup-date">
            <div class="meetup-month">2월</div>
            <div class="meetup-day">22</div>
          </div>
          <div class="meetup-info">
            <div class="meetup-title">부산 신규교사 멘토링 데이</div>
            <div class="meetup-location">📍 부산 해운대구 · 커뮤니티 센터</div>
            <div class="meetup-attendees">
              <span>👥</span>
              <span>15명 참석 예정</span>
            </div>
            <div class="meetup-btn-group">
              <button class="meetup-btn primary" onclick="alert('참가 신청')">참가 신청</button>
              <button class="meetup-btn secondary" onclick="alert('알림 설정')">🔔 알림 받기</button>
            </div>
          </div>
        </div>

        <div class="meetup-card">
          <div class="meetup-date">
            <div class="meetup-month">3월</div>
            <div class="meetup-day">08</div>
          </div>
          <div class="meetup-info">
            <div class="meetup-title">대전 AI 교육 도구 워크샵</div>
            <div class="meetup-location">📍 대전 유성구 · 교육청 연수원</div>
            <div class="meetup-attendees">
              <span>👥</span>
              <span>8명 참석 예정</span>
            </div>
            <div class="meetup-btn-group">
              <button class="meetup-btn primary" onclick="alert('참가 신청')">참가 신청</button>
              <button class="meetup-btn secondary" onclick="alert('알림 설정')">🔔 알림 받기</button>
            </div>
          </div>
        </div>

        <div class="meetup-card">
          <div class="meetup-date">
            <div class="meetup-month">3월</div>
            <div class="meetup-day">20</div>
          </div>
          <div class="meetup-info">
            <div class="meetup-title">온라인 교사 북클럽 - 도담서가</div>
            <div class="meetup-location">📍 온라인 Zoom · 저녁 8시</div>
            <div class="meetup-attendees">
              <span>👥</span>
              <span>34명 참석 예정</span>
            </div>
            <div class="meetup-btn-group">
              <button class="meetup-btn primary" onclick="alert('참가 신청')">참가 신청</button>
              <button class="meetup-btn secondary" onclick="alert('알림 설정')">🔔 알림 받기</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Suggestions Tab Content -->
      <div id="content-suggestions" class="tab-content" style="display: none;">
        <div class="suggestion-card">
          <div class="suggestion-header">
            <div class="suggestion-content">
              <div class="suggestion-title">학급 경영 노하우 시리즈 콘텐츠</div>
              <div class="suggestion-desc">
                신규 교사들을 위한 학급 경영 실전 가이드가 있으면 좋겠어요. 
                첫 담임을 맡았을 때 어떻게 시작해야 할지 막막했던 기억이 나네요.
              </div>
              <div style="font-size: 0.85rem; color: #999; margin-top: 0.5rem;">
                제안자: 이수진 선생님 · 2일 전
              </div>
            </div>
            <div class="suggestion-vote">
              <button class="vote-btn" onclick="alert('추천하기')">👍</button>
              <div class="vote-count">156</div>
            </div>
          </div>
        </div>

        <div class="suggestion-card">
          <div class="suggestion-header">
            <div class="suggestion-content">
              <div class="suggestion-title">학부모 소통 메시지 템플릿 모음</div>
              <div class="suggestion-desc">
                다양한 상황별로 학부모님께 보낼 수 있는 메시지 템플릿이 있으면 유용할 것 같아요. 
                특히 민감한 상황에서 어떻게 말을 꺼내야 할지 어려울 때가 많거든요.
              </div>
              <div style="font-size: 0.85rem; color: #999; margin-top: 0.5rem;">
                제안자: 박준호 선생님 · 5일 전
              </div>
            </div>
            <div class="suggestion-vote">
              <button class="vote-btn" onclick="alert('추천하기')">👍</button>
              <div class="vote-count">203</div>
            </div>
          </div>
        </div>

        <div class="suggestion-card">
          <div class="suggestion-header">
            <div class="suggestion-content">
              <div class="suggestion-title">교사 자기계발 북리스트</div>
              <div class="suggestion-desc">
                교사로서 성장하는 데 도움이 되는 책들을 주제별로 정리한 큐레이션이 있으면 좋겠습니다. 
                교육 철학, 심리학, 자기계발 등 다양한 카테고리로 나눠서요.
              </div>
              <div style="font-size: 0.85rem; color: #999; margin-top: 0.5rem;">
                제안자: 최민지 선생님 · 1주일 전
              </div>
            </div>
            <div class="suggestion-vote">
              <button class="vote-btn" onclick="alert('추천하기')">👍</button>
              <div class="vote-count">89</div>
            </div>
          </div>
        </div>

        <div class="suggestion-card">
          <div class="suggestion-header">
            <div class="suggestion-content">
              <div class="suggestion-title">지역별 교사 모임 정보 공유</div>
              <div class="suggestion-desc">
                각 지역에서 열리는 교사 모임이나 스터디 정보를 한눈에 볼 수 있는 게시판이 있으면 좋을 것 같아요. 
                지역 선생님들과 네트워킹할 기회가 많아질 것 같습니다.
              </div>
              <div style="font-size: 0.85rem; color: #999; margin-top: 0.5rem;">
                제안자: 강혜진 선생님 · 2주일 전
              </div>
            </div>
            <div class="suggestion-vote">
              <button class="vote-btn" onclick="alert('추천하기')">👍</button>
              <div class="vote-count">124</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Floating Create Post Button -->
      <button class="create-post-btn" onclick="alert('글쓰기 (로그인 필요)')" title="글쓰기">✏️</button>

      <footer>
        <p>© 2025 WITTI | 출퇴근길 5분, 위트 있는 인사이트 한 컷.</p>
      </footer>

      <script>
        function switchTab(tabName) {
          // Hide all tab contents
          document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
          });
          
          // Reset all tab buttons
          document.querySelectorAll('[id^="tab-"]').forEach(btn => {
            btn.style.background = 'white';
            btn.style.color = '#333';
            btn.style.border = '2px solid #ffe9d6';
          });
          
          // Show selected tab content
          document.getElementById('content-' + tabName).style.display = 'block';
          
          // Highlight active tab button
          const activeBtn = document.getElementById('tab-' + tabName);
          activeBtn.style.background = '#ff8566';
          activeBtn.style.color = 'white';
          activeBtn.style.border = 'none';
        }
      </script>

    </body>
    </html>
  `)
})

// Tools page route - AI Tools Dashboard with interactive tools
app.get('/tools', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WITTI Tools - AI 도구 허브</title>
      <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <link rel="stylesheet" href="/static/style.css">
      <style>
        .tools-container {
          max-width: 1200px;
          margin: 2rem auto;
          padding: 0 2rem;
        }
        
        .tool-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
          margin-bottom: 3rem;
        }
        
        @media (max-width: 968px) {
          .tool-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .tool-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          cursor: pointer;
          transition: all 0.3s ease;
          border: 3px solid transparent;
        }
        
        .tool-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
          border-color: #ff8566;
        }
        
        .tool-card.active {
          border-color: #ff8566;
          background: linear-gradient(135deg, #fff0e6 0%, #ffffff 100%);
        }
        
        .tool-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
        }
        
        .tool-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 0.75rem;
        }
        
        .tool-desc {
          color: #666;
          line-height: 1.6;
          margin-bottom: 1rem;
        }
        
        .tool-badge {
          display: inline-block;
          background: #fff0e6;
          color: #ff8566;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .ai-workspace {
          background: white;
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          margin-bottom: 3rem;
        }
        
        .workspace-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px solid #f0f0f0;
        }
        
        .workspace-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #ff8566 0%, #ff9f80 100%);
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          color: white;
        }
        
        .workspace-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #333;
        }
        
        .input-section {
          margin-bottom: 2rem;
        }
        
        .input-label {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 0.75rem;
          display: block;
        }
        
        .ai-textarea {
          width: 100%;
          min-height: 200px;
          padding: 1.5rem;
          border: 2px solid #ffe9d6;
          border-radius: 12px;
          font-size: 1rem;
          font-family: "Pretendard", -apple-system, sans-serif;
          resize: vertical;
          transition: border-color 0.3s;
        }
        
        .ai-textarea:focus {
          outline: none;
          border-color: #ff8566;
        }
        
        .ai-textarea::placeholder {
          color: #999;
        }
        
        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .ai-button {
          flex: 1;
          padding: 1rem 2rem;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        
        .ai-button.primary {
          background: linear-gradient(135deg, #ff8566 0%, #ff9f80 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(255, 133, 102, 0.3);
        }
        
        .ai-button.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(255, 133, 102, 0.4);
        }
        
        .ai-button.secondary {
          background: white;
          color: #ff8566;
          border: 2px solid #ff8566;
        }
        
        .ai-button.secondary:hover {
          background: #fff0e6;
        }
        
        .result-section {
          background: #f9f9f9;
          border-radius: 12px;
          padding: 2rem;
          display: none;
        }
        
        .result-section.show {
          display: block;
        }
        
        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .result-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #333;
        }
        
        .copy-button {
          padding: 8px 20px;
          background: #ff8566;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        
        .copy-button:hover {
          background: #ff9f80;
        }
        
        .result-content {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          line-height: 1.8;
          color: #555;
          white-space: pre-wrap;
        }
        
        .toolkit-section {
          background: white;
          border-radius: 16px;
          padding: 2.5rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        .section-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #333;
        }
        
        .view-all-btn {
          color: #ff8566;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s;
        }
        
        .view-all-btn:hover {
          color: #ff9f80;
        }
        
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .history-item {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.5rem;
          background: #f9f9f9;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .history-item:hover {
          background: #fff0e6;
          transform: translateX(4px);
        }
        
        .history-icon {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
        }
        
        .history-info {
          flex: 1;
        }
        
        .history-tool {
          font-weight: 700;
          color: #333;
          margin-bottom: 0.25rem;
        }
        
        .history-date {
          font-size: 0.85rem;
          color: #999;
        }
        
        .template-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-top: 2rem;
        }
        
        @media (max-width: 968px) {
          .template-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 640px) {
          .template-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .template-card {
          background: #f9f9f9;
          padding: 1.5rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
          border: 2px solid transparent;
        }
        
        .template-card:hover {
          background: #fff0e6;
          border-color: #ff8566;
        }
        
        .template-name {
          font-weight: 700;
          color: #333;
          margin-bottom: 0.5rem;
        }
        
        .template-desc {
          font-size: 0.9rem;
          color: #666;
        }
      </style>
    </head>
    <body>

      <header style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid #f0f0f0;">
        <div style="display: flex; align-items: center; gap: 2.5rem;">
          <h1 style="margin: 0; cursor: pointer; font-size: 1.5rem; font-weight: 700; color: #333;" onclick="window.location.href='/'">🌿 WITTI</h1>
          <nav style="display: flex; gap: 2rem; align-items: center;">
            <a href="/" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">New</a>
            <a href="/learn" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Learn</a>
            <a href="/story" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Story</a>
            <a href="/talk" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Talk</a>
            <a href="/tools" style="text-decoration: none; color: #ff8566; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; border-radius: 8px; background: #fff0e6; transition: all 0.3s;">Tools</a>
          </nav>
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <button onclick="window.location.href='/cart'" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; position: relative;" title="장바구니">
            🛒
            <span class="cartBadge" style="position: absolute; top: -5px; right: -5px; background: #ff8566; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: none; align-items: center; justify-content: center;">0</span>
          </button>
          <button onclick="alert('검색 기능 준비 중')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem;" title="검색">🔍</button>
          <button onclick="alert('알림이 없습니다')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; position: relative;" title="알림">
            🔔
            <span style="position: absolute; top: -5px; right: -5px; background: #ff8566; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center;">3</span>
          </button>
          <div class="userMenu" style="display: none; gap: 0.5rem; align-items: center;">
            <a href="/mywitti" style="background: #ff8566; color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">내 강의실</a>
            <button class="logoutBtn" style="background: #f5f5f5; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">로그아웃</button>
          </div>
          <div class="authMenu" style="display: flex; gap: 0.5rem;">
            <a href="/login" style="background: #f5f5f5; color: #333; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">로그인</a>
            <a href="/signup" style="background: #ff8566; color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">회원가입</a>
          </div>
        </div>
      </header>

      <section id="hero">
        <h2>교사를 위한 AI 도구 허브</h2>
        <p>일상 업무를 AI로 간편하게, 나만의 시간을 되찾으세요</p>
      </section>

      <div class="tools-container">
        <!-- Tool Selection Grid -->
        <div class="tool-grid">
          <div class="tool-card" onclick="selectTool('meeting')">
            <div class="tool-icon">🤖</div>
            <div class="tool-title">부모면담 요약기</div>
            <div class="tool-desc">
              긴 면담 내용을 AI가 핵심만 추려서 정리해드립니다. 
              면담 기록 시간을 90% 단축하세요.
            </div>
            <div class="tool-badge">가장 인기</div>
          </div>

          <div class="tool-card" onclick="selectTool('diary')">
            <div class="tool-icon">📝</div>
            <div class="tool-title">일일일지 자동작성</div>
            <div class="tool-desc">
              오늘 있었던 활동을 간단히 입력하면 체계적인 일지로 정리됩니다.
            </div>
            <div class="tool-badge">시간 절약</div>
          </div>

          <div class="tool-card" onclick="selectTool('emotion')">
            <div class="tool-icon">💗</div>
            <div class="tool-title">감정일지 & 마음진단</div>
            <div class="tool-desc">
              교사의 감정 상태를 체크하고 번아웃을 예방합니다. WITTI Care.
            </div>
            <div class="tool-badge">마음 건강</div>
          </div>

          <div class="tool-card" onclick="selectTool('report')">
            <div class="tool-icon">📊</div>
            <div class="tool-title">성장 리포트 생성기</div>
            <div class="tool-desc">
              아이의 발달 과정을 PDF 리포트로 자동 생성. 학부모 공유용.
            </div>
            <div class="tool-badge">PDF 출력</div>
          </div>
        </div>

        <!-- AI Workspace -->
        <div class="ai-workspace" id="ai-workspace" style="display: none;">
          <div class="workspace-header">
            <div class="workspace-icon" id="workspace-icon">🤖</div>
            <div>
              <div class="workspace-title" id="workspace-title">부모면담 요약기</div>
              <div style="color: #666;">AI가 정리해드릴게요</div>
            </div>
          </div>

          <div class="input-section">
            <label class="input-label" id="input-label">
              면담 내용을 입력하거나 붙여넣기 해주세요
            </label>
            <textarea 
              class="ai-textarea" 
              id="ai-input" 
              placeholder="예시: 오늘 OOO 학부모님과 면담을 진행했습니다. 아이가 최근 친구들과 잘 어울리지 못하는 것 같다는 고민을 상담했고, 집에서도 조금 위축된 모습을 보인다고 하셨습니다..."
            ></textarea>
          </div>

          <div class="action-buttons">
            <button class="ai-button primary" onclick="generateResult()">
              <span>✨</span>
              <span>AI가 정리해드릴게요</span>
            </button>
            <button class="ai-button secondary" onclick="clearInput()">
              <span>🔄</span>
              <span>초기화</span>
            </button>
          </div>

          <div class="result-section" id="result-section">
            <div class="result-header">
              <div class="result-title">✅ AI 정리 완료</div>
              <button class="copy-button" onclick="copyResult()">📋 복사하기</button>
            </div>
            <div class="result-content" id="result-content"></div>
          </div>
        </div>

        <!-- My Toolkit Section -->
        <div class="toolkit-section">
          <div class="section-header">
            <div class="section-title">📂 My Toolkit</div>
            <div class="view-all-btn" onclick="alert('전체 보기')">전체 보기 →</div>
          </div>

          <div style="margin-bottom: 3rem;">
            <h4 style="color: #666; margin-bottom: 1rem;">최근 사용 도구</h4>
            <div class="history-list">
              <div class="history-item" onclick="alert('도구 불러오기')">
                <div class="history-icon">🤖</div>
                <div class="history-info">
                  <div class="history-tool">부모면담 요약기</div>
                  <div class="history-date">2025년 1월 9일 · 오후 3:24</div>
                </div>
              </div>

              <div class="history-item" onclick="alert('도구 불러오기')">
                <div class="history-icon">📝</div>
                <div class="history-info">
                  <div class="history-tool">일일일지 자동작성</div>
                  <div class="history-date">2025년 1월 8일 · 오후 5:12</div>
                </div>
              </div>

              <div class="history-item" onclick="alert('도구 불러오기')">
                <div class="history-icon">💗</div>
                <div class="history-info">
                  <div class="history-tool">감정일지</div>
                  <div class="history-date">2025년 1월 7일 · 오후 7:45</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 style="color: #666; margin-bottom: 1rem;">내 템플릿 저장소</h4>
            <div class="template-grid">
              <div class="template-card" onclick="alert('템플릿 불러오기')">
                <div class="template-name">📄 학부모 상담 템플릿</div>
                <div class="template-desc">정기 상담용 기본 양식</div>
              </div>

              <div class="template-card" onclick="alert('템플릿 불러오기')">
                <div class="template-name">📋 월간 활동 보고서</div>
                <div class="template-desc">매월 작성하는 활동 일지</div>
              </div>

              <div class="template-card" onclick="alert('템플릿 불러오기')">
                <div class="template-name">📊 발달 체크리스트</div>
                <div class="template-desc">영유아 발달 평가 양식</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer style="margin-top: 4rem;">
        <p>© 2025 WITTI | AI로 더 스마트하게, 더 따뜻하게</p>
      </footer>

      <script>
        const toolConfigs = {
          meeting: {
            icon: '🤖',
            title: '부모면담 요약기',
            label: '면담 내용을 입력하거나 붙여넣기 해주세요',
            placeholder: '예시: 오늘 OOO 학부모님과 면담을 진행했습니다. 아이가 최근 친구들과 잘 어울리지 못하는 것 같다는 고민을 상담했고...',
            sample: '【면담 요약】\\n\\n일시: 2025년 1월 9일\\n대상: OOO 학부모\\n\\n[주요 내용]\\n- 아이가 또래 관계에서 어려움을 겪고 있음\\n- 가정에서도 위축된 모습 관찰\\n- 자신감 저하가 주요 원인으로 파악\\n\\n[조치 사항]\\n1. 교실 내 소그룹 활동 참여 독려\\n2. 긍정적 피드백 강화\\n3. 학부모님께 가정에서의 지지 방법 안내\\n\\n[후속 계획]\\n- 2주 후 진척 상황 재확인\\n- 필요시 상담교사 연계'
          },
          diary: {
            icon: '📝',
            title: '일일일지 자동작성',
            label: '오늘 진행한 활동을 간단히 입력해주세요',
            placeholder: '예시: 오전에는 미술활동으로 손바닥 나무 그리기를 했고, 점심 후에는 운동장에서 공놀이를 했습니다...',
            sample: '【일일 활동 일지】\\n\\n날짜: 2025년 1월 9일 (목)\\n날씨: 맑음\\n\\n[오전 활동]\\n◆ 미술 활동: 손바닥 나무 그리기\\n- 참여도: 높음\\n- 창의성 발휘 우수\\n- 색채 감각 발달 관찰\\n\\n[점심 이후]\\n◆ 실외 활동: 운동장 공놀이\\n- 대근육 발달 활동\\n- 협동심 향상\\n- 규칙 준수 연습\\n\\n[특이사항]\\n- 전반적으로 적극적인 참여도\\n- 친구들 간 협력이 잘 이루어짐\\n\\n[교사 소견]\\n오늘 아이들이 특히 즐겁게 활동에 참여했습니다.'
          },
          emotion: {
            icon: '💗',
            title: '감정일지 & 마음진단',
            label: '오늘 느낀 감정과 상황을 자유롭게 적어주세요',
            placeholder: '예시: 오늘은 아이들과의 활동이 잘 풀리지 않아서 조금 지쳤습니다. 업무가 많아서 퇴근 후에도 마음이 무겁네요...',
            sample: '【WITTI Care 마음 진단】\\n\\n감정 상태: 피로 및 스트레스\\n번아웃 위험도: 중간 (주의 필요)\\n\\n[감지된 감정]\\n- 신체적 피로감 ★★★☆☆\\n- 정서적 소진 ★★★★☆\\n- 성취감 저하 ★★☆☆☆\\n\\n[추천 케어]\\n1. 오늘은 일찍 퇴근해서 충분한 휴식을 취하세요\\n2. 좋아하는 음악이나 영화로 기분 전환\\n3. 가벼운 산책이나 스트레칭 추천\\n\\n[장기 관리]\\n- 업무 우선순위 재조정 필요\\n- 동료 교사와의 고민 나누기\\n- 필요시 전문 상담 연계\\n\\n💚 선생님, 힘든 하루였군요. 오늘 하루도 최선을 다한 자신을 칭찬해주세요.'
          },
          report: {
            icon: '📊',
            title: '성장 리포트 생성기',
            label: '아이의 이름과 최근 발달 상황을 입력해주세요',
            placeholder: '예시: 김OO 아이는 최근 3개월간 언어 발달이 눈에 띄게 향상되었습니다. 문장 구성 능력이 좋아졌고...',
            sample: '【발달 성장 리포트】\\n\\n아동명: 김OO\\n관찰 기간: 2024년 10월 ~ 2025년 1월\\n\\n[언어 발달]\\n★★★★★ 우수\\n- 문장 구성 능력 향상\\n- 어휘력 확장\\n- 의사소통 적극적\\n\\n[사회성 발달]\\n★★★★☆ 양호\\n- 또래 관계 원만\\n- 협동 활동 참여 우수\\n- 감정 표현 발달\\n\\n[신체 발달]\\n★★★★☆ 양호\\n- 대근육 운동 능력 향상\\n- 소근육 활동 적극 참여\\n\\n[종합 의견]\\n전반적으로 균형 잡힌 발달을 보이고 있습니다. 특히 언어 영역에서 두드러진 성장이 관찰됩니다.\\n\\n※ 본 리포트는 학부모 상담 및 기록용으로 활용 가능합니다.'
          }
        };

        let currentTool = null;

        function selectTool(toolType) {
          currentTool = toolType;
          const config = toolConfigs[toolType];
          
          // Update workspace
          document.getElementById('workspace-icon').textContent = config.icon;
          document.getElementById('workspace-title').textContent = config.title;
          document.getElementById('input-label').textContent = config.label;
          document.getElementById('ai-input').placeholder = config.placeholder;
          
          // Show workspace
          document.getElementById('ai-workspace').style.display = 'block';
          
          // Hide result
          document.getElementById('result-section').classList.remove('show');
          
          // Clear input
          document.getElementById('ai-input').value = '';
          
          // Scroll to workspace
          document.getElementById('ai-workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
          
          // Update active state
          document.querySelectorAll('.tool-card').forEach(card => {
            card.classList.remove('active');
          });
          event.currentTarget.classList.add('active');
        }

        function generateResult() {
          const input = document.getElementById('ai-input').value;
          
          if (!input.trim()) {
            alert('내용을 입력해주세요.');
            return;
          }
          
          if (!currentTool) {
            alert('도구를 먼저 선택해주세요.');
            return;
          }
          
          // Show loading
          const resultSection = document.getElementById('result-section');
          const resultContent = document.getElementById('result-content');
          
          resultContent.textContent = '✨ AI가 열심히 정리 중입니다...';
          resultSection.classList.add('show');
          
          // Simulate AI processing
          setTimeout(() => {
            const config = toolConfigs[currentTool];
            resultContent.textContent = config.sample;
          }, 1500);
        }

        function clearInput() {
          document.getElementById('ai-input').value = '';
          document.getElementById('result-section').classList.remove('show');
        }

        function copyResult() {
          const resultText = document.getElementById('result-content').textContent;
          navigator.clipboard.writeText(resultText).then(() => {
            alert('✅ 복사되었습니다!');
          });
        }
      </script>

    </body>
    </html>
  `)
})

// MyWITTI page route - 4개 탭 (대시보드, 내 강의실, 성장 트리, 멘토 매칭)
app.get('/mywitti', async (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MyWITTI - 나의 성장 공간</title>
  <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
  <link rel="stylesheet" href="/static/style.css">
  <style>
    .dashboard-container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 2rem;
    }
    
    /* 탭 네비게이션 */
    .tab-navigation {
      background: white;
      border-radius: 16px;
      padding: 1rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
    }
    
    .tab-button {
      padding: 12px 24px;
      border: none;
      background: transparent;
      color: #666;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      border-radius: 10px;
      transition: all 0.3s ease;
      white-space: nowrap;
    }
    
    .tab-button:hover {
      background: #fff0e6;
      color: #ff8566;
    }
    
    .tab-button.active {
      background: #ff8566;
      color: white;
    }
    
    .tab-content {
      display: none;
    }
    
    .tab-content.active {
      display: block;
    }
    
    /* 프로필 섹션 */
    .profile-section {
      background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%);
      border-radius: 20px;
      padding: 2.5rem;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      gap: 2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .profile-avatar {
      width: 120px;
      height: 120px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      flex-shrink: 0;
    }
    
    .profile-info {
      flex: 1;
    }
    
    .profile-name {
      font-size: 2rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 0.5rem;
    }
    
    .profile-role {
      font-size: 1.1rem;
      color: #666;
      margin-bottom: 1rem;
    }
    
    .profile-level {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: white;
      padding: 10px 20px;
      border-radius: 25px;
      font-weight: 700;
      color: #ff8566;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    /* 통계 카드 */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    
    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
    }
    
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.12);
    }
    
    .stat-number {
      font-size: 3rem;
      font-weight: 700;
      color: #ff8566;
      margin-bottom: 0.5rem;
    }
    
    .stat-label {
      font-size: 1.1rem;
      color: #666;
      font-weight: 600;
    }
    
    /* 성장 트리 */
    .growth-tree {
      background: white;
      border-radius: 20px;
      padding: 3rem;
      margin-bottom: 3rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .section-title {
      font-size: 1.8rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .tree-branches {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      min-height: 300px;
      flex-wrap: wrap;
      gap: 2rem;
    }
    
    .tree-branch {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .tree-branch:hover {
      transform: translateY(-8px);
    }
    
    .branch-nodes {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: center;
    }
    
    .tree-node {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    
    .tree-node:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0,0,0,0.15);
    }
    
    .tree-node.locked {
      background: #f0f0f0;
      opacity: 0.5;
    }
    
    .tree-node.locked::before {
      content: '🔒';
      font-size: 1.5rem;
    }
    
    .branch-label {
      font-weight: 700;
      color: #333;
      font-size: 1rem;
      text-align: center;
    }
    
    /* 내 강의실 스타일 */
    .enrollment-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    
    .enrollment-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
      cursor: pointer;
    }
    
    .enrollment-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.12);
    }
    
    .enrollment-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    
    .enrollment-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 0.5rem;
    }
    
    .enrollment-instructor {
      font-size: 0.95rem;
      color: #ff8566;
      margin-bottom: 0.75rem;
    }
    
    .enrollment-date {
      font-size: 0.85rem;
      color: #999;
    }
    
    .payment-list {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .payment-item {
      border-bottom: 1px solid #f0f0f0;
      padding: 1.5rem 0;
    }
    
    .payment-item:last-child {
      border-bottom: none;
    }
    
    .payment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .payment-order-id {
      font-size: 0.95rem;
      font-weight: 700;
      color: #333;
    }
    
    .payment-amount {
      font-size: 1.3rem;
      font-weight: 700;
      color: #ff8566;
    }
    
    .payment-info {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      color: #666;
      flex-wrap: wrap;
    }
    
    .payment-classes {
      background: #f8f8f8;
      border-radius: 12px;
      padding: 1rem;
      margin-top: 1rem;
    }
    
    .payment-class-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
    }
    
    .payment-class-icon {
      font-size: 1.5rem;
    }
    
    .payment-class-info {
      flex: 1;
    }
    
    .payment-class-title {
      font-weight: 600;
      color: #333;
      font-size: 0.95rem;
    }
    
    .payment-class-instructor {
      font-size: 0.85rem;
      color: #999;
    }
    
    /* 멘토 매칭 */
    .mentor-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    
    .mentor-card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
    }
    
    .mentor-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.12);
    }
    
    .mentor-avatar {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      margin: 0 auto 1rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .mentor-name {
      font-size: 1.2rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 0.5rem;
    }
    
    .mentor-role {
      color: #666;
      margin-bottom: 1rem;
      font-size: 0.95rem;
    }
    
    .mentor-match {
      display: inline-block;
      background: #e8f5e9;
      color: #4caf50;
      padding: 6px 16px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
    
    .mentor-btn {
      background: #ff8566;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      width: 100%;
    }
    
    .mentor-btn:hover {
      background: #ff6b47;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 133, 102, 0.3);
    }
    
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #999;
    }
    
    .empty-state-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    
    .empty-state-text {
      font-size: 1.2rem;
      margin-bottom: 2rem;
    }
    
    .btn-primary {
      background: #ff8566;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .btn-primary:hover {
      background: #ff6b47;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 133, 102, 0.3);
    }
    
    @media (max-width: 968px) {
      .profile-section {
        flex-direction: column;
        text-align: center;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .tree-branches {
        flex-direction: column;
        align-items: center;
      }
    }
  </style>
</head>
<body>

      <header style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid #f0f0f0;">
        <div style="display: flex; align-items: center; gap: 2.5rem;">
          <h1 style="margin: 0; cursor: pointer; font-size: 1.5rem; font-weight: 700; color: #333;" onclick="window.location.href='/'">🌿 WITTI</h1>
          <nav style="display: flex; gap: 2rem; align-items: center;">
            <a href="/" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">New</a>
            <a href="/learn" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Learn</a>
            <a href="/story" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Story</a>
            <a href="/talk" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Talk</a>
            <a href="/tools" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Tools</a>
          </nav>
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <button onclick="window.location.href='/cart'" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; position: relative;" title="장바구니">
            🛒
            <span class="cartBadge" style="position: absolute; top: -5px; right: -5px; background: #ff8566; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: none; align-items: center; justify-content: center;">0</span>
          </button>
          <button onclick="alert('검색 기능 준비 중')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem;" title="검색">🔍</button>
          <button onclick="alert('알림이 없습니다')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; position: relative;" title="알림">
            🔔
            <span style="position: absolute; top: -5px; right: -5px; background: #ff8566; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center;">3</span>
          </button>
          <div class="userMenu" style="display: none; gap: 0.5rem; align-items: center;">
            <a href="/mywitti" style="background: #ff8566; color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">내 강의실</a>
            <button class="logoutBtn" style="background: #f5f5f5; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">로그아웃</button>
          </div>
          <div class="authMenu" style="display: flex; gap: 0.5rem;">
            <a href="/login" style="background: #f5f5f5; color: #333; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">로그인</a>
            <a href="/signup" style="background: #ff8566; color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">회원가입</a>
          </div>
        </div>
      </header>
  </header>
  
  <script>
    // 로그인 상태 확인 및 메뉴 표시
    (function() {
      const token = localStorage.getItem('witti_token');
      const userMenu = document.querySelector('.userMenu');
      const authMenu = document.querySelector('.authMenu');
      
      if (token) {
        userMenu.style.display = 'flex';
        authMenu.style.display = 'none';
      } else {
        userMenu.style.display = 'none';
        authMenu.style.display = 'flex';
      }
      
      // 로그아웃 버튼
      document.querySelector('.logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('witti_token');
        localStorage.removeItem('witti_user');
        alert('로그아웃되었습니다.');
        window.location.href = '/';
      });
      
      // 장바구니 아이템 수 표시
      const cart = JSON.parse(localStorage.getItem('witti_cart') || '[]');
      const cartBadge = document.querySelector('.cartBadge');
      if (cart.length > 0) {
        cartBadge.textContent = cart.length;
        cartBadge.style.display = 'flex';
      }
    })();
  </script>

  <section id="hero">
    <h2>나만의 성장 공간</h2>
    <p>배움의 기록부터 성취까지, 당신의 성장을 응원합니다</p>
  </section>

  <div class="dashboard-container">
    <!-- 프로필 섹션 -->
    <div class="profile-section">
      <div class="profile-avatar">👩‍🏫</div>
      <div class="profile-info">
        <div class="profile-name" id="userName">선생님</div>
        <div class="profile-role">유치원 교사 · 3년차</div>
        <div class="profile-level">
          <span style="font-size: 1.5rem;">⭐</span>
          <span>Lv.3 주임교사</span>
        </div>
      </div>
    </div>

    <!-- 탭 네비게이션 -->
    <div class="tab-navigation">
      <button class="tab-button active" onclick="switchTab('dashboard')">
        🏠 대시보드
      </button>
      <button class="tab-button" onclick="switchTab('classes')">
        📚 내 강의실
      </button>
      <button class="tab-button" onclick="switchTab('growth')">
        🌳 성장 트리
      </button>
      <button class="tab-button" onclick="switchTab('mentor')">
        💬 멘토 매칭
      </button>
    </div>

    <!-- 탭 1: 대시보드 -->
    <div id="tab-dashboard" class="tab-content active">
      <!-- 통계 카드 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number" id="enrollmentCount">0</div>
          <div class="stat-label">수강한 강의</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">37</div>
          <div class="stat-label">공감한 이야기</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">5</div>
          <div class="stat-label">획득한 뱃지</div>
        </div>
      </div>

      <!-- 간단한 성장 트리 미리보기 -->
      <div class="growth-tree">
        <div class="section-title">
          <span>🌳</span>
          <span>나의 성장 트리</span>
        </div>
        <p style="text-align: center; color: #666; margin-bottom: 2rem;">
          영역별 학습 진도를 확인하세요. 상세 보기는 "성장 트리" 탭에서!
        </p>
        <div class="tree-branches">
          <div class="tree-branch" onclick="switchTab('growth')">
            <div class="branch-nodes">
              <div class="tree-node">🤝</div>
              <div class="tree-node">💬</div>
              <div class="tree-node locked"></div>
            </div>
            <div class="branch-label">부모상담</div>
          </div>

          <div class="tree-branch" onclick="switchTab('growth')">
            <div class="branch-nodes">
              <div class="tree-node">🎨</div>
              <div class="tree-node">🎭</div>
              <div class="tree-node">🎪</div>
            </div>
            <div class="branch-label">놀이지도</div>
          </div>

          <div class="tree-branch" onclick="switchTab('growth')">
            <div class="branch-nodes">
              <div class="tree-node">🤖</div>
              <div class="tree-node locked"></div>
              <div class="tree-node locked"></div>
            </div>
            <div class="branch-label">AI 활용</div>
          </div>

          <div class="tree-branch" onclick="switchTab('growth')">
            <div class="branch-nodes">
              <div class="tree-node">💗</div>
              <div class="tree-node">🧘</div>
              <div class="tree-node locked"></div>
            </div>
            <div class="branch-label">감정케어</div>
          </div>

          <div class="tree-branch" onclick="switchTab('growth')">
            <div class="branch-nodes">
              <div class="tree-node">👑</div>
              <div class="tree-node locked"></div>
              <div class="tree-node locked"></div>
            </div>
            <div class="branch-label">리더십</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 탭 2: 내 강의실 -->
    <div id="tab-classes" class="tab-content">
      <div class="section-title">
        <span>📚</span>
        <span>수강중인 강의</span>
      </div>
      <div class="enrollment-grid" id="enrollmentList">
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">로딩 중...</div>
        </div>
      </div>

      <div class="section-title" style="margin-top: 3rem;">
        <span>💳</span>
        <span>결제 내역</span>
      </div>
      <div class="payment-list" id="paymentList">
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">로딩 중...</div>
        </div>
      </div>
    </div>

    <!-- 탭 3: 성장 트리 (상세) -->
    <div id="tab-growth" class="tab-content">
      <div class="section-title">
        <span>🌳</span>
        <span>성장 트리 상세</span>
      </div>
      <p style="text-align: center; color: #666; margin-bottom: 3rem; font-size: 1.1rem;">
        각 영역별 강의를 완료하면 노드가 활성화됩니다. 모든 노드를 완성하면 뱃지를 획득할 수 있어요!
      </p>

      <div class="growth-tree">
        <h3 style="color: #ff8566; margin-bottom: 2rem;">🤝 부모상담 전문가 트리</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 3rem;">
          <div style="text-align: center;">
            <div class="tree-node" style="margin: 0 auto 1rem;">🤝</div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">첫 만남 준비</div>
            <div style="font-size: 0.9rem; color: #4caf50;">✓ 완료</div>
          </div>
          <div style="text-align: center;">
            <div class="tree-node" style="margin: 0 auto 1rem;">💬</div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">효과적인 대화법</div>
            <div style="font-size: 0.9rem; color: #4caf50;">✓ 완료</div>
          </div>
          <div style="text-align: center;">
            <div class="tree-node locked" style="margin: 0 auto 1rem;"></div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">어려운 상황 대처</div>
            <div style="font-size: 0.9rem; color: #999;">🔒 잠김</div>
          </div>
        </div>
      </div>

      <div class="growth-tree">
        <h3 style="color: #ff8566; margin-bottom: 2rem;">🎨 놀이지도 전문가 트리</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 3rem;">
          <div style="text-align: center;">
            <div class="tree-node" style="margin: 0 auto 1rem;">🎨</div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">미술 놀이</div>
            <div style="font-size: 0.9rem; color: #4caf50;">✓ 완료</div>
          </div>
          <div style="text-align: center;">
            <div class="tree-node" style="margin: 0 auto 1rem;">🎭</div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">역할 놀이</div>
            <div style="font-size: 0.9rem; color: #4caf50;">✓ 완료</div>
          </div>
          <div style="text-align: center;">
            <div class="tree-node" style="margin: 0 auto 1rem;">🎪</div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">신체 놀이</div>
            <div style="font-size: 0.9rem; color: #4caf50;">✓ 완료</div>
          </div>
        </div>
      </div>

      <div class="growth-tree">
        <h3 style="color: #ff8566; margin-bottom: 2rem;">🤖 AI 활용 전문가 트리</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 3rem;">
          <div style="text-align: center;">
            <div class="tree-node" style="margin: 0 auto 1rem;">🤖</div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">AI 기초</div>
            <div style="font-size: 0.9rem; color: #4caf50;">✓ 완료</div>
          </div>
          <div style="text-align: center;">
            <div class="tree-node locked" style="margin: 0 auto 1rem;"></div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">업무 자동화</div>
            <div style="font-size: 0.9rem; color: #999;">🔒 잠김</div>
          </div>
          <div style="text-align: center;">
            <div class="tree-node locked" style="margin: 0 auto 1rem;"></div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">수업 활용</div>
            <div style="font-size: 0.9rem; color: #999;">🔒 잠김</div>
          </div>
        </div>
      </div>

      <div class="growth-tree">
        <h3 style="color: #ff8566; margin-bottom: 2rem;">💗 감정케어 전문가 트리</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 3rem;">
          <div style="text-align: center;">
            <div class="tree-node" style="margin: 0 auto 1rem;">💗</div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">자기 돌봄</div>
            <div style="font-size: 0.9rem; color: #4caf50;">✓ 완료</div>
          </div>
          <div style="text-align: center;">
            <div class="tree-node" style="margin: 0 auto 1rem;">🧘</div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">스트레스 관리</div>
            <div style="font-size: 0.9rem; color: #4caf50;">✓ 완료</div>
          </div>
          <div style="text-align: center;">
            <div class="tree-node locked" style="margin: 0 auto 1rem;"></div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">번아웃 극복</div>
            <div style="font-size: 0.9rem; color: #999;">🔒 잠김</div>
          </div>
        </div>
      </div>

      <div class="growth-tree">
        <h3 style="color: #ff8566; margin-bottom: 2rem;">👑 리더십 전문가 트리</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;">
          <div style="text-align: center;">
            <div class="tree-node" style="margin: 0 auto 1rem;">👑</div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">리더십 기초</div>
            <div style="font-size: 0.9rem; color: #4caf50;">✓ 완료</div>
          </div>
          <div style="text-align: center;">
            <div class="tree-node locked" style="margin: 0 auto 1rem;"></div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">학급 운영</div>
            <div style="font-size: 0.9rem; color: #999;">🔒 잠김</div>
          </div>
          <div style="text-align: center;">
            <div class="tree-node locked" style="margin: 0 auto 1rem;"></div>
            <div style="font-weight: 600; margin-bottom: 0.5rem;">팀 협업</div>
            <div style="font-size: 0.9rem; color: #999;">🔒 잠김</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 탭 4: 멘토 매칭 -->
    <div id="tab-mentor" class="tab-content">
      <div class="section-title">
        <span>💬</span>
        <span>추천 멘토</span>
      </div>
      <p style="text-align: center; color: #666; margin-bottom: 3rem; font-size: 1.1rem;">
        당신의 성장 트리를 기반으로 AI가 매칭한 멘토를 만나보세요
      </p>

      <div class="mentor-grid">
        <div class="mentor-card">
          <div class="mentor-avatar">👨‍🏫</div>
          <div class="mentor-name">이준호 선생님</div>
          <div class="mentor-role">초등학교 교사 · 7년차</div>
          <div class="mentor-match">매칭도 92%</div>
          <div style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
            부모상담 · AI활용 전문
          </div>
          <button class="mentor-btn" onclick="alert('멘토 신청 기능 준비 중입니다')">멘토 신청하기</button>
        </div>

        <div class="mentor-card">
          <div class="mentor-avatar">👩‍🏫</div>
          <div class="mentor-name">박수진 선생님</div>
          <div class="mentor-role">중학교 교사 · 10년차</div>
          <div class="mentor-match">매칭도 88%</div>
          <div style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
            감정케어 · 리더십 전문
          </div>
          <button class="mentor-btn" onclick="alert('멘토 신청 기능 준비 중입니다')">멘토 신청하기</button>
        </div>

        <div class="mentor-card">
          <div class="mentor-avatar">👨‍🏫</div>
          <div class="mentor-name">최민수 선생님</div>
          <div class="mentor-role">유치원 원장 · 15년차</div>
          <div class="mentor-match">매칭도 85%</div>
          <div style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">
            놀이지도 · 학급운영 전문
          </div>
          <button class="mentor-btn" onclick="alert('멘토 신청 기능 준비 중입니다')">멘토 신청하기</button>
        </div>
      </div>
    </div>
  </div>

  <footer style="margin-top: 4rem;">
    <p>© 2025 WITTI | 출퇴근길 5분, 위트 있는 인사이트 한 컷.</p>
  </footer>

  <script>
    // 로그인 확인
    const token = localStorage.getItem('witti_token');
    const user = JSON.parse(localStorage.getItem('witti_user') || '{}');

    if (!token) {
      alert('로그인이 필요합니다.');
      window.location.href = '/login';
    }

    // 사용자 이름 표시
    if (user.name) {
      document.getElementById('userName').textContent = user.name + ' 선생님';
    }

    // 탭 전환 함수
    function switchTab(tabName) {
      // 모든 탭 버튼과 콘텐츠 비활성화
      document.querySelectorAll('.tab-button').forEach(function(btn) {
        btn.classList.remove('active');
      });
      document.querySelectorAll('.tab-content').forEach(function(content) {
        content.classList.remove('active');
      });

      // 선택된 탭 활성화
      event.target.classList.add('active');
      document.getElementById('tab-' + tabName).classList.add('active');

      // 내 강의실 탭 선택 시 데이터 로드
      if (tabName === 'classes') {
        loadEnrollments();
        loadPayments();
      }
    }

    // 수강 내역 로드
    async function loadEnrollments() {
      try {
        const response = await fetch('/api/my/enrollments', {
          headers: {
            'Authorization': 'Bearer ' + token
          }
        });

        const data = await response.json();
        
        if (data.success && data.enrollments.length > 0) {
          // 대시보드 통계 업데이트
          document.getElementById('enrollmentCount').textContent = data.enrollments.length;

          // 수강 목록 표시
          const enrollmentList = document.getElementById('enrollmentList');
          enrollmentList.innerHTML = data.enrollments.map(function(enrollment) {
            const enrolledDate = new Date(enrollment.enrolled_at).toLocaleDateString('ko-KR');
            return '<div class="enrollment-card" onclick="window.location.href=' + "'/class/" + enrollment.class_id + "'" + '">' +
              '<div class="enrollment-icon">' + enrollment.thumbnail_icon + '</div>' +
              '<div class="enrollment-title">' + enrollment.title + '</div>' +
              '<div class="enrollment-instructor">👩‍🏫 ' + enrollment.instructor_name + '</div>' +
              '<div class="enrollment-date">수강 시작: ' + enrolledDate + '</div>' +
            '</div>';
          }).join('');
        } else {
          document.getElementById('enrollmentCount').textContent = '0';
          document.getElementById('enrollmentList').innerHTML = 
            '<div class="empty-state">' +
            '<div class="empty-state-icon">📭</div>' +
            '<div class="empty-state-text">아직 수강중인 강의가 없습니다</div>' +
            '<button class="btn-primary" onclick="window.location.href=' + "'/learn'" + '">강의 둘러보기</button>' +
            '</div>';
        }
      } catch (error) {
        console.error('수강 내역 로드 실패:', error);
        document.getElementById('enrollmentList').innerHTML = 
          '<div class="empty-state">' +
          '<div class="empty-state-text">수강 내역을 불러올 수 없습니다</div>' +
          '</div>';
      }
    }

    // 결제 내역 로드
    async function loadPayments() {
      try {
        const response = await fetch('/api/my/payments', {
          headers: {
            'Authorization': 'Bearer ' + token
          }
        });

        const data = await response.json();
        
        if (data.success && data.payments.length > 0) {
          const paymentList = document.getElementById('paymentList');
          paymentList.innerHTML = data.payments.map(function(payment) {
            const paidDate = new Date(payment.paid_at).toLocaleDateString('ko-KR');
            const paidTime = new Date(payment.paid_at).toLocaleTimeString('ko-KR');
            
            let classesHTML = '';
            if (payment.classes && payment.classes.length > 0) {
              classesHTML = '<div class="payment-classes">' +
                payment.classes.map(function(cls) {
                  return '<div class="payment-class-item">' +
                    '<div class="payment-class-icon">' + cls.thumbnail_icon + '</div>' +
                    '<div class="payment-class-info">' +
                      '<div class="payment-class-title">' + cls.title + '</div>' +
                      '<div class="payment-class-instructor">' + cls.instructor_name + '</div>' +
                    '</div>' +
                  '</div>';
                }).join('') +
              '</div>';
            }
            
            return '<div class="payment-item">' +
              '<div class="payment-header">' +
                '<div class="payment-order-id">주문번호: ' + payment.order_id + '</div>' +
                '<div class="payment-amount">' + payment.amount.toLocaleString() + '원</div>' +
              '</div>' +
              '<div class="payment-info">' +
                '<span>💳 ' + payment.payment_method + '</span>' +
                '<span>📅 ' + paidDate + ' ' + paidTime + '</span>' +
                '<span style="color: #4CAF50; font-weight: 600;">✓ ' + payment.payment_status + '</span>' +
              '</div>' +
              classesHTML +
            '</div>';
          }).join('');
        } else {
          document.getElementById('paymentList').innerHTML = 
            '<div class="empty-state">' +
            '<div class="empty-state-icon">💳</div>' +
            '<div class="empty-state-text">결제 내역이 없습니다</div>' +
            '</div>';
        }
      } catch (error) {
        console.error('결제 내역 로드 실패:', error);
        document.getElementById('paymentList').innerHTML = 
          '<div class="empty-state">' +
          '<div class="empty-state-text">결제 내역을 불러올 수 없습니다</div>' +
          '</div>';
      }
    }

    // 페이지 로드 시 수강 내역 로드 (통계용)
    loadEnrollments();
  </script>

</body>
</html>

  `)
})

// 로그인 페이지
app.get('/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>로그인 - WITTI</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <link rel="stylesheet" href="/static/style.css">
      <style>
        .login-container {
          max-width: 420px;
          margin: 6rem auto;
          padding: 2rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .login-header h1 {
          font-size: 1.8rem;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }
        .login-header p {
          color: #666;
          font-size: 0.95rem;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #333;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          font-family: 'Pretendard', sans-serif;
          transition: all 0.2s;
        }
        .form-group input:focus {
          outline: none;
          border-color: #ff8566;
          box-shadow: 0 0 0 3px rgba(255, 133, 102, 0.1);
        }
        .form-message {
          margin-top: 0.5rem;
          font-size: 0.85rem;
          color: #ff4444;
          min-height: 1.2rem;
        }
        .remember-forgot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
        }
        .remember-forgot label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #666;
          cursor: pointer;
        }
        .remember-forgot a {
          color: #ff8566;
          text-decoration: none;
        }
        .remember-forgot a:hover {
          text-decoration: underline;
        }
        .submit-btn {
          width: 100%;
          padding: 14px;
          background: #ff8566;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Pretendard', sans-serif;
        }
        .submit-btn:hover:not(:disabled) {
          background: #ff6b4a;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 133, 102, 0.3);
        }
        .submit-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .signup-link {
          text-align: center;
          margin-top: 1.5rem;
          color: #666;
          font-size: 0.95rem;
        }
        .signup-link a {
          color: #ff8566;
          text-decoration: none;
          font-weight: 600;
        }
        .signup-link a:hover {
          text-decoration: underline;
        }
        .loading {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #fff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-right: 8px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .divider {
          text-align: center;
          margin: 2rem 0;
          position: relative;
        }
        .divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #e0e0e0;
        }
        .divider span {
          background: white;
          padding: 0 1rem;
          position: relative;
          color: #999;
          font-size: 0.9rem;
        }
      </style>
    </head>
    <body>
      <header style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h1 style="margin: 0; cursor: pointer;" onclick="window.location.href='/'">🌿 WITTI</h1>
        <nav>
          <a href="/signup" style="color: #666; text-decoration: none;">회원가입</a>
        </nav>
      </header>

      <div class="login-container">
        <div class="login-header">
          <h1>로그인</h1>
          <p>WITTI에 오신 것을 환영합니다</p>
        </div>

        <form id="loginForm">
          <div class="form-group">
            <label>이메일</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              placeholder="example@email.com"
              autocomplete="email"
              required
            >
          </div>

          <div class="form-group">
            <label>비밀번호</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              placeholder="비밀번호를 입력하세요"
              autocomplete="current-password"
              required
            >
            <div class="form-message" id="errorMessage"></div>
          </div>

          <div class="remember-forgot">
            <label>
              <input type="checkbox" id="remember">
              로그인 상태 유지
            </label>
            <a href="#" onclick="alert('비밀번호 찾기 기능은 준비 중입니다'); return false;">
              비밀번호 찾기
            </a>
          </div>

          <button type="submit" class="submit-btn" id="submitBtn">
            로그인
          </button>
        </form>

        <div class="divider">
          <span>또는</span>
        </div>

        <div class="signup-link">
          아직 계정이 없으신가요? <a href="/signup">회원가입</a>
        </div>
      </div>

      <script>
        const form = document.getElementById('loginForm');
        const submitBtn = document.getElementById('submitBtn');
        const errorMessage = document.getElementById('errorMessage');
        
        // 페이지 로드 시 저장된 토큰 확인
        window.addEventListener('DOMContentLoaded', () => {
          const token = localStorage.getItem('witti_token');
          if (token) {
            // 토큰이 있으면 유효성 검증
            fetch('/api/auth/me', {
              headers: { 'Authorization': 'Bearer ' + token }
            }).then(response => response.json())
              .then(data => {
                if (data.success) {
                  // 이미 로그인된 상태
                  window.location.href = '/';
                } else {
                  // 토큰이 만료되었거나 유효하지 않음
                  localStorage.removeItem('witti_token');
                  localStorage.removeItem('witti_user');
                }
              }).catch(() => {
                localStorage.removeItem('witti_token');
                localStorage.removeItem('witti_user');
              });
          }
        });
        
        // 폼 제출
        form.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const remember = document.getElementById('remember').checked;
          
          errorMessage.textContent = '';
          
          if (!email || !password) {
            errorMessage.textContent = '이메일과 비밀번호를 입력해주세요';
            return;
          }
          
          // 제출 버튼 비활성화
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="loading"></span>로그인 중...';
          
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
              // 토큰 저장
              localStorage.setItem('witti_token', data.token);
              localStorage.setItem('witti_user', JSON.stringify(data.user));
              
              // 로그인 성공
              alert('로그인 되었습니다!');
              window.location.href = '/';
            } else {
              errorMessage.textContent = data.message || '로그인에 실패했습니다';
              submitBtn.disabled = false;
              submitBtn.textContent = '로그인';
            }
          } catch (error) {
            console.error('Login error:', error);
            errorMessage.textContent = '로그인 처리 중 오류가 발생했습니다';
            submitBtn.disabled = false;
            submitBtn.textContent = '로그인';
          }
        });
      </script>
    </body>
    </html>
  `)
})

// 클래스 상세 페이지
app.get('/class/:id', async (c) => {
  const classId = c.req.param('id')
  
  // 클래스 정보 조회
  const { DB } = c.env
  const { results } = await DB.prepare(`
    SELECT * FROM classes WHERE id = ?
  `).bind(classId).all()
  
  if (results.length === 0) {
    return c.html('<h1>클래스를 찾을 수 없습니다</h1>')
  }
  
  const classInfo = results[0] as any
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${classInfo.title} - WITTI</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <link rel="stylesheet" href="/static/style.css">
      <style>
        .class-detail { max-width: 1000px; margin: 2rem auto; padding: 0 2rem; }
        .class-header { background: white; padding: 3rem; border-radius: 16px; margin-bottom: 2rem; }
        .class-icon { font-size: 4rem; margin-bottom: 1rem; }
        .class-meta { display: flex; gap: 2rem; margin: 1.5rem 0; color: #666; }
        .class-meta span { display: flex; align-items: center; gap: 0.5rem; }
        .class-price { font-size: 2rem; font-weight: 700; color: #ff8566; margin: 1rem 0; }
        .class-content { background: white; padding: 3rem; border-radius: 16px; margin-bottom: 2rem; }
        .enroll-btn { 
          width: 100%; padding: 18px; background: #ff8566; color: white; 
          border: none; border-radius: 12px; font-size: 1.2rem; font-weight: 700; 
          cursor: pointer; transition: all 0.2s; margin-top: 2rem;
        }
        .enroll-btn:hover { background: #ff6b4a; transform: translateY(-2px); }
      </style>
    </head>
    <body>
      <header style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: white;">
        <h1 style="margin: 0; cursor: pointer;" onclick="window.location.href='/'">🌿 WITTI</h1>
        <nav style="display: flex; gap: 2rem;">
          <a href="/">홈</a>
          <a href="/login">로그인</a>
        </nav>
      </header>

      <div class="class-detail">
        <div class="class-header">
          <div class="class-icon">${classInfo.thumbnail_icon}</div>
          <h1>${classInfo.title}</h1>
          <div class="class-meta">
            <span>⭐ ${classInfo.rating}</span>
            <span>👥 ${classInfo.student_count}명 수강</span>
            <span>⏱️ ${classInfo.duration}분</span>
          </div>
          <div class="class-price">${classInfo.price.toLocaleString()}원</div>
          <p style="color: #666; font-size: 1.1rem; line-height: 1.6; margin-top: 1rem;">
            ${classInfo.description}
          </p>
          <button class="enroll-btn" onclick="enrollClass(${classInfo.id}, '${classInfo.title}', ${classInfo.price})">
            수강 신청하기
          </button>
        </div>

        <div class="class-content">
          <h2>강사 소개</h2>
          <p style="color: #ff8566; font-weight: 600; margin: 1rem 0;">
            ${classInfo.instructor_name} (${classInfo.instructor_role === 'teacher' ? '교사' : classInfo.instructor_role === 'counselor' ? '상담사' : '전문가'})
          </p>
          <p>교육 현장에서 ${classInfo.student_count}명 이상의 선생님들과 함께한 경험을 바탕으로 실용적인 노하우를 공유합니다.</p>
        </div>
      </div>

      <script>
        function enrollClass(classId, title, price) {
          const token = localStorage.getItem('witti_token');
          if (!token) {
            if (confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
              window.location.href = '/login';
            }
            return;
          }
          
          // 장바구니에 추가 (localStorage)
          const cart = JSON.parse(localStorage.getItem('witti_cart') || '[]');
          
          // 이미 장바구니에 있는지 확인
          if (cart.find(item => item.id === classId)) {
            alert('이미 장바구니에 담긴 클래스입니다.');
            if (confirm('장바구니로 이동하시겠습니까?')) {
              window.location.href = '/cart';
            }
            return;
          }
          
          cart.push({ id: classId, title, price });
          localStorage.setItem('witti_cart', JSON.stringify(cart));
          
          if (confirm('장바구니에 담았습니다. 결제 페이지로 이동하시겠습니까?')) {
            window.location.href = '/checkout';
          }
        }
      </script>
    </body>
    </html>
  `)
})

// 장바구니 페이지
app.get('/cart', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>장바구니 - WITTI</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <link rel="stylesheet" href="/static/style.css">
      <style>
        .cart-container { max-width: 800px; margin: 2rem auto; padding: 0 2rem; }
        .cart-item { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; }
        .cart-item h3 { margin: 0; color: #1a1a1a; }
        .cart-item .price { font-size: 1.5rem; font-weight: 700; color: #ff8566; }
        .remove-btn { background: #ff4444; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; margin-left: 1rem; }
        .cart-summary { background: white; padding: 2rem; border-radius: 12px; margin-top: 2rem; }
        .checkout-btn { width: 100%; padding: 16px; background: #ff8566; color: white; border: none; border-radius: 12px; font-size: 1.2rem; font-weight: 700; cursor: pointer; margin-top: 1rem; }
        .empty-cart { text-align: center; padding: 4rem 2rem; color: #999; }
      </style>
    </head>
    <body>
      <header style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: white;">
        <h1 style="margin: 0; cursor: pointer;" onclick="window.location.href='/'">🌿 WITTI</h1>
      </header>

      <div class="cart-container">
        <h1>장바구니</h1>
        <div id="cartItems"></div>
        <div id="cartSummary" style="display:none;" class="cart-summary">
          <h2>결제 정보</h2>
          <div style="display: flex; justify-content: space-between; margin: 1rem 0; font-size: 1.5rem; font-weight: 700;">
            <span>총 금액</span>
            <span id="totalPrice" style="color: #ff8566;">0원</span>
          </div>
          <button class="checkout-btn" onclick="goToCheckout()">결제하기</button>
        </div>
        <div id="emptyCart" style="display:none;" class="empty-cart">
          <p>장바구니가 비어있습니다</p>
          <button onclick="window.location.href='/'" style="padding: 12px 24px; background: #ff8566; color: white; border: none; border-radius: 8px; cursor: pointer;">클래스 둘러보기</button>
        </div>
      </div>

      <script>
        function loadCart() {
          const cart = JSON.parse(localStorage.getItem('witti_cart') || '[]');
          const cartItemsEl = document.getElementById('cartItems');
          const cartSummaryEl = document.getElementById('cartSummary');
          const emptyCartEl = document.getElementById('emptyCart');
          
          if (cart.length === 0) {
            emptyCartEl.style.display = 'block';
            return;
          }
          
          cartSummaryEl.style.display = 'block';
          
          let total = 0;
          cartItemsEl.innerHTML = cart.map((item, index) => {
            total += item.price;
            return '<div class="cart-item">' +
              '<div><h3>' + item.title + '</h3></div>' +
              '<div style="display: flex; align-items: center;">' +
                '<span class="price">' + item.price.toLocaleString() + '원</span>' +
                '<button class="remove-btn" onclick="removeFromCart(' + index + ')">삭제</button>' +
              '</div>' +
            '</div>';
          }).join('');
          
          document.getElementById('totalPrice').textContent = total.toLocaleString() + '원';
        }
        
        function removeFromCart(index) {
          const cart = JSON.parse(localStorage.getItem('witti_cart') || '[]');
          cart.splice(index, 1);
          localStorage.setItem('witti_cart', JSON.stringify(cart));
          loadCart();
        }
        
        function goToCheckout() {
          window.location.href = '/checkout';
        }
        
        loadCart();
      </script>
    </body>
    </html>
  `)
})

// 결제 페이지 (7-8단계 통합)
app.get('/checkout', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>결제하기 - WITTI</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <link rel="stylesheet" href="/static/style.css">
      <style>
        .checkout-container { max-width: 800px; margin: 2rem auto; padding: 0 2rem; }
        .checkout-section { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 1.5rem; }
        .checkout-section h2 { margin-top: 0; color: #1a1a1a; }
        .order-item { display: flex; justify-content: space-between; padding: 1rem 0; border-bottom: 1px solid #eee; }
        .payment-methods { display: grid; gap: 1rem; margin-top: 1rem; }
        .payment-method { padding: 1rem; border: 2px solid #e0e0e0; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .payment-method.selected { border-color: #ff8566; background: #fff5f3; }
        .pay-btn { width: 100%; padding: 18px; background: #ff8566; color: white; border: none; border-radius: 12px; font-size: 1.2rem; font-weight: 700; cursor: pointer; }
        .pay-btn:disabled { background: #ccc; cursor: not-allowed; }
      </style>
    </head>
    <body>
      <header style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: white;">
        <h1 style="margin: 0; cursor: pointer;" onclick="window.location.href='/'">🌿 WITTI</h1>
      </header>

      <div class="checkout-container">
        <h1>결제하기</h1>
        
        <div class="checkout-section">
          <h2>주문 상품</h2>
          <div id="orderItems"></div>
          <div style="display: flex; justify-content: space-between; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 2px solid #eee; font-size: 1.3rem; font-weight: 700;">
            <span>총 결제 금액</span>
            <span id="totalAmount" style="color: #ff8566;">0원</span>
          </div>
        </div>

        <div class="checkout-section">
          <h2>결제 수단</h2>
          <div class="payment-methods">
            <div class="payment-method selected" onclick="selectPayment('card')" data-method="card">
              💳 신용/체크카드
            </div>
            <div class="payment-method" onclick="selectPayment('transfer')" data-method="transfer">
              🏦 계좌이체
            </div>
            <div class="payment-method" onclick="selectPayment('kakao')" data-method="kakao">
              💬 카카오페이
            </div>
          </div>
        </div>

        <button class="pay-btn" onclick="processPayment()">결제하기</button>
      </div>

      <script>
        let selectedMethod = 'card';
        let totalPrice = 0;
        
        function loadOrderItems() {
          const cart = JSON.parse(localStorage.getItem('witti_cart') || '[]');
          if (cart.length === 0) {
            alert('장바구니가 비어있습니다');
            window.location.href = '/';
            return;
          }
          
          const orderItemsEl = document.getElementById('orderItems');
          totalPrice = 0;
          
          orderItemsEl.innerHTML = cart.map(item => {
            totalPrice += item.price;
            return '<div class="order-item">' +
              '<span>' + item.title + '</span>' +
              '<span style="font-weight: 600;">' + item.price.toLocaleString() + '원</span>' +
            '</div>';
          }).join('');
          
          document.getElementById('totalAmount').textContent = totalPrice.toLocaleString() + '원';
        }
        
        function selectPayment(method) {
          selectedMethod = method;
          document.querySelectorAll('.payment-method').forEach(el => {
            el.classList.remove('selected');
          });
          document.querySelector('[data-method="' + method + '"]').classList.add('selected');
        }
        
        async function processPayment() {
          const token = localStorage.getItem('witti_token');
          if (!token) {
            alert('로그인이 필요합니다');
            window.location.href = '/login';
            return;
          }
          
          const cart = JSON.parse(localStorage.getItem('witti_cart') || '[]');
          const orderId = 'ORDER-' + Date.now();
          
          try {
            const response = await fetch('/api/payment/create', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
              },
              body: JSON.stringify({
                order_id: orderId,
                amount: totalPrice,
                payment_method: selectedMethod,
                items: cart
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              // 장바구니 비우기
              localStorage.removeItem('witti_cart');
              alert('결제가 완료되었습니다!');
              window.location.href = '/mywitti';
            } else {
              alert(data.message || '결제에 실패했습니다');
            }
          } catch (error) {
            console.error('Payment error:', error);
            alert('결제 처리 중 오류가 발생했습니다');
          }
        }
        
        loadOrderItems();
      </script>
    </body>
    </html>
  `)
})

// 관리자 페이지 (10단계)
app.get('/admin', async (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>관리자 - WITTI</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <link rel="stylesheet" href="/static/style.css">
      <style>
        .admin-container { max-width: 1200px; margin: 2rem auto; padding: 0 2rem; }
        .admin-section { background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; }
        .admin-section h2 { margin-top: 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f5f5f5; font-weight: 600; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { background: white; padding: 1.5rem; border-radius: 12px; text-align: center; }
        .stat-number { font-size: 2rem; font-weight: 700; color: #ff8566; }
        .stat-label { color: #666; margin-top: 0.5rem; }
      </style>
    </head>
    <body>
      <header style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: white;">
        <h1 style="margin: 0; cursor: pointer;" onclick="window.location.href='/'">🌿 WITTI 관리자</h1>
        <button onclick="window.location.href='/'" style="padding: 8px 16px; background: #ff8566; color: white; border: none; border-radius: 8px; cursor: pointer;">홈으로</button>
      </header>

      <div class="admin-container">
        <h1>관리자 대시보드</h1>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-number" id="totalUsers">0</div>
            <div class="stat-label">총 회원 수</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="totalClasses">0</div>
            <div class="stat-label">총 클래스 수</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="totalEnrollments">0</div>
            <div class="stat-label">총 수강 건수</div>
          </div>
          <div class="stat-card">
            <div class="stat-number" id="totalRevenue">0원</div>
            <div class="stat-label">총 매출</div>
          </div>
        </div>

        <div class="admin-section">
          <h2>최근 회원</h2>
          <table id="usersTable">
            <thead>
              <tr>
                <th>ID</th>
                <th>이메일</th>
                <th>이름</th>
                <th>가입일</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>

        <div class="admin-section">
          <h2>최근 결제</h2>
          <table id="paymentsTable">
            <thead>
              <tr>
                <th>주문번호</th>
                <th>금액</th>
                <th>결제수단</th>
                <th>상태</th>
                <th>결제일</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>

      <script>
        async function loadStats() {
          try {
            // 회원 수
            const usersRes = await fetch('/api/test/users');
            const usersData = await usersRes.json();
            document.getElementById('totalUsers').textContent = usersData.count || 0;
            
            // 클래스 수
            const classesRes = await fetch('/api/classes');
            const classesData = await classesRes.json();
            document.getElementById('totalClasses').textContent = classesData.count || 0;
            
            // 회원 목록
            if (usersData.users) {
              const tbody = document.querySelector('#usersTable tbody');
              tbody.innerHTML = usersData.users.slice(0, 10).map(user => 
                '<tr>' +
                  '<td>' + user.id + '</td>' +
                  '<td>' + user.email + '</td>' +
                  '<td>' + user.name + '</td>' +
                  '<td>' + new Date(user.created_at).toLocaleDateString('ko-KR') + '</td>' +
                '</tr>'
              ).join('');
            }
          } catch (error) {
            console.error('Failed to load stats:', error);
          }
        }
        
        loadStats();
      </script>
    </body>
    </html>
  `)
})

// Signup page route
app.get('/signup', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>회원가입 - WITTI</title>
      <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <link rel="stylesheet" href="/static/style.css">
    </head>
    <body>

      <header style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid #f0f0f0;">
        <div style="display: flex; align-items: center; gap: 2.5rem;">
          <h1 style="margin: 0; cursor: pointer; font-size: 1.5rem; font-weight: 700; color: #333;" onclick="window.location.href='/'">🌿 WITTI</h1>
          <nav style="display: flex; gap: 2rem; align-items: center;">
            <a href="/" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">New</a>
            <a href="/learn" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Learn</a>
            <a href="/story" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Story</a>
            <a href="/talk" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Talk</a>
            <a href="/tools" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Tools</a>
          </nav>
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <button onclick="window.location.href='/cart'" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; position: relative;" title="장바구니">
            🛒
            <span class="cartBadge" style="position: absolute; top: -5px; right: -5px; background: #ff8566; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: none; align-items: center; justify-content: center;">0</span>
          </button>
          <button onclick="alert('검색 기능 준비 중')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem;" title="검색">🔍</button>
          <button onclick="alert('알림이 없습니다')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; position: relative;" title="알림">
            🔔
            <span style="position: absolute; top: -5px; right: -5px; background: #ff8566; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center;">3</span>
          </button>
          <div class="userMenu" style="display: none; gap: 0.5rem; align-items: center;">
            <a href="/mywitti" style="background: #ff8566; color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">내 강의실</a>
            <button class="logoutBtn" style="background: #f5f5f5; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">로그아웃</button>
          </div>
          <div class="authMenu" style="display: flex; gap: 0.5rem;">
            <a href="/login" style="background: #f5f5f5; color: #333; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">로그인</a>
            <a href="/signup" style="background: #ff8566; color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">회원가입</a>
          </div>
        </div>
      </header>

      <section id="hero" style="padding: 60px 20px;">
        <h2>WITTI와 함께 시작하기</h2>
        <p>교사를 위한 성장 플랫폼에 오신 것을 환영합니다</p>
      </section>

      <section id="content" style="max-width: 500px; margin: 0 auto; padding: 2rem;">
        <div style="background: white; padding: 3rem; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <h3 style="text-align: center; margin-bottom: 2rem;">회원가입</h3>
          
          <form id="signupForm" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <!-- 이메일 -->
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">이메일</label>
              <input type="email" placeholder="your@email.com" required
                style="width: 100%; padding: 12px; border: 2px solid #ffe9d6; border-radius: 10px; font-size: 16px; font-family: Pretendard;">
            </div>

            <!-- 비밀번호 -->
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">비밀번호</label>
              <input type="password" placeholder="••••••••" required
                style="width: 100%; padding: 12px; border: 2px solid #ffe9d6; border-radius: 10px; font-size: 16px; font-family: Pretendard;">
            </div>

            <!-- 이름 -->
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">이름</label>
              <input type="text" placeholder="홍길동" required
                style="width: 100%; padding: 12px; border: 2px solid #ffe9d6; border-radius: 10px; font-size: 16px; font-family: Pretendard;">
            </div>

            <!-- 직무 선택 -->
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">현재 직무</label>
              <select required
                style="width: 100%; padding: 12px; border: 2px solid #ffe9d6; border-radius: 10px; font-size: 16px; font-family: Pretendard;">
                <option value="">선택해주세요</option>
                <option value="신입">신입 교사 (0-2년)</option>
                <option value="주임">주임 교사 (3-5년)</option>
                <option value="선임">선임 교사 (6년 이상)</option>
                <option value="원장">원장/관리자</option>
                <option value="학생">대학생/예비교사</option>
              </select>
            </div>

            <!-- 관심 키워드 -->
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">관심 키워드 (복수 선택 가능)</label>
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                <label style="padding: 8px 16px; border: 2px solid #ffe9d6; border-radius: 20px; cursor: pointer; font-size: 14px;">
                  <input type="checkbox" name="interest" value="놀이"> 놀이
                </label>
                <label style="padding: 8px 16px; border: 2px solid #ffe9d6; border-radius: 20px; cursor: pointer; font-size: 14px;">
                  <input type="checkbox" name="interest" value="상담"> 부모상담
                </label>
                <label style="padding: 8px 16px; border: 2px solid #ffe9d6; border-radius: 20px; cursor: pointer; font-size: 14px;">
                  <input type="checkbox" name="interest" value="AI"> AI 도구
                </label>
                <label style="padding: 8px 16px; border: 2px solid #ffe9d6; border-radius: 20px; cursor: pointer; font-size: 14px;">
                  <input type="checkbox" name="interest" value="성장"> 자기성장
                </label>
                <label style="padding: 8px 16px; border: 2px solid #ffe9d6; border-radius: 20px; cursor: pointer; font-size: 14px;">
                  <input type="checkbox" name="interest" value="리더십"> 리더십
                </label>
                <label style="padding: 8px 16px; border: 2px solid #ffe9d6; border-radius: 20px; cursor: pointer; font-size: 14px;">
                  <input type="checkbox" name="interest" value="발달"> 아동발달
                </label>
              </div>
            </div>

            <!-- 제출 버튼 -->
            <button type="submit" 
              style="background-color: #ff8566; border: none; color: white; padding: 15px; border-radius: 10px; font-size: 18px; cursor: pointer; font-weight: 600; margin-top: 1rem;">
              가입하고 시작하기
            </button>

            <!-- SNS 로그인 -->
            <div style="text-align: center; margin-top: 1rem;">
              <p style="color: #999; margin-bottom: 1rem;">또는</p>
              <button type="button" onclick="alert('카카오 로그인 연동 예정')"
                style="background-color: #FEE500; border: none; color: #000; padding: 12px 20px; border-radius: 10px; font-size: 16px; cursor: pointer; font-weight: 600; width: 100%;">
                🟡 카카오로 3초만에 시작하기
              </button>
            </div>

            <!-- 로그인 링크 -->
            <p style="text-align: center; color: #666; margin-top: 1rem;">
              이미 계정이 있으신가요? 
              <a href="/login" style="color: #ff8566; font-weight: 600; text-decoration: none;">로그인</a>
            </p>
          </form>
        </div>
      </section>

      <footer>
        <p>© 2025 WITTI | 출퇴근길 5분, 위트 있는 인사이트 한 컷.</p>
      </footer>

      <script>
        document.getElementById('signupForm').addEventListener('submit', function(e) {
          e.preventDefault();
          alert('회원가입이 완료되었습니다! 온보딩 페이지로 이동합니다.');
          window.location.href = '/onboarding';
        });
      </script>

    </body>
    </html>
  `)
})

// Login page route
app.get('/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>로그인 - WITTI</title>
      <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <link rel="stylesheet" href="/static/style.css">
    </head>
    <body>

      <header style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; border-bottom: 1px solid #f0f0f0;">
        <div style="display: flex; align-items: center; gap: 2.5rem;">
          <h1 style="margin: 0; cursor: pointer; font-size: 1.5rem; font-weight: 700; color: #333;" onclick="window.location.href='/'">🌿 WITTI</h1>
          <nav style="display: flex; gap: 2rem; align-items: center;">
            <a href="/" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">New</a>
            <a href="/learn" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Learn</a>
            <a href="/story" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Story</a>
            <a href="/talk" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Talk</a>
            <a href="/tools" style="text-decoration: none; color: #333; font-size: 1.1rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.3s;">Tools</a>
          </nav>
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <button onclick="window.location.href='/cart'" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; position: relative;" title="장바구니">
            🛒
            <span class="cartBadge" style="position: absolute; top: -5px; right: -5px; background: #ff8566; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: none; align-items: center; justify-content: center;">0</span>
          </button>
          <button onclick="alert('검색 기능 준비 중')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem;" title="검색">🔍</button>
          <button onclick="alert('알림이 없습니다')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; position: relative;" title="알림">
            🔔
            <span style="position: absolute; top: -5px; right: -5px; background: #ff8566; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center;">3</span>
          </button>
          <div class="userMenu" style="display: none; gap: 0.5rem; align-items: center;">
            <a href="/mywitti" style="background: #ff8566; color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">내 강의실</a>
            <button class="logoutBtn" style="background: #f5f5f5; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem;">로그아웃</button>
          </div>
          <div class="authMenu" style="display: flex; gap: 0.5rem;">
            <a href="/login" style="background: #f5f5f5; color: #333; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">로그인</a>
            <a href="/signup" style="background: #ff8566; color: white; padding: 0.5rem 1rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem;">회원가입</a>
          </div>
        </div>
      </header>

      <section id="hero" style="padding: 60px 20px;">
        <h2>다시 만나서 반가워요!</h2>
        <p>오늘도 함께 성장해요</p>
      </section>

      <section id="content" style="max-width: 500px; margin: 0 auto; padding: 2rem;">
        <div style="background: white; padding: 3rem; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <h3 style="text-align: center; margin-bottom: 2rem;">로그인</h3>
          
          <form id="loginForm" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <!-- 이메일 -->
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">이메일</label>
              <input type="email" placeholder="your@email.com" required
                style="width: 100%; padding: 12px; border: 2px solid #ffe9d6; border-radius: 10px; font-size: 16px; font-family: Pretendard;">
            </div>

            <!-- 비밀번호 -->
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #333;">비밀번호</label>
              <input type="password" placeholder="••••••••" required
                style="width: 100%; padding: 12px; border: 2px solid #ffe9d6; border-radius: 10px; font-size: 16px; font-family: Pretendard;">
            </div>

            <!-- 제출 버튼 -->
            <button type="submit" 
              style="background-color: #ff8566; border: none; color: white; padding: 15px; border-radius: 10px; font-size: 18px; cursor: pointer; font-weight: 600; margin-top: 1rem;">
              로그인
            </button>

            <!-- SNS 로그인 -->
            <div style="text-align: center; margin-top: 1rem;">
              <p style="color: #999; margin-bottom: 1rem;">또는</p>
              <button type="button" onclick="alert('카카오 로그인 연동 예정')"
                style="background-color: #FEE500; border: none; color: #000; padding: 12px 20px; border-radius: 10px; font-size: 16px; cursor: pointer; font-weight: 600; width: 100%;">
                🟡 카카오로 로그인
              </button>
            </div>

            <!-- 회원가입 링크 -->
            <p style="text-align: center; color: #666; margin-top: 1rem;">
              아직 계정이 없으신가요? 
              <a href="/signup" style="color: #ff8566; font-weight: 600; text-decoration: none;">회원가입</a>
            </p>
          </form>
        </div>
      </section>

      <footer>
        <p>© 2025 WITTI | 출퇴근길 5분, 위트 있는 인사이트 한 컷.</p>
      </footer>

      <script>
        document.getElementById('loginForm').addEventListener('submit', function(e) {
          e.preventDefault();
          alert('로그인되었습니다!');
          window.location.href = '/';
        });
      </script>

    </body>
    </html>
  `)
})

// Onboarding page route
app.get('/onboarding', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>온보딩 - WITTI</title>
      <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <link rel="stylesheet" href="/static/style.css">
    </head>
    <body>

      <section id="hero" style="min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px 20px;">
        <h2 style="margin-bottom: 1rem;">🎉 환영합니다!</h2>
        <p style="font-size: 1.2rem; color: #666; margin-bottom: 3rem;">
          김민지님을 위한 맞춤 콘텐츠를 추천해드릴게요
        </p>

        <div style="max-width: 900px; width: 100%;">
          <h3 style="text-align: center; margin-bottom: 2rem; color: #ff8566;">✨ AI가 추천하는 첫 시작 콘텐츠</h3>
          
          <div class="cards" style="margin-bottom: 3rem;">
            <div class="card" onclick="window.location.href='/learn'">
              🎓 <b>AI로 부모면담 정리하기</b><br>
              <small>신입 교사에게 추천하는 필수 클래스</small><br>
              <span style="color: #ff8566; font-weight: 600; font-size: 0.9rem;">👉 바로 시작하기</span>
            </div>
            <div class="card" onclick="window.location.href='/story'">
              📖 <b>"첫 출근, 그리고 첫 눈물"</b><br>
              <small>같은 고민을 했던 선배의 이야기</small><br>
              <span style="color: #ff8566; font-weight: 600; font-size: 0.9rem;">👉 읽어보기</span>
            </div>
            <div class="card" onclick="window.location.href='/talk'">
              💬 <b>신규교사 멘토링 그룹</b><br>
              <small>함께 성장하는 동료들과 만나보세요</small><br>
              <span style="color: #ff8566; font-weight: 600; font-size: 0.9rem;">👉 참여하기</span>
            </div>
          </div>

          <div style="text-align: center; margin-top: 3rem;">
            <p style="font-size: 1.1rem; color: #333; margin-bottom: 1.5rem;">
              나만의 WITTI 루틴을 시작해볼까요?
            </p>
            <button onclick="window.location.href='/'" 
              style="background-color: #ff8566; border: none; color: white; padding: 15px 40px; border-radius: 10px; font-size: 18px; cursor: pointer; font-weight: 600;">
              홈으로 이동하기
            </button>
            <p style="margin-top: 1rem; color: #999; font-size: 0.9rem;">
              언제든지 MyWITTI에서 맞춤 설정을 변경할 수 있어요
            </p>
          </div>
        </div>
      </section>

      <footer>
        <p>© 2025 WITTI | 출퇴근길 5분, 위트 있는 인사이트 한 컷.</p>
      </footer>

    </body>
    </html>
  `)
})

// 회원가입 페이지
app.get('/signup', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>회원가입 - WITTI</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <link rel="stylesheet" href="/static/style.css">
      <style>
        .signup-container {
          max-width: 480px;
          margin: 4rem auto;
          padding: 2rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        .signup-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .signup-header h1 {
          font-size: 1.8rem;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }
        .signup-header p {
          color: #666;
          font-size: 0.95rem;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #333;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .form-group label .required {
          color: #ff8566;
        }
        .form-group label .optional {
          color: #999;
          font-weight: 400;
          font-size: 0.85rem;
        }
        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          font-family: 'Pretendard', sans-serif;
          transition: all 0.2s;
        }
        .form-group input:focus {
          outline: none;
          border-color: #ff8566;
          box-shadow: 0 0 0 3px rgba(255, 133, 102, 0.1);
        }
        .form-group input.error {
          border-color: #ff4444;
        }
        .form-group input.success {
          border-color: #00c087;
        }
        .form-message {
          margin-top: 0.5rem;
          font-size: 0.85rem;
          min-height: 1.2rem;
        }
        .form-message.error {
          color: #ff4444;
        }
        .form-message.success {
          color: #00c087;
        }
        .password-strength {
          margin-top: 0.5rem;
          display: flex;
          gap: 4px;
        }
        .strength-bar {
          flex: 1;
          height: 4px;
          background: #e0e0e0;
          border-radius: 2px;
          transition: all 0.3s;
        }
        .strength-bar.active {
          background: #ff8566;
        }
        .submit-btn {
          width: 100%;
          padding: 14px;
          background: #ff8566;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Pretendard', sans-serif;
        }
        .submit-btn:hover:not(:disabled) {
          background: #ff6b4a;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 133, 102, 0.3);
        }
        .submit-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .login-link {
          text-align: center;
          margin-top: 1.5rem;
          color: #666;
          font-size: 0.95rem;
        }
        .login-link a {
          color: #ff8566;
          text-decoration: none;
          font-weight: 600;
        }
        .login-link a:hover {
          text-decoration: underline;
        }
        .loading {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #fff;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-right: 8px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <header style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <h1 style="margin: 0; cursor: pointer;" onclick="window.location.href='/'">🌿 WITTI</h1>
        <nav>
          <a href="/login" style="color: #666; text-decoration: none;">로그인</a>
        </nav>
      </header>

      <div class="signup-container">
        <div class="signup-header">
          <h1>회원가입</h1>
          <p>WITTI와 함께 교사의 하루를 더 가볍게</p>
        </div>

        <form id="signupForm">
          <div class="form-group">
            <label>이메일 <span class="required">*</span></label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              placeholder="example@email.com"
              autocomplete="email"
              required
            >
            <div class="form-message" id="emailMessage"></div>
          </div>

          <div class="form-group">
            <label>비밀번호 <span class="required">*</span></label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              placeholder="8자 이상, 영문/숫자/특수문자 중 2가지 이상"
              autocomplete="new-password"
              required
            >
            <div class="password-strength">
              <div class="strength-bar" id="strength1"></div>
              <div class="strength-bar" id="strength2"></div>
              <div class="strength-bar" id="strength3"></div>
              <div class="strength-bar" id="strength4"></div>
            </div>
            <div class="form-message" id="passwordMessage"></div>
          </div>

          <div class="form-group">
            <label>비밀번호 확인 <span class="required">*</span></label>
            <input 
              type="password" 
              id="passwordConfirm" 
              name="passwordConfirm" 
              placeholder="비밀번호를 다시 입력해주세요"
              autocomplete="new-password"
              required
            >
            <div class="form-message" id="passwordConfirmMessage"></div>
          </div>

          <div class="form-group">
            <label>이름 <span class="required">*</span></label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              placeholder="홍길동"
              autocomplete="name"
              required
            >
            <div class="form-message" id="nameMessage"></div>
          </div>

          <div class="form-group">
            <label>전화번호 <span class="optional">(선택)</span></label>
            <input 
              type="tel" 
              id="phone" 
              name="phone" 
              placeholder="010-1234-5678"
              autocomplete="tel"
            >
            <div class="form-message" id="phoneMessage"></div>
          </div>

          <button type="submit" class="submit-btn" id="submitBtn">
            회원가입
          </button>
        </form>

        <div class="login-link">
          이미 계정이 있으신가요? <a href="/login">로그인</a>
        </div>
      </div>

      <script>
        const form = document.getElementById('signupForm');
        const submitBtn = document.getElementById('submitBtn');
        
        // 이메일 중복 체크 (디바운스)
        let emailCheckTimeout;
        document.getElementById('email').addEventListener('input', function(e) {
          const email = e.target.value;
          const messageEl = document.getElementById('emailMessage');
          
          clearTimeout(emailCheckTimeout);
          
          if (!email) {
            messageEl.textContent = '';
            e.target.classList.remove('error', 'success');
            return;
          }
          
          // 이메일 형식 검증
          const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
          if (!emailRegex.test(email)) {
            messageEl.textContent = '올바른 이메일 형식이 아닙니다';
            messageEl.className = 'form-message error';
            e.target.classList.add('error');
            e.target.classList.remove('success');
            return;
          }
          
          emailCheckTimeout = setTimeout(async () => {
            try {
              const response = await fetch('/api/auth/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
              });
              
              const data = await response.json();
              
              if (data.success && data.available) {
                messageEl.textContent = '✓ 사용 가능한 이메일입니다';
                messageEl.className = 'form-message success';
                e.target.classList.remove('error');
                e.target.classList.add('success');
              } else {
                messageEl.textContent = data.message || '이미 사용 중인 이메일입니다';
                messageEl.className = 'form-message error';
                e.target.classList.add('error');
                e.target.classList.remove('success');
              }
            } catch (error) {
              console.error('Email check error:', error);
            }
          }, 500);
        });
        
        // 비밀번호 강도 체크
        document.getElementById('password').addEventListener('input', function(e) {
          const password = e.target.value;
          const messageEl = document.getElementById('passwordMessage');
          
          if (!password) {
            messageEl.textContent = '';
            for (let i = 1; i <= 4; i++) {
              document.getElementById(\`strength${i}\`).classList.remove('active');
            }
            return;
          }
          
          let strength = 0;
          if (password.length >= 8) strength++;
          if (/[a-zA-Z]/.test(password)) strength++;
          if (/[0-9]/.test(password)) strength++;
          if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
          
          // 강도 표시 업데이트
          for (let i = 1; i <= 4; i++) {
            if (i <= strength) {
              document.getElementById(\`strength${i}\`).classList.add('active');
            } else {
              document.getElementById(\`strength${i}\`).classList.remove('active');
            }
          }
          
          // 검증 메시지
          if (password.length < 8) {
            messageEl.textContent = '비밀번호는 최소 8자 이상이어야 합니다';
            messageEl.className = 'form-message error';
            e.target.classList.add('error');
          } else {
            const hasLetter = /[a-zA-Z]/.test(password);
            const hasNumber = /[0-9]/.test(password);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
            const complexityCount = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
            
            if (complexityCount < 2) {
              messageEl.textContent = '영문, 숫자, 특수문자 중 2가지 이상 포함해주세요';
              messageEl.className = 'form-message error';
              e.target.classList.add('error');
            } else {
              messageEl.textContent = '✓ 사용 가능한 비밀번호입니다';
              messageEl.className = 'form-message success';
              e.target.classList.remove('error');
              e.target.classList.add('success');
            }
          }
        });
        
        // 비밀번호 확인
        document.getElementById('passwordConfirm').addEventListener('input', function(e) {
          const password = document.getElementById('password').value;
          const passwordConfirm = e.target.value;
          const messageEl = document.getElementById('passwordConfirmMessage');
          
          if (!passwordConfirm) {
            messageEl.textContent = '';
            e.target.classList.remove('error', 'success');
            return;
          }
          
          if (password !== passwordConfirm) {
            messageEl.textContent = '비밀번호가 일치하지 않습니다';
            messageEl.className = 'form-message error';
            e.target.classList.add('error');
            e.target.classList.remove('success');
          } else {
            messageEl.textContent = '✓ 비밀번호가 일치합니다';
            messageEl.className = 'form-message success';
            e.target.classList.remove('error');
            e.target.classList.add('success');
          }
        });
        
        // 이름 검증
        document.getElementById('name').addEventListener('input', function(e) {
          const name = e.target.value;
          const messageEl = document.getElementById('nameMessage');
          
          if (!name) {
            messageEl.textContent = '';
            e.target.classList.remove('error', 'success');
            return;
          }
          
          if (name.length < 2) {
            messageEl.textContent = '이름은 최소 2자 이상이어야 합니다';
            messageEl.className = 'form-message error';
            e.target.classList.add('error');
          } else if (name.length > 50) {
            messageEl.textContent = '이름은 최대 50자까지 가능합니다';
            messageEl.className = 'form-message error';
            e.target.classList.add('error');
          } else {
            messageEl.textContent = '✓ 사용 가능한 이름입니다';
            messageEl.className = 'form-message success';
            e.target.classList.remove('error');
            e.target.classList.add('success');
          }
        });
        
        // 전화번호 검증
        document.getElementById('phone').addEventListener('input', function(e) {
          const phone = e.target.value;
          const messageEl = document.getElementById('phoneMessage');
          
          if (!phone) {
            messageEl.textContent = '';
            e.target.classList.remove('error', 'success');
            return;
          }
          
          const phoneRegex = /^[0-9-]+$/;
          if (!phoneRegex.test(phone)) {
            messageEl.textContent = '숫자와 하이픈(-)만 입력 가능합니다';
            messageEl.className = 'form-message error';
            e.target.classList.add('error');
            return;
          }
          
          const digitsOnly = phone.replace(/-/g, '');
          if (digitsOnly.length < 10 || digitsOnly.length > 11) {
            messageEl.textContent = '올바른 전화번호 형식이 아닙니다';
            messageEl.className = 'form-message error';
            e.target.classList.add('error');
          } else {
            messageEl.textContent = '✓ 올바른 전화번호 형식입니다';
            messageEl.className = 'form-message success';
            e.target.classList.remove('error');
            e.target.classList.add('success');
          }
        });
        
        // 폼 제출
        form.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const passwordConfirm = document.getElementById('passwordConfirm').value;
          const name = document.getElementById('name').value;
          const phone = document.getElementById('phone').value;
          
          // 기본 검증
          if (!email || !password || !name) {
            alert('필수 항목을 모두 입력해주세요');
            return;
          }
          
          if (password !== passwordConfirm) {
            alert('비밀번호가 일치하지 않습니다');
            return;
          }
          
          // 제출 버튼 비활성화
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="loading"></span>처리 중...';
          
          try {
            const response = await fetch('/api/auth/signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password, name, phone: phone || undefined })
            });
            
            const data = await response.json();
            
            if (data.success) {
              alert('회원가입이 완료되었습니다!\\n로그인 페이지로 이동합니다.');
              window.location.href = '/login';
            } else {
              alert(data.message || '회원가입에 실패했습니다');
              submitBtn.disabled = false;
              submitBtn.textContent = '회원가입';
            }
          } catch (error) {
            console.error('Signup error:', error);
            alert('회원가입 처리 중 오류가 발생했습니다');
            submitBtn.disabled = false;
            submitBtn.textContent = '회원가입';
          }
        });
      </script>
    </body>
    </html>
  `)
})

// 데이터베이스 테스트 페이지
app.get('/test/database', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WITTI 데이터베이스 테스트</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Pretendard', sans-serif; 
          padding: 2rem; 
          background: #fafafa;
          line-height: 1.6;
        }
        h1 { 
          color: #1a1a1a; 
          margin-bottom: 2rem;
          font-size: 2rem;
        }
        .test-section {
          background: white;
          padding: 2rem;
          margin-bottom: 2rem;
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        h2 {
          color: #ff8566;
          margin-bottom: 1rem;
          font-size: 1.3rem;
        }
        button {
          background: #ff8566;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          margin-right: 0.5rem;
          margin-bottom: 0.5rem;
        }
        button:hover {
          background: #ff6b4a;
        }
        pre {
          background: #2d2d2d;
          color: #f8f8f2;
          padding: 1.5rem;
          border-radius: 8px;
          overflow-x: auto;
          margin-top: 1rem;
          font-size: 0.9rem;
        }
        .status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-left: 0.5rem;
        }
        .status.success { background: #d4edda; color: #155724; }
        .status.error { background: #f8d7da; color: #721c24; }
        .stats {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        .stat-box {
          flex: 1;
          background: linear-gradient(135deg, #ff8566 0%, #ff9f80 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 12px;
          text-align: center;
        }
        .stat-number {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .stat-label {
          font-size: 0.95rem;
          opacity: 0.9;
        }
      </style>
    </head>
    <body>
      <h1>🗄️ WITTI 데이터베이스 테스트</h1>
      
      <div class="stats" id="stats">
        <div class="stat-box">
          <div class="stat-number" id="classCount">-</div>
          <div class="stat-label">등록된 클래스</div>
        </div>
        <div class="stat-box">
          <div class="stat-number" id="userCount">-</div>
          <div class="stat-label">가입한 회원</div>
        </div>
      </div>

      <div class="test-section">
        <h2>📚 클래스 데이터 테스트</h2>
        <button onclick="testAllClasses()">모든 클래스 조회</button>
        <button onclick="testClass(1)">클래스 #1 조회</button>
        <button onclick="testClass(999)">존재하지 않는 클래스 (404 테스트)</button>
        <pre id="classResult">버튼을 클릭하여 테스트를 시작하세요.</pre>
      </div>

      <div class="test-section">
        <h2>👥 사용자 데이터 테스트</h2>
        <button onclick="testAllUsers()">모든 사용자 조회</button>
        <pre id="userResult">버튼을 클릭하여 테스트를 시작하세요.</pre>
      </div>

      <div class="test-section">
        <h2>✅ 데이터베이스 상태</h2>
        <p>
          <strong>데이터베이스:</strong> witti-production (로컬)
          <span class="status success">연결됨</span>
        </p>
        <p><strong>위치:</strong> .wrangler/state/v3/d1/</p>
        <p><strong>테이블:</strong> users, classes, enrollments, payments, reviews</p>
      </div>

      <script>
        async function testAllClasses() {
          const resultEl = document.getElementById('classResult');
          resultEl.textContent = '로딩 중...';
          
          try {
            const response = await fetch('/api/test/classes');
            const data = await response.json();
            resultEl.textContent = JSON.stringify(data, null, 2);
            
            if (data.success) {
              document.getElementById('classCount').textContent = data.count;
            }
          } catch (error) {
            resultEl.textContent = '오류: ' + error.message;
          }
        }

        async function testClass(id) {
          const resultEl = document.getElementById('classResult');
          resultEl.textContent = '로딩 중...';
          
          try {
            const response = await fetch('/api/test/classes/' + id);
            const data = await response.json();
            resultEl.textContent = JSON.stringify(data, null, 2);
          } catch (error) {
            resultEl.textContent = '오류: ' + error.message;
          }
        }

        async function testAllUsers() {
          const resultEl = document.getElementById('userResult');
          resultEl.textContent = '로딩 중...';
          
          try {
            const response = await fetch('/api/test/users');
            const data = await response.json();
            resultEl.textContent = JSON.stringify(data, null, 2);
            
            if (data.success) {
              document.getElementById('userCount').textContent = data.count;
            }
          } catch (error) {
            resultEl.textContent = '오류: ' + error.message;
          }
        }

        // 페이지 로드 시 통계 자동 로드
        window.addEventListener('DOMContentLoaded', () => {
          testAllClasses();
          testAllUsers();
        });
      </script>
    </body>
    </html>
  `)
})

export default app
