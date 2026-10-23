/* ============================================================
   motion.js · 全站平滑动效
   1. 光标柔光跟随（静止即停，不再空转 60fps）
   2. 入口卡光斑跟随
   3. 页面转场：涟漪 + 轻推远 + 柔光覆盖
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- 1. 光标柔光 ---------------- */
  var glow = document.getElementById('glow');
  if (glow && !reduce) {
    var gx = 0, gy = 0, tx = 0, ty = 0, raf = null;

    var step = function () {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)';

      /* 已收敛到亚像素级就停掉循环，避免空转耗帧 */
      if (Math.abs(tx - gx) < 0.35 && Math.abs(ty - gy) < 0.35) {
        raf = null;
        return;
      }
      raf = requestAnimationFrame(step);
    };

    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      tx = e.clientX;
      ty = e.clientY;
      if (!document.body.classList.contains('has-pointer')) {
        document.body.classList.add('has-pointer');
        gx = tx; gy = ty;
      }
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
  }

  /* ---------------- 2. 入口卡光斑跟随 ---------------- */
  var cards = document.querySelectorAll('.mat');
  for (var i = 0; i < cards.length; i++) {
    cards[i].addEventListener('pointermove', function (e) {
      var r = this.getBoundingClientRect();
      this.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      this.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* ---------------- 3. 页面转场 ---------------- */
  var leaving = false;

  document.addEventListener('click', function (e) {
    if (leaving) return;

    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a) return;

    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' ||
        /^(https?:|mailto:|tel:|javascript:)/i.test(href)) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    e.preventDefault();
    leaving = true;

    /* 系统要求减少动效：直接跳转 */
    if (reduce) { window.location.href = href; return; }

    /* 点击处柔和扩散的涟漪，掩住转场切口 */
    var x = e.clientX || 0, y = e.clientY || 0;
    var ripple = document.createElement('span');
    ripple.className = 'tap-ripple';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    document.body.appendChild(ripple);
    window.setTimeout(function () {
      if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
    }, 700);

    /* 等两帧再挂离场类：确保浏览器已提交当前样式，
       否则「加类」和「首帧」可能合并，过渡被跳过而显得生硬 */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.body.classList.add('leaving');
      });
    });

    window.setTimeout(function () { window.location.href = href; }, 255);
  }, false);
})();
