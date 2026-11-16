# Pandatize – Design spec (approved 14 Nov 2026)

This is the agreed look of my habit tracker + calendar + lists app, **Pandatize** (an iPhone progressive web app). **When building any screen of this app, follow this spec exactly.** Don't redesign anything.

Visual reference: the approved mockups are on a Claude design canvas at https://claude.ai/artifact/LFpV37TDvkH2Rw73cSqDNN (they still say "[App name]" or "Habitizer" in places; the app is called Pandatize). Claude Code can't open that link, so this file is the full description.

What gets built when is in SPEC.md. This file describes how everything looks.

---

## 1. Basics
- App name: **Pandatize**. Write the name in ONE place in the code (js/config.js) so it's easy to change.
- **Logo:** my own image, **logo.png** in the project folder. It's a glossy black rounded square with a broken ring of four rounded arcs (orange-to-yellow on the left, lime-to-green on the right), and a cute black-and-white panda in the middle holding a white calendar card with a green tick. Use this file for the home-screen icon and anywhere the app shows its logo. Make the other icon sizes from it. Don't redraw it.
- Screen: iPhone, 393 × 852, portrait. Leave the top ~58px free for the real iOS status bar. Don't draw a fake status bar or keyboard.
- Font: `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', Inter, 'Helvetica Neue', system-ui, sans-serif` (SF Pro on iPhone; my Windows laptop will show a similar stand-in).
- Feel: sleek, modern, rounded, soft, generous spacing, no clutter. Bold, HabitKit/Streaks-style dark look.
- Theme follows the phone's dark/light setting.
- Icons: simple line icons drawn as original SVGs, stroke width 2, round caps and joins. Never emoji.

## 2. Backgrounds
- **Dark:** `radial-gradient(140% 55% at 0% 0%, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 60%), linear-gradient(180deg, #000000 0%, #0C0C0F 40%, #222226 100%)` (black at the top fading to a glossy grey at the bottom, with a faint shine top-left).
- **Light:** `linear-gradient(180deg, #E2EBFA 0%, #F1F5FC 45%, #FFFFFF 100%)` (pale blue at the top fading to white).

## 3. Theme colours
| Token | Dark | Light |
|---|---|---|
| card | #1C1C1E | #FFFFFF |
| card2 (tracks, chips, fields) | #2C2C2E | #E8E8EE |
| selected segment | #4A4A4E | #FFFFFF |
| text | #F5F5F7 | #111114 |
| text2 (secondary) | #A1A1AA | #5C5C66 |
| checkbox border | #5A5A62 | #8E8E96 |
| hairline | rgba(255,255,255,0.08) | rgba(0,0,0,0.07) |
| link / accent | #4DA3FF | #0062D1 |
| red text / bg (≤1 day) | #FF6961 / #3A1D1C | #C4000F / #FDE3E1 |
| orange text / bg (≤3 days) | #FFB340 / #3A2C14 | #A04F00 / #FFEFD9 |
| toggle on | #30D158 | #30D158 |
| card shadow | none | 0 1px 3px rgba(0,0,0,0.06) |
| sheet background | #1C1C1E | #F2F2F7 |
| fields inside sheets | #2C2C2E | #FFFFFF |

**Light mode = white cards** with the same vivid colours as dark mode. A habit card that is done gets 16% of its colour mixed into white. In dark mode, a done habit card gets 30% of its colour mixed into the card colour.

## 4. The 12-colour palette (habits AND calendar categories), plus a "custom" colour wheel
Red #FF453A · Orange #FF9F0A · Yellow #FFD60A · Lime #A8E10C · Green #30D158 · Teal #2DD4BF · Sky #3BC9F5 · Blue #0A84FF · Indigo #5E5CE6 · Purple #BF5AF2 · Pink #FF4FA3 · Sand #C8A27A
- Text on a colour fill: near-black #0B0B0F, except white on Indigo.
- Icon glyph on a colour fill: dark on Orange/Yellow/Lime/Green/Teal/Sky/Sand, white on the others.
- Example habits (used by the "Start with example habits" button): Read 20 pages = Blue (book icon), Gym = Orange (dumbbell, 3 times a week), Chess practice = Purple (chess pawn), No phone in bed = Green (moon), Stretch = Pink (stretching person).
- Calendar categories: Lecture = Indigo, Assignment due = Red, Exam = Yellow, Work = Teal, Team meeting = Sky, Football = Lime, Social = Pink, Birthday = Orange.

