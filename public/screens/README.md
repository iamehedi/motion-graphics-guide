# Screenshot drop folder

Filenames the promo looks for. Missing files fall back to the built-in CSS mockup.

| Filename | Scene | Status |
|---|---|---|
| `deadlines.png` | 03 · Deadlines (NEW) | ✅ Deadline Details |
| `push-notification.png` | 04 · Push alerts (NEW) | ⬜ **missing — using CSS mockup** |
| `support-chat.png` | 05 · Support (NEW) | ✅ Support Management console |
| `home.png` | 06 · New UI (NEW) | ✅ Dashboard |
| `faculty.png` | 07 · Faculty (NEW) | ✅ Faculty |
| `notices.png` | 08 · Notices (NEW) | ✅ Notices + detail sheet |
| `notes.png` | 09 · Notes | ✅ My Notes |
| `class-routine.png` | 10 · Class routine | ✅ Daily Schedule |
| `exam-routine.png` | 11 · Exam routine | ✅ Exam Routine |
| `id-card.png` | 12 · ID card | ✅ My Profile |
| `install.png` | 13 · Install | ⬜ optional, not provided |

Source captures live in `images/` at the project root.

## Specs

- **Resolution:** 1080×2460 (9:20.5). The frame is sized `aspect-ratio: 9 / 19.8` to match,
  so captures are displayed without cropping.
- **Format:** PNG, loaded as `/screens/<name>.png`.
- **Status bar:** keep it in — the frame does not draw its own over a real screenshot.
