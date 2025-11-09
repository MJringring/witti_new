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

      <header style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem;">
        <h1 style="margin: 0;">🌿 WITTI</h1>
        <nav style="display: flex; gap: 2rem; align-items: center;">
          <a href="/learn">Learn</a>
          <a href="/story">Story</a>
          <a href="/talk">Talk</a>
          <a href="/tools">Tools</a>
          <a href="/mywitti">MyWITTI</a>
          <div style="display: flex; gap: 1rem; margin-left: 1rem;">
            <button onclick="alert('검색 기능 준비 중')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem;">🔍</button>
            <button onclick="alert('알림이 없습니다')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem; position: relative;">
              🔔
              <span style="position: absolute; top: -5px; right: -5px; background: #ff8566; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 0.7rem; display: flex; align-items: center; justify-content: center;">3</span>
            </button>
          </div>
        </nav>
      </header>

      <section id="hero">
        <h2 style="font-size: 2.8rem; margin-bottom: 1rem;">교사의 하루를 덜어주고, 마음을 채워주는 플랫폼.</h2>
        <p style="font-size: 1.3rem; color: #666; margin-bottom: 2rem;">출근길 5분, 위트 있는 인사이트 한 컷.</p>
        <button id="viewInsight" style="background-color: #ff8566; border: none; color: white; padding: 15px 40px; border-radius: 12px; font-size: 18px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(255, 133, 102, 0.3);">
          오늘의 인사이트 보기
        </button>
      </section>

      <!-- AI 추천 카드 영역 -->
      <section id="content">
        <h3 style="text-align: center; margin-bottom: 1rem;">🎯 오늘의 추천 콘텐츠</h3>
        <p style="text-align: center; color: #666; margin-bottom: 2rem; font-size: 0.95rem;">AI가 김민지님을 위해 큐레이션한 콘텐츠</p>
        <div class="cards">
          <div class="card" onclick="window.location.href='/story'" style="cursor: pointer; position: relative;">
            <div style="width: 100%; height: 120px; background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%); border-radius: 12px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; font-size: 3rem;">📖</div>
            <span style="position: absolute; top: 10px; right: 10px; background: #ff8566; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">아티클</span>
            <b>"첫 출근, 그리고 첫 눈물"</b><br>
            <small style="color: #666;">신규 교사의 첫 한 달 이야기 | 10분 읽기</small>
          </div>
          <div class="card" onclick="window.location.href='/learn'" style="cursor: pointer; position: relative;">
            <div style="width: 100%; height: 120px; background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%); border-radius: 12px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; font-size: 3rem;">🎬</div>
            <span style="position: absolute; top: 10px; right: 10px; background: #ff8566; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">영상</span>
            <b>"5분 완성 부모면담 준비"</b><br>
            <small style="color: #666;">짧은 강의 | 5분 | 조회수 2.3K</small>
          </div>
          <div class="card" onclick="window.location.href='/learn'" style="cursor: pointer; position: relative;">
            <div style="width: 100%; height: 120px; background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%); border-radius: 12px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; font-size: 3rem;">🎓</div>
            <span style="position: absolute; top: 10px; right: 10px; background: #ff8566; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">클래스</span>
            <b>"AI로 부모면담 정리하기"</b><br>
            <small style="color: #666;">⭐ 4.9 | 1,234명 수강 중</small>
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
            <span style="color: #ff8566; font-size: 0.85rem; font-weight: 600;">김민지 선생님</span>
          </div>
          <div class="card" onclick="window.location.href='/learn'" style="min-width: 280px; cursor: pointer;">
            <div style="width: 100%; height: 140px; background: linear-gradient(135deg, #ff8566 0%, #ff9f80 100%); border-radius: 12px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">📋</div>
            <b>놀이일지 10분 완성법</b><br>
            <small>⭐ 4.8 | 892명 수강</small><br>
            <span style="color: #ff8566; font-size: 0.85rem; font-weight: 600;">박수진 선생님</span>
          </div>
          <div class="card" onclick="window.location.href='/learn'" style="min-width: 280px; cursor: pointer;">
            <div style="width: 100%; height: 140px; background: linear-gradient(135deg, #ff8566 0%, #ff9f80 100%); border-radius: 12px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">💬</div>
            <b>감정케어 & 회복 클래스</b><br>
            <small>⭐ 5.0 | 567명 수강</small><br>
            <span style="color: #ff8566; font-size: 0.85rem; font-weight: 600;">이지은 상담사</span>
          </div>
          <div class="card" onclick="window.location.href='/learn'" style="min-width: 280px; cursor: pointer;">
            <div style="width: 100%; height: 140px; background: linear-gradient(135deg, #ff8566 0%, #ff9f80 100%); border-radius: 12px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">🎯</div>
            <b>효과적인 부모 소통 전략</b><br>
            <small>⭐ 4.9 | 432명 수강</small><br>
            <span style="color: #ff8566; font-size: 0.85rem; font-weight: 600;">정미영 전문가</span>
          </div>
        </div>
      </section>

      <!-- 교사 인터뷰 (짧은 영상형 썸네일) -->
      <section id="content" style="background: #fff0e6; padding: 3rem 2rem; margin-top: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
          <h3 style="margin: 0;">🎤 교사 인터뷰</h3>
          <a href="/story" style="color: #ff8566; text-decoration: none; font-weight: 600; font-size: 0.95rem;">전체보기 →</a>
        </div>
        <div class="cards">
          <div class="card" onclick="window.location.href='/story'" style="cursor: pointer; position: relative;">
            <div style="width: 100%; height: 160px; background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%); border-radius: 12px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; position: relative;">
              <div style="font-size: 3rem;">🎬</div>
              <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem;">05:23</div>
            </div>
            <b>"첫 출근, 그리고 첫 눈물"</b><br>
            <small style="color: #666;">신규 교사 김민지 | 조회수 3.2K</small>
          </div>
          <div class="card" onclick="window.location.href='/story'" style="cursor: pointer; position: relative;">
            <div style="width: 100%; height: 160px; background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%); border-radius: 12px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; position: relative;">
              <div style="font-size: 3rem;">🎬</div>
              <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem;">07:45</div>
            </div>
            <b>"아이의 작은 변화가 준 감동"</b><br>
            <small style="color: #666;">10년차 박수진 | 조회수 5.1K</small>
          </div>
          <div class="card" onclick="window.location.href='/story'" style="cursor: pointer; position: relative;">
            <div style="width: 100%; height: 160px; background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%); border-radius: 12px; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; position: relative;">
              <div style="font-size: 3rem;">🎬</div>
              <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem;">06:12</div>
            </div>
            <b>"번아웃에서 회복까지"</b><br>
            <small style="color: #666;">선임교사 이지은 | 조회수 4.7K</small>
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

      <footer style="background: #2e2e2e; color: white; text-align: center; padding: 2rem;">
        <p style="margin-bottom: 0.5rem; font-size: 0.95rem;">© 2025 WITTI | 교사의 하루를 덜어주고, 마음을 채워주는 플랫폼</p>
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
    </head>
    <body>

      <header style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem;">
        <h1 style="margin: 0;">🌿 WITTI</h1>
        <nav style="display: flex; gap: 2rem; align-items: center;">
          <a href="/">Home</a>
          <a href="/learn" class="active">Learn</a>
          <a href="/story">Story</a>
          <a href="/talk">Talk</a>
          <a href="/tools">Tools</a>
          <a href="/mywitti">MyWITTI</a>
          <div style="display: flex; gap: 1rem; margin-left: 1rem;">
            <button onclick="alert('검색 기능')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem;">🔍</button>
            <button onclick="alert('알림')" style="background: none; border: none; cursor: pointer; font-size: 1.2rem;">🔔</button>
          </div>
        </nav>
      </header>

      <section id="hero" style="padding: 60px 20px;">
        <h2>실전에서 바로 쓰는 교사 강의</h2>
        <p>5분만에 배우고, 내일 바로 써먹는 실전 콘텐츠</p>
        <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem;">
          <button onclick="window.location.href='/learn#all'" style="background-color: #ff8566; border: none; color: white; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-weight: 600;">전체 강좌 보기</button>
          <button onclick="alert('선임교사만 클래스를 개설할 수 있습니다')" style="background-color: white; color: #ff8566; border: 2px solid #ff8566; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-weight: 600;">내 클래스 개설하기</button>
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
          <div class="card" onclick="alert('리포트 다운로드')">
            📊 <b>2025 부모면담 체크리스트</b><br>
            <small>PDF 다운로드 | 567회</small><br>
            <button style="margin-top: 0.5rem; padding: 6px 16px; background: #ff8566; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem;">무료 다운로드</button>
          </div>
          <div class="card" onclick="alert('리포트 다운로드')">
            📝 <b>놀이일지 작성 가이드</b><br>
            <small>PDF 다운로드 | 892회</small><br>
            <button style="margin-top: 0.5rem; padding: 6px 16px; background: #ff8566; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.85rem;">무료 다운로드</button>
          </div>
          <div class="card" onclick="alert('리포트 다운로드')">
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

      <!-- 교사 인터뷰 -->
      <section id="content">
        <h3>🎤 교사 인터뷰</h3>
        <div class="cards">
          <div class="card" onclick="alert('인터뷰 전문 보기')">
            📖 <b>"첫 출근, 그리고 첫 눈물"</b><br>
            <small>신규 교사 김민지 | 10분 읽기 | 💬 234</small>
          </div>
          <div class="card" onclick="alert('인터뷰 전문 보기')">
            💝 <b>"아이의 작은 변화가 준 감동"</b><br>
            <small>10년차 박수진 | 8분 읽기 | 💬 189</small>
          </div>
          <div class="card" onclick="alert('인터뷰 전문 보기')">
            🌈 <b>"번아웃에서 회복까지"</b><br>
            <small>선임교사 이지은 | 12분 읽기 | 💬 312</small>
          </div>
        </div>
      </section>

      <!-- 아티클 & 리포트 -->
      <section id="content" style="background: #fff0e6; padding: 3rem 2rem; margin-top: 2rem;">
        <h3>📄 아티클 & 리포트</h3>
        <p style="text-align: center; color: #666; margin-bottom: 2rem;">교육 현장의 인사이트를 담은 깊이 있는 콘텐츠</p>
        <div class="cards">
          <div class="card" onclick="alert('아티클 읽기')">
            📊 <b>2025 보육 트렌드 리포트</b><br>
            <small>WITTI 리서치팀 | 20분 읽기</small>
          </div>
          <div class="card" onclick="alert('아티클 읽기')">
            💡 <b>AI 시대, 교사의 역할 재정의</b><br>
            <small>교육학 박사 김철수 | 15분 읽기</small>
          </div>
          <div class="card" onclick="alert('아티클 읽기')">
            🔍 <b>효과적인 부모 소통 전략</b><br>
            <small>상담 전문가 정미영 | 12분 읽기</small>
          </div>
        </div>
      </section>

      <!-- 뉴스레터 & 카드뉴스 -->
      <section id="content">
        <h3>📬 뉴스레터 & 카드뉴스</h3>
        <div style="text-align: center; background: white; padding: 2rem; border-radius: 16px; margin-bottom: 2rem; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
          <h4 style="color: #ff8566; margin-bottom: 1rem;">📨 WITTI 주간 뉴스레터</h4>
          <p style="color: #666; margin-bottom: 1.5rem;">매주 화요일, 교사를 위한 인사이트를 카카오톡으로 받아보세요</p>
          <button onclick="alert('뉴스레터 구독 신청')" style="background: #ff8566; color: white; border: none; padding: 12px 32px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 16px;">무료 구독하기</button>
          <p style="margin-top: 1rem; color: #999; font-size: 0.85rem;">현재 3,456명이 구독 중이에요</p>
        </div>

        <div class="cards">
          <div class="card" onclick="alert('카드뉴스 보기')">
            🎨 <b>오늘의 카드뉴스</b><br>
            <small>"교사의 자존감 높이는 3가지 방법"</small>
          </div>
          <div class="card" onclick="alert('카드뉴스 보기')">
            🎨 <b>이번 주 하이라이트</b><br>
            <small>"부모상담 꿀팁 Top 5"</small>
          </div>
          <div class="card" onclick="alert('카드뉴스 보기')">
            🎨 <b>인기 카드뉴스</b><br>
            <small>"신규교사가 알아야 할 것들"</small>
          </div>
        </div>
      </section>

      <!-- 도담서가 큐레이션 -->
      <section id="content" style="background: linear-gradient(135deg, #ffe9d6 0%, #fff0e6 100%); padding: 3rem 2rem; margin-top: 2rem;">
        <h3>📚 도담서가 큐레이션</h3>
        <p style="text-align: center; color: #666; margin-bottom: 2rem;">교사를 위한 책 추천 & 북카페 연동</p>
        <div class="cards">
          <div class="card" onclick="alert('책 상세 정보')">
            📕 <b>"교사의 말공부"</b><br>
            <small>김성우 저 | 추천 ⭐⭐⭐⭐⭐</small>
          </div>
          <div class="card" onclick="alert('책 상세 정보')">
            📘 <b>"아이의 마음을 읽는 기술"</b><br>
            <small>이임숙 저 | 추천 ⭐⭐⭐⭐</small>
          </div>
          <div class="card" onclick="alert('책 상세 정보')">
            📗 <b>"교사 회복 프로젝트"</b><br>
            <small>정은주 저 | 추천 ⭐⭐⭐⭐⭐</small>
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
