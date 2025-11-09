import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

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
    </head>
    <body>

      <header>
        <h1>🌿 WITTI</h1>
        <nav>
          <a href="/" class="active">Home</a>
          <a href="/learn">Learn</a>
          <a href="/story">Story</a>
          <a href="/talk">Talk</a>
          <a href="/tools">Tools</a>
          <a href="/mywitti">MyWITTI</a>
        </nav>
      </header>

      <section id="hero">
        <h2>교사의 하루를 덜어주고, 마음을 채워주는 플랫폼</h2>
        <p>출근길 5분, 위트 있는 인사이트 한 컷.</p>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 1.5rem;">
          <button id="viewInsight" style="background-color: #ff8566;">오늘의 인사이트 보기</button>
          <button onclick="window.location.href='/signup'" style="background-color: white; color: #ff8566; border: 2px solid #ff8566;">시작하기</button>
        </div>
      </section>

      <!-- 오늘의 인사이트 섹션 -->
      <section id="content">
        <h3>🌟 오늘의 AI 추천 인사이트</h3>
        <div class="cards">
          <div class="card" onclick="alert('인사이트 상세 페이지로 이동합니다')">
            💡 <b>"완벽한 수업보다 완벽한 관심"</b><br>
            <small>학생 한 명 한 명의 작은 변화를 알아차리는 것</small>
          </div>
          <div class="card" onclick="alert('인사이트 상세 페이지로 이동합니다')">
            ❤️ <b>"교사를 위로하면 보육이 달라진다"</b><br>
            <small>당신의 마음 건강이 최우선입니다</small>
          </div>
          <div class="card" onclick="alert('인사이트 상세 페이지로 이동합니다')">
            🌱 <b>"작은 실천이 큰 변화를 만든다"</b><br>
            <small>오늘부터 시작하는 긍정적 변화</small>
          </div>
        </div>
      </section>

      <!-- 지금 인기 클래스 -->
      <section id="content" style="background-color: #fff0e6; padding: 3rem 2rem; margin-top: 2rem;">
        <h3>🔥 지금 인기 클래스</h3>
        <div class="cards">
          <div class="card" onclick="window.location.href='/learn'">
            🎓 <b>AI로 부모면담 정리하기</b><br>
            <small>⭐ 4.9 | 수강생 1,234명</small>
          </div>
          <div class="card" onclick="window.location.href='/learn'">
            📋 <b>놀이일지 쉽게 작성하기</b><br>
            <small>⭐ 4.8 | 수강생 892명</small>
          </div>
          <div class="card" onclick="window.location.href='/learn'">
            💬 <b>감정케어 & 회복 클래스</b><br>
            <small>⭐ 5.0 | 수강생 567명</small>
          </div>
        </div>
      </section>

      <!-- 교사 인터뷰 하이라이트 -->
      <section id="content">
        <h3>🎤 교사 인터뷰 하이라이트</h3>
        <div class="cards">
          <div class="card" onclick="window.location.href='/story'">
            📖 <b>"첫 출근, 그리고 첫 눈물"</b><br>
            <small>신규 교사 김민지 선생님의 이야기</small>
          </div>
          <div class="card" onclick="window.location.href='/story'">
            💝 <b>"아이의 작은 변화가 준 감동"</b><br>
            <small>10년차 박수진 선생님의 경험담</small>
          </div>
          <div class="card" onclick="window.location.href='/story'">
            🌈 <b>"번아웃에서 회복까지"</b><br>
            <small>다시 교사로 살아가기</small>
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

      <footer>
        <p>© 2025 WITTI | 교사의 하루를 덜어주고, 마음을 채워주는 플랫폼</p>
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
    </head>
    <body>

      <header>
        <h1>🌿 WITTI</h1>
        <nav>
          <a href="/">Home</a>
          <a href="/learn" class="active">Learn</a>
          <a href="/story">Story</a>
          <a href="/talk">Talk</a>
          <a href="/tools">Tools</a>
          <a href="/mywitti">MyWITTI</a>
        </nav>
      </header>

      <section id="hero">
        <h2>실전에서 바로 쓰는 교사 강의</h2>
        <p>5분만에 배우고, 내일 바로 써먹는 실전 콘텐츠</p>
      </section>

      <section id="content">
        <h3>오늘의 추천 클래스</h3>
        <div class="cards">
          <div class="card">
            🎓 <b>AI로 부모면담 정리하기</b><br>
            <small>대화기록을 자동으로 요약해주는 실무 꿀팁</small>
          </div>
          <div class="card">
            📋 <b>놀이일지 쉽게 작성하기</b><br>
            <small>AI 템플릿으로 10분 안에 완성!</small>
          </div>
          <div class="card">
            💬 <b>감정케어 & 회복 클래스</b><br>
            <small>교사 마음건강 회복을 위한 미니 클래스</small>
          </div>
        </div>
      </section>

      <footer>
        <p>© 2025 WITTI | Learn smarter, grow warmer.</p>
      </footer>

    </body>
    </html>
  `)
})

// Story page route
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
    </head>
    <body>

      <header>
        <h1>🌿 WITTI</h1>
        <nav>
          <a href="/">Home</a>
          <a href="/learn">Learn</a>
          <a href="/story" class="active">Story</a>
          <a href="/talk">Talk</a>
          <a href="/tools">Tools</a>
          <a href="/mywitti">MyWITTI</a>
        </nav>
      </header>

      <section id="hero">
        <h2>오늘도 괜찮아요, 선생님</h2>
        <p>교사들의 진솔한 이야기와 공감의 공간</p>
      </section>

      <section id="content">
        <h3>이번 주 인기 스토리</h3>
        <div class="cards">
          <div class="card">
            📖 <b>"첫 출근, 그리고 첫 눈물"</b><br>
            <small>신규 교사의 첫 한 달 이야기</small>
          </div>
          <div class="card">
            💝 <b>"아이의 작은 변화가 준 감동"</b><br>
            <small>6개월 만에 웃게 된 아이</small>
          </div>
          <div class="card">
            🌈 <b>"번아웃에서 회복까지"</b><br>
            <small>다시 교사로 살아가기</small>
          </div>
        </div>
      </section>

      <footer>
        <p>© 2025 WITTI | 교사의 하루를 덜어주고, 마음을 채워주는 플랫폼</p>
      </footer>

    </body>
    </html>
  `)
})

