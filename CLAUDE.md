# CLAUDE.md – standing instructions for Pandatize

## About me
- I'm a beginner learning to code. I study management science and information systems. Explain things in plain language with everyday analogies, and explain any new term the first time it comes up.
- You write the code. After each change, explain what you did section by section in plain language.
- If something breaks, fix it first, then explain why it happened.
- Don't quiz me.

## My setup
- Windows laptop (PowerShell), iPhone. My Windows username contains an apostrophe: in PowerShell use $env:USERPROFILE instead of typing my user folder path.
- This project folder: claude-computers_and_coding\pandatize
- Not installed: Node.js, Python. Don't install anything without asking me first.

## The project
- Pandatize: my habit tracker + calendar + lists app, built as an iPhone progressive web app.
- **SPEC.md** = what to build and the build steps (we are on VERSION 1, build steps in section 10).
- **DESIGN.md** = exactly how everything looks and moves. Follow it exactly; don't redesign anything.
- **logo.png** = my app logo. Use it as it is; never redraw it.

## How we work
- Do ONE build step (or part of a step) at a time, and nothing beyond what I ask.
- Before writing anything, briefly tell me in plain language what you'll add or change and why.
- When a step is finished, tell me exactly how to check it (what to open, what to tap, what I should see).
- Only tick a build step in SPEC.md after I confirm it works.
- Small looks-only tweaks I ask for between steps: do them, and record them in DESIGN.md or SPEC.md so later steps don't undo them.
- If I change my mind about how something works, update SPEC.md/DESIGN.md first, then the code.
- Before downloading any library, sound or image: tell me its name, source and licence, and wait for my OK. List everything outside in CREDITS.md.

## Code rules
- Plain HTML, CSS and JavaScript. No frameworks, no build tools.
- Must work by double-clicking index.html (except offline/home-screen features, which only work on the live https:// site).
- App name only in js/config.js. All saving/loading only in js/storage.js. Keep dataVersion up to date and write a converter whenever the data format changes.
- Whenever any app file changes after the service worker exists, increase the service worker's version number.
- Links must work from a GitHub Pages subfolder (https://[username].github.io/pandatize/): no links starting with "/". File names: lower case, no spaces (GitHub Pages is case-sensitive).
- Never put personal data, backups, passwords or keys in the repo (it's public).
- Keep files organised in folders (css/, js/, icons/, sounds/) and explain why when you create them.
- Use git only if I ask; I usually commit and push myself.
