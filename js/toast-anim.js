/* ===========================================================
   WANDR Toast 通知 + 滚动动画
   =========================================================== */

let toastTimer = null;

function showToast(msg) {
  const toast = dom('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// 滚动入场动画
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.12 });

// 初始化动画观察
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.animate-on-scroll, .fade-in, .slide-up, .slide-in-left, .slide-in-right')
    .forEach(el => observer.observe(el));
});

window.showToast = showToast;
WANDR.showToast = showToast;
WANDR.scrollObserver = observer;
