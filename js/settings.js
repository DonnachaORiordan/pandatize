// settings.js – the Settings screen (opened from the gear button on Today):
// Categories, the Sounds switch, Archived habits, Export backup and Import backup.

(function () {
  const ui = Pz.ui, h = ui.h, S = Pz.storage;
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);

  function open() {
    const row = (icon, label, end, onClick) => h(onClick ? 'button' : 'div', { type: onClick ? 'button' : null, class: 'row', onclick: onClick }, [
      h('span', { class: 'row-icon' }, [Pz.icon(icon, 20)]), h('span', { class: 'row-grow', text: label }), end
    ]);
    const chev = () => h('span', { class: 'row-icon' }, [Pz.icon('chevR', 16)]);
    const box = h('div');
    // Drawn again after an import, so the Sounds switch shows the imported setting
    const draw = () => {
      box.innerHTML = '';
      box.appendChild(h('div', { class: 'group' }, [row('tag', 'Categories', chev(), Pz.categories.openScreen)]));
      box.appendChild(h('div', { class: 'group' }, [
        row('speaker', 'Sounds', ui.toggle(Pz.data.settings.sounds, on => {
          Pz.data.settings.sounds = on; Pz.storage.save();
          if (on) Pz.sounds.tick();                      // a little sample so you hear it's on
        })),
        row('archive', 'Archived habits', chev(), () => Pz.habitsView.openArchived())
      ]));
      box.appendChild(h('div', { class: 'group' }, [
        row('upload', 'Export backup', null, exportBackup),
        row('download', 'Import backup', null, importBackup)
      ]));
    };
    const stop = Pz.app.listen(draw);
    Pz.nav.push(h('div', { class: 'screen-scroll' }, [
      h('div', { class: 'screen-top' }, [ui.backLink('Today', Pz.nav.pop)]),
      h('h1', { class: 'big-title', text: 'Settings', style: { marginBottom: '20px' } }),
      box,
      h('div', { class: 'version', text: Pz.config.appName + ' ' + Pz.config.version })
    ]), stop);
    draw();
  }

  // ---------- Export ----------
  // On the iPhone: the share menu (choose "Save to Files" › iCloud Drive). On the laptop: a download.
  function exportBackup() {
    const text = S.exportText(), name = S.backupName();
    const done = () => { S.markExported(); ui.toast('Backup saved'); };
    const phone = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    const file = type => new File([text], name, { type: type });
    const canShare = f => phone && navigator.canShare && navigator.share && navigator.canShare({ files: [f] });
    let f = file('application/json');
    if (!canShare(f)) f = file('text/plain');                 // some phones only share "plain text" files
    if (canShare(f)) {
      navigator.share({ files: [f] }).then(done).catch(err => {
        if (err && err.name === 'AbortError') return;        // you closed the share menu: nothing saved
        download(text, name); done();
      });
    } else { download(text, name); done(); }
  }
  function download(text, name) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = h('a', { href: url, download: name, style: { display: 'none' } });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // ---------- Import ----------
  function importBackup() {
    const input = h('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' } });
    input.addEventListener('change', () => {
      const f = input.files && input.files[0];
      input.remove();
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => handle(String(reader.result || ''));
      reader.onerror = () => ui.message('Couldn’t open that file', 'Try picking it again.');
      reader.readAsText(f);
    });
    document.body.appendChild(input);
    input.click();
  }

  function handle(text) {
    const r = S.readBackup(text);
    if (r.error) { ui.message('Can’t import this file', r.error); return; }
    const d = r.data;
    const entries = d.lists.reduce((n, l) => n + l.entries.length, 0);
    const summary = [plural(d.habits.length, 'habit', 'habits'), plural(d.items.length, 'calendar item', 'calendar items'),
      plural(d.todos.length, 'to-do', 'to-dos'), plural(d.lists.length, 'list', 'lists') + ' (' + plural(entries, 'entry', 'entries') + ')'].join(' · ');
    const made = r.exportedAt ? 'Backup from ' + Pz.dates.short(r.exportedAt.slice(0, 10)) + ': ' : 'Backup: ';
    ui.actions({ title: 'Import backup', message: made + summary, buttons: [
      { label: 'Add what’s missing', value: 'merge' },
      { label: 'Replace everything', value: 'replace', danger: true }
    ] }).then(choice => {
      if (!choice) return;
      let undo, msg;
      if (choice === 'replace') { undo = S.replaceWith(d); msg = 'Everything replaced from the backup'; }
      else { const m = S.mergeIn(d); undo = m.undo; msg = m.added ? 'Added ' + plural(m.added, 'thing', 'things') + ' from the backup' : 'Nothing was missing'; }
      Pz.habits.rememberBests();
      Pz.app.changed();
      ui.toast(msg, 'Undo', () => { undo(); Pz.app.changed(); });
    });
  }

  Pz.settings = { open: open };
})();
