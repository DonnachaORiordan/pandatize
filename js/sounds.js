// sounds.js – the app's three little sounds, made in code with "Web Audio"
// (the browser's built-in synthesiser), so there are no sound files to download.
//   tick()    – a short soft "pop" when a habit or to-do is ticked
//   perfect() – a brighter rising sparkle when the day reaches 100%
//   chime()   – a gentle bell: streak milestones, and back-filling a past day to 100%
// All of them stay silent when Sounds is off in Settings.
// (On iPhone they also follow the silent switch on the side of the phone.)

(function () {
  const S = {};
  let ctx = null;

  // The sound "engine". The iPhone only allows it to start during a tap, which is always
  // when these are called. Gives back null if sounds are off or not possible.
  function engine() {
    if (!Pz.data || !Pz.data.settings.sounds) return null;
    try {
      if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC(); }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { return null; }
    return ctx;
  }

  // One note: a wave of "freq" vibrations a second, starting "at" seconds from now, fading over "len"
  // seconds. "glide" bends the pitch up to that frequency right at the start (makes it a "pop").
  function note(c, freq, at, len, vol, type, glide) {
    const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + Math.min(0.07, len));
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);           // quick, soft start (no click)
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);          // then fades away smoothly
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + len + 0.05);
  }

  S.tick = () => {
    const c = engine(); if (!c) return;
    note(c, 700, 0, 0.13, 0.16, 'sine', 1050);
    note(c, 2100, 0.004, 0.06, 0.025, 'triangle');                 // a tiny bright edge
  };

  // "delay" (seconds) lets the celebration time it to the confetti.
  S.perfect = delay => {
    const c = engine(); if (!c) return;
    const d = delay || 0;
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) => {               // C, E, G, high C: a rising arpeggio
      note(c, f, d + i * 0.075, 0.5, 0.11, 'triangle');
      note(c, f * 2, d + i * 0.075, 0.25, 0.025, 'sine');
    });
    note(c, 2637, d + 0.33, 0.9, 0.04, 'sine');                     // a last shimmer on top
  };

  // A soft bell: a main note plus a quieter, slightly "off" higher note, as real bells have.
  function bell(c, f, at, vol) {
    note(c, f, at, 1.6, vol, 'sine');
    note(c, f * 2.76, at, 0.5, vol * 0.22, 'sine');
    note(c, f * 5.4, at, 0.18, vol * 0.08, 'sine');
  }
  S.chime = big => {
    const c = engine(); if (!c) return;
    if (big) { bell(c, 784, 0, 0.12); bell(c, 1046.5, 0.16, 0.11); bell(c, 1318.5, 0.32, 0.1); }   // milestone: three notes
    else { bell(c, 1046.5, 0, 0.1); bell(c, 1568, 0.12, 0.07); }                                       // back-filled day: two
  };

  Pz.sounds = S;
})();
