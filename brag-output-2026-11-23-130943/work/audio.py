"""Ep 2 soundtrack: 120 BPM gym beat in A minor, thin until DAY 240 (16.5s), then heavy. 25s, all events on the grid."""
import sys, wave
import numpy as np

SR = 44100; DUR = 25.0; N = int(SR * DUR); BEAT = .5
rng = np.random.default_rng(11)
L = np.zeros(N); R = np.zeros(N)
DROP = 16.5; END = 22.5

def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
def add(sig, t0, gain=1.0, pan=0.0):
    i = int(round(t0 * SR))
    if i >= N: return
    sig = sig[:N - i]
    L[i:i+len(sig)] += sig * gain * np.sqrt(.5 * (1 - pan)); R[i:i+len(sig)] += sig * gain * np.sqrt(.5 * (1 + pan))
def env(n, a=.005, d=.3):
    t = np.arange(n) / SR; return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def bandnoise(dur, lo, hi):
    n = int(dur * SR); X = np.fft.rfft(rng.standard_normal(n)); f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0; y = np.fft.irfft(X, n); return y / (np.abs(y).max() + 1e-9)
def tone(freq, dur, harm=(1, .5, .25), a=.005, d=.3):
    n = int(dur * SR); t = np.arange(n) / SR
    return sum(h * np.sin(2 * np.pi * freq * (k + 1) * t) for k, h in enumerate(harm)) * env(n, a, d)
def kick(big=False):
    n = int(.5 * SR); t = np.arange(n) / SR; f = 42 + (140 if big else 100) * np.exp(-t * 26)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (.34 if big else .2))
def hat(d=.018): return bandnoise(.07, 7000, 16000) * env(int(.07 * SR), .001, d)
def clap():
    n = int(.28 * SR); x = bandnoise(.28, 900, 6500); e = np.exp(-np.arange(n) / SR / .08)
    for k in (0, .011, .022): e[int(k*SR):int(k*SR)+70] += .7
    return x * e
def b808(m, dur):
    n = int(dur * SR); t = np.arange(n) / SR; f = midi(m) * (1 + .6 * np.exp(-t * 40))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR); s = np.tanh(s * 1.8)
    return s * np.minimum(1, t / .004) * np.exp(-t / (dur * .7))
def bell(m, dur=1.0, d=.4):
    return tone(midi(m), dur, harm=(1, 0, .35, 0, .12), a=.002, d=d) + .25 * tone(midi(m) * 2.76, dur, harm=(1,), a=.001, d=d * .3)
def pop(m): return tone(midi(m), .25, harm=(1, .2), a=.002, d=.05)
def clank():  # metal plate: inharmonic partials
    n = int(.9 * SR); t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, a, d in ((220, 1, .35), (523, .6, .25), (1187, .45, .15), (2633, .3, .08), (3911, .2, .05)))
    return s / 2 + bandnoise(.9, 1500, 9000) * env(n, .001, .02) * .6
def rattle(dur):
    n = int(dur * SR); out = np.zeros(n)
    for k in range(int(dur / .055)):
        i = int(k * .055 * SR + rng.integers(0, 300)); c = bandnoise(.03, 2500, 9000) * env(int(.03 * SR), .001, .006)
        out[i:i+len(c)] += c[:max(0, n - i)] * (.4 + .6 * rng.random())
    return out
def whoosh(dur=.5):
    n = int(dur * SR); x = bandnoise(dur, 700, 8000); t = np.arange(n) / n; return x * t ** 2.2

CH = [(45, [57, 60, 64]), (41, [53, 57, 60]), (48, [55, 60, 64]), (43, [55, 59, 62])]

# pad
for bar in range(13):
    t0 = bar * 2.0; root, tri = CH[bar % 4]; dur = 2.0
    if t0 >= END: break
    for m in tri:
        n = int(dur * SR); t = np.arange(n) / SR
        s = np.sin(2*np.pi*midi(m)*t) + .3*np.sin(2*np.pi*midi(m)*2.003*t)
        add(s * np.minimum(1, t/.2) * np.minimum(1, (dur-t)/.25), t0, .035 if t0 < DROP else .05, pan=(m % 3 - 1) * .4)

