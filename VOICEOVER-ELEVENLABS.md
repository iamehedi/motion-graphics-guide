# CST Portal — Promo Voice-over (ElevenLabs)

Total runtime: **77.2 s** (13 scenes) · Language: **Bengali (বাংলা)**

> **Implementation note.** A single continuous take was generated and lives at
> `public/voiceover.mp3` (77.166 s). Because one block drifts from fixed scene
> cuts, the promo timeline was re-timed to the narration instead: each scene's
> `duration` in `src/promo/scenes.js` is the gap between its line's start and
> the next line's start, so every cut lands when its line begins. The per-scene
> take list below is kept for reference (the multi-take workflow is not used).

---

## 1. Paste-ready text

One scene per line. Generate **each line as its own take**, then place them on the
timeline at the offsets in section 3 — do not generate it as one block, or the
pacing will drift away from the scene cuts.

```text
সিএসটি পোর্টাল — সিএসটি ডিপার্টমেন্টের অফিসিয়াল অ্যাপ। নোটিশ, নোট, রুটিন আর পরীক্ষা।
পোর্টালে এলো বড় আপডেট — পাঁচটি নতুন ফিচার, নতুন ডিজাইন।
ডেডলাইন আর মিস হবে না — পরীক্ষা, অ্যাসাইনমেন্ট আর প্র্যাকটিক্যাল, সব লাইভ কাউন্টডাউনসহ।
নোটিশ প্রকাশের সাথে সাথেই পুশ নোটিফিকেশন — ট্যাপ করলেই অ্যাপে খুলে যাবে, অ্যাটাচমেন্টসহ।
সাপোর্টের সবকিছু অ্যাপের ভেতরেই — টিকিট তৈরি থেকে সমাধান, এক কনসোলে।
একেবারে নতুন লুক — নতুন ড্যাশবোর্ড, ডার্ক ও লাইট থিম, আর সহজ নেভিগেশন।
ফ্যাকাল্টি ডিরেক্টরি নতুন করে সাজানো — সার্চসহ, আর এক ট্যাপে কল।
নোটিশ পড়ার জন্যও নতুন ডিজাইন — পরিষ্কার ফিড, অ্যাটাচমেন্ট অ্যাপের ভেতরেই।
সব নোট, বিষয় অনুযায়ী — PDF আর ছবি এক লাইব্রেরিতে।
ক্লাস রুটিন — পুরো সপ্তাহ এক নজরে, সময় আর রুমসহ রিমাইন্ডার।
মিড, ফাইনাল আর ক্লাস টেস্ট আলাদা সেকশনে — প্রতিটির আগে রিমাইন্ডার।
স্টুডেন্ট আইডি কার্ড আর প্রোফাইল এক জায়গায় — তথ্য সবসময় হালনাগাদ।
সিএসটি পোর্টাল নিন — সম্পূর্ণ ফ্রি। রিলিজ পেজ থেকে APK ডাউনলোড করে ইনস্টল করুন।
```

---

## 2. Voice settings

| Setting | Value |
|---|---|
| Language / model | Bengali — `eleven_multilingual_v2` (or `v3`) |
| Voice type | Male, mid-low, warm/confident — promo-narration style |
| Stability | 0.45 – 0.55 (natural variation, not robotic) |
| Similarity boost | 0.75 – 0.85 |
| Style / speed | Style 0.2–0.3 · Speed **1.0** (do not speed up; scenes are timed) |
| Quality | 44.1 kHz MP3 or WAV |
| Format | Mono is fine — it gets mixed under the synth bed anyway |

**Pronunciation hints** (add these as glossary/pace rules if the model misreads):

| Written | Should sound like |
|---|---|
| সিএসটি | CST |
| প্র্যাকটিক্যাল | Practical |
| অ্যাসাইনমেন্ট | Assignment |
| অ্যাটাচমেন্টসহ | Attachments-saho |
| ড্যাশবোর্ড | Dashboard |
| APK | A-P-K |
| PDF | P-D-F |
| হালনাগাদ | hal-nagad |

---

## 3. Timeline / scene map

Place each take at its **start** offset. A take may run to the end of its scene
plus a ~0.3 s tail into the next cut.

