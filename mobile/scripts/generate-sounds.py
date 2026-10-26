"""Render the webapp's WebAudio tones (webapp/src/lib/fx.ts) to WAV files the app can play.

Each note is an oscillator with the same envelope as `tone()`: exponential ramp from
0.0001 to `vol` over 20 ms, then down to 0.0001 at `dur`. Run: python3 scripts/generate-sounds.py
"""

import math
import struct
import wave
from pathlib import Path

RATE = 44100
OUT = Path(__file__).resolve().parent.parent / "assets" / "sounds"


def osc(kind: str, phase: float) -> float:
    p = phase % 1.0
    if kind == "sine":
        return math.sin(2 * math.pi * p)
    if kind == "square":
        return 1.0 if p < 0.5 else -1.0
    # triangle
    return 4 * p - 1 if p < 0.5 else 3 - 4 * p


def envelope(t: float, dur: float, vol: float) -> float:
    lo = 0.0001
    if t < 0.02:
        return lo * (vol / lo) ** (t / 0.02)
    if t < dur:
        return vol * (lo / vol) ** ((t - 0.02) / (dur - 0.02))
    return 0.0


def render(name: str, notes: list[tuple[float, float, float, str, float]]) -> None:
    """notes: (freq, start, dur, type, vol)"""
    length = max(s + d for _, s, d, _, _ in notes) + 0.06
    buf = [0.0] * int(length * RATE)
    for freq, start, dur, kind, vol in notes:
        s0 = int(start * RATE)
        for i in range(int((dur + 0.05) * RATE)):
            t = i / RATE
            if s0 + i < len(buf):
                buf[s0 + i] += osc(kind, freq * t) * envelope(t, dur, vol)
    peak = max(1.0, max(abs(x) for x in buf))
    OUT.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b"".join(struct.pack("<h", int(x / peak * 32767)) for x in buf))


render("tap", [(660, 0, 0.08, "sine", 0.12)])
render("good", [(f, i * 0.08, 0.3, "triangle", 0.18) for i, f in enumerate([523, 659, 784, 1047, 1319])])
render("bad", [(f, i * 0.18, 0.35, "sine", 0.15) for i, f in enumerate([392, 349, 311, 262])])
render("wrong", [(f, i * 0.12, 0.15, "square", 0.06) for i, f in enumerate([220, 196])])
starts = [0, 0.12, 0.24, 0.36, 0.6, 0.78, 0.9, 1.1]
render("fanfare", [(f, starts[i], 0.8 if i == 7 else 0.2, "square", 0.1) for i, f in enumerate([523, 523, 523, 659, 784, 659, 784, 1047])])
print(f"wrote {sorted(p.name for p in OUT.glob('*.wav'))}")