// Talk page route
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
    </head>
    <body>

      <header>
        <h1>🌿 WITTI</h1>
        <nav>
          <a href="/">Home</a>
          <a href="/learn">Learn</a>
          <a href="/story">Story</a>
          <a href="/talk" class="active">Talk</a>
          <a href="/tools">Tools</a>
          <a href="/mywitti">MyWITTI</a>
        </nav>
      </header>

      <section id="hero">
        <h2>함께 나누는 교사 커뮤니티</h2>
        <p>고민 상담부터 경험 공유까지, 혼자가 아닙니다</p>
      </section>

      <section id="content">
        <h3>인기 토픽</h3>
        <div class="cards">
          <div class="card">
            💬 <b>부모 상담 노하우</b><br>
            <small>98개의 댓글</small>
          </div>
          <div class="card">
            🤝 <b>신규교사 멘토링</b><br>
            <small>실전 경험 공유 중</small>
          </div>
          <div class="card">
            🎯 <b>실천 프로젝트</b><br>
            <small>함께 성장하는 챌린지</small>
          </div>
        </div>
      </section>

      <footer>
        <p>© 2025 WITTI | 교사의 하루를 덜어주고, 마음을 채워주는 플랫폼</p>
      </footer>

    </body>
    </html>
  `)
})

// Tools page route
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
    </head>
    <body>

      <header>
        <h1>🌿 WITTI</h1>
        <nav>
          <a href="/">Home</a>
          <a href="/learn">Learn</a>
          <a href="/story">Story</a>
          <a href="/talk">Talk</a>
          <a href="/tools" class="active">Tools</a>
          <a href="/mywitti">MyWITTI</a>
        </nav>
      </header>

      <section id="hero">
        <h2>교사를 위한 AI 도구 허브</h2>
        <p>일상 업무를 AI로 간편하게, 나만의 시간을 되찾으세요</p>
      </section>

      <section id="content">
        <h3>인기 도구</h3>
        <div class="cards">
          <div class="card">
            🤖 <b>부모면담 요약기</b><br>
            <small>AI가 자동으로 요약해주는 면담 기록</small>
          </div>
          <div class="card">
            📝 <b>일일일지 자동작성</b><br>
            <small>오늘의 활동을 빠르게 기록</small>
          </div>
          <div class="card">
            💗 <b>감정일지 & 마음진단</b><br>
            <small>WITTI Care로 마음 건강 체크</small>
          </div>
        </div>
        
        <h3 style="margin-top: 3rem;">더 많은 도구</h3>
        <div class="cards">
          <div class="card">
            📊 <b>성장 리포트 생성기</b><br>
            <small>아이 발달 리포트 PDF 출력</small>
          </div>
          <div class="card">
            📁 <b>나만의 템플릿 저장소</b><br>
            <small>자주 쓰는 문서 템플릿 관리</small>
          </div>
          <div class="card">
            ⚙️ <b>맞춤형 도구 개발 중</b><br>
            <small>교사들의 제안으로 만들어집니다</small>
          </div>
        </div>
      </section>

      <footer>
        <p>© 2025 WITTI | AI로 더 스마트하게, 더 따뜻하게</p>
      </footer>

    </body>
    </html>
  `)
})

