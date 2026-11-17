// nav.js – moving around the app: the four tabs (tap or swipe), the floating
// tab bar, and full screens that slide in from the right (like Settings).

(function () {
  const ui = Pz.ui, h = ui.h;
  const tabs = [
    { id: 'today', label: 'Today', icon: 'today' },
    { id: 'habits', label: 'Habits', icon: 'habits' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar' },
    { id: 'lists', label: 'Lists', icon: 'lists' }
  ];
  const pages = {};
  const screens = [];
  let index = 0, track, bar;

  // Swiping between tabs is switched off while something is open on top.
  const blocked = () => ui.modalOpen() || screens.length > 0 || (Pz.calendar && Pz.calendar.panelOpen());

  function place(animate, dx) {
    const still = Pz.fx.reduced();           // iPhone "Reduce Motion": no slide, a quick fade instead
    track.style.transition = animate && !still ? 'transform .28s cubic-bezier(.3,.7,.3,1)' : 'none';
    track.style.transform = 'translateX(calc(' + (-index * 100) + '% + ' + (still ? 0 : dx || 0) + 'px))';
    if (animate && still && track.animate) track.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
    Array.from(bar.children).forEach((b, i) => b.classList.toggle('on', i === index));
  }

  function go(id, animate) {
    const i = tabs.findIndex(t => t.id === id);
    if (i < 0) return;
    if (Pz.calendar && id !== 'calendar') Pz.calendar.closePanel();
    const arriving = i !== index;
    index = i;
    place(animate !== false);
    if (arriving && id === 'calendar' && Pz.calendar) Pz.calendar.shown();     // month lines grow in again
  }

  function init() {
    track = document.getElementById('tabs-track');
    bar = document.getElementById('tabbar');
    tabs.forEach(t => {
      pages[t.id] = h('section', { class: 'tab-page', 'data-tab': t.id });
      track.appendChild(pages[t.id]);
      bar.appendChild(h('button', { type: 'button', class: 'tab', onclick: () => go(t.id) }, [Pz.icon(t.icon, 22), h('span', { text: t.label })]));
    });

    ui.hdrag(document.getElementById('tabs-viewport'), {
      accept: (dx, target) => {
        if (blocked()) return false;
        if (target.closest('input, textarea, select, [data-noswipe]')) return false;
        // On a swipe-to-delete row, a LEFT swipe belongs to the row; a right swipe can still change tab.
        const row = target.closest('[data-swiperow]');
        if (row) return dx > 0 && !row.pzIsOpen();
        return true;
      },
      move: dx => {
        const atEdge = (index === 0 && dx > 0) || (index === tabs.length - 1 && dx < 0);
        place(false, atEdge ? dx * 0.25 : dx);   // at the first/last tab it only stretches a little
      },
      end: (dx, speed) => {
        let next = index;
        if (dx < -70 || (dx < -20 && speed < -0.4)) next = Math.min(tabs.length - 1, index + 1);
        if (dx > 70 || (dx > 20 && speed > 0.4)) next = Math.max(0, index - 1);
        go(tabs[next].id);
      }
    });
    place(false);
  }

  // Slide a full screen in from the right. onPop runs when it is closed.
  function push(content, onPop) {
    const s = h('div', { class: 'screen' }, [content]);
    s.pzOnPop = onPop;
    document.getElementById('screens').appendChild(s);
    screens.push(s);
    Pz.ui.nextFrame(() => s.classList.add('open'));
  }
  function pop() {
    const s = screens.pop();
    if (!s) return;
    s.classList.remove('open');
    setTimeout(() => s.remove(), 320);
    if (s.pzOnPop) s.pzOnPop();
  }

  Pz.nav = { init: init, go: go, push: push, pop: pop, page: id => pages[id], current: () => tabs[index].id };
})();
