# Pandatize – SPEC (the whole app, and the order to build it)

Pandatize is my habit tracker + calendar + to-do lists/notes app for my iPhone (a progressive web app added to my home screen).
- **How it looks and moves:** DESIGN.md (follow it exactly).
- **What it does and the build order:** this file. The whole app is planned here. There are 6 big build steps (section 12).

## 1. Technology decisions
- Plain HTML, CSS and JavaScript. No frameworks, no build tools, no Node.js. Must work by double-clicking index.html on my laptop (except the offline/home-screen features, which only work on the live site).
- The app name is written in ONE place: js/config.js.
- All saving and loading code is in ONE file: js/storage.js (so online syncing could be added one day).
- Data is saved on the device with a `dataVersion` number (started at 1; now 3). Design the data shape in step 1 for the WHOLE app (habits, categories, calendar items, to-dos, lists, settings), so later steps don't need a data conversion. If the format ever has to change, raise dataVersion and write a converter. Use localStorage unless the data could outgrow it; if so use IndexedDB, still only inside storage.js.
- Progressive web app: manifest.json, home-screen icons made from logo.png, and a service worker so it works offline. The service worker has a version number that must go up every time any app file changes.
- Hosting: GitHub Pages from a PUBLIC GitHub repo called `pandatize` (live at https://donnachaoriordan.github.io/pandatize/). Never put personal data, backups, passwords or keys in the repo.
- Any outside library, sound or image: tell me its name, source and licence first and wait for my OK. Relaxed licences only (MIT, BSD, CC0, CC-BY with credit). List everything in CREDITS.md. Prefer drawing things ourselves (SVG) and making simple sounds in code.
- Weeks run Monday to Sunday everywhere. Times use the 24-hour clock. Dates look like "Tue 17 Nov".
- Respect the iPhone "Reduce Motion" setting (DESIGN.md section 10).

## 2. Navigation
- Floating tab bar: Today, Habits, Calendar, Lists. Tap a tab or swipe left/right to move between tabs (quick slide). **On the Calendar tab (changed 19 Nov 2026)** the screen is split into three strips: a swipe that STARTS in the outer 15% on the left or right edge changes tab (to Habits / Lists); a swipe that starts anywhere in the middle changes the month / week / day being shown (swipe left = next, right = previous). In Agenda (which has no periods) every swipe changes tab. Swiping doesn't change tabs while a sheet or panel is open, or when the swipe starts on something that scrolls sideways or a row being swiped to delete.
- Settings opens from the gear button on Today.
- Until a tab is built, it shows a simple, nicely styled "Coming soon" screen.

## 3. Habits
- A habit has: title, description (optional, a note to remind myself, shown under the name in the habit sheet), colour (palette or custom), icon, frequency (**every day** OR **X times per week**, X from 1 to 7), date created, archived yes/no, and its tick history (the dates it was done).
- **Ticking:** tap the tick box to mark done; tap again to un-tick. I can tick for today, any past day, or a future day, by picking the day in the week strip on Habits (‹ › arrows or swiping the strip goes to other weeks). Tiles on the Today screen always tick for today.
- Days before a habit was created never count as missed.
- **Daily streak:** days in a row it was done, counting back from today if done today, otherwise from yesterday (not ticking today yet doesn't break the streak until the day is over).
- **Weekly habit:** shows "2 of 3 this week" with pips. Its streak is the number of weeks in a row the target was met, counting back from this week if already met, otherwise from last week ("N weeks in a row").
- **Best streak:** the longest streak ever (days for daily, weeks for weekly). Never goes down.
- **History strip:** the last 20 days (DESIGN.md section 6).
- **Archive:** hides the habit from Today, Habits and the graph but keeps its history. Unarchive in Settings.
- **Delete:** asks first ("Delete Gym? Its history will be lost. This can't be undone."), then removes it with a gentle fade.
- Reorder: press and hold a card, then drag.
- **Empty state:** with no habits, Today and Habits show a friendly message, an "Add a habit" button and a "Start with example habits" button (the 5 examples in DESIGN.md section 4).

### Progress bar and celebrations
- The progress bar counts **daily habits only**. Segments in the colours of the done daily habits. A small sliver at 0%.
- **Perfect day:** when all daily habits are done for TODAY (and there's at least one), play the celebration once that day (progress bar fills → "Perfect day!" card → confetti + a brighter sound). If a habit is un-ticked the card goes away; reaching 100% again the same day shows the card without confetti.
- Back-filling a past day to 100% gives a gentle chime only.
- **Streak milestones** at 7, 30 and 100 (days for daily habits, weeks for weekly ones): show the milestone screen the first time each is reached. Each habit/milestone pair is celebrated only once.

### Graph ("Progress" screen)
- ONE line graph of the **% of all habits completed**.
- Each day's % = daily habits done that day ÷ daily habits that existed (created, not archived) that day. **On Sundays only, weekly habits are added in:** each counts as 1 done if its weekly target was met, otherwise 1 not done.
- **Week:** 7 points (Mon–Sun). **Month:** one point per day. **Year:** one point per week (the average of that week's days).
- ‹ › arrows move to the previous/next period. Future days have no point.
- The big number is the period's average; the comparison line compares it with the previous period.
- "Per habit": % of days done in the period for daily habits; "N of M wks" for weekly habits.

## 4. Calendar items
There are three types of item. All have: title, category (sets the colour), location (optional), notes (optional), repeat, reminders, countdown, auto-task.
- **Event:** start date + time and end date + time (default length 1 hour). Shown as a coloured block.
- **Deadline:** ONE date + time. Takes up no time: shown as a thin coloured line with a flag and title at its exact time. Can be ticked as done (then it's shown faded with a line through it, and its countdown and auto-task disappear).
- **All-day:** a date (or a start and end date). Shown in a strip at the top of the day.

### Categories
- Starting categories and colours: Lecture (Indigo), Assignment due (Red, default type Deadline), Exam (Yellow), Work (Teal), Team meeting (Sky), Football (Lime), Social (Pink), Birthday (Orange, default type All-day, default repeat Yearly). I can add, edit, reorder and delete categories (deleting asks which category its items move to).
- Each category has defaults that new items in it start with: colour, default type, default repeat, **default reminders** (a list, e.g. "1 day before", "15 min before"), **default countdown start** (N days before, or Never), and **default auto-task** (off, or: a text template, how many days before it appears, and how often it reminds).
- Starting defaults:

| Category | Reminders | Countdown | Auto-task |
|---|---|---|---|
| Lecture | 15 min before | Never | None |
| Assignment due | 1 day before, 3 hours before | 14 days before | "Start {title}", 10 days before, every 2 days |
| Exam | 1 week before, 1 day before | 30 days before | "Study for {title}", 14 days before, daily |
| Work | 1 hour before | Never | None |
| Team meeting | 15 min before | Never | "Prepare notes for {title}", 1 day before, once |
| Football | 2 hours before | Never | None |
| Social | 1 hour before | Never | None |
| Birthday | On the day 09:00, 1 week before 09:00 | 30 days before | "Get a present for {name}", 1 month before, weekly |

- Template placeholders: **{title}** = the item's title. **{name}** = the title with the category word and any 's removed ("Sarah's birthday" → "Sarah").
- Changing a category's defaults affects new items only, plus existing items that are still using the default (not ones I changed by hand).
- On an item, each default is shown with a small "Exam default" label and can be changed, added to, or turned off for that one item.

### Repeats
- Options: None, Daily, Weekly (pick the weekdays; default the item's weekday), Every 2 weeks, Monthly (same date), Yearly, Custom (every N days / weeks / months, with weekdays for weeks). Optional end date.
- Editing or deleting one occurrence of a repeating item asks: **This one only / This and future ones / All**.
- Store a repeating item once with its rule and exceptions, not as hundreds of copies.

### Countdowns
- An item with a countdown appears in the Countdowns strip on Today from its start (N days before) until it has passed (or the deadline is ticked). Text: "Today", "Tomorrow", then "3 days", "12 days".
- Colour: neutral, **orange at 3 days or fewer, red at 1 day or fewer**.
- For repeating items the countdown is for the next occurrence.

### Auto-tasks
- An item with an auto-task creates a to-do automatically N days before (e.g. "Study for Statistics exam" 14 days before). It appears in the to-do list for that day and carries forward each day until I tick it or the item has passed. It's tagged with its linked event (sparkle + colour dot + event title); tapping the tag opens the event.
- If I edit the event's title or date, the auto-task updates. Deleting the event deletes its un-ticked auto-task.
- "Reminder frequency" (once, daily, every 2 days, weekly) = how often it comes up in the reminders bell (below) until ticked.

### Reminders (in-app only)
- iPhone web apps can't send real notifications without a server, so reminders live inside the app:
  - A **bell button** on Today (beside the gear) with a red count badge. It opens a panel listing reminders that have come due and not been dismissed (item title, "in 2 hours" / "tomorrow 09:30", category colour). Tap one to open the item; swipe or "Clear all" to dismiss.
  - If the app is open when a reminder comes due, a small banner slides down from the top for a few seconds.
- Real phone notifications are on the Later list.

## 5. Calendar views
All views share the header (DESIGN.md section 7): ‹ title › arrows, search, filter and + buttons, and the Month / Week / Day / Agenda switch. The app remembers the last view used. Tapping the title jumps back to today.
- **Month:** the "open grid" (DESIGN.md section 7). Coloured lines only, no titles; to-do count badge; arrows or a swipe in the middle of the screen change month (see section 2). Tapping a day slides up the **day panel**: that day's events, deadlines, all-day items and to-dos with titles and times, plus a + button to add to that day and an "Open day" link to the Day view.
- **Week:** 7 columns with a time grid; events as blocks, deadlines as flagged lines, all-day items in a strip at the top, a "now" line. Arrows change week. Tap a day's header to open its Day view.
- **Day:** that day's to-do list at the top, then the all-day strip, then the time grid (events as blocks with title, time and location; deadlines as lines with a flag and title; "now" line). A mini week strip picks other days. Tap an empty time slot to add an event there.
- **Agenda:** a scrolling list of upcoming items grouped by date ("Today · Tue 17 Nov", "Wed 18 Nov"…), with countdown chips on deadlines. Loads more as I scroll. Days with nothing are skipped.
- Time grids show the whole day, scrollable, starting scrolled to about 08:00 (or to now, for today). Events that overlap sit side by side.
- Tapping any item opens the **add/edit item sheet** (DESIGN.md section 8). Swipe left on an item in a list to delete (fades out).
- **Search** (magnifier): typing lists all matching events, deadlines and all-day items, past and future, in "Upcoming" and "Past" groups with an All / Upcoming / Past switch. Matches title, location and notes; ignores capitals; tolerates small typos. Repeating items show their next few and last few occurrences with an "N more" count.
- **Filter** (filter icon): pick a category (chips) to see a list of all UPCOMING items in it, soonest first, each with date, time and countdown. "Clear" goes back.
- **Flexible typing:** date and time fields open the normal iPhone pickers, but also accept typed text like "7:30pm", "19:30", "1930", "tomorrow", "fri", "next fri", "20 nov".

## 6. To-dos (day to-dos)
- Every day has a to-do list (shown on Today, in the Day view and in the day panel). Add with "Add a to-do" (just a title; it belongs to that day).
- Tick to complete (line through, stays visible that day). Swipe left to delete. Tap to rename or move to another day.
- **Carry over:** unfinished to-dos from past days move to today automatically, tagged "Carried over from Mon" (the day they were first set for).
- Auto-tasks (section 4) and list to-dos with a due date (section 8) also appear here, with their tags.
- The month view badge on a day = that day's unfinished to-dos (carried-over ones count on today).

## 7. Today screen (top to bottom)
1. Date header, bell and gear buttons.
2. Daily-habits progress bar.
3. **Now / next card:** the current event (with time left, time range, location and a thin progress line) and the next one ("NEXT · Operations Research · 12:00 · in 1 h 40 min"). If nothing is on now, it shows just the next event today; if nothing is left today, "Nothing else today".
4. **Schedule:** today as a coloured timeline (events as blocks, deadlines as small flags at their time, "now" line), showing from the first item to the last (at least 08:00–18:00), with an "Open day" link. All-day items as chips above it. Hidden with a short "Nothing scheduled" line if the day is empty.
5. **To do:** today's to-do list with "N left".
6. **Habits:** the compact tiles.
7. **Countdowns:** the sideways strip.
- Updates itself every minute while open, and when the app comes back to the front (including rolling over to a new day).

## 8. Lists
- **Lists screen:** all my lists (as many as I want), each with a name, colour and icon, showing counts ("9 to-dos · 4 notes") and "3 due this week" in orange if any. + adds a list. "Search all lists" searches every list. A "Recently edited" section shows the last 3 items edited. Start with four lists: College, Shopping, Ideas, General notes. Press and hold to reorder; a list's ⋯ menu has Rename/Edit and Delete (asks first).
- **Inside a list:** notes and to-dos mixed together.
  - **To-do:** checkbox, title, optional start date (from that day on it shows on the daily to-do list every day until ticked), optional due date and time, optional priority flag (low = yellow, medium = orange, high = red), optional subtasks (each with its own checkbox; shows "1 of 3 subtasks"), optional notes.
  - **Note:** a title and body text.
  - **Pinned** items stay at the top under "Pinned". Then "Everything else". Then "Completed · N": completed to-dos stay visible with a line through them (un-tick to bring back).
  - Search within the list. Press and hold to reorder. Swipe left to delete (fades out). Tap an item to open and edit it in a sheet (with Pin, Delete).
  - Two buttons bottom right: "Note" and "+ To-do".
- A list to-do with a due date also appears in that day's to-do list (Today / Day view), tagged with its list's name and colour; ticking it in either place ticks it in both. If it's overdue and not done, it carries over like other to-dos.

## 9. Settings (from the gear)
iOS-style grouped rows: **Categories** (section 4; laid out as in DESIGN.md), Appearance (Auto = follow the phone, Light, Dark), Sounds on/off, Archived habits (Unarchive, Delete), Export backup, Import backup, app version number.

## 10. Sounds and backup
- Sounds: a short soft completion sound for ticks (habits and to-dos), a brighter one for a perfect day, a gentle chime for milestones. Made in code (Web Audio) unless I ask for sound files. On/off saved in Settings.
- **Export:** saves ALL data (habits, calendar, to-dos, lists, categories, settings) as `pandatize-backup-2026-11-16.json` through the iPhone share menu (so I can Save to Files > iCloud Drive). On the laptop it downloads.
- **Import:** pick a backup, then "Replace everything" or "Add what's missing". Check it's a real Pandatize backup first and show a clear message if not. Old dataVersions are converted.
- Settings shows a gentle nudge if I haven't exported for 30 days.

## 11. Home screen and offline
- manifest.json: name Pandatize, dark background, standalone (full screen), portrait.
- Icons made from logo.png (180 × 180 apple-touch-icon, 192 × 192, 512 × 512), using tools already on Windows. Don't install anything without asking me.
- Service worker: saves all app files so the app opens with no internet. Raise its version number with every change after it exists.

## 12. Build steps
Six big steps, **hardest first**: the tricky logic (calendar repeats, auto-tasks, carry-over, syncing between screens) is built early, and the easier parts (habits, animations, polish) come later. Claude Code does ONE step at a time, may split it into a few parts of its own choosing, and tells me how to check each. Tick a step here only after I say it works. After each step I commit (and push once the app is live).

- [x] **Step 1 – Foundation and Calendar core.** Folder structure, theme (dark/light, backgrounds), js/config.js, js/storage.js with the data shape for the WHOLE app (habits, categories, calendar items with repeat rules and exceptions, to-dos, lists, settings), tab bar with sliding/swiping and "Coming soon" screens, the Settings screen shell. Categories with all their defaults and Settings › Categories. The add/edit item sheet for Event / Deadline / All-day with category, times, location, notes and flexible typing (the repeat, reminders, countdown and auto-task sections appear and save their values, but don't act until step 2). Month view with the day panel, Week view (with overlapping events side by side), Day view, Agenda view, the shared header, ticking deadlines, swipe to delete.
- [x] **Step 2 – Calendar smart features and to-dos.** Repeats (all options, stored as a rule plus exceptions) with "This one only / This and future ones / All" for edits and deletes. Day to-dos with carry-over and the month badges. Countdowns. Auto-tasks (appearing, carrying forward, updating with their event, deleted with it). In-app reminders (bell + banner). Search (with typo tolerance and repeating items) and the category filter.
- [x] **Step 3 – Lists and the full Today screen.** Everything in section 8 (lists, notes, to-dos, subtasks, priorities, pins, completed, search, reorder), including due-dated list to-dos appearing in day to-do lists and ticking in both places. The Today screen: header with bell and gear, Now/next card, Schedule timeline, To do, Countdowns (the Habits section shows "Coming soon" until step 4), updating every minute and on a new day.
- [x] **Step 4 – Habits and the graph.** Everything in section 3 except the animations, sounds and celebrations: Habits screen, add/edit habit sheet, ticking for any day, week strip, daily and weekly streaks, best streaks, history strips, progress bar (Today and Habits), reorder, archive (and Archived habits in Settings), delete, empty state and examples, Today's habit tiles. The Progress graph screen.
- [x] **Step 5 – Go live, backup, and make it feel great.** Export and import (all data). Manifest, icons from logo.png, service worker; then help me create the GitHub repo, turn on GitHub Pages and add the app to my iPhone home screen (test offline). Then all animations and sounds (DESIGN.md sections 9–10): tick animations, perfect-day celebration with confetti, streak milestone screens, strike-through drawing, fades on delete, month lines growing in, panels springing, tab slides, Reduce Motion support, and the sounds switch in Settings.
- [x] **Step 6 – Polish and final checks.** Bigger hit areas everywhere, the backup nudge, speed check with a year of sample data, then go through section 13 with me on my laptop and iPhone and fix what we find. Update CLAUDE.md to say the app is complete.

## 13. Final checks (tick when tested on my iPhone)
Note (19 Nov 2026): step 6 was ticked after a partial check. I tested the step 6 changes and the changes made just before it, but not every line below, so these boxes are left unticked until each one has really been tested.
- [ ] Every screen matches DESIGN.md in dark AND light mode.
- [ ] Habits: add, edit, archive, unarchive, reorder, delete; ticking on Today and Habits for past and future days; streaks, best streaks and "2 of 3 this week" are right; progress bar counts daily habits only.
- [ ] Perfect day and milestones appear at the right moments, with sounds (and sounds can be turned off).
- [ ] The graph matches what I ticked.
- [ ] Calendar: add, edit and delete events, deadlines and all-day items; all four views look right; the day panel opens.
- [ ] Repeats work, including "This one only / This and future ones / All".
- [ ] Category defaults apply to new items and can be changed per item.
- [ ] Countdowns appear on time and turn orange then red.
- [ ] Auto-tasks appear on the right day, carry over, and link to their event.
- [ ] Reminders show in the bell.
- [ ] To-dos carry over and month badges are right.
- [ ] Search finds past and future items; the filter lists upcoming items.
- [ ] Lists: notes, to-dos, subtasks, priorities, pins, search, completed items; due-dated to-dos show on their day.
- [ ] Export and import bring everything back.
- [ ] Works from the home-screen icon in Airplane Mode; data survives closing the app.

## 14. Later list (not planned; don't build)
- Real phone notifications (needs a server).
- Accounts and syncing between devices.
- Dragging events to move them; importing from Google Calendar.

## 15. Decisions made during the build
Small things the plan didn't spell out, chosen to fit sections 1–11 and DESIGN.md. Later steps must keep them.

**Step 1**
- **Data:** saved in localStorage under the label `pandatize-data` (the data is small text, well inside its limit). The full data shape for every step is described in comments in js/storage.js.
- **Sizes on screen:** the top gap uses the iPhone's own "safe area" (so it's right both in Safari and from the home screen). On the laptop the app is shown as a phone-width column in the middle of the window.
- **Date and time pills:** type into the text ("next fri", "7:30pm"), or tap the small calendar/clock icon inside the pill to open the normal iPhone picker. Text the app can't understand flashes red and goes back to what it was.
- **Typing rules:** "fri" = the coming Friday (today counts); "next fri" = Friday of next week; "20/11" is day/month; a date with no year that would be more than about 6 months ago means next year ("5 jan" typed in November = next January). An end time at or before the start time on the same day means the next day.
- **Moving the start** of an event moves its end too, keeping the same length.
- **Ticking a deadline:** tap its coloured flag square in the day panel or Agenda (it becomes a tick; the row fades with a line through it). In the edit sheet a deadline also has a "Done" switch. On the Week/Day time grids, tap the flag to open the sheet.
- **Swipe left to delete:** a short swipe shows a red Delete button; a long swipe deletes at once. Either way a "Deleted · Undo" message appears for a few seconds. Swiping RIGHT on such a row still changes tab.
- **Day panel:** closes by tapping the grabber, dragging it down, tapping the same day again, or changing view. Tapping another day switches the panel to that day.
- **Day view header:** the back link ("‹ November") and the search/filter/+ buttons share the top row; the big day title with its ‹ › arrows (previous/next day) sits on the row below, because all of it doesn't fit on one row at 30px.
- **Agenda:** has no ‹ › arrows (it always starts from today). An event that runs past midnight is listed under each day it covers.
- **Month view:** shows at most 6 lines per day.
- **Time grids** scroll inside their card (the all-day row stays put at the top). Very short events are drawn at least half an hour tall so they can be tapped.
- **Settings › Categories:** changes save straight away (no Save button). Each card also has a name field, "New items start as" (type and repeat), and Move up / Move down / Delete buttons. A category can't be deleted if it is the only one.
- **Item sheet, auto-task:** the Task field holds the template (e.g. "Study for {title}") and a line under it shows the finished text.
- **Not yet working (by plan):** repeats, reminders, countdowns and auto-tasks are saved on each item but don't act until step 2; the search and filter buttons say so when tapped. To-dos (in the Day view, day panel and month badges) also arrive in step 2.
- **Starting lists** (for step 3) are already in the data: College (Indigo, book), Shopping (Green, cart), Ideas (Yellow, bulb), General notes (Sky, note).

**Step 2**
- **Repeats:** a repeating item always happens on its own start date, then follows its rule. "Monthly" on the 31st skips months with no 31st; a 29 Feb yearly item shows in leap years only.
- **"This one only"** takes that occurrence out of the series and makes it a separate item (the series remembers the gap). **"This and future ones"** ends the old series the day before and starts a new one from that occurrence. **"All"** changes the whole series; if the date was moved, every occurrence moves by the same number of days. Choosing "This and future ones" on the very first occurrence is the same as "All".
- The question's second line says what changed ("You changed the time and location of ...") or what is being deleted. Flipping only the "Done" switch of a repeating deadline never asks: it is always just that one.
- **To-dos:** tap a to-do to rename it or move it to another day (moving by hand clears the "Carried over" tag). Tap an auto-task to open its event. Typing in "Add a to-do" and pressing Enter keeps the cursor there for the next one. Deleting shows "Undo" for a few seconds.
- **Auto-tasks** exist from N days before until the event's day is over (or its deadline is ticked). While un-ticked they sit on today's list. A ticked one stays, struck through, on the day it was ticked, even if the event is later deleted.
- **Countdown chips** show on every un-ticked upcoming deadline in the day panel and Agenda, and on every card in the category filter. The Today strip (step 3) uses each item's own countdown setting.
- **Reminders:** an all-day item's "N before" reminders count from 09:00 that day. "1 month" = 30 days. A reminder stays in the bell until dismissed, its deadline is ticked, or the item's day is over. An un-ticked auto-task comes back into the bell (at 09:00) as often as its "Reminders" setting says. The banner shows for 5 seconds; tap it to open the item. In the bell panel, swipe a row left and tap "Clear" to dismiss one.
- **Search:** every typed word must match the title, location or notes. Words of 4+ letters allow one wrong letter (8+ letters: two). A repeating item shows its next 3 and last 3 occurrences; each group shows up to 8 rows, and "N more" opens the rest (up to a year ahead).
- **Category filter:** opens with no category picked. Several categories can be picked at once (tap a chip to add it, tap again to remove it); the list shows them all together, soonest first. A repeating item is listed once, as its next occurrence, with its repeat ("Weekly") beside the date. Ticked deadlines are left out. "Clear" and "‹ Calendar" both go back.
- **Animation fix:** slide-ups now start the moment they are created (no waiting for the next screen refresh).

**Step 3**
- **Lists tab:** opening a list happens inside the Lists tab (the tab bar stays visible, as in the mockup). A list card counts unfinished to-dos and all notes; "N due this week" counts unfinished to-dos due by this Sunday, including overdue ones.
- **List icons** (pick one of 12): book, cart, bulb, note, star, home, heart, briefcase, gift, plane, music, check.
- **New entries** go to the top of "Everything else". A note saved without a title uses its first line as the title. A due time is dropped if there is no due date.
- **Reorder:** press and hold (about a third of a second) then drag. Entries reorder within their own section (Pinned, Everything else); the Completed section is ordered by when things were ticked. Reordering is off while a search is typed.
- **The ⋯ menu** in a list offers "Edit list" (name, colour, icon) and "Delete list".
- **Priority flag colours:** low = Yellow, medium = Orange, high = Red (from the palette). An overdue due date is shown in red.
- **List to-dos on days:** a list to-do with a due date shows on that day, tagged with its list's colour and name (and time). If overdue and not done it shows on today instead, with "Carried over from Mon" as well. Once ticked it stays on the day it was ticked. Tapping it in a day list opens its sheet; swiping deletes it from its list (with Undo).
- **Today, Now/next:** only events count (not deadlines or all-day items). "Next" is the next event starting later today. With nothing on now, the card shows the next event with a grey NEXT pill.
- **Today, Schedule:** one hour is 44px tall; all-day items are chips above the card.
- **Today, Habits:** shows a small "arrives in build step 4" card for now; the daily-habits progress bar also arrives in step 4.
- **Today, Countdowns:** cards show weekday + time when under a week away ("Fri 23:59"), otherwise the date. On the laptop the strip can be dragged sideways with the mouse. Tapping a card opens the item.
- **Every minute** the Now/next card, Schedule and Countdowns redraw; the To do section only redraws when something changes (so typing a to-do is never interrupted).
- **Undo after every delete (my request, 17 Nov):** every delete, now and in all later steps, shows "Deleted … · Undo" for a few seconds. Added for deleting a list and deleting a category (a category's items go back to it too). See DESIGN.md section 10.
- **Quick pin (my request, 17 Nov):** a pin button at the top right of every note and to-do card inside a list (hollow = not pinned, filled = pinned). Lists themselves are NOT pinnable (I tried it and removed it). Completed to-dos have no pin button. The "Pinned to the top" switch inside the edit sheet is still there too. dataVersion is 2 because list pins existed briefly; nothing else changed in the data.

**Step 4**
- **Best streak** is remembered when the app opens (not at the moment of ticking), so an accidental tick that is un-ticked straight away never leaves a false "best". What is shown is always the larger of the remembered best and the longest run in the history.
- **Habits screen:** the week strip has small ‹ › arrows at its ends, and swiping the strip sideways also changes week. Each day button has a tiny bar showing that day's daily-habit completion. The streak text is always "as of today"; the tick boxes, card tint, progress bar and "2 of 3 this week" follow the selected day.
- **History squares:** done = habit colour; missed = a darker tint (daily habits only); today not yet done = outline; grey = a weekly habit's day off, or a day before the habit was created.
- **Tapping a habit card** opens its edit sheet; tapping a Today tile (outside its tick box) goes to the Habits tab. "N of M" beside the Habits heading on Today counts habits ticked today.
- **Custom colour:** the 13th swatch (a colour wheel) opens the phone's own colour picker.
- **Habit icons:** book, dumbbell, pawn, moon, stretch, drop, pen, music, leaf, heart, coffee, code.
- **Archive** shows "Archived … · Undo". **Delete** asks first ("Its history will go with it.") and then shows Undo, following the undo-after-every-delete rule (the original "This can't be undone" wording no longer fits).
- **Graph:** archived habits are left out completely while archived. A day with no habits yet (or in the future) has no point. Year view: one point per week that starts in that year; the big number is the average of all that period's days. The comparison line is green when up or level, red when down, and hidden if the earlier period has no history. The › arrow stops at the current period.
- **Graph touch:** touching or hovering the graph shows the nearest point's date and value.
- **Per habit:** daily = % of days done since the habit was created (within the period, up to today); weekly = "N of M wks" for weeks that have started.
- **Not yet (step 5):** tick animations, sounds, the perfect-day celebration and streak milestone screens.

**Step 5**
- **Export:** on the iPhone it opens the share menu (choose "Save to Files"); on the laptop it downloads. It remembers when you last exported (for step 6's nudge). The file also records the moment it was made, shown when importing ("Backup from Tue 17 Nov").
- **Import:** checks the file first (not a Pandatize backup, damaged, or from a newer version: a clear message and nothing changes). Then "Add what's missing" or "Replace everything", both with Undo. "Add what's missing" adds habits, categories, calendar items, to-dos, lists and list entries that aren't here yet; it never changes or removes anything already here, except that a habit that's in both gets any ticks it was missing.
- **Home-screen icons** are logo.png with its outer black margin trimmed (not redrawn), so the logo fills the iPhone's rounded icon. They live in icons/. The browser-tab icon is now icons/icon-192.png (logo.png is 1.2 MB, too big to load every time).
- **App name:** still written once in js/config.js for the app itself. manifest.json also has to contain it (it is a plain settings file that can't read config.js), so renaming the app means changing both.
- **Service worker** (sw.js, in the main folder so it covers the whole app): its version number is `VERSION` at the top of sw.js. When a new version arrives while the app is open, a "Pandatize has been updated · Reload" message appears. It only runs on the live https:// site (and on localhost), never when index.html is double-clicked.
- **Perfect day card** is on Today only (under the progress bar). If the last daily habit is ticked on the Habits tab, the confetti and sound play there, and the card is waiting on Today. "Nth perfect day this month" counts every day this month where all daily habits were done (including back-filled ones).
- **Streak milestones** appear when a tick makes the streak cross 7, 30 or 100 (not for streaks that were already past them before step 5). If a back-fill jumps past two at once (e.g. 5 → 35), the screen shows the biggest one and both count as celebrated. If the same tick also made a perfect day, the milestone screen comes after the confetti.
- **Finishing a deadline** (tapping its flag square in the day panel or Agenda): the line draws through it, a small burst of confetti comes from the flag, and the completion sound plays. (The "Done" switch in the edit sheet doesn't celebrate.)
- **Sounds** are made in code: a soft pop for ticks (habits, to-dos, subtasks, deadlines; not for un-ticking), a rising sparkle for a perfect day, a three-note bell for milestones and a two-note bell for back-filling a past day to 100%. Turning Sounds on in Settings plays the pop as a sample. On iPhone they also follow the ring/silent switch.
- **Strike-through** on to-dos, list to-dos, subtasks and ticked deadlines is a drawn line (it draws left to right when ticked) instead of the plain text line-through.
- **Fades on delete:** habits, to-dos, list entries and calendar items fade out before they go (rows swiped away already fade).
- **Month lines** grow in when a month is shown: on changing month, switching to Month view, or arriving on the Calendar tab. Not when the month is just redrawn after a change.
- **Panels:** sheets, action sheets and the day panel spring up with a small overshoot. Tapping another day while the day panel is open makes it dip a few pixels and spring back (the "anticipation" from DESIGN.md 10).
- **Reduce Motion on:** tabs fade instead of sliding; sheets, panels and screens fade in; ticks, cards and squares fade instead of popping; no flying square, no confetti, no rolling numbers, no flicker; the strike line appears without drawing.

**Changes before step 6 (my requests, 19 Nov)**
- **Appearance** in Settings: Auto (follows the phone's dark/light setting, and switches straight away when the phone does), Light or Dark. Saved as `settings.theme` ('auto' | 'light' | 'dark'). The app labels the page `data-theme="light"` or `"dark"` and the CSS picks its colours from that label (no more "follow the phone" rules in the CSS itself). The iPhone's top-bar colour follows too.
- **Gear icon** changed to a toothed cog.
- **Habit icons:** 10 more, so 22 in all: piano (piano keys), guitar, shower (cold shower), language, wakeup (get up), wsj, brain (a head in profile with a brain inside), cooking (frying pan), phone (phone screen), apple (healthy food). "Stretch" was already one of the original 12.
- **Habit description:** an optional box right under the name in the habit sheet. Only shown in the sheet (tap the habit card to see it), not on the cards.
- **Pin** (quick pin on list cards) is drawn tilted at about 40°.
- **List to-do start date:** a "Starts" row above "Due". From its start date the to-do shows on that day's to-do list, and then on Today every day until ticked (tagged with its list, "due Tue 24 Nov" if the due date is still ahead, and "Carried over from Tue" after the first day). On future days in the calendar it shows on its start day and its due day. Once ticked it stays on the day it was ticked. Before the start day the list card says "Starts Fri 20 Nov". (Day to-dos already work this way: Edit to-do › Day sets the day it starts, and it carries over until ticked.)
- **dataVersion 3:** the converter adds an empty description to habits, `start: null` to list entries and `theme: 'auto'` to settings.

**Step 6**
- **Bigger hit areas:** every small round button, × button, week-strip arrow, stepper button and switch has an invisible tap area of at least 48 × 48 px (one shared rule at the end of css/app.css). A tap anywhere on the right third of a habit card (Habits) or habit tile (Today) ticks it; the left third still opens it. A tap on the left 56 px of a to-do row (Today, Day view, day panel) or a to-do card inside a list ticks it. Other buttons inside a row (chips, the pin) keep their own job, and a row with its red Delete showing just closes.
- **Backup nudge:** a card at the top of Settings ("No backup yet" / "Last backup 34 days ago", "Save a copy of everything to Files, just in case.", and an "Export now" button) when the last export is 30 or more days old or there has never been one. It goes away as soon as a backup is saved.
- **Speed check** with a year of sample data (8 habits ticked most days, 10 weekly lectures, ~330 events, 60 deadlines, 20 birthdays, ~1,100 to-dos, 600 list entries; about 0.5 MB saved): every screen draws in well under 0.1 s on the laptop. Made faster: monthly/yearly repeats jump straight to their date instead of checking every day; each habit's best streak is remembered until its ticks change; the "add days" and "weekday" date sums remember their answers. A check confirmed the faster repeat sums give exactly the same dates as before.

**After step 6 (19 Nov 2026)**
- **Calendar swiping:** see section 2. The edge strips are 15% of the screen width on each side.
- **iPhone swipe fix:** when the iPhone cancels a touch (because it starts scrolling the page), it reports the finger at the far left edge. That was read as a big left swipe, so a right swipe on Habits went to the Calendar. Now the last real finger position is used, and once a sideways swipe has started the page isn't allowed to scroll up/down.
- **Changing day/week keeps the time of day** in the time grid (by swipe or arrows); it no longer jumps back to 08:00.
- **Swipes are never taps:** a finger that moves more than 10 px before lifting is never treated as a tap (fixes a swipe from Habits to Today landing on Today's "Open day" link and jumping to the Calendar on the iPhone).
