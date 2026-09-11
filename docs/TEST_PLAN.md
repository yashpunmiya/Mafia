# Milestone 5 Test Plan

## Mobile Quick Discussion checklist

0. Enter on mobile and confirm the lobby keeps the movement joystick and Explorer emote control, while jump, crosshair, interaction, primary, secondary, numbered action buttons and `+` overflow are absent. Start a match: the joystick must disappear for each living participant and return for spectators/Game Over/new lobby. Confirm camera, native chat/voice and every game UI control still work. Leave the scene and confirm the Explorer restores its normal controls.

1. Start a four-player match and reach Discussion. All four living clients must show the same feed and approximately 45-second timer.
2. On one phone, tap `SUSPECT`, choose each accusation form, then choose another living player. Confirm the server-rendered sentence appears on all clients and self is absent.
3. Tap `DEFEND` and `REACT`; verify one-tap phrases appear publicly and require no keyboard.
4. From the Mafia client, claim Detective. From a Villager, claim Doctor. Both must be accepted and the real roles must remain private.
5. Make a deliberately false `I CHECKED [PLAYER]: MAFIA/NOT MAFIA` claim. It must publish without changing the real Detective's private result.
6. Have two players claim Detective. Desktop must show both on `CLAIMS - NOT VERIFIED` with a conflict warning. Mobile must show them after tapping `CLAIMS`.
7. Change one player's role claim. The board must replace only that player's public claim.
8. Send twice within 1.5 seconds. The second request must be rejected cleanly; after the cooldown, sending must work again.
9. Kill/eliminate a participant, then reach the next Discussion. The dead client and a sixth spectator must read the feed, see the spectator warning, and have disabled category controls.
10. Let the timer expire. All clients must transition to the unchanged private Voting screen; discussion statements must not become votes or reveal totals.
11. On mobile, test with native chat closed and open. The panel must remain inside the reported interactable area; TAKE YOUR COUNCIL SEAT must not overlay Discussion; CLAIM and REACT must show all three phrase rows above the category bar with no clipping; notch and home indicator must stay clear. Confirm the 3D scene outside the council panel is no longer dimmed.
12. On desktop, verify platform voice still works while Quick Discussion is visible. The scene must not request a custom microphone or replace native chat.
13. On a narrow phone, visit Role Reveal, every Night role screen, Voting, Detective Result, Elimination, Game Over and How to Play. Only each card may be dark; the full-screen area around it must remain transparent. Long player names, announcements, errors, recap lines and all buttons must stay inside their panels without clipping or overlap.

## Lobby follow-up checks

- Mobile app: retry SIT in the current build. If it fails, record whether it says "Chair movement failed" or "Chair reached; animation failed to load" and capture the corresponding `[SEATING:move]` / `[SEATING:pose]` error. A passing desktop test is not mobile verification.

1. Tap MINIMIZE: large panel disappears, compact OPEN LOBBY stays usable, scene movement/camera input works. Restore it and verify Ready is unchanged.
2. Open all three How to Play tabs on desktop/mobile. Check every paragraph and all four role illustrations fit; close returns to the lobby.
3. With both avatar body shapes, sit in each of the five chair positions. Hips should meet the cushion, face the fire and stay seated for at least 30 seconds. Compare from a second client.
4. In the lobby, walk or tap STAND UP and confirm the loop stops. During an active match, walking/jump must remain disabled and an interrupted pose or reconnect must automatically recover the same assigned chair. Die and Play Again: movement returns and no stale seated state remains.
5. Reopen the scene and rotate the camera around the MAFIA noticeboard: its text should remain mounted to the board without following the camera.

## Courtyard / seating / cards regression

- Inspect the updated village facades, dormers, chimneys and monument arches on mobile and desktop. Verify house/wall collision and unobstructed council access. Compare `docs/village-preview.png` for geometry only; Explorer lighting differs from the offline render.
- All five cushions were lowered 10cm. Test both avatar body shapes in every chair: hips should rest on the cushion, not sink inside it. A passing asset-height test does not certify live retargeting.

