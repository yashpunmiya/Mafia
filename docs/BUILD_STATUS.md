# Build Status

Last updated: 2026-09-11

## Mobile native-control cleanup

- Kept the native movement joystick in the lobby, then hide it for living participants while a match is active.
- Hid jump, crosshair and all removable gamepad buttons: pointer interaction, primary, secondary, and action slots 3-6. Native chat, voice and the Explorer-owned emote menu remain available.
- Left the Explorer-owned emote control untouched. Native chat, minimap, communications and voice settings are unchanged.
- Removed the Discussion-only TAKE YOUR COUNCIL SEAT overlay and every full-screen popup dimming backdrop. Role Reveal, Night Action/Voting, Detective Result, Elimination, Game Over and How to Play now leave the surrounding 3D world visually clear.
- Made all three-row mobile phrase groups fit through percentage-width buttons and explicit vertical space. Shared action boards, role/results, handbook, lobby, phase/spectator banners, player cards, final reveals and dynamic status/recap text now use mobile dimensions, wrapping, bounded boxes or safe truncation.
- Living match participants are movement-locked during active phases, automatically recover their assigned seat after reconnect/interruption, and unlock in the lobby, after Game Over, or when spectating. The seating regression now tracks the accepted device-tuned `0.667/0.467` axis correction.

## Milestone 5 mobile social discussion completed

- Replaced the voice-only Discussion prompt with a responsive public feed, desktop Claims Board, mobile Claims toggle, and large `SUSPECT`, `DEFEND`, `CLAIM`, and `REACT` controls.
- Added server-validated typed discussion intents. Speaker identity comes only from `context.from`; the server validates phase, match, living participation, targets, templates and claim enums, then constructs the sentence.
- Public role claims are intentionally unverified and may be lies. Mafia/Villager bluffing and false Detective/Doctor-style claims are accepted by design without consulting private role/action state.
- Added a 1.5-second per-player cooldown, 20-event bound, latest-claim replacement and full Play Again cleanup. Public discussion data uses `P1`-`P5` references rather than raw wallet addresses.
- Spectators/dead players can read but cannot send. Native Decentraland voice/chat remain untouched; no arbitrary custom text chat was added.
- Mobile uses the live interactable inset, a narrow centered panel, centered bottom controls and explicit fixed label boxes. No hover, keyboard, emoji glyph, unsupported rounded corner, or 3D click is required.
- Added 11 Milestone 5 tests. Typecheck, all 48 gameplay tests plus seating/asset regressions, and the SDK production build pass. No deploy/sign command was run.

## Mobile seating investigation / custom village follow-up

- User reports the mobile app rejects seating and desktop avatars intersect the cushions. These are open live issues, not production-verified.
- Removed the prerequisite stopEmote call and duration-based movement from seating. Basic movement is followed by bounded position-settling checks before animation playback. Movement and animation failures now have separate user messages and stage-only diagnostics, with no secret match data.
- Added injected seating-transport tests for legacy responses, sequencing, cancellation, unsettled positions and failure stages. Typecheck, full tests and SDK build pass; mobile success still requires device confirmation.
- Used official portable Blender to author/export the custom village: detailed doors, window frames, stone trim, roof detailing, dormers, chimneys and monument arches. Lowered all five cushion tops by 10cm to 0.675m; avatar fit still needs live device verification.
- Courtyard: 8,629 visible triangles, eight shared materials, original dedicated collision mesh preserved. Offline render inspected; editable source is `scripts/village.blend`, excluded from deployment. The legacy procedural generator requires explicit opt-in to prevent overwriting this model. Preview: `docs/village-preview.png`.
- Gameplay, voice and World configuration are unchanged. No deployment performed.

## World deployment preparation: feelsbar.dcl.eth

- `scene.json.worldConfiguration.name` is exactly `feelsbar.dcl.eth`.
- `authoritativeMultiplayer: true`, voiceChat and nearbyVoiceChat remain enabled; no communications-disable setting was added. Gameplay source and timings are unchanged.
- Discovery tags are `game` and `social`; removed unsupported `multiplayer` category and nonexistent `favicon_asset` reference.
- Upload exclusions cover sources, scripts, tests, docs, maps, editor/agent files and environment files. SDK publishable-file audit includes 10 files (~12.55 MB), including the bundle, composite, thumbnail, courtyard, sitting animation and role atlas. No file exceeds 50 MB.
- Typecheck, all 37 gameplay tests plus seating/asset/board regressions, and SDK build pass. Installed SDK scene-schema validation and exact World/voice checks pass.
- Preparation is complete, but full production certification requires the manual multiplayer/mobile checklist below, live seating/performance checks, World wallet permissions/storage, and post-publication server/asset-conversion verification. Current thumbnail exists (1024x557); review its framing in publishing preview.
- No deployment or signature requested or executed. See `docs/WORLD_PUBLISH.md` for the owner-controlled publishing steps.

## Lobby usability follow-up details

- Added MINIMIZE / OPEN LOBBY and fixed wrapping seat numbers.
- Replaced the short help paragraph with illustrated Quick Start, Four Roles, and Voting & Winning tabs.
- Added owner-approved bundled chair animation, pose-compensated root positioning, post-move settling, and cancellation handling.
- Typecheck, all automated tests, and SDK build pass. Live avatar retargeting/visual checks remain manual.
- Removed Billboard from Lobby Sign in the current composite after Creator Hub was closed. The generator preserves this fixed board orientation on future rebuilds; label position, styling and other scene edits are unchanged.

## Cards, collision and lobby seating pass

