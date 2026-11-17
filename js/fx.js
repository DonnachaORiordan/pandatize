// fx.js – the animations ("effects"): tick pops, the square that flies into the history
// strip, rolling streak numbers, strike-through lines, fades on delete, highlights and confetti.
// The looks (timings, bounces) are in css/motion.css; this file decides WHEN they play.
//
// How it works: ticking something saves it and redraws the screens straight away (so it feels
// instant). Then these functions find the freshly drawn pieces and add an animation class to them.
// Everything checks the iPhone "Reduce Motion" setting: then only simple fades are used.

(function () {
  const ui = Pz.ui, h = ui.h;
  const F = {};
  const FLY = 360;                 // how long the square takes to fly into the strip (ms)
  const mq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  F.reduced = () => !!(mq && mq.matches);

  const app = () => document.getElementById('app');
  const all = sel => Array.from(document.querySelectorAll(sel));
  // Add an animation class, restarting it if it's already there.
  const play = (el, cls) => { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  F.play = play;
  // Is this element actually on screen (not on another tab, which sits off to the side)?
  F.onScreen = el => {
    const r = el.getBoundingClientRect(), a = app().getBoundingClientRect();
    return r.width > 0 && r.left >= a.left - 1 && r.right <= a.right + 1 && r.bottom > a.top && r.top < a.bottom;
  };
  // Where an element's centre is, measured from the app's top-left corner.
  const centre = el => {
    const r = el.getBoundingClientRect(), a = app().getBoundingClientRect();
    return { x: r.left + r.width / 2 - a.left, y: r.top + r.height / 2 - a.top, w: r.width };
  };

  // ---------- A habit was ticked (or un-ticked) ----------
  // The tick box pops, the card fills with its colour, a square flies from the tick box into the
  // history strip along a curve and pops in, the streak rolls like a counter, the progress bar slides.
  F.habitTick = (hb, date, on, oldWords) => {
    all('.habit-tick[data-habit="' + hb.id + '"][data-date="' + date + '"]').forEach(box => {
      box.classList.add(on ? 'fx-tick' : 'fx-untick');
      const card = box.closest('.habit-card, .habit-tile');
      if (!card) return;
      card.classList.add(on ? 'fx-cardon' : 'fx-cardoff');
      const sq = on && card.querySelector('.h-strip i[data-day="' + date + '"]');
      if (!sq) return;
      if (!F.reduced() && F.onScreen(box)) { fly(box, sq, hb.color); sq.classList.add('fx-land', 'after-fly'); }
      else sq.classList.add('fx-land');
    });
    // Streak text: roll from the old words to the new ones (up when it grows, down when it shrinks)
    all('[data-streak="' + hb.id + '"]').forEach(el => {
      const was = oldWords[el.dataset.kind], now = el.textContent;
      if (was == null || was === now) return;
      el.textContent = '';
      const fresh = h('span', { class: 'new', text: now });
      el.appendChild(h('span', { class: 'roll' + (on ? '' : ' down') }, [h('span', { class: 'old', text: was }), fresh]));
      fresh.addEventListener('animationend', () => { el.textContent = now; });      // back to plain text afterwards
      const flame = el.parentNode && el.parentNode.querySelector('.flame');
      if (flame && on) flame.classList.add('fx-flicker');
    });
    // Progress bar: the habit's segment grows in, or a copy of it shrinks away
    all('.progress[data-date="' + date + '"] .progress-track').forEach(track => {
      if (on) { const seg = track.querySelector('i[data-habit="' + hb.id + '"]'); if (seg) seg.classList.add('fx-grow'); return; }
      const p = Pz.habits.dayProgress(date);
      if (!p.total) return;
      const daily = Pz.habits.active(date).filter(x => !Pz.habits.isWeekly(x));
      const pos = daily.slice(0, daily.indexOf(hb)).filter(x => Pz.habits.isDone(x, date)).length;     // where its segment was
      const ghost = h('i', { class: 'fx-shrink', style: { background: hb.color, width: 'calc(' + (100 / p.total) + '% - 2px)' } });
      track.insertBefore(ghost, track.children[pos] || null);
      ghost.addEventListener('animationend', () => ghost.remove());
      setTimeout(() => ghost.remove(), 600);                                                        // (in case the animation never runs)
    });
  };

  // The square flying from the tick box into the strip, along a gentle curve.
  function fly(from, to, color) {
    const a = centre(from), b = centre(to), size = b.w;
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, bend = Math.min(70, len * 0.45);
    let nx = -dy / len, ny = dx / len;
    if (nx > 0) { nx = -nx; ny = -ny; }                        // bulge towards the middle of the card
    const cx = (a.x + b.x) / 2 + nx * bend, cy = (a.y + b.y) / 2 + ny * bend;
    const dot = h('div', { class: 'fx-flyer', style: { width: size + 'px', height: size + 'px', background: color } });
    app().appendChild(dot);
    const frames = [];
    for (let i = 0; i <= 12; i++) {                            // points along the curve
      const s = i / 12, u = 1 - s;
      const x = u * u * a.x + 2 * u * s * cx + s * s * b.x, y = u * u * a.y + 2 * u * s * cy + s * s * b.y;
      frames.push({ transform: 'translate(' + (x - size / 2) + 'px,' + (y - size / 2) + 'px) scale(' + (1.6 - 0.6 * s) + ')', opacity: i === 12 ? 0.6 : 1 });
    }
    if (!dot.animate) { dot.remove(); return; }
    dot.animate(frames, { duration: FLY, easing: 'cubic-bezier(.45,0,.35,1)' }).onfinish = () => dot.remove();
    setTimeout(() => dot.remove(), FLY + 200);
  }

  // ---------- A to-do (day to-do, list to-do or subtask) was ticked ----------
  // The checkbox pops and the strike-through line draws across from left to right.
  F.todoTick = (selector, on) => {
    all(selector).forEach(row => {
      const check = row.querySelector('.todo-check, .sub-check');
      if (check) check.classList.add(on ? 'fx-check' : 'fx-uncheck');
      const line = row.querySelector('.strike');
      if (line && on) line.classList.add('fx-strike');
    });
    if (on) Pz.sounds.tick();
  };

  // ---------- Fades ----------
  // Fade things out gently (used before something is deleted). Resolves when done.
  F.fadeAway = els => {
    els = Array.from(els).filter(el => el.isConnected && parseFloat(getComputedStyle(el).opacity) > 0.05);
    if (!els.length || !els[0].animate) return Promise.resolve();
    els.forEach(el => el.animate([{ opacity: 0, transform: F.reduced() ? 'none' : 'scale(.97)' }], { duration: 220, easing: 'ease-in-out', fill: 'forwards' }));
    return new Promise(res => setTimeout(res, 220));
  };
  // Briefly highlight something that just changed (e.g. the time rows in the item sheet).
  F.flash = el => play(el, 'fx-flash');

  // ---------- Confetti ----------
  // Pieces in the 12 palette colours. They fall in gentle curving paths, stretch as they fall, and
  // squash when they land, then fade. o.count = how many; o.x/o.y = burst from a point (else from the top).
  F.confetti = o => {
    if (F.reduced()) return;
    o = o || {};
    const root = app(), W = root.clientWidth, H = root.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cv = h('canvas', { class: 'confetti', width: String(Math.round(W * dpr)), height: String(Math.round(H * dpr)) });
    root.appendChild(cv);
    const g = cv.getContext('2d');
    if (!g) { cv.remove(); return; }
    g.scale(dpr, dpr);
    const colors = Pz.config.palette.map(p => p.hex), rnd = (a, b) => a + Math.random() * (b - a);
    const burst = o.x != null;
    const pieces = [];
    for (let i = 0; i < (o.count || 120); i++) pieces.push({
      x: burst ? o.x : rnd(0, W), y: burst ? o.y : rnd(-H * 0.45, -10),
      vx: burst ? rnd(-3.2, 3.2) : rnd(-0.5, 0.5), vy: burst ? rnd(-7.5, -3) : rnd(1.2, 3),
      w: rnd(6, 9), h: rnd(9, 14), color: colors[i % colors.length],
      rot: rnd(0, Math.PI), spin: rnd(-0.12, 0.12), phase: rnd(0, 6.3), sway: rnd(0.6, 1.6),
      floor: burst ? o.y + rnd(30, 150) : rnd(H * 0.36, H * 0.56), landed: false, t: 0
    });
    let last = performance.now();
    const startT = last;
    function frame(now) {
      const dt = Math.min(48, now - last) / 16.7; last = now;
      g.clearRect(0, 0, W, H);
      let alive = 0;
      pieces.forEach(p => {
        if (!p.landed) {
          p.vy = Math.min(p.vy + (burst ? 0.32 : 0.06) * dt, 4.2);      // gravity, but light paper floats
          p.vx *= Math.pow(0.985, dt);
          p.phase += 0.06 * dt;
          p.x += (p.vx + Math.sin(p.phase) * p.sway) * dt;               // drifting side to side: curving paths
          p.y += p.vy * dt;
          p.rot += p.spin * dt;
          if (p.y >= p.floor && p.vy > 0) { p.landed = true; p.y = p.floor; }
        } else p.t += dt;
        let sx = 1, sy = 1, alpha = 1;
        if (!p.landed) { const s = Math.min(Math.abs(p.vy) / 4.2, 1); sy = 1 + 0.4 * s; sx = 1 - 0.15 * s; }   // stretch while falling
        else { const k = Math.min(p.t / 22, 1); sy = 0.45 + 0.55 * k; sx = 1.45 - 0.45 * k; alpha = 1 - k; }     // squash on landing, then fade
        if (alpha <= 0) return;
        alive++;
        g.save();
        g.globalAlpha = alpha;
        g.translate(p.x, p.y);
        g.scale(sx, sy);
        g.rotate(p.rot);
        g.fillStyle = p.color;
        const flip = Math.abs(Math.cos(p.phase * 1.7));                 // tumbling: it turns edge-on now and then
        g.fillRect(-p.w / 2 * Math.max(0.25, flip), -p.h / 2, p.w * Math.max(0.25, flip), p.h);
        g.restore();
      });
      if (alive && now - startT < 7000) requestAnimationFrame(frame); else cv.remove();
    }
    requestAnimationFrame(frame);
  };
  // A small burst of confetti from an element (e.g. a deadline's flag when it's ticked as done).
  F.burstFrom = (el, count) => {
    if (!el || F.reduced()) return;
    const c = centre(el);
    F.confetti({ x: c.x, y: c.y, count: count || 36 });
  };

  Pz.fx = F;
})();
