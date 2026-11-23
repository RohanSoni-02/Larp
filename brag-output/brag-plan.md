# larpr: brag plan

**Format:** landscape 1920×1080, 30fps, 21.0s · **Tone:** `default` with a straight-faced edge: playful and clean, and the joke is the product's own line, "Everyone starts out larping."

## Rubric
- **What is it?** A Strava for skills: log practice in any hobby, prove it, watch the hours add up.
- **Who is it for?** People learning piano, pottery, lifting or pen spinning who want their progress to be real and seen.
- **What sets it apart?** Proof. You don't just log time: a surprise *Larp Check* asks for a photo of the work and your face within two minutes. Tiers go Larping → Apprentice → Adept → Legit.
- **Most impressive/funny claim:** "Everyone starts out larping. This is where you stop pretending."
- **Visual hook:** Three familiar hobby brags, then a purple **LARPING** stamp slams over all of them.
- **Real UI shown:** the welcome screen's fanned proof cards, the dark Focus timer, the Larp Check dual-photo stage with its countdown pill, the XP celebration screen, and the tier stamps (`Stamp`). Colors, fonts (Bricolage Grotesque, Inter, Barlow Condensed), logo mask and copy all come from `src/theme` and the screens.
- **Share caption:** "Everyone starts out larping. larpr is where you stop pretending."

**Privacy:** no seed users, emails or DB rows appear. The photos in the Larp Check are the app's own procedural `Art` covers (placeholders), and the selfie is a generic silhouette.

## Music
120 BPM (one beat every 0.5s, one bar every 2s), A minor / C major. Synth kick, offbeat hats, sub bass and plucks, all synthesized. Every cut lands on a beat. SFX are tuned into the key: a low thump on the stamp, soft filtered-noise swells into cuts, chime arpeggios on XP and the tier ladder.

## Storyboard
| # | Time | Scene | On screen | Audio |
|---|---|---|---|---|
| 1 | 0.0–4.0 | **Hook** | White canvas. Three claims type in at 0.0, 0.5 and 1.0s: "Learning piano." "Basically a potter." "Day 1 of calisthenics." At 2.0s a tilted purple **LARPING** stamp slams across them. | Kick and hats from frame 0; low stamp thud at 2.0 |
| 2 | 4.0–7.5 | **Reveal** | larpr wordmark, "Everyone starts out larping." and "A Strava for skills." on the left; on the right a phone with the three proof cards fanning out (Pottery 80 min · Bouldering Landed · Piano 12 day streak). | Swell into the cut, then bass enters |
| 3 | 7.5–10.5 | **Log it** | "Log the practice." Phone on the dark Focus screen: ring fills, clock ticks on each beat (04:12 → 04:07), "Scales" block, Pause button. | Soft tick on each second |
| 4 | 10.5–14.0 | **Prove it** | Night-purple background. "Larp Check." plus "Two minutes. Your work and your face. No do-overs." A phone with a notification drop, then the dual-photo stage with the selfie inset, and the timer pill counting 1:52 → 1:49; taps add the work photo, then the selfie, then Post. | Notification blip on beat |
| 5 | 14.0–17.0 | **Watch it add up** | Celebration screen: gold "+95 XP" counts up, "Piano practice, banked." Highlight rows: "12-day streak" and "Two-hand scales landed on your tree". | Chime run during the count |
| 6 | 17.0–21.0 | **Punchline** | Four tier stamps land on beats: Larping, Apprentice, Adept, then **Legit** in gold (17.0/17.5/18.0/18.5). At 19.0: "Stop pretending." plus the larpr wordmark. | Rising chimes, final hit at 19.0, ring-out |

Poster: the settled reveal frame (6.67s): wordmark, headline and fanned proof cards. It is baked in as frame 0.
