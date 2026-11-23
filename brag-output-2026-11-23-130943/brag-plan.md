# larpr Ep 2 "Yeah, I bench 225.": brag plan

**Format:** vertical 1080×1920, 30fps, 25.0s · **Tone:** `default`, played as a gym-TikTok skit. The reference script (`ep02-bench-script.md`) is the brief; it's cut from 34s to 25s because brag keeps launch videos under 25s.

## Rubric
- **What is it?** larpr, a Strava for skills: log practice, prove it on video, post it, and climb from Larping to Legit.
- **Who is it for?** Anyone who has ever inflated their hobby. Here that's the gym guy who "benches 225".
- **What sets it apart?** Lifts only count on video. The slow-mo coach controls catch bad form, and kudos come from people who actually lift.
- **Funniest claim:** "Yeah, I bench 225." Then the spotter is doing all the work on an empty bar.
- **Visual hook:** a DM exchange, then the purple LARPING stamp slams over it.
- **Real UI shown:** the Calisthenics **Strength** branch (Bench 135 lb → 185 lb → 225 lb, from `supabase/seed.sql`), `VideoProof` with "Slow-mo 0.25×" and the 0.25/0.5/1× controls, a `PostCard` with the real kudos chips (Clean technique · Solid form · I learned something), `TierPill` and `Stamp`, and the "225 lb bench" Standard copy.
- **Share caption:** "What's your gym larp? Wrong answers only."

**Privacy:** Marcus, Priya and the commenters are fictional (from the script). No seed users or database rows appear, and the bench clip is a flat illustration.

## Music
120 BPM: a thin gym-playlist beat (kick and hats) that drops into a heavier 808-and-clap groove at DAY 240 (16.5s). Plate clanks, message pops and kudos blips are all on the beat grid, and the stamp thuds are tuned to A.

## Storyboard (safe zone: readable text between y 250 and 1536)
| # | Time | Scene | On screen | Audio |
|---|---|---|---|---|
| 1 | 0.0–3.5 | Hook | Dark gym. DM bubbles: Priya "How much do you bench?" (0.0), Marcus "Yeah, I bench 225. 💪" (1.0). LARPING stamp slams (2.0). | Pops on 0/1, stamp thud 2.0 |
| 2 | 3.5–7.0 | Reality | LED interval timer `DAY 001`. Illustration: Marcus shaking under the **empty bar**, the spotter's two fingers doing the work. "He did not bench 225." | Bar rattle, plate clank |
| 3 | 7.0–10.0 | Tree | "Lifts only count on video." Phone with the Strength branch: three nodes light up, each tagged "Video required". | Chimes 7.5/8.0/8.5 |
| 4 | 10.0–13.0 | Slow-mo | "Slow-mo doesn't lie." `VideoProof` at 0.25×: a slow rep, then a coach ring on the elbow: "Elbows flaring". | Low swell |
| 5 | 13.0–16.5 | Post it | "Post it. Get kudos from people who'd know." PostCard: "Paused at the chest. Bar path fixed." Solid form kudos tick up, and kudos toasts from strangers slide in. | Blips on beats |
| 6 | 16.5–17.5 | Time jump | LED `DAY 240`. | Beat drops heavy |
| 7 | 17.5–20.5 | Climb | Tier pill climbs Larping → Apprentice → Adept → Legit (17.5/18/18.5/19), "Bench 225 lb · Landed", gold stamp. "He stopped faking it." | Step chimes, thud 19.0 |
| 8 | 20.5–22.5 | Payoff | DM reprise: "How much do you bench?" → "225. Here's the video." with a clip bubble: two plates a side, a clean paused rep, Legit tick. | Pops, plate clank 21.5 |
| 9 | 22.5–25.0 | End card | larpr wordmark. "Fake it till you make it. We'll track the making." | Final hit, ring-out |

Poster: the hook's settled stamp frame (~3.0s), which is the most scroll-stopping frame. It is baked in as frame 0.
