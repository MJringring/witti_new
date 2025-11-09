# 🌿 WITTI - 교사의 하루를 덜어주는 플랫폼

## 프로젝트 개요
- **이름**: WITTI (Wise Teachers' Interactive Tools & Insights)
- **목표**: 교사의 업무 부담을 줄이고 마음의 여유를 제공하는 통합 플랫폼
- **슬로건**: "출근길 5분, 위트 있는 인사이트 한 컷"

## 주요 기능

### ✅ 현재 구현된 기능

#### 1. **홈페이지 (Home)**
   - 교사들을 위한 영감을 주는 명언 및 인사이트 제공
   - 모달 창을 통한 인터랙티브한 인사이트 표시
   - 랜덤으로 매번 다른 인사이트 제공
   - 시간대에 따라 변하는 환영 메시지
   - 추천 콘텐츠 카드

#### 2. **Learn 페이지 - 실전형 교사 강의**
   - "5분만에 배우고, 내일 바로 써먹는 실전 콘텐츠"
   - 추천 클래스:
     - 🎓 AI로 부모면담 정리하기
     - 📋 놀이일지 쉽게 작성하기
     - 💬 감정케어 & 회복 클래스

#### 3. **Story 페이지 - 교사들의 이야기**
   - "오늘도 괜찮아요, 선생님"
   - 교사들의 진솔한 이야기와 공감의 공간
   - 인기 스토리:
     - 📖 "첫 출근, 그리고 첫 눈물"
     - 💝 "아이의 작은 변화가 준 감동"
     - 🌈 "번아웃에서 회복까지"

#### 4. **Talk 페이지 - 교사 커뮤니티**
   - 함께 나누는 교사 커뮤니티
   - 고민 상담부터 경험 공유까지
   - 인기 토픽:
     - 💬 부모 상담 노하우
     - 🤝 신규교사 멘토링
     - 🎯 실천 프로젝트

#### 5. **Tools 페이지 - AI 도구 허브**
   - 교사를 위한 AI 도구 허브
   - 일상 업무를 AI로 간편하게
   - 주요 도구:
     - 🤖 부모면담 요약기
     - 📝 일일일지 자동작성
     - 💗 감정일지 & 마음진단 (WITTI Care)
     - 📊 성장 리포트 생성기
     - 📁 나만의 템플릿 저장소

#### 6. **MyWITTI 페이지 - 나의 성장 공간**
   - 배움의 기록부터 성취까지
   - 나의 활동:
     - 📚 수강 중인 강의 관리
     - ⭐ 저장한 콘텐츠
     - 🌱 성장 트리 & 뱃지
   - 나의 참여:
     - 🎯 실천 프로젝트 관리
     - 👥 멘토·멘티 매칭
     - 🎓 나의 클래스 (개설자 전용)
   - 프로필 관리:
     - 👤 역량 및 관심 분야
     - 📈 성장 리포트
     - 🔔 맞춤형 알림 설정

#### 7. **RESTful API**
   - `/api/hello` - API 상태 확인
   - `/api/insights` - 인사이트 데이터 JSON 제공

### 🚀 현재 기능 URI 요약
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/` | GET | 메인 홈페이지 |
| `/learn` | GET | Learn 페이지 - 실전형 교사 강의 |
| `/story` | GET | Story 페이지 - 교사들의 이야기 |
| `/talk` | GET | Talk 페이지 - 교사 커뮤니티 |
| `/tools` | GET | Tools 페이지 - AI 도구 허브 |
| `/mywitti` | GET | MyWITTI 페이지 - 나의 성장 공간 |
| `/api/hello` | GET | API 상태 확인 (JSON) |
| `/api/insights` | GET | 인사이트 목록 조회 (JSON) |
| `/static/style.css` | GET | 스타일시트 |
| `/static/script.js` | GET | JavaScript 파일 |

## 🔜 향후 구현 예정 기능

### Phase 1: 페이지 상세 기능 구현

1. **Learn 섹션 확장**
   - 강의 상세 페이지
   - 동영상 강의 플레이어
   - 강의 진도 관리
   - 수료증 발급
   - 댓글 및 Q&A
   - 교사 개설형 클래스 (Class 101 모델)

2. **Story 섹션 확장**
   - 스토리 상세 페이지
   - 스토리 작성 및 편집 기능
   - 좋아요 및 댓글 시스템
   - 카테고리별 필터링
   - 인기/최신 정렬
   - 북카페 연동: 도담서가 큐레이션

3. **Talk 섹션 확장**
   - 게시판 CRUD 기능
   - 실시간 댓글
   - 태그 시스템
   - 검색 기능
   - 밋업 / 오프라인 행사 등록

4. **Tools 섹션 기능 구현**
   - 부모면담 요약기 실제 기능
   - 일일일지 자동작성 기능
   - 감정일지 & 마음진단 도구
   - 성장 리포트 PDF 출력
   - 템플릿 저장/불러오기

5. **MyWITTI 섹션 기능 구현**
   - 개인 대시보드 데이터 연동
   - 수강 관리 시스템
   - 성장 트리 & 뱃지 시스템
   - 멘토·멘티 매칭 알고리즘
   - 프로필 편집 기능

### Phase 2: 플랫폼 고도화

6. **사용자 인증 시스템**
   - 로그인/회원가입
   - 개인화된 콘텐츠 추천

7. **데이터베이스 연동**
   - Cloudflare D1을 활용한 사용자 데이터 관리
   - 인사이트 및 콘텐츠 동적 관리

8. **AI 도구 통합**
   - OpenAI API를 활용한 부모면담 요약 기능
   - 실시간 커뮤니티: WebSocket 또는 Durable Objects 활용
   - 모바일 앱: Progressive Web App (PWA) 변환

9. **B2B / 기관 관리자 페이지**
   - 기관별 교사 대시보드
   - 구독 관리 / 결제
   - 학습 리포트 / 데이터 통계
   - 교사 참여 지표 / 피드백
   - 학습 기록 및 진행상황

6. **사용자 인증 시스템**
   - 로그인/회원가입
   - 개인화된 콘텐츠 추천

7. **데이터베이스 연동**
   - Cloudflare D1을 활용한 사용자 데이터 관리
   - 인사이트 및 콘텐츠 동적 관리

## 📊 데이터 구조

### 현재 데이터 모델
- **Insights (인사이트)**
  - `id`: 고유 식별자
  - `title`: 인사이트 제목
  - `quote`: 인용구
  - `message`: 메시지 내용
  - `author`: 작성자/출처

### 스토리지 서비스
- **현재**: 정적 데이터 (하드코딩)
- **향후**: Cloudflare D1 Database (SQLite)

## 🌐 URLs

### Development (Sandbox)
- **홈페이지**: https://3000-inf87fujpavw034thos04-583b4d74.sandbox.novita.ai
- **Learn 페이지**: https://3000-inf87fujpavw034thos04-583b4d74.sandbox.novita.ai/learn
- **Story 페이지**: https://3000-inf87fujpavw034thos04-583b4d74.sandbox.novita.ai/story
- **Talk 페이지**: https://3000-inf87fujpavw034thos04-583b4d74.sandbox.novita.ai/talk
- **Tools 페이지**: https://3000-inf87fujpavw034thos04-583b4d74.sandbox.novita.ai/tools
- **MyWITTI 페이지**: https://3000-inf87fujpavw034thos04-583b4d74.sandbox.novita.ai/mywitti
- **API Hello**: https://3000-inf87fujpavw034thos04-583b4d74.sandbox.novita.ai/api/hello
- **API Insights**: https://3000-inf87fujpavw034thos04-583b4d74.sandbox.novita.ai/api/insights

### Production
- **플랫폼**: Cloudflare Pages (배포 예정)
- **GitHub**: (저장소 생성 예정)

## 🛠️ 기술 스택
- **프레임워크**: Hono (v4.10.4) - 경량 웹 프레임워크
- **런타임**: Cloudflare Workers
- **프론트엔드**: Vanilla JavaScript + HTML5 + CSS3
- **프로세스 관리**: PM2
- **배포**: Cloudflare Pages

## 🎨 디자인 특징
- **색상 테마**: 따뜻한 오렌지/피치 톤 (#ff8566, #ff9f80, #ffe9d6, #fff0e6)
- **폰트**: Pretendard - 한글 최적화 폰트
- **UI/UX**: 
  - 부드럽고 따뜻한 색감
  - 카드 기반 레이아웃
  - 호버 애니메이션
  - 반응형 디자인 (모바일 최적화)
  - 모달 인터랙션

## 📖 사용자 가이드

### 메인 페이지 사용법
1. **인사이트 보기**: "오늘의 인사이트 보기" 버튼을 클릭하면 영감을 주는 명언과 메시지를 볼 수 있습니다
2. **콘텐츠 탐색**: 추천 콘텐츠 카드를 클릭하여 각 섹션으로 이동할 수 있습니다
3. **네비게이션**: 상단 메뉴를 통해 다양한 섹션을 탐색할 수 있습니다

### 시간별 맞춤 경험
- **오전 (00:00-11:59)**: "좋은 아침입니다, 선생님!" 메시지
- **오후 (12:00-17:59)**: "오늘도 수고하셨습니다, 선생님!" 메시지
- **저녁 (18:00-23:59)**: "하루를 마무리하며..." 메시지

## 🚀 로컬 개발 가이드

### 설치
```bash
cd /home/user/webapp
npm install
```

### 개발 서버 실행
```bash
# 빌드
npm run build

# PM2로 서버 시작
pm2 start ecosystem.config.cjs

# 또는 npm 스크립트 사용
npm run dev:sandbox
```

### 테스트
```bash
# 홈페이지 테스트
curl http://localhost:3000

# API 테스트
curl http://localhost:3000/api/hello
curl http://localhost:3000/api/insights
```

### PM2 관리
```bash
# 상태 확인
pm2 list

# 로그 확인
pm2 logs witti --nostream

# 재시작
pm2 restart witti

# 중지
pm2 stop witti

# 삭제
pm2 delete witti
```

## 📁 프로젝트 구조
```
webapp/
├── src/
│   ├── index.tsx          # Hono 메인 애플리케이션
│   └── renderer.tsx       # JSX 렌더러 (사용 안 함)
├── public/
│   └── static/
│       ├── style.css      # 스타일시트
│       └── script.js      # 클라이언트 JavaScript
├── dist/                  # 빌드 결과물
├── ecosystem.config.cjs   # PM2 설정
├── package.json           # 의존성 관리
├── vite.config.ts         # Vite 빌드 설정
├── wrangler.jsonc         # Cloudflare 설정
└── README.md             # 프로젝트 문서
```

## 🎯 다음 단계 추천

### 즉시 구현 가능
1. **더 많은 인사이트 추가**: `src/index.tsx`의 insights 배열 확장
2. **추가 페이지 라우팅**: Learn, Story, Talk, Tools 페이지 구현
3. **네비게이션 활성화**: 현재 더미 링크를 실제 페이지 연결로 변경

### 중기 개발
1. **Cloudflare D1 데이터베이스 통합**: 인사이트 및 사용자 데이터 관리
2. **사용자 인증 시스템**: 회원가입/로그인 구현
3. **콘텐츠 관리 시스템**: 관리자 페이지 구축

### 장기 개발
1. **AI 도구 통합**: OpenAI API를 활용한 부모면담 요약 기능
2. **실시간 커뮤니티**: WebSocket 또는 Durable Objects 활용
3. **모바일 앱**: Progressive Web App (PWA) 변환

## 📊 배포 상태
- **현재 상태**: ✅ 개발 환경 활성화 - 전체 플랫폼 구조 완성
- **구현된 페이지**: Home, Learn, Story, Talk, Tools, MyWITTI (6개 페이지)
- **플랫폼**: Cloudflare Pages (배포 준비 완료)
- **마지막 업데이트**: 2025-01-09
  - 디자인 테마 변경 (초록 → 오렌지)
  - 6개 핵심 페이지 구현 완료
  - 네비게이션 active 상태 처리
  - Tools & MyWITTI 섹션 추가

## 📝 라이선스
© 2025 WITTI | All Rights Reserved

## 🤝 기여
이 프로젝트는 교사들의 피드백을 통해 지속적으로 개선됩니다.

---

**"교사의 하루를 덜어주고, 마음을 채워주는 플랫폼"**
