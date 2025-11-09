// Modal functionality
const modal = document.getElementById('insightModal');
const btn = document.getElementById('viewInsight');
const span = document.getElementsByClassName('close')[0];

// Insight data
const insights = [
  {
    title: "오늘의 인사이트",
    quote: "완벽한 수업보다 완벽한 관심이 학생들에게 더 큰 영향을 줍니다.",
    message: "학생 한 명 한 명의 작은 변화를 알아차리는 것, 그것이 진짜 교육의 시작입니다.",
    author: "― 교육 심리학자 김민정"
  },
  {
    title: "마음을 채우는 한 마디",
    quote: "가르침은 두 번의 학습이다.",
    message: "가르치면서 우리도 함께 성장합니다. 오늘 하루도 학생들과 함께 배우는 시간이었습니다.",
    author: "― 조셉 주베르"
  },
  {
    title: "교사의 지혜",
    quote: "학생들은 당신이 얼마나 아는지 상관하지 않습니다. 당신이 얼마나 관심을 가지는지를 알 때까지는.",
    message: "오늘 하루, 한 명의 학생에게라도 진심 어린 관심을 보여주셨나요?",
    author: "― 존 맥스웰"
  }
];

// Random insight selector
function getRandomInsight() {
  return insights[Math.floor(Math.random() * insights.length)];
}

// Display insight in modal
function displayInsight() {
  const insight = getRandomInsight();
  const insightContent = document.querySelector('.insight-content');
  
  insightContent.innerHTML = `
    <h2>${insight.title}</h2>
    <div class="insight-quote">"${insight.quote}"</div>
    <p>${insight.message}</p>
    <p style="text-align: right; color: #ff8566; font-weight: 600; margin-top: 1rem;">
      ${insight.author}
    </p>
  `;
}

// Open modal
if (btn) {
  btn.onclick = function() {
    displayInsight();
    modal.style.display = 'block';
  }
}

// Close modal
if (span) {
  span.onclick = function() {
    modal.style.display = 'none';
  }
}

// Close modal when clicking outside
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = 'none';
  }
}

// Card click events
document.addEventListener('DOMContentLoaded', function() {
  const cards = document.querySelectorAll('.card');
  
  cards.forEach((card, index) => {
    card.addEventListener('click', function() {
      const messages = [
        '🎓 AI 부모면담 요약법 강의가 곧 시작됩니다!',
        '📖 "오늘도 괜찮아요, 선생님" 이야기를 읽어보세요.',
        '💬 실천 프로젝트에 참가하여 다른 선생님들과 소통해보세요!'
      ];
      
      alert(messages[index]);
    });
  });
});

// Greeting based on time
function updateGreeting() {
  const hour = new Date().getHours();
  const heroText = document.querySelector('#hero h2');
  
  if (hour < 12) {
    heroText.innerHTML = '☀️ 좋은 아침입니다, 선생님!<br>교사의 하루를 덜어주고, 마음을 채워주는 플랫폼';
  } else if (hour < 18) {
    heroText.innerHTML = '🌤️ 오늘도 수고하셨습니다, 선생님!<br>교사의 하루를 덜어주고, 마음을 채워주는 플랫폼';
  } else {
    heroText.innerHTML = '🌙 하루를 마무리하며...<br>교사의 하루를 덜어주고, 마음을 채워주는 플랫폼';
  }
}

// Initialize greeting on page load
document.addEventListener('DOMContentLoaded', updateGreeting);

// Add smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Console welcome message
console.log('%c🌿 WITTI Platform', 'color: #ff8566; font-size: 24px; font-weight: bold;');
console.log('%c교사의 하루를 덜어주고, 마음을 채워주는 플랫폼', 'color: #666; font-size: 14px;');
console.log('%c© 2025 WITTI', 'color: #999; font-size: 12px;');
