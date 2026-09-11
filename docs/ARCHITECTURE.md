# MAFIA Architecture

## Lobby usability and chair pose

Lobby minimization is local presentation state, not readiness or match state. A compact restore card replaces the large lobby panel. The illustrated handbook has three fixed-layout tabs.

Seating uses the bundled `council_sitting_emote.glb` loop after a basic awaited move and bounded position-settling checks, without a prerequisite stop-emote RPC. Movement and animation failures have separate diagnostics. `seat-position.ts` applies the device-tuned X/Z avatar-root correction that aligns the animation hips with the cushion. The actual composite anchors remain the source of chair positions. Eligibility/match/seat is checked again before playback; active living participants automatically recover their assigned seat after reconnect or an interrupted pose with a bounded retry. No player Transform is mutated and no gameplay authority changes. All five cushion tops are now 0.675m high; live avatar retargeting still requires device verification.

The custom courtyard was authored/exported in Blender: 8,629 visible triangles and eight shared materials, with the existing collider preserved. Editable source: `scripts/village.blend` (excluded from deployment). The legacy generator requires explicit opt-in to avoid overwriting the detailed model.

## Visual components and collision

`CardFrame`, `ActionBoard`, `PlayerCard`, `RevealedCard` and `RoleEmblem` provide a consistent React-ECS card system. Popup layout roots remain transparent so only the readable card itself covers the world. Shared action boards, role reveal, Detective result, elimination, Game Over, handbook, lobby, phase banner and player/reveal cards branch for mobile dimensions; dynamic copy is wrapped, bounded or truncated inside explicit boxes. Generated role art is one shared texture atlas; selection is local and secret-role inputs are only used by authorized private/public reveal screens. The lobby calls cosmetic seating independently of Ready.

The courtyard GLB has a visible mesh and a separate `courtyard_collider` node. The GltfContainer enables invisible-mesh physics but disables visible-mesh collision to keep avatar seating clear. Collider geometry is authored in the same coordinate conversion as visuals, with automated mask/bounds checks. It blocks structures rather than decorative leaves or cushions.


## Milestone 4 scope

Milestone 4 completes the match loop: Morning, 45-second Discussion, private server-validated Voting, a 10-second tied-candidate Runoff, public daytime elimination and role reveal, authoritative win checks, repeated nights, Game Over, and Play Again. Decentraland platform voice remains external. No custom voice, deployment, signing, rewards, persistence, or admin tooling is added.

## Milestone 5 mobile social discussion

`DiscussionStore` is server-memory state for the 45-second Discussion phase. Clients send a typed phrase intent and optional target/claim parameters; the server derives the speaker from `context.from`, validates current match/phase/living participation, validates the target and enum values, applies a 1.5-second per-player cooldown, and constructs the display sentence. The public feed is capped at 20 entries.

Public role claims are intentionally unverified and may be lies. The store never receives `PrivateRoleStore`, night actions, Detective truth, or vote data. Claims use the explicitly named `publicRoleClaim` field. Discussion snapshots use only stable `P1`-`P5` references and sanitized display names, not raw wallet addresses.

React-ECS renders a responsive council panel without a full-screen dimming backdrop. Desktop shows feed and Claims Board together. Mobile shows the feed first and opens Claims through a compact button. The renderer's `screenInset: 'interactable'` reacts to native minimap/chat reserved areas. Three-row phrase sets use percentage-width touch targets and reserved vertical space, long status copy has a wrapped mobile box, and the Discussion-only floating seat prompt is removed. Core social play uses large `SUSPECT`, `DEFEND`, `CLAIM`, and `REACT` touch controls. Native chat and platform voice remain available and untouched; no custom free-text or voice backend is added.

`TouchScreenControls` hides jump, crosshair and all scene action buttons. It keeps the joystick in the lobby, then hides it for living participants during an active match. `InputModifier` blocks walk/jog/run/jump/double-jump/glide for those participants on supported desktop clients; camera, React-ECS input, native chat/voice and the Explorer-owned emote control remain available. Spectators and Game Over/lobby clients are unlocked.

## Runtime topology

One SDK7 codebase runs in two environments:

- The headless Multiplayer Server dynamically loads `setupAuthority()` and is the only writer of synchronized match state.
- Explorer clients load the player adapter, React-ECS UI, and phase visuals.
- Message and component schemas are imported statically before the engine seals.

`src/index.ts` selects the branch with `isServer()`. The project uses the official auth-server package versions `7.27.1-33533530571.commit-451d001`.

## Trust and privacy boundary

Clients send intent only:

- lobby: `toggleReady`
- private recovery: `requestPrivateProof`, `requestRole`, `requestNightState`, `requestVoteState`
- gameplay: `submitNightAction`, `submitVote`, `requestPlayAgain`
- social: `submitDiscussion` with a safe template enum and optional target/public-claim parameters

Authorization always uses the server-provided `context.from`; no client-provided actor ID is accepted. Private responses are targeted to that same verified identity with `{ to: [recipient] }`. The SDK room layer delivers client callbacks only for events whose sender is `AUTH_SERVER_PEER_ID`; it intentionally omits sender context on those callbacks. Application handlers then verify the expected recipient and current nonce/match/round where applicable.

`PublicMatchState` and `ServerHeartbeat` reject non-server component writes through `validateBeforeChange()`. Only the server calls `syncEntity()`.

