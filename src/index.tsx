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
          <a href="#">Home</a>
          <a href="#">Learn</a>
          <a href="#">Story</a>
          <a href="#">Talk</a>
          <a href="#">Tools</a>
          <a href="#">MyWITTI</a>
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

export default app