## 5. Shapes & spacing
- Screen side padding 16px (calendar month 12px). Gap between sections 24px.
- Corner radius: cards 22–24px, sheets 28px (top corners), tiles 14px, inputs 16px, pills fully round.
- Type: big screen titles 32–34px weight 800 (tight letter spacing); section headings 20px/700; body 16px; secondary 13–14px; tiny labels 11–12px.
- Tap targets at least 44px.

## 6. Components
- **Tab bar:** a floating pill, 16px from the sides and 24px from the bottom, 64px tall, fully rounded, with a hairline border and soft shadow. Tabs (icon + small label): Today, Habits, Calendar, Lists. The active tab gets a card2 pill behind it and full text colour; the others use text2. Settings is a round gear button at the top right of Today. Swipe left/right to change tabs.
- **Progress bar:** 8px tall, rounded, card2 track. The fill is made of segments (2px gaps) in the colours of the habits done today. It always shows a small sliver (3%) at 0%. **It counts daily habits only; weekly habits are left out.** Label above it: "Daily habits" on the left, "2 of 4 · 50%" on the right. It appears on Today and at the top of Habits.
- **Habit card (Habits screen):** a coloured rounded-square icon (40px, radius 12), title 17px/700, a flame + "X day streak · Best N" (if no streak: "No streak yet · Best N"; weekly: "2 of 3 this week" with 3 small pips, then "N weeks in a row · Best N"), a tick box on the right (32px rounded square: an outline in the habit colour when not done, filled with the habit colour plus a check when done), and a strip of 20 small squares underneath (13px, rounded) for the last 20 days: filled with the habit colour = done, dark tint of the colour = missed, outlined = today not yet done, neutral grey = days a weekly habit wasn't done (not "missed"). A done card fills with a tint of its colour. The flame is orange.
- **Compact habit tiles (Today):** a 2-column grid. Each tile: icon (34px) top-left, tick box (30px) top-right, title, flame + streak (or "2 of 3 this week"), and a 7-square mini strip. The last cell is a dashed "All habits →" tile that opens the Habits tab.
- **Week strip (Habits):** 7 day buttons, Mon–Sun, each with the letter, the date and a tiny bar showing that day's completion. The selected day is filled with the text colour. Future days are faded. Picking another day shows a banner "Ticking for Monday 16 Nov · Back to today" and the cards show that day's ticks.
- **Countdown cards:** 156px wide, scrolling sideways. Neutral normally, orange at 3 days or fewer, red at 1 day or fewer.
- **To-do rows:** round checkboxes. A "Carried over from Mon" chip, and auto-task chips (sparkle + category colour dot + linked event). Done = struck through.
- **Events:** solid colour blocks. **Deadlines:** a thin coloured line with a flag pill at their exact time. **Now line:** a text-coloured line with a dot.
- **Sheets:** slide up from the bottom, with a grabber bar and Cancel / Title / Save across the top. iOS-style grouped rows inside. The screen behind is dimmed.

## 7. Calendar month view = "open grid"
- Header: ‹ November 2026 › arrows (arrows change the month, no swiping), then search, filter and + buttons, then a Month / Week / Day / Agenda switch.
- A row of weekday letters, M T W T F S S (weeks start on Monday).
- The whole month sits on one rounded card (card colour, 22px corners, 4px padding). No boxes around individual days. Each week row is separated by a 1px hairline.
- Each day is 80px tall. The date number is centred at the top (15px, regular weight) inside a 28px circle. Today's circle is filled with the text colour, with the number in the background colour.
- Under the date, each item that day is a thin colour line: 4px tall, rounded, 3px apart, in its category colour, stacked in time order. Full day-width with 3px side padding. No titles.
- Days outside the month are faded to 35%.
- A day with unfinished to-dos shows a tiny number badge in the top-right corner (15px pill, card2 background).
- Tapping a day slides up the day panel (events, deadlines and to-dos with titles and times).
- When a month loads, the lines grow in from the left.