Line starts below were recovered from `public/voiceover.mp3` (alternating
short intra-line / longer inter-line pauses). Each scene's `duration` equals the
next line's start minus its own.

| # | Scene id | Start | End | Duration | Words | Line (short) |
|---|---|---|---|---|---|---|
| 1 | `splash` | 0.000 s | 7.591 s | 7.591 s | 11 | সিএসটি পোর্টাল — অফিসিয়াল অ্যাপ |
| 2 | `upgrade` | 7.591 s | 12.458 s | 4.867 s | 9 | বড় আপডেট — ৫টি নতুন ফিচার |
| 3 | `deadlines` | 12.458 s | 19.055 s | 6.597 s | 12 | ডেডলাইন মিস হবে না |
| 4 | `push` | 19.055 s | 25.510 s | 6.455 s | 12 | পুশ নোটিফিকেশন |
| 5 | `support` | 25.510 s | 31.161 s | 5.651 s | 10 | সাপোর্ট সিস্টেম |
| 6 | `redesign` | 31.161 s | 37.762 s | 6.601 s | 12 | নতুন লুক / নতুন UI |
| 7 | `faculty` | 37.762 s | 43.211 s | 5.449 s | 10 | ফ্যাকাল্টি ডিরেক্টরি |
| 8 | `notices` | 43.211 s | 48.797 s | 5.586 s | 10 | নোটিশ ডিজাইন |
| 9 | `notes` | 48.797 s | 54.048 s | 5.251 s | 9 | সব নোট, বিষয় অনুযায়ী |
| 10 | `routine` | 54.048 s | 59.713 s | 5.665 s | 10 | ক্লাস রুটিন |
| 11 | `exams` | 59.713 s | 65.269 s | 5.556 s | 10 | পরীক্ষার সেকশন |
| 12 | `idcard` | 65.269 s | 70.733 s | 5.464 s | 10 | আইডি কার্ড ও প্রোফাইল |
| 13 | `cta` | 70.733 s | 77.166 s | 6.433 s | 13 | ইনস্টল করুন — সম্পূর্ণ ফ্রি |

Cumulative offset check: 0 → 77.166 s = `TOTAL_DURATION` in `src/promo/scenes.js`.

---

## 4. Timing rules

- **Scene 3, 4, 6, 13** are the longest lines — if a take runs over its window,
  shorten that line (see fallbacks below), never speed the audio up.
- Allow a 0.2–0.3 s lead-in after each scene cut so the whoosh/riser cue lands first.
- Line 13 may run ~0.5 s past the scene end into the final frame; that is fine.
- Regenerate a take if it exceeds its window by more than 0.4 s.

### Short fallbacks (if a take runs long)

| Scene | Use instead |
|---|---|
| `deadlines` | আর কখনো ডেডলাইন মিস হবে না — সব লাইভ কাউন্টডাউনসহ। |
| `push` | নোটিশ প্রকাশের সাথে সাথেই পুশ নোটিফিকেশন — ট্যাপ করলেই অ্যাপে খুলে যাবে। |
| `redesign` | একেবারে নতুন লুক — নতুন ড্যাশবোর্ড, নতুন থিম, সহজ নেভিগেশন। |
| `cta` | সিএসটি পোর্টাল নিন — সম্পূর্ণ ফ্রি। রিলিজ পেজ থেকে APK ডাউনলোড করুন। |

---

## 5. Mix notes

- Duck the synth bed (`bedBus` in `src/promo/audio.js`) by **~8 dB** while VO plays;
  restore over ~0.4 s after each line.
- Keep SFX cues (`whoosh`, `impact`, `ping`) at full level — they sit between lines.
- VO target: **−16 LUFS integrated**, peaks below **−1 dBTP**.
- Fade the whole VO track in 0.15 s at 0.0 s and out 0.4 s at 55.6 s.

---

## 6. Deliverables checklist

- [ ] 13 takes generated (one per scene), Bengali, multilingual v2/v3
- [ ] Each take checked against its duration window
- [ ] WAV/MP3 exports named `01-splash.mp3` … `13-cta.mp3`
- [ ] Mixed under the promo bed with ducking
- [ ] Exported MP4 muxed with the final VO track
