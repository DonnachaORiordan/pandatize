// progress.js – the "Progress" screen: ONE line graph of the % of all habits completed,
// by Week, Month or Year, with the period's average, a comparison with the period
// before, and a "Per habit" list. (The per-day sums come from habits.js.)

(function () {
  const D = Pz.dates, ui = Pz.ui, h = ui.h, H = Pz.habits;
  const mon3 = d => D.monthName(d).slice(0, 3);
  const mean = vals => { const v = vals.filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const daysBetween = (a, b) => { const out = []; for (let d = a; d <= b; d = D.addDays(d, 1)) out.push(d); return out; };

  // Everything about one period: its dates, title, the points to draw and the labels under the graph.
  function period(mode, cursor) {
    const today = D.today(), p = { mode: mode };
    if (mode === 'week') {
      p.start = D.monday(cursor); p.end = D.addDays(p.start, 6);
      p.title = D.dayNum(p.start) + (p.start.slice(5, 7) !== p.end.slice(5, 7) ? ' ' + mon3(p.start) : '') + ' – ' + D.dayNum(p.end) + ' ' + mon3(p.end);
      p.prev = D.addDays(p.start, -7); p.next = D.addDays(p.start, 7);
      p.versus = p.start === D.monday(today) ? 'last week' : 'the week before';
    } else if (mode === 'month') {
      p.start = cursor.slice(0, 8) + '01'; p.end = D.addDays(D.addMonths(p.start, 1), -1);
      p.title = D.monthName(p.start) + ' ' + p.start.slice(0, 4);
      p.prev = D.addMonths(p.start, -1); p.next = D.addMonths(p.start, 1);
      p.versus = D.monthName(p.prev);
    } else {
      const y = +cursor.slice(0, 4);
      p.start = y + '-01-01'; p.end = y + '-12-31'; p.title = String(y);
      p.prev = (y - 1) + '-01-01'; p.next = (y + 1) + '-01-01'; p.versus = String(y - 1);
    }
    const days = daysBetween(p.start, p.end);
    p.average = mean(days.map(H.dayPct));
    if (mode === 'year') {
      // One point per week (Monday-start weeks that begin in this year): the average of that week's days
      p.points = []; p.labels = [];
      let m = D.monday(p.start); if (m < p.start) m = D.addDays(m, 7);
      let lastMonth = '';
      for (; m <= p.end; m = D.addDays(m, 7)) {
        // Month labels: "Jan", "Feb"… (June, July and Sept keep 4 letters). They are drawn at a slant so all 12 fit.
        if (m.slice(5, 7) !== lastMonth) { lastMonth = m.slice(5, 7); const name = D.monthName(m); p.labels.push({ at: p.points.length, text: name.length <= 4 ? name : name.slice(0, name === 'September' ? 4 : 3) }); }
        p.points.push({ name: 'Week of ' + D.short(m), value: mean(daysBetween(m, D.addDays(m, 6)).map(H.dayPct)) });
      }
    } else {
      p.points = days.map(d => ({ name: D.short(d), value: H.dayPct(d) }));
      p.labels = mode === 'week' ? days.map((d, i) => ({ at: i, text: D.dayName(d)[0] }))
        : days.map((d, i) => ({ at: i, text: String(D.dayNum(d)) })).filter(l => (+l.text - 1) % 7 === 0);
    }
    p.hasToday = p.start <= today && today <= p.end;
    return p;
  }

  // The line graph. Drawn as SVG (a picture described in code) stretched to the card's width;
  // the labels and the dot are ordinary elements placed on top, so they never stretch.
  function chart(p) {
    const pts = p.points, n = pts.length, W = 300, HT = 120, PAD = 7;
    const X = i => (n > 1 ? i / (n - 1) * W : W / 2), Y = v => PAD + (1 - v / 100) * (HT - 2 * PAD);
    let line = '', area = '', run = [];
    const flush = () => {
      if (run.length > 1) {
        let d = 'M' + X(run[0]) + ',' + Y(pts[run[0]].value);
        for (let k = 1; k < run.length; k++) {           // a gentle S-curve between neighbouring points (never overshoots 0% or 100%)
          const a = run[k - 1], b = run[k], mx = (X(a) + X(b)) / 2;
          d += 'C' + mx + ',' + Y(pts[a].value) + ' ' + mx + ',' + Y(pts[b].value) + ' ' + X(b) + ',' + Y(pts[b].value);
        }
        line += d;
        area += d + 'L' + X(run[run.length - 1]) + ',' + Y(0) + 'L' + X(run[0]) + ',' + Y(0) + 'Z';
      }
      run = [];
    };
    pts.forEach((pt, i) => { if (pt.value == null) flush(); else run.push(i); });
    flush();
    const grid = [100, 50, 0].map(v => '<line x1="0" x2="' + W + '" y1="' + Y(v) + '" y2="' + Y(v) + '" class="grid"/>').join('');
    const plot = h('div', { class: 'plot' });
    plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + HT + '" preserveAspectRatio="none" aria-hidden="true">' + grid +
      '<path d="' + area + '" class="area"/><path d="' + line + '" class="line"/></svg>';
    const place = (el, i) => { el.style.left = X(i) / W * 100 + '%'; el.style.top = Y(pts[i].value) / HT * 100 + '%'; };
    // Points with no neighbour to join to get a small dot of their own; the latest point gets the big dot.
    const have = pts.map((pt, i) => (pt.value == null ? -1 : i)).filter(i => i >= 0);
    have.forEach(i => { if ((i === 0 || pts[i - 1].value == null) && (i === n - 1 || pts[i + 1].value == null)) { const s = h('i', { class: 'dot small' }); place(s, i); plot.appendChild(s); } });
    if (have.length) { const dot = h('i', { class: 'dot' }); place(dot, have[have.length - 1]); plot.appendChild(dot); }

    // Touch or hover: show the value of the nearest point
    const tip = h('div', { class: 'tip' }), rule = h('i', { class: 'rule' }), mark = h('i', { class: 'dot hover' });
    const hide = () => { tip.style.display = rule.style.display = mark.style.display = 'none'; };
    const show = e => {
      if (!have.length) return;
      const r = plot.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width * W;
      const i = have.reduce((best, k) => (Math.abs(X(k) - fx) < Math.abs(X(best) - fx) ? k : best), have[0]);
      tip.textContent = pts[i].name + ' · ' + Math.round(pts[i].value) + '%';
      tip.style.display = rule.style.display = mark.style.display = 'block';
      rule.style.left = X(i) / W * 100 + '%'; place(mark, i);
      tip.style.left = Math.min(Math.max(X(i) / W * 100, 18), 82) + '%';
    };
    plot.appendChild(rule); plot.appendChild(mark); plot.appendChild(tip); hide();
    plot.addEventListener('pointerdown', show); plot.addEventListener('pointermove', show);
    plot.addEventListener('pointerleave', hide); plot.addEventListener('pointercancel', hide);

    const yAxis = h('div', { class: 'y-axis' }, [100, 50, 0].map(v => h('span', { text: v + '%', style: { top: Y(v) / HT * 100 + '%' } })));
    const xAxis = h('div', { class: 'x-axis' + (p.mode === 'year' ? ' slant' : '') }, p.labels.map(l => h('span', { text: l.text, style: { left: X(l.at) / W * 100 + '%' } })));
    return h('div', { class: 'chart', role: 'img', 'aria-label': 'Line graph of the percentage of habits done, ' + p.title }, [h('div', { class: 'chart-main' }, [yAxis, plot]), xAxis]);
  }

  // "Per habit": % of days done (daily habits) or "4 of 5 wks" (weekly habits) in the period.
  function perHabit(p) {
    const today = D.today();
    return H.shown().map(hb => {
      let text = '–', frac = 0;
      if (H.isWeekly(hb)) {
        let weeks = 0, met = 0;
        for (let m = D.monday(p.start); m <= p.end; m = D.addDays(m, 7)) {
          if (m > today || D.addDays(m, 6) < hb.created) continue;
          weeks++; if (H.weekCount(hb, m) >= hb.freq.times) met++;
        }
        if (weeks) { text = met + ' of ' + weeks + ' wks'; frac = met / weeks; }
      } else {
        const from = hb.created > p.start ? hb.created : p.start, to = today < p.end ? today : p.end;
        if (from <= to) { const days = daysBetween(from, to); frac = days.filter(d => H.isDone(hb, d)).length / days.length; text = Math.round(frac * 100) + '%'; }
      }
      return h('div', { class: 'ph-row' }, [
        h('span', { class: 'habit-ic', style: { background: hb.color, color: Pz.glyphOn(hb.color), width: '32px', height: '32px' } }, [Pz.icon(hb.icon, 18)]),
        h('div', { class: 'main' }, [
          h('div', { class: 'ph-top' }, [h('span', { text: hb.title }), h('span', { text: text })]),
          h('div', { class: 'ph-bar' }, [h('i', { style: { width: frac * 100 + '%', background: hb.color } })])
        ])
      ]);
    });
  }

  function open() {
    let mode = 'month', cursor = D.today();
    const box = h('div');
    function render() {
      const p = period(mode, cursor), before = period(mode, p.prev).average;
      box.innerHTML = '';
      const next = ui.roundBtn('chevR', 'Next', () => { cursor = p.next; render(); }, 'small');
      next.disabled = p.hasToday || p.start > D.today();        // nothing to see in the future
      let compare = null;
      if (p.average != null && before != null) {
        const diff = Math.round(p.average) - Math.round(before);
        compare = h('div', { class: 'compare' + (diff < 0 ? ' down' : '') }, [h('span', { text: (diff > 0 ? '+' : diff < 0 ? '−' : '') + Math.abs(diff) + '% on ' + p.versus })]);
      }
      box.appendChild(h('div', { class: 'card graph-card' }, [
        h('div', { class: 'graph-nav' }, [ui.roundBtn('chevL', 'Previous', () => { cursor = p.prev; render(); }, 'small'), h('span', { text: p.title }), next]),
        h('div', { class: 'big-num', text: p.average == null ? '–' : Math.round(p.average) + '%' }),
        h('div', { class: 'big-sub', text: p.average == null ? 'No habit history in this period' : 'of habits done on average' }),
        compare,
        chart(p)
      ]));
      const rows = perHabit(p);
      if (rows.length) {
        box.appendChild(h('div', { class: 'sec-head', style: { marginTop: '24px' } }, [h('h2', { text: 'Per habit' })]));
        box.appendChild(h('div', { class: 'card', style: { padding: '6px 14px' } }, rows));
      }
      box.appendChild(h('p', { class: 'footnote', text: 'Weekly habits (like Gym, 3× a week) count once a week, on Sunday, when the week (Mon–Sun) closes.' }));
    }
    const stop = Pz.app.listen(render);
    Pz.nav.push(h('div', { class: 'screen-scroll' }, [
      h('div', { class: 'screen-top' }, [ui.backLink('Habits', Pz.nav.pop)]),
      h('h1', { class: 'big-title', style: { marginBottom: '16px' }, text: 'Progress' }),
      ui.segmented([{ value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }, { value: 'year', label: 'Year' }], mode, v => { mode = v; render(); }),
      h('div', { style: { height: '16px' } }), box
    ]), stop);
    render();
  }

  Pz.progress = { open: open, period: period };
})();