- Walk into houses, low walls, lantern pillars, tree trunks, pergola posts, benches, the monument and chair backs: these should stop movement. Entry gaps and routes between chairs remain passable. Decorative foliage and chair cushions intentionally have no physics.
- Lobby: the large SIT AT COUNCIL button is beside READY TO PLAY. It must show feedback and become STAND UP / LEAVE SEAT. Test before Ready, after Ready, and after a reconnect.
- Check illustrated role quadrants: Mafia mask, Doctor vial, Detective magnifier, Villager wheat. Private screens must never show another player's role. Final role cards use only the server's public reveal list.
- Verify every action board fits five Doctor targets without shrinking the touch cards, and portrait/voting/role/result/game-over text and Confirm buttons remain inside frames.

- Reopen the scene and restart preview to reload the changed GLB. The imported courtyard center must coincide with the existing fire at SDK (8, 0, 8), not appear beside the floor.
- Use four then five distinct identities. TAKE YOUR COUNCIL SEAT should place each avatar on a different throne, facing the fire. Inspect actual seated pose in third person, for both body shapes. Walk/LEAVE SEAT must allow exit; elimination must release seating. Built-in emote compatibility is not proven by TypeScript tests.
- Reconnect and eliminate one participant: survivors keep their original chairs. Ready Again must permit seating in the new lobby.
- Test role reveal, five Doctor cards, other night cards and voting on mobile landscape. Check text wraps, Confirm remains visible, selected cards highlight, and reconnect restores the submitted target highlight without exposing another player's selection.
- Automated tests now additionally cover seat eligibility/stability and actual exported cushion positions against named anchors, using the verified import transform.


## Automated commands

Run from the project root:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

The 48 gameplay tests cover the Milestones 1-3 regressions; Milestone 4 voting, elimination, wins and repeated rounds; and Milestone 5 wrong-phase/stale/invalid discussion rejection, living-only speakers and targets, deliberate bluffing, latest public claims, cooldown, bounded history, identity privacy and reset cleanup. Seating/asset regressions run afterward.

## Exact manual 4-5 player checklist

Use Creator Hub Preview with distinct identities. Do not deploy.

### A. Four-player baseline and Discussion

1. Open four clients, wait for `Private channel: verified`, ready all four, and record the roles only for test coordination.
2. Complete a night that does not end the game. Confirm the server-resolved Morning appears before Discussion.
3. Confirm Discussion lasts approximately 45 seconds and all living clients show a large `DISCUSS — WHO IS THE MAFIA?` prompt and readable countdown.
4. Confirm the scene does not add voice controls or a custom voice channel; use Decentraland platform voice if desired.
5. Confirm a dead participant, if present, sees exactly `SPECTATING — Don't reveal secret information.` and no actionable Discussion/Voting UI.

### B. Normal private vote and authoritative elimination

6. At Voting, confirm every living client sees large cards for other living players only; self, dead players, and spectators are absent.
7. Select a card without confirming. Verify no other client changes and no public live total appears.
8. Confirm one vote. Verify only that client shows its locked target and cannot change it.
9. Disconnect and reconnect one voter after confirming. Verify the same identity recovers only its own locked vote.
10. Have all living players vote for one non-Mafia target. Verify Voting ends early when the last eligible vote arrives, even if time remains.
11. Confirm the server enters Elimination, marks that player dead/spectator, and publicly reveals only that eliminated player's role.
12. Inspect every other living player's role: none may appear in public state, UI, entity names, or logs.
13. On the next night, verify the eliminated player sees the spectator warning and cannot submit any action.

### C. Voting timeout

14. In another round/match, leave at least one living player unvoted. Confirm Voting resolves only when its timer expires.
15. Verify the missing vote does not create a default vote and no live totals or voter-to-target mapping becomes public.

### D. First tie and runoff

