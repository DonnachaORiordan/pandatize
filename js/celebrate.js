// celebrate.js – what happens when a habit is ticked: the tick animation and sound,
// the "Perfect day!" celebration, and the streak milestone screens (7, 30, 100).
//
// Perfect day = every daily habit done TODAY (and there's at least one). The first time each
// day it plays in order: the progress bar fills → the "Perfect day!" card appears → confetti
// and a bright sound. Un-tick and the card goes away; reach 100% again that day and the card
// comes back quietly (no confetti). Back-filling a past day to 100% gives a gentle chime only.

(function () {
  const D = Pz.dates, ui = Pz.ui, h = ui.h, H = Pz.habits;
  const C = {};
  const MILESTONES = [7, 30, 100];
  let cardPops = null;        // the day whose "Perfect day!" card should spring in on this redraw

  const meta = () => Pz.data.habitMeta;
  const isPerfect = date => { const p = H.dayProgress(date); return p.total > 0 && p.done === p.total; };

  // ---------- Ticking a habit ----------
  C.tickHabit = (hb, date) => {
    const today = D.today();
    const before = { streak: H.streak(hb), perfect: isPerfect(date) };
    const words = { card: Pz.habitsView.streakWords(hb, before.streak, 'card'), tile: Pz.habitsView.streakWords(hb, before.streak, 'tile') };
    H.toggle(hb, date);
    const on = H.isDone(hb, date), streak = H.streak(hb);
    if (on) Pz.sounds.tick();

    // Did that tick complete the day?
    let show = null;
    if (on && !before.perfect && isPerfect(date)) {
      if (date === today) show = meta().perfectDays.includes(today) ? 'card' : 'full';
      else if (date < today) show = 'chime';
    }
    cardPops = show === 'full' || show === 'card' ? today : null;
    Pz.app.changed();                                  // redraw everything straight away (feels instant)…
    cardPops = null;
    Pz.fx.habitTick(hb, date, on, words);              // …then animate the freshly drawn pieces

    let wait = 450;
    if (show === 'full') {
      meta().perfectDays.push(today);
      meta().perfectDays = meta().perfectDays.filter(d => d >= D.addDays(today, -400));      // keep about a year
      Pz.storage.save();
      setTimeout(() => Pz.fx.confetti({ count: 140 }), 560);         // after the bar fills and the card appears
      Pz.sounds.perfect(0.56);
      wait = 2400;
    } else if (show === 'chime') Pz.sounds.chime(false);

    // Streak milestones: celebrated the first time the streak crosses 7, 30 or 100.
    if (on && streak > before.streak) {
      const got = meta().milestones[hb.id] || [];
      const crossed = MILESTONES.filter(m => before.streak < m && streak >= m && !got.includes(m));
      if (crossed.length) {
        meta().milestones[hb.id] = got.concat(crossed);
        Pz.storage.save();
        setTimeout(() => openMilestone(hb, crossed[crossed.length - 1]), wait);
      }
    }
  };

  // ---------- The "Perfect day!" card (on Today, under the progress bar) ----------
  const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  function perfectThisMonth(date) {
    let n = 0;
    for (let d = date.slice(0, 8) + '01'; d <= date; d = D.addDays(d, 1)) if (isPerfect(d)) n++;
    return n;
  }
  // A ring split into the colours of the daily habits, with a check in the middle.
  function ring(colors) {
    const r = 27, len = 2 * Math.PI * r, gap = colors.length > 1 ? 5 : 0, seg = len / colors.length;
    const arcs = colors.map((c, i) => '<circle cx="34" cy="34" r="' + r + '" fill="none" stroke="' + c + '" stroke-width="7" stroke-linecap="round"' +
      ' stroke-dasharray="' + Math.max(0.1, seg - gap - (gap ? 7 : 0)) + ' ' + len + '" stroke-dashoffset="' + (-i * seg) + '" transform="rotate(-90 34 34)"/>').join('');
    const box = h('div', { class: 'pc-ring' });
    box.innerHTML = '<svg width="68" height="68" viewBox="0 0 68 68" aria-hidden="true">' + arcs + '</svg>';
    box.appendChild(h('span', { class: 'pc-check' }, [Pz.icon('check', 26)]));
    return box;
  }
  C.perfectCard = date => {
    if (!isPerfect(date)) return null;
    const colors = H.active(date).filter(x => !H.isWeekly(x)).map(x => x.color);
    return h('div', { class: 'card perfect-card' + (cardPops === date ? ' fx-in' : '') }, [
      ring(colors),
      h('div', { class: 'pc-title', text: 'Perfect day!' }),
      h('div', { class: 'pc-sub', text: 'All your daily habits done. That’s your ' + ordinal(perfectThisMonth(date)) + ' perfect day this month.' })
    ]);
  };

  // ---------- Streak milestone screen ----------
  function openMilestone(hb, m) {
    const weekly = H.isWeekly(hb), unit = weekly ? 'week' : 'day';
    const next = MILESTONES[MILESTONES.indexOf(m) + 1];
    const said = { 7: weekly ? 'Seven weeks in a row.' : 'A full week in a row.', 30: weekly ? 'Thirty weeks in a row.' : 'A whole month in a row.', 100: weekly ? 'A hundred weeks in a row.' : 'A hundred days in a row.' }[m];
    const msg = said + (next ? ' Next milestone: ' + next + ' ' + unit + 's.' : ' That’s every milestone. Amazing.');
    const reached = meta().milestones[hb.id] || [];
    let close = null;
    const content = h('div', { class: 'milestone', role: 'dialog', 'aria-label': m + '-' + unit + ' streak' }, [
      h('div', { class: 'ms-top' }, [ui.roundBtn('x', 'Close', () => close(), 'big')]),
      h('div', { class: 'ms-body' }, [
        h('div', { class: 'ms-flame' }, [Pz.icon('flame', 200), h('span', { class: 'ms-num' + (m >= 100 ? ' three' : ''), text: String(m) })]),
        h('h1', { class: 'ms-title', text: m + '-' + unit + ' streak!' }),
        h('div', { class: 'ms-habit' }, [
          h('span', { class: 'habit-ic', style: { background: hb.color, color: Pz.glyphOn(hb.color), width: '30px', height: '30px', borderRadius: '9px' } }, [Pz.icon(hb.icon, 17)]),
          h('span', { text: hb.title })
        ]),
        h('p', { class: 'ms-msg', text: msg }),
        h('div', { class: 'ms-badges' }, MILESTONES.map(b => {
          const got = reached.includes(b) || b <= m;
          return h('div', { class: 'ms-badge' + (got ? ' on' : ''), style: got ? { background: hb.color, color: Pz.textOn(hb.color) } : null }, [
            h('b', { text: String(b) }), !got && h('span', { class: 'ms-lock' }, [Pz.icon('lock', 12)])
          ]);
        })),
        h('button', { type: 'button', class: 'ms-go', text: 'Keep going', onclick: () => close() })
      ])
    ]);
    close = ui.overlay(content);
    Pz.sounds.chime(true);
    setTimeout(() => Pz.fx.confetti({ count: 60 }), 420);          // once the flame has burst
  }
  C.openMilestone = openMilestone;

  Pz.celebrate = C;
})();
