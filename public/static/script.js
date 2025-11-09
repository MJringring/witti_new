// View Insight button - Simple alert version
document.addEventListener('DOMContentLoaded', function() {
  const viewInsightBtn = document.getElementById('viewInsight');
  
  if (viewInsightBtn) {
    viewInsightBtn.addEventListener('click', function() {
      alert("오늘의 인사이트 🌿\n\n'교사를 위로하면, 보육이 달라진다.'");
    });
  }
});

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
  const heroSubtext = document.querySelector('#hero p');
  
  if (hour < 12) {
    heroText.innerHTML = '선생님을 위한 5분의 여유';
    heroSubtext.innerHTML = 'WITTI로 하루를 시작하세요';
  } else if (hour < 18) {
    heroText.innerHTML = '바쁜 하루의 쉼표';
    heroSubtext.innerHTML = 'WITTI가 함께합니다';
  } else {
    heroText.innerHTML = '오늘 하루도 고생 많으셨어요.';
    heroSubtext.innerHTML = '내일의 나를 위한 시간, WITTI와 함께!';
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