## 8. Screens (all approved in the mockups)
Today, Celebration (confetti at 100%), Streak milestone (7/30/100), Habits (with a week strip to tick a past or future day), Habit graph (Week/Month/Year), Add/edit habit, Calendar month, Tap-a-day panel, Day view, Week view, Agenda, Add/edit item, the "This one only / This and future ones / All" choice, Category filter, Search, Lists, Inside a list, Settings › Categories, Colour palette.

### Screen details
- **Today:** "TUESDAY" (small, uppercase, text2) above "17 November" (32px/800); round bell and gear buttons top right. Then, in order: progress bar, Now/next card, Schedule, To do, Habits, Countdowns (details below).
- **Celebration (all daily habits done today):** the Today screen with a "Perfect day!" card under the progress bar: a ring split into the colours of the daily habits with a check in the middle, "Perfect day!" (28px/800), and "All your daily habits done. That's your Nth perfect day this month." Confetti in the 12 palette colours falls over the top half of the screen.
- **Streak milestone (7, 30, 100):** a full-screen moment: a big orange flame with the number in it, "7-day streak!", the habit's icon and name, "A full week in a row. Next milestone: 30 days.", three badges (7, 30, 100; reached ones filled in the habit colour, others dashed with a small lock), a "Keep going" pill button, a close (X) button top right, and a little confetti.
- **Habits:** title "Habits" (34px/800) with two round buttons on the right: graph and +. Then the progress bar ("Daily habits · Tue 17 Nov"), the week strip, then the habit cards (12px apart).
- **Habit graph ("Progress"):** back link "‹ Habits", title "Progress", a Week / Month / Year switch, a card with ‹ period › arrows (e.g. "November 2026"), the average (44px/800, e.g. "71%") with "of habits done on average", a green comparison line (e.g. "+6% on October"), then ONE line graph (y axis 0%, 50%, 100% with dashed gridlines; a smooth line in the text colour with a faint fill under it and a dot on the latest point). Below: "Per habit" list (icon, name, % or "4 of 5 wks", thin bar in the habit colour). Footnote: "Weekly habits (like Gym, 3× a week) count once a week, on Sunday, when the week (Mon–Sun) closes."
- **Add / edit habit sheet:** Cancel / "New habit" or "Edit habit" / Save. A live preview card. Title field. Colour: the 12 swatches + a custom colour-wheel button (7 per row). Icon: a grid of 12 line icons (book, dumbbell, chess pawn, moon, stretching person, water drop, pen, music note, leaf, heart, coffee cup, code brackets). Frequency: "Every day | Times per week" switch, and a − 3 + stepper for times per week, with the note "Weeks run Monday to Sunday." When editing: Archive and Delete buttons side by side at the bottom (Delete in red).
- **Now / next card (Today):** a card with a "NOW" pill in the event's category colour (white dot + text), the category name, and "40 min left" on the right. Below: the event title (21px/700), then a clock icon + "09:00 – 11:00" and a pin icon + location. A thin progress line in the category colour shows how far through the event we are. Under a hairline: "NEXT", a colour dot, the next event's title, and on the right "12:00 · in 1 h 40 min".
- **Schedule (Today):** heading "Schedule" with an "Open day" link. A card with a timeline: hour labels down the left (11px), hairlines per hour, events as rounded colour blocks (title in bold, then "09:00 – 11:00 · location"; short events on one line), deadlines as a 2px colour line with a small flag pill ("17:00 · Statistics problem set") at their time, and the now line.
- **To do (Today):** heading "To do" with "4 left". One card of rows: round checkbox, title, and under it a chip if there is one ("→ Carried over from Mon", or sparkle + colour dot + "Statistics exam"). Last row: "+ Add a to-do" in text2.
- **Habits (Today):** heading "Habits" with "3 of 5"; the compact tile grid.
- **Countdowns (Today):** heading "Countdowns"; cards with a colour dot + date ("Fri 23:59"), the big countdown ("3 days", 26px/800) and the title.
- **Reminders panel (bell):** a slide-up panel titled "Reminders" with "Clear all"; rows with a colour bar, title and when ("in 2 hours").
- **Calendar header (all views):** left: ‹ and › round buttons (32px) either side of the title ("November 2026", 22px/800, year in text2). Right: round search, filter and + buttons (36px; the + is filled with the text colour). Below: the Month / Week / Day / Agenda segmented switch.
- **Day panel (tap a day in Month):** slides up over the lower part of the screen; the tapped day gets a ring. Grabber, "Friday 20 November" (20px/800), "2 events · 1 deadline · 2 to-dos", a + button, an "Open day" link. Rows: events with a colour bar, time range, title and location; deadlines with a small flag square in the colour, time, title and a countdown chip; to-dos with checkboxes.
- **Day view:** back link "‹ November", title "Tuesday 17" (30px/800), the view switch, a mini week strip (M–S with dates, selected day filled). Section "To-dos" with "3 left" and the to-do card. Then a card with the "All day" row (colour pills with titles) and the time grid: 50px per hour, event blocks with title and "time · location", deadline lines with flag pills, now line.
- **Week view:** title "Nov 16 – 22". A row of day letters with dates (today's date in a filled circle), an "all-day" row with colour pills, then a 7-column time grid (hour labels every 2 hours, faint column lines, today's column lightly shaded). Events are small rounded blocks with tiny bold titles; deadlines are a colour line across the column with a tiny flag and label; now line in today's column.
- **Agenda view:** title "Upcoming". Groups headed "TODAY · TUE 17 NOV" (14px/700, text2, uppercase), each a card of rows: start time (bold), colour bar (or flag square for deadlines), title, location underneath, countdown chip on deadlines.
- **Add / edit item sheet:** Cancel / "New item" or "Edit item" / Save. Event | Deadline | All-day switch. Title field (18px/600). A group: Category (colour square + name ›), Starts (date pill + time pill), Ends (same; hidden for a deadline, which shows one "Due" row; all-day shows dates only), Location. Repeat: wrapping pills (None, Daily, Weekly, Every 2 weeks, Monthly, Yearly, Custom…; selected one filled) and an "End date" row. Reminders: rows with a bell, each default tagged with a small grey "Exam default" label, added ones with an ×, and "+ Add reminder". Countdown: "Show countdown" toggle and "Starts · 30 days before" with the default label; footnote 'Shows on Today as "Statistics exam · 14 days". Turns orange at 3 days, red at 1 day.' Auto-task: toggle, Task ("Study for Statistics exam"), Appears ("14 days before"), Reminders ("Daily until ticked"); footnote 'From the Exam default. Changes here only affect this item.' Notes box. When editing: a red "Delete" button at the bottom.
- **Repeating item choice:** an iOS action sheet from the bottom: "This is a repeating event" + a line saying what changed, then buttons "This one only", "This and future ones", "All events in the series", and a separate "Cancel" button.
- **Category filter:** back link "‹ Calendar" and "Clear". Title "Assignments due" (32px/800) with "5 upcoming · soonest first". The category chips (colour square + name; the selected one filled with a check) are ALL visible straight away, wrapping onto as many rows as they need (no sideways scrolling; changed 16 Nov 2026). Several chips can be selected at once (tap to add, tap again to remove); the list then shows the upcoming items of all selected categories together, each card with a thin bar in its category colour, and the title reads "3 categories". Then cards: a date block (FRI / 20 / NOV on card2), the title, a flag + "Fri 20 Nov · 23:59", and a countdown chip (red / orange / neutral).
- **Search:** a search field (magnifier, text, clear ×) with "Cancel"; an All | Upcoming | Past switch; "UPCOMING" and "PAST" groups with "12 more" on the right; rows with a date block, colour bar, title (the matching word highlighted in a tint of the category colour) and "19:30 – 21:00 · College Park". Past rows slightly faded.
- **Lists:** title "Lists" (34px/800) with a + button; "Search all lists" field; one card per list: a 44px colour square with a line icon, the name (17px/700), "9 to-dos · 4 notes", an orange "3 due this week" if any, and ›. A dashed "+ New list" button. "Recently edited": rows with an icon, the title and "College · edited 2 h ago".
- **Inside a list:** back link "‹ Lists" and a ⋯ button; the list's colour icon and name (32px/800); "Search College" field. Small uppercase headings "PINNED", "EVERYTHING ELSE", "COMPLETED · 2". Each item is its own card (radius 18): to-dos have a round checkbox (filled in the list colour when done), title, a small meta line (due date or "1 of 3 subtasks"), indented subtasks with small checkboxes, and on the right a filled priority flag (yellow / orange / red) and a pin icon if pinned. Notes have a note icon, a title, a few lines of body in text2 and "Note · edited yesterday". Completed to-dos are struck through in text2. Bottom right, above the tab bar: two pill buttons, "Note" (card colour) and "+ To-do" (filled with the text colour).
- **Settings › Categories:** back link "‹ Settings" and a + button; title "Categories" with the line "Defaults for every new item in a category. You can change them on any single item." One card per category: colour square, name, a type chip ("Event", "Deadline", "All-day · yearly") and ›; then three lines with icons: Reminders, Countdown, Auto-task (template · when · how often). Tapping a card expands it (outlined in its colour) to edit: a row of the 12 colour dots, Reminders rows, Countdown "Starts" row, the auto-task template field (the {name} placeholder shown as a tinted pill), "Appears" and "Reminders" rows, and a footnote explaining {name}. A dashed "+ New category" button at the bottom.
- **Settings:** title "Settings"; grouped rows: Categories ›, Sounds (toggle), Archived habits ›, Export backup, Import backup; the version number in small text2 at the bottom.

