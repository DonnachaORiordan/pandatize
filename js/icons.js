// icons.js – our own simple line icons, drawn as SVG (a picture described in code).
// Stroke width 2 with round ends, as DESIGN.md asks. Pz.icon('flag', 16) makes one.

(function () {
  const paths = {
    today: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
    habits: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16 9.5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    lists: '<path d="M9 6.5h11M9 12h11M9 17.5h11M4 6.5h.01M4 12h.01M4 17.5h.01"/>',
    gear: '<path d="M10.54 4.85L10.64 2.3h2.72l.1 2.55 2.57 1.06 1.87-1.74 1.93 1.93-1.74 1.87 1.06 2.57 2.55.1v2.72l-2.55.1-1.06 2.57 1.74 1.87-1.93 1.93-1.87-1.74-2.57 1.06-.1 2.55h-2.72l-.1-2.55-2.57-1.06-1.87 1.74-1.93-1.93 1.74-1.87-1.06-2.57-2.55-.1v-2.72l2.55-.1 1.06-2.57-1.74-1.87 1.93-1.93 1.87 1.74z"/><circle cx="12" cy="12" r="3"/>',
    chevL: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
    chevR: '<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
    up: '<path d="M6 14.5l6-6 6 6"/>',
    down: '<path d="M6 9.5l6 6 6-6"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5l5 5"/>',
    filter: '<path d="M4 6.5h16M7 12h10M10 17.5h4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    flag: '<path d="M6 21V4M6 4.5h11l-2.2 4 2.2 4H6"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0112 0v5.5l1.5 2h-15zM10 21h4"/>',
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    sparkle: '<path d="M11 3.5l1.9 5.1 5.1 1.9-5.1 1.9L11 17.5l-1.9-5.1L4 10.5l5.1-1.9zM18.5 16.5v4M16.5 18.5h4"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5"/>',
    hourglass: '<path d="M7 3.5h10M7 20.5h10M8 3.5v3l4 5.5 4-5.5v-3M8 20.5v-3l4-5.5 4 5.5v3"/>',
    tag: '<path d="M3.5 12.5v-9h9l8 8-9 9z"/><path d="M8 8h.01"/>',
    speaker: '<path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4zM16 9a4.5 4.5 0 010 6M18.5 6.5a8 8 0 010 11"/>',
    archive: '<path d="M4 5h16v4H4zM5.5 9v10.5h13V9M10 13h4"/>',
    download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>',
    upload: '<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 19.5h14"/>',
    // List icons
    book: '<path d="M5 4.5h10a3 3 0 013 3v12H8a3 3 0 01-3-3zM5 16.5a3 3 0 013-3h10M9 8.5h5"/>',
    cart: '<path d="M3 4.5h2.5l2.2 10h9.8l2-7H7"/><circle cx="9" cy="19" r="1.3"/><circle cx="16.5" cy="19" r="1.3"/>',
    bulb: '<path d="M9.5 17.5h5M10 21h4M9.5 17.5v-1.6c0-.8-.4-1.5-1-2a6 6 0 117 0c-.6.5-1 1.2-1 2v1.6"/>',
    note: '<path d="M6 3.5h8l4 4v13H6zM14 3.5v4h4M9 12h6M9 16h4"/>',
    star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/>',
    home: '<path d="M4 11l8-7 8 7M6 9.5V20h12V9.5M10 20v-5h4v5"/>',
    heart: '<path d="M12 20.5C5 16 3.5 12 3.5 9A4.5 4.5 0 0112 7a4.5 4.5 0 018.5 2c0 3-1.5 7-8.5 11.5z"/>',
    briefcase: '<rect x="3.5" y="7.5" width="17" height="12" rx="2.5"/><path d="M9 7.5V5h6v2.5M3.5 13h17"/>',
    gift: '<rect x="4" y="10" width="16" height="10.5" rx="1.5"/><path d="M3 7h18v3H3zM12 7v13.5M12 7c-1.5-3-5-3.5-5-1.5S9.5 7 12 7zM12 7c1.5-3 5-3.5 5-1.5S14.5 7 12 7z"/>',
    plane: '<path d="M3 11.5l18-7.5-7.5 18-2.5-8zM11 14l10-10"/>',
    music: '<path d="M9 18V5.5l10-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    // Habit icons (book, music and heart are above)
    dumbbell: '<path d="M3 9.5v5M6 7v10M18 7v10M21 9.5v5M6 12h12"/>',
    pawn: '<circle cx="12" cy="6.5" r="3"/><path d="M9.5 9.5h5M10.5 9.5c0 4-2.5 5-3 8h9c-.5-3-3-4-3-8M6.5 20.5h11"/>',
    moon: '<path d="M19.5 14.5A8 8 0 019.5 4.5a8 8 0 1010 10z"/>',
    stretch: '<circle cx="12" cy="4.5" r="2"/><path d="M4.5 7.5l7.5 2 7.5-2M12 9.5v6M12 15.5l-4 5.5M12 15.5l4 5.5"/>',
    drop: '<path d="M12 3.5s6 6.2 6 10.5a6 6 0 01-12 0c0-4.3 6-10.5 6-10.5z"/>',
    pen: '<path d="M4 20l1-4.5L16.5 4a2.1 2.1 0 013 3L8 18.5zM14.5 6l3 3"/>',
    leaf: '<path d="M5 19c0-9 5-14 14.5-14.5C19 14 14 19 5 19zM5 19l7-7"/>',
    coffee: '<path d="M5 9.5h11v5a5 5 0 01-5 5h-1a5 5 0 01-5-5zM16 10.5h1.5a2.5 2.5 0 010 5H16M8 3.5v2.5M12 3.5v2.5"/>',
    code: '<path d="M8.5 7L3.5 12l5 5M15.5 7l5 5-5 5"/>',
    // More habit icons (added 19 Nov 2026)
    piano: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 13v6M12 13v6M16 13v6"/><path d="M6.5 5v8h3V5M14.5 5v8h3V5" fill="currentColor"/>',      // piano keys
    guitar: '<g transform="rotate(40 12 12)"><path d="M12 8.5a3 3 0 00-3 3c0 .8.3 1.4.7 2a4.5 4.5 0 104.6 0c.4-.6.7-1.2.7-2a3 3 0 00-3-3zM12 8.5V2M10.5 2.5h3"/><circle cx="12" cy="16.6" r="1.4"/></g>',
    shower: '<path d="M5 20.5V6a3 3 0 016 0M7.5 10h7a3.5 3.5 0 00-7 0zM8.5 13.5l-.5 1.5M11 13.5V15M13.5 13.5l.5 1.5M8 17.5L7.5 19M11 17.5V19M14 17.5l.5 1.5M19 3v6M16.4 4.5l5.2 3M16.4 7.5l5.2-3"/>',
    language: '<path d="M4 4.5h9a1 1 0 011 1v6a1 1 0 01-1 1H8.5L5 15v-2.5H4a1 1 0 01-1-1v-6a1 1 0 011-1zM6.5 11l2-5 2 5M7.3 9.2h2.4M16 9.5h4a1 1 0 011 1v6a1 1 0 01-1 1h-1V20l-3-2.5h-4a1 1 0 01-1-1V14M14.5 13h4M14.5 15.3h2.5"/>',
    wakeup: '<path d="M3 18.5h18M7 18.5a5 5 0 0110 0M12 3v6.5M9.5 5.5L12 3l2.5 2.5M4.5 13.5l1.5 1M19.5 13.5l-1.5 1M7 21.5h10"/>',
    wsj: '<text x="12" y="15.4" text-anchor="middle" font-size="9.5" font-weight="800" letter-spacing="-.2" font-family="Georgia, \'Times New Roman\', serif" fill="currentColor" stroke="none">WSJ</text>',
    brain: '<path d="M9.5 21v-3H7.5a2 2 0 01-2-2v-2.5l-2-.8 2-3.2A7 7 0 0112.5 3a7 7 0 017 7c0 2.6-1 4.3-2.5 5.5V21"/><path d="M10 8.5a2 2 0 013.3-.8 2 2 0 013.2 1.8 1.8 1.8 0 01-2 2.5H11a1.8 1.8 0 01-1-3.5z"/>',      // a brain inside a head seen from the side (option 8 of 20)
    cooking: '<path d="M2.5 12h13v1a3.5 3.5 0 01-3.5 3.5H6A3.5 3.5 0 012.5 13zM15.5 13h6M6.5 4.5c-.8 1 .8 2 0 3M9.5 3.5c-.8 1 .8 2 0 3M12.5 4.5c-.8 1 .8 2 0 3"/>',      // frying pan with steam
    phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 5h3M11.5 18.5h1"/>',
    apple: '<path d="M12 8c-1.5-1-5.5-1.5-6.8 2.2-1.3 3.7.8 9.8 4.3 10.3.9.1 1.6-.5 2.5-.5s1.6.6 2.5.5c3.5-.5 5.6-6.6 4.3-10.3C17.5 6.5 13.5 7 12 8zM12 8V5.5M12.5 5.5c.3-1.6 1.8-2.6 3.8-2.6-.3 1.8-1.8 2.8-3.8 2.6z"/>',
    appearance: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 010 17z" fill="currentColor"/>',
    flame: '<path d="M12 3c.5 3 4.5 5 4.5 10a4.5 4.5 0 01-9 0c0-1.8.8-3 1.8-4 .2 1.5 1 2.3 1.7 2.5C11 9.5 10.5 6 12 3z" fill="currentColor"/>',
    graph: '<path d="M4 19.5h16M5 15l4-4.5 3.5 3L19 6.5"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 018 0v2.5"/>',
    // Small extras
    dots: '<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>',
    tack: '<g transform="rotate(40 12 12)"><path d="M9 3.5h6l-1 6 3 3.5H7l3-3.5zM12 13v7.5"/></g>',
    tackFill: '<g transform="rotate(40 12 12)"><path d="M9 3.5h6l-1 6 3 3.5H7l3-3.5z" fill="currentColor"/><path d="M12 13v7.5"/></g>',
    flagFill: '<path d="M6 4.5h11l-2.2 4 2.2 4H6z" fill="currentColor"/><path d="M6 21V4"/>'
  };

  Pz.icon = function (name, size) {
    const s = size || 24;
    const box = document.createElement('span');
    box.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (paths[name] || '') + '</svg>';
    return box.firstChild;
  };
})();