16. Create a first-ballot top tie (for four living players, split votes 2-2 between two candidates).
17. Confirm the phase becomes `RUNOFF VOTING`, the timer is approximately 10 seconds, and only the two tied candidates appear on cards.
18. Confirm all living players remain eligible voters, subject to no self-vote; dead players and spectators remain blocked.
19. Resolve the runoff with one unique leader. Verify only that candidate is eliminated and their role is public.

### E. Second tie

20. Create another first tie, then tie the runoff again.
21. Confirm the second tie creates no third ballot, nobody is eliminated, and the Elimination screen states that nobody leaves.
22. Confirm the match proceeds to the next Night if neither team has won.

### F. Repeated round and Doctor restriction

23. Verify the round number increments exactly once and surviving identities retain the same roles.
24. Verify previous night selections, Detective result, vote acknowledgement, runoff candidates, and temporary elimination display are cleared.
25. Have the Doctor try to protect the same player as the previous night. Confirm that target is unavailable in the UI and a forged/direct intent is rejected by the server.
26. Confirm the Doctor can protect a different living player, including themself when that is not the previous target.
27. Confirm a player killed at night or eliminated by vote cannot act or vote in later rounds.

### G. Village win

28. Vote out the Mafia. Confirm the server computes Village victory, shows the Mafia elimination/reveal, then enters Game Over.
29. Confirm Game Over says `VILLAGE WINS`, reveals all 4-5 roles, and shows a compact recap without voter mappings or private targets.

### H. Mafia parity win

30. Start a fresh match and reach a state where living Mafia equals living non-Mafia, normally after an authoritative night kill.
31. Confirm the server ends the match without waiting for another vote and Game Over says `MAFIA WINS`.
32. If the Detective submitted on that terminal night, confirm only the Detective client receives its targeted result before/finally alongside the now-public final reveal.

### I. Five players and overflow spectator

33. Repeat the core loop with five active clients. Confirm exactly one Mafia, Doctor, Detective and two Villagers.
34. Add a sixth client. Confirm it remains spectator, cannot ready mid-match, receives no role/night/vote private state, and sees the spectator warning during actionable phases.
35. Confirm every living fifth player appears as a valid night/vote target when rules permit.

### J. Play Again and cleanup

36. At Game Over, confirm only original match participants have an enabled `PLAY AGAIN` button; a sixth spectator cannot restart.
37. Press Play Again. Confirm everyone returns to a clean lobby and must use the normal Ready flow again.
38. Inspect UI/public state: winner, all role reveals, recap, dead flags, round, runoff candidates, elimination, night targets, vote targets, private results, and ready flags must be reset.
39. Start a second match. Confirm roles are newly assigned and no old private acknowledgement or result can be recovered with a stale match/round request.

### K. Security and console audit

40. During active Night/Voting, inspect synchronized state and all logs. It may show roster/living/phase/timers and public outcomes only.
41. Confirm it never shows living-player roles, night actor→target, Doctor history, Detective result, voter→target, nonces, or live vote totals.
42. Confirm runoff candidate identities appear only after the first ballot has resolved.
43. Confirm eliminated-role data appears only after daytime resolution and complete role data appears only at Game Over.
44. Check all client/server consoles for `RemoteError`, `JavaScriptError`, schema, validation, spoofed-message, or retry-loop errors.

## Mobile checks

- Discussion title/countdown fit and remain readable.
- Voting and Runoff cards are easy to select with touch; Confirm is large and clearly disabled before selection/after lock.
- Up to five rows fit without overlap or clipping.
- Essential cards and buttons stay clear of native bottom-right controls, notch, and home indicator.
- Spectator warning, Elimination, all final roles, recap, and Play Again fit within the interactable safe area.
- No gameplay depends on hover, keyboard, or a 3D click.
- No unsupported border radius or emoji glyph is used.

## Performance checks

In Desktop Explorer press `P` and record average FPS, entities, triangles, physics bodies, materials, textures, and phase-transition spikes. Target at least 30 FPS on representative mobile hardware and remain comfortably below one-parcel limits.