## 9. Animations
- Ticking a habit: the card fills with its colour and pops, a short completion sound plays, and that day's square pops into the strip. The streak number rolls up like a counter and the progress bar slides.
- Day reaches 100%: confetti plus a different, brighter sound.
- Streak milestones at 7, 30 and 100.
- Tabs slide; deleted items fade out; month lines grow in when a month loads; panels spring up.

## 10. Motion & UX rules
**Ground rule: the more often something happens, the smaller and faster its animation.** Habit and to-do ticks are short and subtle (about 0.25 s). Tab switches are a quick slide. The full show is saved for rare moments: the day hitting 100%, streak milestones and finishing a deadline.

**Animation principles**
1. **Squash and stretch:** the tick box squashes slightly as it's pressed, then springs back slightly bigger as it fills. Confetti pieces stretch as they fall and squash when they land.
2. **Anticipation:** on the milestone screen, the flame shrinks very slightly for a split second before bursting to full size. Panels dip a few pixels before sliding up. **Never on habit ticks**, because any delay there feels slow.
3. **Staging (one thing at a time):** the celebration plays in order: the progress bar fills, then "Perfect day!" appears, then confetti. In the add/edit item sheet, switching Event / Deadline / All-day briefly highlights the time fields that changed.
4. **Follow through:** sheets and panels overshoot slightly and settle back, like a drawer springing into place. When a habit card pops, the card settles first and its history square pops in a moment later.
5. **Slow in, slow out:** every movement eases in and out. Nothing moves at a constant speed.
6. **Moving in arcs:** when a habit is ticked, today's square flies from the tick box into the history strip along a curve. Confetti falls in gentle curving paths.
7. **Secondary action:** the flame next to a streak gives a small flicker as the number rolls up. A to-do's strike-through line draws across from left to right.
8. **Exaggerated feedback:** only for the rare moments (100% confetti, 7/30/100 milestones), which can be big and loud. Single ticks stay small.

