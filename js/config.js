// config.js – the app's name and other fixed facts, in ONE place.
// To rename the app, change appName here and nowhere else.

window.Pz = window.Pz || {};   // "Pz" is the one shared box all our files put their tools into

Pz.config = {
  appName: 'Pandatize',
  version: '0.6.3',
  buildStep: 6,
  storageKey: 'pandatize-data',   // the label our data is saved under on the device
  dataVersion: 4,                 // raise this (and write a converter in storage.js) if the data format changes

  // The 12-colour palette (DESIGN.md section 4)
  palette: [
    { name: 'Red', hex: '#FF453A' }, { name: 'Orange', hex: '#FF9F0A' }, { name: 'Yellow', hex: '#FFD60A' },
    { name: 'Lime', hex: '#A8E10C' }, { name: 'Green', hex: '#30D158' }, { name: 'Teal', hex: '#2DD4BF' },
    { name: 'Sky', hex: '#3BC9F5' }, { name: 'Blue', hex: '#0A84FF' }, { name: 'Indigo', hex: '#5E5CE6' },
    { name: 'Purple', hex: '#BF5AF2' }, { name: 'Pink', hex: '#FF4FA3' }, { name: 'Sand', hex: '#C8A27A' }
  ]
};

(function () {
  const DARK = '#0B0B0F';
  const byHex = hex => Pz.config.palette.find(p => p.hex.toLowerCase() === String(hex).toLowerCase());
  // For a custom colour: is it light enough to need dark text?
  const isLight = hex => {
    const n = parseInt(String(hex).replace('#', ''), 16);
    return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) > 140;
  };
  // Text on a colour fill: near-black, except white on Indigo.
  Pz.textOn = hex => {
    const p = byHex(hex);
    if (p) return p.name === 'Indigo' ? '#FFFFFF' : DARK;
    return isLight(hex) ? DARK : '#FFFFFF';
  };
  // Icon on a colour fill: dark on the lighter colours, white on the others.
  Pz.glyphOn = hex => {
    const p = byHex(hex);
    if (p) return ['Orange', 'Yellow', 'Lime', 'Green', 'Teal', 'Sky', 'Sand'].includes(p.name) ? DARK : '#FFFFFF';
    return isLight(hex) ? DARK : '#FFFFFF';
  };
})();
