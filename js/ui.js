// ui.js – small reusable building blocks: making elements, sheets, action sheets,
// toasts, toggles, segmented switches, and the sideways-drag detector used for
// swiping between tabs and swipe-to-delete.

(function () {
  const ui = {};
  // Start a slide/fade: make the browser notice where the element is now, then let it move.
  ui.nextFrame = fn => { void document.body.offsetWidth; fn(); };
  let modals = 0;                      // how many sheets/action sheets are open right now
  ui.modalOpen = () => modals > 0;

  // h('div', { class: 'card', text: 'Hi', onclick: fn }, [children]) builds one element.
  function h(tag, attrs, kids) {
    const el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(k => {
      const v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'value') el.value = v;
      else if (k === 'style') Object.keys(v).forEach(s => { if (s.indexOf('--') === 0) el.style.setProperty(s, v[s]); else el.style[s] = v[s]; });
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    add(el, kids);
    return el;
  }
  function add(el, kids) {
    if (kids == null || kids === false) return;
    if (Array.isArray(kids)) kids.forEach(k => add(el, k));
    else el.appendChild(typeof kids === 'string' ? document.createTextNode(kids) : kids);
  }
  ui.h = h;

  const mount = (rootId, el) => {
    document.getElementById(rootId).appendChild(el);
    Pz.ui.nextFrame(() => el.classList.add('open'));
  };

  // ---- Small controls ----
  ui.roundBtn = (icon, label, onClick, extra) =>
    h('button', { type: 'button', class: 'round-btn ' + (extra || ''), 'aria-label': label, onclick: onClick }, [Pz.icon(icon, extra && extra.indexOf('small') >= 0 ? 18 : 20)]);

  ui.backLink = (label, onClick) =>
    h('button', { type: 'button', class: 'back-link', onclick: onClick }, [Pz.icon('chevL', 20), h('span', { text: label })]);

  ui.toggle = (on, onChange) => {
    const b = h('button', { type: 'button', class: 'toggle' + (on ? ' on' : ''), role: 'switch', 'aria-checked': String(!!on) }, [h('i')]);
    b.addEventListener('click', () => { on = !on; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); onChange(on); });
    return b;
  };

  ui.segmented = (options, value, onChange) => {
    const el = h('div', { class: 'seg' });
    const set = v => { value = v; Array.from(el.children).forEach(b => b.classList.toggle('on', b.dataset.v === String(v))); };
    options.forEach(o => el.appendChild(h('button', {
      type: 'button', 'data-v': String(o.value), text: o.label,
      onclick: () => { if (String(value) === String(o.value)) return; set(o.value); onChange(o.value); }
    })));
    set(value);
    return el;
  };

  // A normal drop-down (on iPhone it opens the usual picker wheel)
  ui.select = (options, value, onChange) => {
    const s = h('select', { class: 'pz-select' });
    if (!options.some(o => String(o.value) === String(value))) options = options.concat([{ value: value, label: String(value) }]);
    options.forEach(o => s.appendChild(h('option', { value: String(o.value), text: o.label })));
    s.value = String(value);
    s.addEventListener('change', () => onChange(s.value));
    return s;
  };

  ui.stepper = (value, min, max, onChange) => {
    const num = h('span', { text: String(value) });
    const step = d => { const v = Math.min(max, Math.max(min, value + d)); if (v !== value) { value = v; num.textContent = String(v); onChange(v); } };
    return h('span', { class: 'stepper' }, [
      h('button', { type: 'button', text: '−', 'aria-label': 'Less', onclick: () => step(-1) }), num,
      h('button', { type: 'button', text: '+', 'aria-label': 'More', onclick: () => step(1) })
    ]);
  };

  ui.row = (label, control, cls) => h('div', { class: 'row ' + (cls || '') }, [
    typeof label === 'string' ? h('span', { class: 'row-label', text: label }) : label,
    h('span', { class: 'row-end' }, control)
  ]);

  // ---- Toast: a small message that pops up for a few seconds ----
  ui.toast = (message, actionLabel, onAction) => {
    const root = document.getElementById('toasts');
    Array.from(root.children).forEach(c => c.remove());
    const t = h('div', { class: 'toast' }, [h('span', { text: message })]);
    const hide = () => { t.classList.remove('show'); setTimeout(() => t.remove(), 250); };
    if (actionLabel) t.appendChild(h('button', { type: 'button', text: actionLabel, onclick: () => { hide(); onAction(); } }));
    root.appendChild(t);
    Pz.ui.nextFrame(() => t.classList.add('show'));
    setTimeout(hide, actionLabel ? 5500 : 2800);
  };

  // ---- Sheet: slides up from the bottom with Cancel / Title / Save ----
  ui.sheet = opts => {
    const wrap = h('div', { class: 'sheet-wrap' });
    let closed = false;
    const close = () => {
      if (closed) return; closed = true; modals--;
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      wrap.classList.remove('open');
      setTimeout(() => wrap.remove(), 340);
    };
    wrap.appendChild(h('div', { class: 'backdrop' }));
    wrap.appendChild(h('div', { class: 'sheet' }, [
      h('div', { class: 'grabber' }),
      h('div', { class: 'sheet-head' }, [
        h('button', { type: 'button', class: 'link', text: 'Cancel', onclick: close }),
        h('div', { class: 'sheet-title', text: opts.title }),
        h('button', { type: 'button', class: 'link', text: opts.saveLabel || 'Save', onclick: () => opts.onSave(close) })
      ]),
      h('div', { class: 'sheet-scroll' }, [opts.body])
    ]));
    modals++;
    mount('sheets', wrap);
    return { close: close, el: wrap };
  };

  // ---- Action sheet: a question with a few buttons. Gives back the chosen value (or undefined). ----
  // buttons: [{ label, value, danger, color, checked }]
  ui.actions = opts => new Promise(resolve => {
    const wrap = h('div', { class: 'sheet-wrap' + (opts.left ? ' as-left' : '') });
    let closed = false;
    const close = v => {
      if (closed) return; closed = true; modals--;
      wrap.classList.remove('open');
      setTimeout(() => wrap.remove(), 300);
      resolve(v);
    };
    const group = h('div', { class: 'as-group' });
    if (opts.title || opts.message) group.appendChild(h('div', { class: 'as-head' }, [
      opts.title && h('div', { class: 'as-title', text: opts.title }),
      opts.message && h('div', { class: 'as-msg', text: opts.message })
    ]));
    opts.buttons.forEach(b => group.appendChild(h('button', { type: 'button', class: 'as-btn' + (b.danger ? ' danger' : ''), onclick: () => close(b.value) }, [
      b.color && h('span', { class: 'sq sm', style: { background: b.color } }),
      h('span', { text: b.label }),
      b.checked && Pz.icon('check', 18)
    ])));
    wrap.appendChild(h('div', { class: 'backdrop', onclick: () => close(undefined) }));
    wrap.appendChild(h('div', { class: 'as-box' }, [group, h('button', { type: 'button', class: 'as-btn as-cancel', text: 'Cancel', onclick: () => close(undefined) })]));
    modals++;
    mount('sheets', wrap);
  });

  // ---- Panel: a shorter slide-up box with a title and a list (e.g. Reminders). Tap outside to close. ----
  ui.panel = (title, actionLabel, onAction, onClose) => {
    const wrap = h('div', { class: 'sheet-wrap' });
    let closed = false;
    const close = () => {
      if (closed) return; closed = true; modals--;
      wrap.classList.remove('open');
      setTimeout(() => wrap.remove(), 340);
      if (onClose) onClose();
    };
    const body = h('div', { class: 'panel-list' });
    wrap.appendChild(h('div', { class: 'backdrop', onclick: close }));
    wrap.appendChild(h('div', { class: 'sheet auto' }, [
      h('div', { class: 'grabber', onclick: close }),
      h('div', { class: 'panel-head', style: { alignItems: 'center', paddingTop: '8px' } }, [
        h('div', { class: 'panel-title', style: { flex: '1' }, text: title }),
        actionLabel && h('button', { type: 'button', class: 'link', style: { minHeight: '36px' }, text: actionLabel, onclick: onAction })
      ]),
      body
    ]));
    modals++;
    mount('sheets', wrap);
    return { body: body, close: close };
  };

  // ---- Press and hold, then drag, to reorder ----
  // Children of "container" marked data-reorder can be picked up after a short hold and dragged
  // up or down. onMove(from, to) is told the old and new position. canStart() can refuse.
  ui.reorder = (container, onMove, canStart) => {
    let timer = null, pid = null, item = null, active = false, sx = 0, sy = 0, items = [], rects = [], from = 0, to = 0, gap = 0;
    const begin = () => {
      timer = null; active = true; ui.reordering = true;
      items = Array.from(container.children).filter(c => c.hasAttribute('data-reorder'));
      rects = items.map(c => c.getBoundingClientRect());
      from = to = items.indexOf(item);
      gap = rects.length > 1 ? Math.max(0, rects[1].top - rects[0].bottom) : 0;
      item.classList.add('dragging');
      try { container.setPointerCapture(pid); } catch (err) { /* fine */ }
    };
    container.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (canStart && !canStart()) return;
      const it = e.target.closest('[data-reorder]');
      if (!it || it.parentNode !== container || e.target.closest('input, textarea')) return;
      item = it; pid = e.pointerId; sx = e.clientX; sy = e.clientY;
      clearTimeout(timer); timer = setTimeout(begin, 380);
    });
    container.addEventListener('pointermove', e => {
      if (e.pointerId !== pid) return;
      if (!active) {         // moved before the hold finished: it's a scroll or a swipe, not a reorder
        if (timer && (Math.abs(e.clientX - sx) > 8 || Math.abs(e.clientY - sy) > 8)) { clearTimeout(timer); timer = null; pid = null; }
        return;
      }
      const dy = e.clientY - sy, size = rects[from].height + gap;
      const mid = rects[from].top + rects[from].height / 2 + dy;
      item.style.transform = 'translateY(' + dy + 'px) scale(1.02)';
      to = from;
      items.forEach((c, i) => {      // the others slide out of the way
        if (i === from) return;
        const cm = rects[i].top + rects[i].height / 2;
        let shift = 0;
        if (i > from && mid > cm) { shift = -size; to++; }
        if (i < from && mid < cm) { shift = size; to--; }
        c.style.transition = 'transform .18s ease';
        c.style.transform = shift ? 'translateY(' + shift + 'px)' : '';
      });
    });
    const finish = e => {
      if (e.pointerId !== pid) return;
      clearTimeout(timer); timer = null; pid = null;
      if (!active) return;
      active = false; ui.reordering = false;
      items.forEach(c => { c.style.transition = ''; c.style.transform = ''; });
      item.classList.remove('dragging');
      const eat = ev => { ev.stopPropagation(); ev.preventDefault(); };       // letting go isn't a tap
      container.addEventListener('click', eat, true);
      setTimeout(() => container.removeEventListener('click', eat, true), 320);
      if (to !== from) onMove(from, to);
    };
    container.addEventListener('pointerup', finish);
    container.addEventListener('pointercancel', finish);
    // While dragging, stop the page from scrolling under the finger
    container.addEventListener('touchmove', e => { if (active) e.preventDefault(); }, { passive: false });
    container.addEventListener('contextmenu', e => { if (active || timer) e.preventDefault(); });
  };

  // Move one thing in a list from position "from" to position "to".
  ui.moveIn = (arr, from, to) => { arr.splice(to, 0, arr.splice(from, 1)[0]); return arr; };

  // Let a sideways-scrolling strip also be dragged with the mouse (fingers already can).
  ui.dragScroll = el => {
    let x = null, start = 0, moved = false;
    el.setAttribute('data-noswipe', '');
    el.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') { x = e.clientX; start = el.scrollLeft; moved = false; } });
    el.addEventListener('pointermove', e => {
      if (x == null) return;
      if (!moved && Math.abs(e.clientX - x) > 5) { moved = true; try { el.setPointerCapture(e.pointerId); } catch (err) { /* fine */ } }
      if (moved) el.scrollLeft = start - (e.clientX - x);
    });
    const end = () => {
      if (x == null) return; x = null;
      if (!moved) return;
      const eat = ev => { ev.stopPropagation(); ev.preventDefault(); };
      el.addEventListener('click', eat, true);
      setTimeout(() => el.removeEventListener('click', eat, true), 320);
    };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  };

  // "5 min ago", "2 h ago", "yesterday"…  (from a saved time stamp)
  ui.ago = iso => {
    const then = new Date(iso), mins = Math.round((Date.now() - then) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + ' min ago';
    const days = Pz.dates.diffDays(Pz.dates.ymd(then), Pz.dates.today());
    if (days === 0) return Math.round(mins / 60) + ' h ago';
    if (days === 1) return 'yesterday';
    if (days < 7) return days + ' days ago';
    return Pz.dates.short(Pz.dates.ymd(then));
  };

  // ---- Sideways-drag detector ----
  // Watches a finger (or mouse) and, once it's clearly moving sideways, reports the drag.
  // o.accept(dx, startTarget) can refuse; o.move(dx); o.end(dx, speed).
  ui.hdrag = (el, o) => {
    let id = null, sx = 0, sy = 0, decided = false, active = false, lastX = 0, lastT = 0, vx = 0, target = null;
    el.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      id = e.pointerId; sx = e.clientX; sy = e.clientY; decided = false; active = false;
      lastX = sx; lastT = e.timeStamp; vx = 0; target = e.target;
    });
    el.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return;
      if (ui.reordering) { id = null; return; }        // a press-and-hold reorder is going on: not a swipe
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!decided) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        decided = true;
        if (Math.abs(dx) > Math.abs(dy) * 1.2 && (!o.accept || o.accept(dx, target))) {
          active = true;
          try { el.setPointerCapture(id); } catch (err) { /* fine */ }
        } else { id = null; return; }
      }
      if (active) {
        const dt = Math.max(1, e.timeStamp - lastT);
        vx = (e.clientX - lastX) / dt; lastX = e.clientX; lastT = e.timeStamp;
        o.move(dx);
      }
    });
    const finish = e => {
      if (e.pointerId !== id) return;
      id = null;
      if (!active) return;
      active = false;
      // The finger lifting would also count as a tap: swallow that one tap.
      const eat = ev => { ev.stopPropagation(); ev.preventDefault(); };
      el.addEventListener('click', eat, true);
      setTimeout(() => el.removeEventListener('click', eat, true), 320);
      o.end(e.clientX - sx, vx);
    };
    el.addEventListener('pointerup', finish);
    el.addEventListener('pointercancel', finish);
  };

  // ---- Swipe left to delete ----
  // Wraps a row. A short swipe shows a red Delete button; a long swipe deletes straight away.
  ui.swipeRow = (content, onDelete, label) => {
    const W = 84;
    let open = false;
    const del = h('button', { type: 'button', class: 'swipe-del' }, [Pz.icon(label ? 'x' : 'trash', 18), h('span', { text: label || 'Delete' })]);
    content.classList.add('swipe-content');
    const wrap = h('div', { class: 'swipe-row', 'data-swiperow': '' }, [del, content]);
    const set = (x, anim) => {
      content.style.transition = anim ? 'transform .22s ease' : 'none';
      del.style.transition = anim ? 'width .22s ease' : 'none';
      content.style.transform = x ? 'translateX(' + x + 'px)' : '';
      del.style.width = Math.max(W, -x) + 'px';
      del.style.visibility = x < 0 ? 'visible' : 'hidden';
    };
    const doDelete = () => {
      wrap.style.transition = 'opacity .2s ease'; wrap.style.opacity = '0';   // gentle fade
      setTimeout(onDelete, 200);
    };
    ui.hdrag(wrap, {
      accept: dx => dx < 0 || open,
      move: dx => { set(Math.min(0, (open ? -W : 0) + dx), false); },
      end: dx => {
        const x = Math.min(0, (open ? -W : 0) + dx);
        if (-x > wrap.offsetWidth * 0.6) { set(-wrap.offsetWidth, true); doDelete(); }
        else if (-x > W / 2) { open = true; set(-W, true); }
        else { open = false; set(0, true); setTimeout(() => { if (!open) del.style.visibility = 'hidden'; }, 230); }
      }
    });
    del.addEventListener('click', e => { e.stopPropagation(); doDelete(); });
    // While Delete is showing, a tap on the row just closes it again.
    content.addEventListener('click', e => { if (open) { e.stopPropagation(); e.preventDefault(); open = false; set(0, true); } }, true);
    wrap.pzIsOpen = () => open;
    return wrap;
  };

  Pz.ui = ui;
})();
