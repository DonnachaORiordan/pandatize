# Pandatize – Design spec (approved 14 Nov 2026)

This is the agreed look of my habit tracker + calendar + lists app, **Pandatize** (an iPhone progressive web app). **When building any screen of this app, follow this spec exactly.** Don't redesign anything.

Visual reference: the approved mockups are on a Claude design canvas at https://claude.ai/artifact/LFpV37TDvkH2Rw73cSqDNN (they still say "[App name]" or "Habitizer" in places; the app is called Pandatize). Claude Code can't open that link, so this file is the full description.

What gets built when is in SPEC.md. This file describes how everything looks, including parts that come in later versions.

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
- Calendar categories (version 2): Lecture = Indigo, Assignment due = Red, Exam = Yellow, Work = Teal, Team meeting = Sky, Football = Lime, Social = Pink, Birthday = Orange.

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
- **Countdown cards (version 2):** 156px wide, scrolling sideways. Neutral normally, orange at 3 days or fewer, red at 1 day or fewer.
- **To-do rows (version 2):** round checkboxes. A "Carried over from Mon" chip, and auto-task chips (sparkle + category colour dot + linked event). Done = struck through.
- **Events (version 2):** solid colour blocks. **Deadlines:** a thin coloured line with a flag pill at their exact time. **Now line:** a text-coloured line with a dot.
- **Sheets:** slide up from the bottom, with a grabber bar and Cancel / Title / Save across the top. iOS-style grouped rows inside. The screen behind is dimmed.

## 7. Calendar month view = "open grid" (version 2)
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

### Screen details for version 1
- **Today:** "TUESDAY" (small, uppercase, text2) above "17 November" (32px/800); gear button top right. Then the progress bar. Then (version 1) the Habits section: heading "Habits" with "3 of 5" on the right, and the compact tile grid. (Version 2 adds Now/next, Schedule, To do and Countdowns in this order: header, progress bar, Now/next, Schedule, To do, Habits, Countdowns.)
- **Celebration (all daily habits done today):** the Today screen with a "Perfect day!" card under the progress bar: a ring split into the colours of the daily habits with a check in the middle, "Perfect day!" (28px/800), and "All your daily habits done. That's your Nth perfect day this month." Confetti in the 12 palette colours falls over the top half of the screen.
- **Streak milestone (7, 30, 100):** a full-screen moment: a big orange flame with the number in it, "7-day streak!", the habit's icon and name, "A full week in a row. Next milestone: 30 days.", three badges (7, 30, 100; reached ones filled in the habit colour, others dashed with a small lock), a "Keep going" pill button, a close (X) button top right, and a little confetti.
- **Habits:** title "Habits" (34px/800) with two round buttons on the right: graph and +. Then the progress bar ("Daily habits · Tue 17 Nov"), the week strip, then the habit cards (12px apart).
- **Habit graph ("Progress"):** back link "‹ Habits", title "Progress", a Week / Month / Year switch, a card with ‹ period › arrows (e.g. "November 2026"), the average (44px/800, e.g. "71%") with "of habits done on average", a green comparison line (e.g. "+6% on October"), then ONE line graph (y axis 0%, 50%, 100% with dashed gridlines; a smooth line in the text colour with a faint fill under it and a dot on the latest point). Below: "Per habit" list (icon, name, % or "4 of 5 wks", thin bar in the habit colour). Footnote: "Weekly habits (like Gym, 3× a week) count once a week, on Sunday, when the week (Mon–Sun) closes."
- **Add / edit habit sheet:** Cancel / "New habit" or "Edit habit" / Save. A live preview card. Title field. Colour: the 12 swatches + a custom colour-wheel button (7 per row). Icon: a grid of 12 line icons (book, dumbbell, chess pawn, moon, stretching person, water drop, pen, music note, leaf, heart, coffee cup, code brackets). Frequency: "Every day | Times per week" switch, and a − 3 + stepper for times per week, with the note "Weeks run Monday to Sunday." When editing: Archive and Delete buttons side by side at the bottom (Delete in red).

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
3. **Staging (one thing at a time):** the celebration plays in order: the progress bar fills, then "Perfect day!" appears, then confetti. In the add/edit item sheet (version 2), switching Event / Deadline / All-day briefly highlights the time fields that changed.
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
- **Be flexible about input (version 2):** time and date fields accept loose typing such as "7:30pm", "19:30", "tomorrow" or "next fri". Search ignores capital letters and tolerates small typos.
- Respect the iPhone's "Reduce Motion" setting: if it's on, use simple fades instead of bounces, flying squares and confetti.
