"""Synthesize the brag soundtrack: 120 BPM, A minor, 21s. Every event sits on the beat grid from frame 0."""
import sys, wave
import numpy as np

SR = 44100
DUR = 21.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)

def midi(m): return 440.0 * 2 ** ((m - 69) / 12)

def add(sig, t0, gain=1.0, pan=0.0):
    i = int(round(t0 * SR))
    if i >= N: return
    sig = sig[: N - i]
    lg = gain * np.sqrt(0.5 * (1 - pan)); rg = gain * np.sqrt(0.5 * (1 + pan))
    L[i:i + len(sig)] += sig * lg; R[i:i + len(sig)] += sig * rg

def env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)

def bandnoise(dur, lo, hi):
    n = int(dur * SR); x = rng.standard_normal(n)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(n, 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(X, n); return y / (np.abs(y).max() + 1e-9)

def tone(freq, dur, harm=(1, .5, .25), a=.005, d=.3):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(h * np.sin(2 * np.pi * freq * (k + 1) * t) for k, h in enumerate(harm))
    return s * env(n, a, d)

def kick(big=False):
    n = int(.45 * SR); t = np.arange(n) / SR
    f = 45 + (130 if big else 95) * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / (0.32 if big else 0.18))

def hat(): return bandnoise(.06, 7000, 16000) * env(int(.06 * SR), .001, .018)
def clap():
    n = int(.25 * SR); x = bandnoise(.25, 900, 6000)
    e = np.exp(-np.arange(n) / SR / .07)
    for k in (0, .012, .024): e[int(k * SR):int(k * SR) + 60] += .6
    return x * e
def bell(m, dur=1.2, d=.5):
    return tone(midi(m), dur, harm=(1, .0, .35, 0, .12), a=.002, d=d) + .25 * tone(midi(m) * 2.76, dur, harm=(1,), a=.001, d=d * .3)
def pluck(m, d=.22): return tone(midi(m), .6, harm=(1, .45, .22, .1), a=.003, d=d)
def whoosh(dur=.45):
    n = int(dur * SR); x = bandnoise(dur, 800, 9000); t = np.arange(n) / n
    return x * (t ** 2.2) * (1 - np.clip((t - .92) / .08, 0, 1))

# chords per bar (2s): Am F C G  (root midi, triad)
CH = [(45, [57, 60, 64]), (41, [53, 57, 60]), (48, [55, 60, 64]), (43, [55, 59, 62])]
END_DRUMS = 19.0

# ---- pad (whole track, soft)
for bar in range(11):
    t0 = bar * 2.0
    root, tri = CH[bar % 4]
    dur = 2.0 if bar < 10 else 2.4
    for m in tri:
        n = int(dur * SR); t = np.arange(n) / SR
        s = np.sin(2 * np.pi * midi(m) * t) + .3 * np.sin(2 * np.pi * midi(m) * 2.003 * t)
        e = np.minimum(1, t / .25) * np.minimum(1, (dur - t) / .3)
        g = .045 if t0 < 4 else .06
        if t0 >= 20: e *= np.exp(-t / .5)
        add(s * e, t0, g, pan=(m % 3 - 1) * .4)

# ---- drums
nb = int(DUR / BEAT)
for b in range(nb):
    t0 = b * BEAT
    if t0 >= END_DRUMS: break
    add(kick(), t0, .9 if t0 >= 4 else .7)
    add(hat(), t0 + .25, .16, pan=.3)
    if t0 >= 4 and b % 2 == 1: add(clap(), t0, .28, pan=-.1)
    if t0 >= 7.5: add(hat(), t0 + .125, .06, pan=-.3); add(hat(), t0 + .375, .06, pan=-.3)

# ---- bass (8ths) from 4.0
for bar in range(2, 10):
    root, _ = CH[bar % 4]
    for k in range(8):
        t0 = bar * 2 + k * .25
        if t0 < 4 or t0 >= END_DRUMS: continue
        m = root + (12 if k in (3, 7) else 0)
        add(tone(midi(m), .3, harm=(1, .55, .3, .15), a=.004, d=.12), t0, .32)
# bar 9 partial up to 19.0 handled by END_DRUMS

# ---- pluck arps from 7.5 (8ths)
for b in range(int(7.5 / .25), int(END_DRUMS / .25)):
    t0 = b * .25
    root, tri = CH[int(t0 // 2) % 4]
    seq = [tri[0] + 12, tri[1] + 12, tri[2] + 12, tri[1] + 12]
    add(pluck(seq[b % 4]), t0, .085, pan=.35 if b % 2 else -.35)

# ---- SFX (all on grid, in key)
for t0, m in ((0, 81), (.5, 84), (1.0, 88)):      # claim pops: A5 C6 E6
    add(pluck(m, .12), t0, .16, pan=-.2)
add(kick(big=True), 2.0, 1.0)                        # stamp
add(bandnoise(.3, 80, 1500) * env(int(.3 * SR), .001, .06), 2.0, .45)
add(tone(midi(33), 1.0, harm=(1, .3), a=.002, d=.45), 2.0, .55)
for cut in (4.0, 7.5, 10.5, 14.0, 17.0):            # soft swells into each cut
    add(whoosh(.5), cut - .5, .12)
add(bell(88, .8, .25), 10.75, .16); add(bell(93, .8, .3), 11.0, .16)   # notification
for t0 in (12.0, 12.5, 13.25): add(bandnoise(.03, 2000, 8000) * env(int(.03 * SR), .001, .008), t0, .18)  # taps
for i, m in enumerate((72, 76, 79, 84)): add(bell(m, .9, .3), 13.25 + i * .0625, .1)  # posted
xp = [69, 72, 76, 79, 81, 84, 88, 91, 93, 96, 100, 103, 105, 108]       # XP count, 16ths
for i, m in enumerate(xp[:14]):
    add(bell(m - 12, .6, .18), 14.25 + i * .0625, .07, pan=(i % 2 - .5) * .5)
for i, m in enumerate((57, 60, 64, 69)):            # tier stamps
    t0 = 17.0 + i * .5
    add(kick(big=i == 3), t0, .55)
    add(bell(m + 12, 1.6, .6 if i == 3 else .4), t0, .2 if i < 3 else .28)
# final hit at 19.0: A minor stab + crash, ring out
for m in (45, 57, 60, 64, 69, 72, 76):
    add(tone(midi(m), 2.0, harm=(1, .4, .2), a=.003, d=.9), 19.0, .07)
add(kick(big=True), 19.0, .9)
add(bandnoise(2.0, 4000, 15000) * env(int(2.0 * SR), .002, .6), 19.0, .14)
add(bell(81, 2.0, .9), 19.0, .14)

mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.1)
fade = np.ones(N); fl = int(.35 * SR); fade[-fl:] = np.linspace(1, 0, fl)
mix *= fade[:, None]
mix *= 0.89 / np.abs(mix).max()
pcm = (mix * 32767).astype(np.int16)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', sys.argv[1], pcm.shape)
