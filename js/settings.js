// settings.js – the Settings screen (opened from the gear button on Today).
// This is the "shell": Categories and the Sounds switch work now; the other rows
// are in place and say which build step brings them.

(function () {
  const ui = Pz.ui, h = ui.h;

  function open() {
    const row = (icon, label, end, onClick) => h(onClick ? 'button' : 'div', { type: onClick ? 'button' : null, class: 'row', onclick: onClick }, [
      h('span', { class: 'row-icon' }, [Pz.icon(icon, 20)]), h('span', { class: 'row-grow', text: label }), end
    ]);
    const chev = () => h('span', { class: 'row-icon' }, [Pz.icon('chevR', 16)]);
    const later = (what, step) => () => ui.toast(what + ' arrives in build step ' + step);

    Pz.nav.push(h('div', { class: 'screen-scroll' }, [
      h('div', { class: 'screen-top' }, [ui.backLink('Today', Pz.nav.pop)]),
      h('h1', { class: 'big-title', text: 'Settings', style: { marginBottom: '20px' } }),
      h('div', { class: 'group' }, [row('tag', 'Categories', chev(), Pz.categories.openScreen)]),
      h('div', { class: 'group' }, [
        row('speaker', 'Sounds', ui.toggle(Pz.data.settings.sounds, on => { Pz.data.settings.sounds = on; Pz.storage.save(); })),
        row('archive', 'Archived habits', chev(), later('Archived habits', 4))
      ]),
      h('div', { class: 'group' }, [
        row('upload', 'Export backup', null, later('Export', 5)),
        row('download', 'Import backup', null, later('Import', 5))
      ]),
      h('div', { class: 'version', text: Pz.config.appName + ' ' + Pz.config.version })
    ]));
  }

  Pz.settings = { open: open };
})();