**UX rules**
- Keep the layout, tick-box positions, palette size and option counts exactly as in the mockups.
- **Bigger hit area:** a habit tick box responds to taps on the whole right third of its card. To-do checkboxes respond across their row's left area. Small arrows and icon buttons get at least a 44 × 44 px tap area.
- **Feels instant (under 0.4 s):** a tick reacts the moment it's touched, before saving finishes. Screens show their content straight away; decorative animations play after the content is visible.
- **Work like familiar iPhone apps:** slide-up sheets with Cancel / Save and a grabber, a bottom tab bar, swipe left to delete, Apple Calendar–style wording for "This one only / This and future ones / All".
- **Undo after every delete (added 17 Nov 2026):** whenever anything is deleted (an event, to-do, note, list, category, habit, or anything added later), a small "Deleted … · Undo" message shows for a few seconds and Undo puts it back exactly as it was. This is on top of any "are you sure?" question.
- **Quick pin (added 17 Nov 2026):** every note and to-do card inside a list has a small pin button at its top right: hollow when not pinned, filled when pinned. One tap pins it to the top (or un-pins it) without opening it. Lists themselves (the cards on the Lists screen) have NO pin.
- **Be flexible about input:** time and date fields accept loose typing such as "7:30pm", "19:30", "tomorrow" or "next fri". Search ignores capital letters and tolerates small typos.
- Respect the iPhone's "Reduce Motion" setting: if it's on, use simple fades instead of bounces, flying squares and confetti.