// MyWITTI page route
app.get('/mywitti', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MyWITTI - 나의 성장 공간</title>
      <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <link rel="stylesheet" href="/static/style.css">
    </head>
    <body>

      <header>
        <h1>🌿 WITTI</h1>
        <nav>
          <a href="/">Home</a>
          <a href="/learn">Learn</a>
          <a href="/story">Story</a>
          <a href="/talk">Talk</a>
          <a href="/tools">Tools</a>
          <a href="/mywitti" class="active">MyWITTI</a>
        </nav>
      </header>

      <section id="hero">
        <h2>나만의 성장 공간</h2>
        <p>배움의 기록부터 성취까지, 당신의 성장을 응원합니다</p>
      </section>

      <section id="content">
        <h3>나의 활동</h3>
        <div class="cards">
          <div class="card">
            📚 <b>수강 중인 강의</b><br>
            <small>진행 중: 3개 | 완료: 12개</small>
          </div>
          <div class="card">
            ⭐ <b>저장한 콘텐츠</b><br>
            <small>Story 5개 | 도구 3개</small>
          </div>
          <div class="card">
            🌱 <b>성장 트리</b><br>
            <small>획득한 뱃지: 8개</small>
          </div>
        </div>
        
        <h3 style="margin-top: 3rem;">나의 참여</h3>
        <div class="cards">
          <div class="card">
            🎯 <b>실천 프로젝트</b><br>
            <small>참여 중인 프로젝트 관리</small>
          </div>
          <div class="card">
            👥 <b>멘토·멘티 매칭</b><br>
            <small>AI 기반 추천 시스템</small>
          </div>
          <div class="card">
            🎓 <b>나의 클래스</b><br>
            <small>내가 개설한 강의 (곧 오픈)</small>
          </div>
        </div>
        
        <h3 style="margin-top: 3rem;">프로필 관리</h3>
        <div class="cards">
          <div class="card">
            👤 <b>프로필 설정</b><br>
            <small>역량 및 관심 분야 관리</small>
          </div>
          <div class="card">
            📈 <b>나의 성장 리포트</b><br>
            <small>학습 패턴 및 성취도 분석</small>
          </div>
          <div class="card">
            🔔 <b>알림 설정</b><br>
            <small>맞춤형 추천 알림 관리</small>
          </div>
        </div>
      </section>

      <footer>
        <p>© 2025 WITTI | 교사의 하루를 덜어주고, 마음을 채워주는 플랫폼</p>
      </footer>

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

      <header>
        <h1>🌿 WITTI</h1>
        <nav>
          <a href="/">Home</a>
          <a href="/learn">Learn</a>
          <a href="/story">Story</a>
          <a href="/talk">Talk</a>
          <a href="/tools">Tools</a>
          <a href="/mywitti">MyWITTI</a>
        </nav>
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
        <p>© 2025 WITTI | 교사의 하루를 덜어주고, 마음을 채워주는 플랫폼</p>
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

      <header>
        <h1>🌿 WITTI</h1>
        <nav>
          <a href="/">Home</a>
          <a href="/learn">Learn</a>
          <a href="/story">Story</a>
          <a href="/talk">Talk</a>
          <a href="/tools">Tools</a>
          <a href="/mywitti">MyWITTI</a>
        </nav>
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
        <p>© 2025 WITTI | 교사의 하루를 덜어주고, 마음을 채워주는 플랫폼</p>
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
        <p>© 2025 WITTI | 교사의 하루를 덜어주고, 마음을 채워주는 플랫폼</p>
      </footer>

    </body>
    </html>
  `)
})

export default app