- Replaced the basic voting/night panels with shared double-border action boards, larger portrait dossiers, parchment nameplates, clear sealed/selected states and centered confirmation buttons.
- Added generated illustrated role emblems to private reveal, Detective report, public elimination and final role cards. All four illustrations are public assets; actual living-role assignments remain private.
- Lobby now places SIT AT COUNCIL beside Ready, with STAND UP / LEAVE SEAT and visible feedback. No 3D click is required.
- Added a dedicated `courtyard_collider` mesh for houses, walls, lantern bases, tree trunks, pergola posts/benches, noticeboard, monument and chair backs. Enabled invisible-mesh physics. Chair cushions and leaves deliberately do not block the avatar.
- Collision changes require reopening Creator Hub and restarting preview. Live mobile layout and seated-emote alignment are still manual checks, not proven by typecheck.


## Courtyard visual update / export correction

Added the original courtyard GLB, five modeled council chairs, portrait target cards, role folio and native cosmetic seating. Live screenshots caught the export-coordinate bug and an incomplete Z-only fix. Verified Inspector loader and Bevy importer source: the 180-degree Y rotation plus handedness conversion gives SDK (-glTF.x, glTF.y, glTF.z). Export now mirrors X and reverses winding. Tests check importer-space bounds AND exported cushion vertices against all five named avatar anchors. Seating reads these scene anchors, preserves survivor/reconnect slots and rejects dead/spectator/disconnected players. Cards recover the confirmed target highlight and explicitly wrap long instructions. Real Explorer pose/UI verification remains pending; no live visual pass is claimed.


## Milestone 4 completed

- Preserved the authoritative server/client split, server-only synchronized writes, heartbeat, 4-5 player lobby, private role assignment, private night actions, and reconnect recovery from Milestones 1-3.
- Recorded the user-confirmed Milestone 3 live privacy/night-resolution smoke-test pass.
- Added a 45-second `DISCUSSION` phase with a large mobile countdown and explicit platform-voice guidance.
- Added server-private ballots with verified-identity authorization, no self-vote, living-only actor/candidate rules, current match/round/phase checks, and first-vote locking.
- Added nonce-bound private vote acknowledgement and reconnect recovery for only the requesting player's vote.
- Added early ballot completion when every eligible living participant votes and deadline completion for missing voters.
- Added `RUNOFF_VOTING` with only tied candidates, a 10-second deadline, and no elimination after a second tie.
- Added authoritative elimination, public eliminated-role reveal, dead-player spectator conversion, and future-action rejection.
- Added server-only Village/Mafia win calculation and sticky Game Over.
- Added repeated rounds that preserve roles/survivors while clearing transient night, investigation, ballot, runoff, and elimination state.
- Enforced the Doctor's no-consecutive-protection-target rule in private server memory and mobile target UI.
- Added targeted, server-authenticated Detective result delivery at night resolution, including a terminal night.
- Added final role reveal, compact match recap, and participant-gated Play Again followed by a clean Ready Again lobby.
- Added large touch-friendly Discussion, Voting, Runoff, Elimination, Spectator, and Game Over screens. No gameplay requires 3D clicking.
- Added fourteen Milestone 4 automated tests, bringing the total to 37.
- Updated all four project documents.

## Verification

- `npm.cmd run typecheck`: passes with zero TypeScript errors.
- `npm.cmd test`: 48/48 gameplay tests pass (5 Milestone 1, 8 Milestone 2, 10 Milestone 3, 14 Milestone 4, 11 Milestone 5), plus seating/asset regressions.
- `npm.cmd run build`: passes; composite processing, client/server bundle creation, and SDK type checking complete.
- No deploy or signing command was run.

## User-confirmed live coverage

- Two-client targeted private-message isolation passed before Milestone 2.
- Milestone 3 role privacy, night-action privacy, and night-resolution smoke tests passed before Milestone 4.

## Still requires manual Explorer coverage

- Complete 4-player and 5-player daytime loops, including early and timed-out ballots.
- First tie to runoff and second tie to no elimination.
- Public daytime role reveal without living-role or vote leakage.
- Both Village and Mafia wins.
- At least one repeated round, Doctor restriction, and dead-player lockout.
- Disconnect/reconnect during Voting and Runoff.
- Play Again full cleanup and a second match.
- Physical phone safe-area/card/button layout.
- Explorer console, FPS, entity, triangle, material, texture, and physics metrics.

Explorer MCP is not connected in this session, so these remain the exact manual checks in `docs/TEST_PLAN.md`.

## Security status

- Role, night-action, Detective, Doctor-history, and actor-to-vote state remains server-private.
- Every gameplay actor is derived from `context.from`.
- The SDK room layer filters client events to `AUTH_SERVER_PEER_ID`; private handlers additionally check recipient/current request context.
- Public state never includes live vote totals or voter mappings.
- A daytime eliminated role is public only after resolution; every role becomes public only at Game Over.
- Reset clears every private store and all public reveal/recap/winner/transient fields before a new lobby.

## Performance status

- Courtyard geometry contains 8,629 visible triangles, eight shared materials and dedicated structure colliders, plus existing composite props/lights. UI uses a shared role atlas; seating uses a bundled animation. Runtime totals still require Explorer measurement.
- Player scans run every 0.5s, public reconciliation every 0.25s, heartbeat every 2s.
- Public state writes only when serialized content changes.
- Ballot tallying is server-side over at most five entries and never runs per frame.
- Runtime metrics remain unmeasured pending Explorer access.

## Remaining blockers

- No code, typecheck, unit-test, or SDK build blocker is currently known.
- Automated live multiplayer/mobile evidence is unavailable because Explorer MCP is not connected.

## Before submission

Run the full manual 4-5 player checklist, capture mobile and desktop evidence, fix any observed UI/runtime issue, record Explorer performance metrics, prepare listing media/copy, and perform a final security/log review. Deployment/signing should happen only under a separate explicit request.
