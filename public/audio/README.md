# Audio

## Sound effects — using the built-in synth cues

The promo is currently using its **built-in synthesised SFX** (the Web Audio cues
in `src/promo/audio.js`). These are what played before the sample pack and are the
ones kept after review.

Any file dropped in here with a matching name **overrides** its synth cue, so the
engine always prefers a real file when one exists.

### Optional: the CC0 sample pack

A set of 10 CC0 (public-domain) cues from the *cinematic* theme of
[romainsimon/uisfx](https://github.com/romainsimon/uisfx) is parked in
**`audio-pack/`** at the project root (not served). To switch to it:

```bash
mv audio-pack/*.mp3 public/audio/
```

To go back to the synth cues:

```bash
mv public/audio/*.mp3 audio-pack/
```

| File | Overrides cue |
|---|---|
| `whoosh.mp3` | scene transitions |
| `impact.mp3` | scene hit accents |
| `riser.mp3` | build-ups (splash / CTA) |
| `pop.mp3` | cards / bullets landing |
| `ping.mp3` | push-notification ping |
| `blip.mp3` | small UI blips |
| `tick.mp3` | countdown ticks |
| `chime.mp3` | soft chimes |
| `key.mp3` | keyboard taps |
| `success.mp3` | success sting (CTA end) |

### Replacing individual cues

Drop a royalty-free file with the same name here to override just that cue —
transition swooshes **0.4–0.9 s** with no leading silence, UI cues **< 300 ms**.
Browse routes: https://pixabay.com/sound-effects/search/motion/ ·
https://pixabay.com/sound-effects/search/whoosh/

## Background music

Not bundled. The synth pad bed plays when `music.mp3` is absent. Add a looping
track as `public/audio/music.mp3` and the engine loops it and ducks it under the
voice-over automatically. Pick **60–90 s, no vocals, mid-tempo**.