# drums: thin before the drop, heavy after
for b in range(int(END / BEAT)):
    t0 = b * BEAT
    if t0 < DROP:
        if b % 2 == 0 or t0 >= 7: add(kick(), t0, .6)
        add(hat(), t0 + .25, .13, pan=.3)
    else:
        add(kick(big=b % 2 == 0), t0, .95)
        add(hat(), t0 + .25, .18, pan=.3); add(hat(.01), t0 + .125, .07, pan=-.3); add(hat(.01), t0 + .375, .07, pan=-.3)
        if b % 2 == 1: add(clap(), t0, .34)
    if 7 <= t0 < DROP and b % 2 == 1: add(clap(), t0, .16)
# bass: light plucks 7–16.5, 808 after drop
for b in range(int(7 / .5), int(END / .5)):
    t0 = b * .5; root, _ = CH[int(t0 // 2) % 4]
    if t0 < DROP: add(tone(midi(root), .3, harm=(1, .5, .25), a=.004, d=.1), t0, .22)
    elif b % 2 == 0: add(b808(root - 12 + 12, .9), t0, .55)

# SFX
add(pop(81), 0.0, .25); add(pop(84), 1.0, .25)                       # DMs
add(kick(big=True), 2.0, 1.0); add(tone(midi(33), 1.0, harm=(1, .3), a=.002, d=.45), 2.0, .5)
add(bandnoise(.3, 80, 1500) * env(int(.3*SR), .001, .06), 2.0, .4)  # stamp
add(clank(), 3.5, .28); add(rattle(3.0), 3.9, .12, pan=-.2)          # empty bar wobble
for cut in (7.0, 10.0, 13.0, 20.5): add(whoosh(.5), cut - .5, .1)
for i, m in enumerate((69, 72, 76)): add(bell(m + 12, .9, .3), 7.5 + i * .5, .12)  # nodes light
add(tone(midi(45), 2.5, harm=(1, .3), a=.4, d=1.2), 10.0, .12)       # slow-mo swell
add(bandnoise(.03, 2000, 8000) * env(int(.03*SR), .001, .008), 9.5, .2)  # tap start
add(bell(76, .7, .2), 11.5, .12)                                    # flare flag
add(bandnoise(.03, 2000, 8000) * env(int(.03*SR), .001, .008), 14.0, .2)
for t0, m in ((13.5, 88), (14.5, 91), (15.5, 93)): add(bell(m, .6, .18), t0, .1); add(bell(m + 5, .6, .18), t0 + .0625, .08)  # kudos toasts
add(kick(big=True), DROP, 1.0); add(bandnoise(1.0, 3000, 14000) * env(int(1.0*SR), .002, .25), DROP, .16)  # DAY 240 drop
for i, m in enumerate((57, 60, 64, 69)): add(bell(m + 12, 1.2, .35 if i < 3 else .6), 17.5 + i * .5, .17 if i < 3 else .25)
add(tone(midi(33), 1.2, harm=(1, .3), a=.002, d=.5), 19.0, .45)      # Legit stamp
add(pop(81), 20.5, .25); add(pop(84), 21.0, .25)
add(clank(), 21.5, .2)
for m in (45, 57, 60, 64, 69, 72, 76): add(tone(midi(m), 2.5, harm=(1, .4, .2), a=.003, d=1.0), END, .07)
add(kick(big=True), END, .9); add(bandnoise(2.0, 4000, 15000) * env(int(2.0*SR), .002, .6), END, .12); add(bell(81, 2.5, 1.0), END, .14)

mix = np.tanh(np.stack([L, R], 1) * 1.1)
fl = int(.4 * SR); mix[-fl:] *= np.linspace(1, 0, fl)[:, None]
mix *= .89 / np.abs(mix).max()
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('wrote', sys.argv[1])