The following never enter synchronized components, broadcasts, entity names, or logs:

- living-player role mappings
- Mafia, Doctor, or Detective targets
- actor-to-vote mappings
- live vote totals
- Detective findings
- the Doctor's previous target

Only a daytime-eliminated player's role is public during a live match. At `GAME_OVER`, all roles are deliberately public.

## Server-private stores

`PrivateRoleStore` holds `Map<verifiedPlayerId, PlayerRole>` only in server process memory. It creates exactly the supported 4- or 5-player deck and clears on reset.

`NightActionStore` owns role-derived night validation, living participants, first-submission locks, resolution, private Detective results, and the Doctor's previous target. On a repeated night it clears submissions, resolution, and Detective output while preserving roles, survivors, and only the previous night's Doctor target. The Doctor may protect themself but cannot protect the same player on consecutive nights.

`VotingStore` owns eligible voters, ballot candidates, and actor-to-target mappings. It validates the current match, round, phase, living actor, living candidate, no self-vote, and one locked vote. A reconnecting voter can recover only their own target. Resolution returns a result to server code; ballot mappings are cleared before the public phase changes.

## Public state

The synchronized state contains only:

- phase, deadline, monotonic match counter, and round number
- active/ready/spectator counts
- display name, connection, living, participant, ready, and spectator status
- public announcement
- tied runoff candidate IDs after first-ballot resolution
- daytime eliminated player and role
- winner and all final role reveals only at Game Over
- compact public recap with night victim/no-victim and daytime elimination outcomes
- bounded server-rendered discussion events and explicitly unverified public role claims

The heartbeat remains a separate component so its two-second write does not resend the slow-changing match snapshot.

## State machine

```text
BOOT -> LOBBY -> STARTING -> ROLE_REVEAL -> NIGHT_ACTION
NIGHT_ACTION -> MORNING -> DISCUSSION -> VOTING
VOTING -> RUNOFF_VOTING (first tie only)
VOTING/RUNOFF_VOTING -> ELIMINATION
ELIMINATION -> NIGHT_ACTION (no winner, next round)
ELIMINATION/NIGHT_ACTION -> GAME_OVER (authoritative win)
GAME_OVER -> LOBBY (participant requests Play Again)
```

Fixed timers are `STARTING` 3s, `ROLE_REVEAL` 7s, `NIGHT_ACTION` 30s, `MORNING` 6s, `DISCUSSION` 45s, `VOTING` 15s, `RUNOFF_VOTING` 10s, and `ELIMINATION` 6s. Game Over is sticky until Play Again.

Night, Voting, Runoff, Elimination, and Game Over transitions are managed by authority logic rather than a blind timer chain. Voting resolves early when all eligible living players have voted or at its deadline. A first tie starts a fresh runoff with only tied candidates. A second tie eliminates nobody.

## Elimination, wins, and repeated rounds

The server marks an eliminated player not alive. Public roster status then changes to spectator, and future night/vote stores exclude that identity.

The server alone computes:

- Village victory when living Mafia is zero.
- Mafia victory when living Mafia is greater than or equal to living non-Mafia.

If no team wins after daytime elimination, the round increments and a new night begins. Roles and survivors persist; prior submissions, Detective result, ballots, runoff candidates, and temporary elimination fields clear. On Game Over, the server publishes all roles and the public recap. Play Again clears role, night, vote, living/dead, reveal, winner, recap, ready, and temporary phase state before returning to a fresh lobby.

## UI and world presentation

React-ECS uses a 1920x1080 virtual canvas with `screenInset: 'interactable'`. All gameplay uses large screen-space cards and confirmation buttons; no 3D click is required. Essential actions are centered away from native bottom-right mobile controls. The new screens are:

- large Discussion prompt and countdown
- private target-card Voting and Runoff panels with no totals
- public Elimination reveal
- spectator/dead warning: `SPECTATING — Don't reveal secret information.`
- Game Over winner, final roles, compact recap, and Play Again

Phase urgency is rendered from local UI state, avoiding per-frame ECS animation writes. Static arena visuals remain client-only and react once per phase edge.

## Module map

- `src/game`: types, timers, roster rules, state controller
- `src/game/discussion.ts`: typed phrase validation, anti-spam, public claims, bounded feed
- `src/server/private-role-store.ts`: secret assignment memory
- `src/server/night-action-store.ts`: secret night actions and consecutive-save rule
- `src/server/voting-store.ts`: secret ballots and runoff resolution
- `src/server/win-conditions.ts`: pure server win calculation
- `src/server/public-results.ts`: explicit public reveal construction
- `src/server/authority.ts`: identity validation, resolution, transitions, reset, publication
- `src/shared`: statically registered transport/component schemas
- `src/multiplayer`: server roster and client public/private adapters
- `src/ui`: mobile-first React-ECS screens
- `src/world`: client-only arena and phase visuals
- `tests`: Milestones 1-5 pure logic tests plus seating/asset regressions

## Remaining production boundary

Milestone 5 is implemented in code. Remaining work before submission is live 4-5 client discussion regression, physical-mobile layout verification with native HUD/chat states, Explorer performance/error capture, product polish based on observed play, and submission assets/metadata. Deployment and signing remain explicitly out of scope.
