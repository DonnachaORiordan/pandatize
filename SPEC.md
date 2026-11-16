# Pandatize – SPEC (what to build, and in what order)

Pandatize is my habit tracker + calendar + to-do lists/notes app for my iPhone (a progressive web app added to my home screen).
- **How it looks:** DESIGN.md (follow it exactly).
- **What it does and the build order:** this file.

## 1. The big plan (versions)
The app is built in versions, so I can use it on my phone early. Each version is added to the SAME app (same repo, same address, same home-screen icon).

| Version | What it adds |
|---|---|
| **1 (this file, sections 2–11)** | Habits + the Today screen (habits part), settings, backup, celebrations, graph. Works offline on my iPhone. |
| 2 (planned later) | Calendar (month/week/day/agenda, events, deadlines, all-day items, categories, repeats, countdowns, auto-tasks, search, filter) + to-dos, Now/next and countdowns on Today. |
| 3 (planned later) | Lists (notes and to-dos, subtasks, priorities, pinned items). |
| 4 (planned later) | Real phone notifications (needs a server) + polish. |

Reminders are **in-app only** until version 4: they show as badges, countdowns and auto-tasks inside the app, not as phone notifications.

## 2. Technology decisions
- Plain HTML, CSS and JavaScript. No frameworks, no build tools, no Node.js. Must work by double-clicking index.html on my laptop (except the offline/home-screen features, which only work on the live site).
- The app name is written in ONE place: js/config.js.
- All saving and loading code is in ONE file: js/storage.js. (So online syncing could be added one day without touching the rest.)
- Data is saved on the device (localStorage) with a `dataVersion` number (version 1 = dataVersion 1). Plan the data shape so calendar items, to-dos and lists can be added in later versions without breaking it.
- Progressive web app: manifest.json, home-screen icons made from logo.png, and a service worker so it works offline. The service worker has a version number that must go up every time any app file changes.
- Hosting: GitHub Pages from a PUBLIC GitHub repo called `pandatize`. Never put personal data, backups, passwords or keys in the repo.
- Any outside library, sound or image: tell me its name, source and licence first and wait for my OK. Relaxed licences only (MIT, BSD, CC0, CC-BY with credit). List everything in CREDITS.md. Prefer drawing things ourselves (SVG) and generating simple sounds in code.
- Respect the iPhone "Reduce Motion" setting (see DESIGN.md section 10).

## 3. Screens in version 1
- **Tab bar** with Today, Habits, Calendar, Lists. Swipe left/right to move between tabs (with a quick slide).
  - Calendar and Lists show a simple, nicely styled "Coming in version 2" / "Coming in version 3" screen for now.
- **Today:** date header, gear button (opens Settings), daily-habits progress bar, compact habit tiles (ticking works here too), "All habits" tile. Celebration when all daily habits are done.
- **Habits:** title with graph and + buttons, progress bar, week strip, habit cards.
- **Add / edit habit sheet.**
- **Progress (habit graph).**
- **Streak milestone screen.**
- **Settings** (from the gear): Sounds on/off, Export backup, Import backup, Archived habits (with Unarchive and Delete), and the app version number. Styled with the same iOS-style grouped rows as the sheets.

