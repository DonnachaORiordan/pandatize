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
- **The app is complete:** all 6 build steps are done (19 Nov 2026) and it's live on GitHub Pages. From now on, work is fixes and small changes I ask for. Section 13 of SPEC.md (final checks) hasn't been fully tested yet, so if something seems broken, check there first.
- **SPEC.md** = the whole app, planned in full, and the 6 build steps (section 12).
- **DESIGN.md** = exactly how everything looks and moves. Follow it exactly; don't redesign anything.
- **logo.png** = my app logo. Use it as it is; never redraw it.

## How we work
- Do ONE build step at a time, and nothing beyond it. The steps are big on purpose: I want to move fast. Split a step into a few sensible parts yourself, finish each part fully, and keep going through the step without waiting for me unless you need a decision or a download approved.
- Don't ask me to plan or design anything: SPEC.md and DESIGN.md already decide it. If something really is missing, choose what fits them best, tell me what you chose, and write it into the spec.
- Before starting a step, briefly tell me in plain language what you'll build and in what parts.
- When a step is finished, give me a short checklist to test it (what to open, what to tap, what I should see).
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
