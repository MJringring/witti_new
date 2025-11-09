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
        </nav>
      </header>

      <section id="hero">
        <h2>교사의 하루를 덜어주고, 마음을 채워주는 플랫폼</h2>
        <p>출근길 5분, 위트 있는 인사이트 한 컷.</p>
        <button id="viewInsight">오늘의 인사이트 보기</button>
      </section>

      <section id="content">
        <h3>오늘의 추천 콘텐츠</h3>
        <div class="cards">
          <div class="card">🎓 실전 강의<br>AI 부모면담 요약법</div>
          <div class="card">📖 이야기<br>"오늘도 괜찮아요, 선생님"</div>
          <div class="card">💬 커뮤니티<br>실천 프로젝트 참가하기</div>
        </div>
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

export default app