## 4. Habits – the rules
- A habit has: title, colour (palette or custom), icon, frequency (**every day** OR **X times per week**, X from 1 to 7), date created, archived yes/no, and its tick history (a list of dates it was done).
- Weeks run **Monday to Sunday**.
- **Ticking:** tap the tick box to mark done; tap again to un-tick. I can tick for today, any past day, or a future day, by picking the day in the week strip on Habits (‹ › arrows or swiping the strip goes to other weeks). Today's tiles on the Today screen always tick for today.
- Days before a habit was created never count as missed.
- **Daily streak:** the number of days in a row it was done, counting back from today if done today, otherwise from yesterday. (Not ticking today yet doesn't break the streak until the day is over.)
- **Weekly habit:** shows "2 of 3 this week" (pips). Its streak is the number of weeks in a row the target was met, counting back from this week if already met, otherwise from last week. Shown as "N weeks in a row".
- **Best streak:** the longest streak ever (days for daily habits, weeks for weekly ones). Never goes down.
- **History strip:** the last 20 days (DESIGN.md section 6).
- **Archive:** hides the habit from Today, Habits and the graph, but keeps its history. Can be unarchived in Settings.
- **Delete:** asks first ("Delete Gym? Its history will be lost. This can't be undone."), then removes it for good with a gentle fade.
- Habits can be put in any order: press and hold a card, then drag it.
- **Empty state:** with no habits, Today and Habits show a friendly message, an "Add a habit" button and a "Start with example habits" button (the 5 examples in DESIGN.md section 4).

## 5. Progress bar and celebrations
- The progress bar counts **daily habits only** (weekly habits are left out). Segments in the colours of the done daily habits. A small sliver at 0%.
- **Perfect day:** when all daily habits are done for TODAY (and there's at least one), show the celebration once that day (DESIGN.md section 8: progress bar fills → "Perfect day!" card → confetti + a different, brighter sound). If a habit is un-ticked, the card goes away; re-reaching 100% the same day shows the card again but without confetti.
- Back-filling a past day to 100% gives a gentle chime only (no confetti).
- **Streak milestones** at 7, 30 and 100 (days for daily habits, weeks for weekly ones): show the milestone screen the first time each one is reached. Each habit/milestone pair is only celebrated once.

## 6. Graph ("Progress" screen)
- ONE line graph of the **% of all habits completed**.
- Each day's % = daily habits done that day ÷ daily habits that existed (created and not archived) that day. **On Sundays only, weekly habits are added in:** each weekly habit counts as 1 done if its weekly target was met, otherwise 1 not done.
- **Week:** 7 points (Mon–Sun). **Month:** one point per day. **Year:** one point per week (the average of that week's days).
- ‹ › arrows move to the previous/next week, month or year. Future days have no point.
- The big number is the average for the period; the comparison line compares it with the previous period.
- "Per habit" list: % of days done in the period for daily habits; "N of M wks" (weeks where the target was met) for weekly habits.

## 7. Sounds
- Completion sound for ticking a habit (short, soft). A different, brighter sound for a perfect day. A gentle chime for milestones.
- Generated in code (Web Audio) or from free sounds with a relaxed licence (ask me first and give me 2–3 options to try).
- Sounds on/off in Settings (saved).

## 8. Backup (export / import)
- **Export:** saves all my data as a .json file named like `pandatize-backup-2026-11-16.json`, using the iPhone share menu (so I can Save to Files > iCloud Drive). On the laptop it just downloads.
- **Import:** pick a backup file, then choose "Replace everything" or "Add missing habits". Check the file is a real Pandatize backup first, and show a clear message if it isn't.
- The backup includes `dataVersion`, so future versions can convert old backups.

## 9. Home screen and offline
- manifest.json: name Pandatize, dark background, standalone (full screen), portrait.
- Icons made from logo.png (180 × 180 apple-touch-icon, 192 × 192 and 512 × 512). Make them with tools already on Windows (e.g. PowerShell). Don't install anything without asking me.
- Service worker: saves all app files so the app opens with no internet.

## 10. Build steps for version 1
Each step ends with something I can see working. Claude Code does ONE step at a time, and ticks it here only after I say it works.

- [ ] **Step 1 – Skeleton and look:** folder structure, index.html, the theme (dark/light colours and backgrounds from DESIGN.md), js/config.js with the name, the floating tab bar with 4 tabs and placeholder screens, sliding between tabs (tap and swipe). Opens by double-clicking index.html.
- [ ] **Step 2 – Habits you can add and edit:** js/storage.js (dataVersion 1), the Habits screen with habit cards (no ticking yet), the add/edit habit sheet (title, colour palette + custom, icon, frequency), archive, delete with confirmation, drag to reorder, empty state + example habits.
- [ ] **Step 3 – Ticking, streaks and history:** ticking (today, past and future days), the week strip with other weeks, the history strip, daily and weekly streaks, best streaks, the progress bar on Habits.
- [ ] **Step 4 – Today screen:** date header, gear button, progress bar, compact habit tiles with ticking, "All habits" tile, empty state.
- [ ] **Step 5 – Settings and backup:** the Settings screen, sounds on/off (saved, sounds come in step 7), export and import, archived habits.
- [ ] **Step 6 – Go live:** manifest, icons from logo.png, service worker, then (with my help) create the GitHub repo, turn on GitHub Pages and add it to my iPhone home screen. Test offline.
- [ ] **Step 7 – Animations and sounds:** tick animations (squash and stretch, card pop, square flying in an arc, streak counter roll-up, flame flicker, progress bar slide), sounds, perfect-day celebration with confetti, streak milestone screen, Reduce Motion support. Follow DESIGN.md sections 9–10.
- [ ] **Step 8 – Progress graph:** the Progress screen (Week/Month/Year, arrows, average, comparison, per-habit list).
- [ ] **Step 9 – Final checks:** go through section 11 on my laptop and iPhone, fix anything, update CLAUDE.md to say version 1 is complete.

## 11. Version 1 checks (tick when tested on my iPhone)
- [ ] Looks like DESIGN.md in dark mode AND light mode.
- [ ] Can add, edit, archive, unarchive, reorder and delete habits.
- [ ] Ticking works on Today and Habits, including past and future days.
- [ ] Streaks, best streaks and "2 of 3 this week" are correct.
- [ ] The progress bar only counts daily habits and never looks empty.
- [ ] Perfect day celebration and milestones appear at the right moments, with sounds (and sounds can be turned off).
- [ ] The graph matches what I ticked (spot-check a few days).
- [ ] Export and import work (Save to Files > iCloud Drive, then import it back).
- [ ] Works from the home-screen icon with Airplane Mode on.
- [ ] Data survives closing and reopening the app.

## 12. Later list (ideas for later versions; don't build yet)
- Version 2: calendar and to-dos (see DESIGN.md).
- Version 3: lists.
- Version 4: real notifications.
