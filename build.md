You are the lead engineer, technical game designer, QA engineer, and Decentraland SDK specialist for this repository.

We are building a submission for the 2026 Decentraland Friendzone Buildathon.

The project is a polished, mobile-first 4–5 player multiplayer Mafia/social-deduction game deployed inside a Decentraland World.

I am not an experienced Decentraland/TypeScript developer. You should perform the vast majority of implementation, debugging, architecture, UI work, multiplayer work, testing automation, optimization, documentation, and build fixes yourself.

However:

- Do NOT deploy or sign anything without my explicit instruction.
- Do NOT request wallet private keys, seed phrases, passwords, or other secrets.
- Do NOT download third-party 3D assets without first asking me.
- Do NOT assume an API exists.
- Do NOT guess from old SDK6/old Decentraland tutorials.
- Prefer the installed official Decentraland SDK Skills and the actual installed SDK types/source as the source of truth.
- Do NOT implement the entire game blindly and only test at the end.
- Work through the milestones below in order and verify each major system.

==================================================
0. FIRST: INSPECT THE PROJECT AND SKILLS
==================================================

Before modifying significant code:

1. Inspect the repository structure.
2. Inspect package.json.
3. Inspect scene.json.
4. Determine the installed @dcl/sdk version.
5. Run the existing build/typecheck.
6. Identify whether this project was created by Creator Hub and preserve compatible Creator Hub structure.
7. Locate and read the installed Decentraland SDK Skills.

At minimum, consult the relevant installed skills before implementing their associated systems:

- sdk-scenes
- game-design
- build-ui
- multiplayer-sync
- authoritative-server
- player-avatar
- add-interactivity
- advanced-input when needed
- scene-runtime
- animations-tweens
- audio-video
- particle-system when needed
- lighting-environment
- optimize-scene
- unity-explorer-mcp if Explorer MCP is available
- deploy-worlds ONLY later when I explicitly ask for deployment

Do not merely say that you used the skills. Actually inspect their instructions and follow their current patterns.

If a skill's instructions conflict with generic knowledge, follow the current installed Decentraland skill and SDK.

If SDK APIs differ from what you expected, inspect the actual installed types/package instead of inventing a workaround.

Create:

docs/ARCHITECTURE.md
docs/BUILD_STATUS.md
docs/TEST_PLAN.md
docs/GAME_RULES.md

Maintain these as the project evolves.

==================================================
1. PRODUCT GOAL
==================================================

Working title:

MAFIA

We can rename/rebrand it later.

The experience should feel like a polished, very short version of classic Mafia designed specifically around Decentraland Mobile and Decentraland's built-in social/voice experience.

The target experience is:

Player enters
→ instantly understands where to go
→ joins lobby
→ 4–5 players become ready
→ game starts
→ private role reveal
→ night
→ morning result
→ voice discussion
→ mobile-friendly vote
→ elimination
→ repeat
→ dramatic winner reveal
→ instant Play Again

Target full match duration:

approximately 5–8 minutes.

Target players:

minimum 4
maximum 5

Do NOT increase the player count for MVP.

==================================================
2. BUILDATHON PRIORITIES
==================================================

Optimize every decision around these seven judging areas:

1. Mobile-First Experience
2. Social Value
3. Mobile UX and Accessibility
4. Performance and Optimization
5. Creativity and Originality
6. Retention and Discovery Value
7. Overall Execution

Important philosophy:

A small, extremely polished game is preferable to a large complicated game.

Do not add unnecessary RPG systems, inventories, blockchain mechanics, NFTs, currencies, quests, custom accounts, large maps, or unrelated features.

Our strongest qualities should be:

- immediate social interaction
- voice-driven discussion
- very clean mobile UI
- quick rounds
- attractive atmosphere
- obvious feedback
- low performance cost
- easy replay
- minimal onboarding
- stable multiplayer

==================================================
3. CORE GAME RULES
==================================================

For 4 players:

- 1 Mafia
- 1 Doctor
- 1 Detective
- 1 Villager

For 5 players:

- 1 Mafia
- 1 Doctor
- 1 Detective
- 2 Villagers

Roles are SECRET.

Never expose a player's secret role through public synchronized state, public UI, console output visible to other clients, entity labels, public components, or broadly broadcast messages.

ROLES:

MAFIA
- knows they are Mafia
- at night chooses one other living player to eliminate
- cannot target themselves

DOCTOR
- chooses one living player to protect each night
- may protect themselves
- cannot protect the same player on two consecutive nights, if this can be implemented cleanly without harming UX

DETECTIVE
- chooses one other living player to investigate
- privately receives:
  "MAFIA"
  or
  "NOT MAFIA"
- investigation result is visible only to that Detective

VILLAGER
- has no night action
- receives a clear "The village sleeps..." waiting screen during night

DAY:
- surviving players discuss using Decentraland's existing voice chat
- our scene should NOT attempt to build a separate voice-chat system
- do not try to programmatically mute/unmute users unless an official supported SDK/API pattern is verified
- voice functionality remains a Decentraland platform feature
- our game controls the discussion timer and visual phase indication

VOTING:
- only living players vote
- voting should be done through large 2D player cards, not precise 3D clicking
- players cannot vote for themselves
- each player gets one vote
- after everyone votes or timer expires, resolve votes
- highest-voted player is eliminated
- on a tie, perform one short runoff vote containing only tied players
- if runoff ties again, nobody is eliminated

ELIMINATION:
- eliminated players cannot vote
- eliminated players cannot perform night actions
- eliminated players cannot affect game state
- they become spectators
- spectator UI should clearly state:
  "You are spectating — don't reveal secret information."
- do not rely on being able to mute spectators unless an official supported mechanism actually exists

ROLE REVEAL AFTER ELIMINATION:
For the MVP, reveal the eliminated player's role publicly after elimination.

This keeps 4–5 player matches short and easy to understand.

WIN CONDITIONS:

Village team wins immediately when Mafia is eliminated.

Mafia wins immediately when Mafia is alive and the number of living non-Mafia players is less than or equal to the number of living Mafia players.

Since MVP contains one Mafia:
- if only Mafia + one non-Mafia remain, Mafia wins

==================================================
4. GAME PHASE STATE MACHINE
==================================================

Implement an explicit, strongly typed game state machine.

Suggested phases:

BOOT
LOBBY
STARTING
ROLE_REVEAL
NIGHT_INTRO
NIGHT_ACTION
NIGHT_RESOLUTION
MORNING
DISCUSSION
VOTING
RUNOFF_VOTING
ELIMINATION
WIN_CHECK
GAME_OVER
RESETTING

Do NOT scatter phase control across random UI components.

Create a centralized authoritative game flow.

All phase transitions should have:

- clearly defined entry
- clearly defined duration
- clearly defined allowed player actions
- cleanup on exit
- server validation where applicable
- late/repeated client messages handled safely

Suggested timings, configurable through constants:

ROLE_REVEAL = 7 seconds
NIGHT_INTRO = 3 seconds
NIGHT_ACTION = 12–15 seconds
MORNING = 6 seconds
DISCUSSION = 45 seconds
VOTING = 15 seconds
RUNOFF_VOTING = 10 seconds
ELIMINATION = 6 seconds
GAME_OVER = 10 seconds

Put these in one constants/config file.

Do not hardcode timers throughout the project.

==================================================
5. MULTIPLAYER / SECURITY ARCHITECTURE
==================================================

THIS IS CRITICAL.

Mafia relies on SECRET PLAYER INFORMATION.

Before building the full game, determine the safest CURRENT Decentraland-supported architecture using the installed skills.

Read both:

authoritative-server
multiplayer-sync

Understand the difference.

Public information may include:

- current phase
- phase timer
- number of players
- living/dead state
- votes after resolution
- public elimination result
- public winner
- public round/night number

Private information includes:

- assigned role
- Mafia target selection before resolution
- Doctor target selection before resolution
- Detective target selection
- Detective investigation result
- any information from which another player's secret role could be trivially derived

Prefer the current official Decentraland authoritative server pattern for secret/server-owned state if supported and viable.

IMPORTANT:

The authoritative server capability may require a specific SDK channel/tag and scene.json configuration.

DO NOT blindly change dependencies based only on this prompt.

Read the installed authoritative-server skill first.

Then:
1. determine required dependencies/configuration
2. explain the dependency changes in docs/ARCHITECTURE.md
3. create a minimal proof-of-concept
4. verify it builds and locally runs
5. verify one client can receive player-specific information without that information being exposed publicly
6. only then use this architecture for the full role system

If authoritative multiplayer is unavailable, broken, or incompatible with our World/deployment setup:

DO NOT fake security.

Do NOT silently put every secret role in CRDT synchronized state.

Instead:
- investigate current supported alternatives using installed Decentraland SDK capabilities
- report the limitation clearly in BUILD_STATUS.md
- implement the safest reasonable fallback only if it preserves private roles
- if no valid private-state approach exists, stop that portion and tell me exactly what blocks it

For all client actions:

The authoritative game authority should validate:
- player belongs to current match
- player is alive
- player's role permits the action
- action belongs to current phase
- target is valid
- player has not already submitted an action/vote
- stale/repeated messages are rejected
- self-target restrictions are respected
- eliminated spectators cannot affect the match

Never trust arbitrary client values for role, kill result, winner, or vote tally.

==================================================
6. PLAYER IDENTITY
==================================================

Use the current Decentraland player/avatar APIs and player-avatar skill.

Use wallet/user IDs as stable match identifiers where appropriate.

Display:
- avatar/player display name
- small avatar representation if easy and performant
- alive/dead status

Do not expose full wallet addresses in normal player-facing UI.

Handle:

- player joins before game
- player leaves lobby
- player disconnects during game
- player reconnects, if current APIs make this practical
- player joins while a match is already running

For MVP:

If a new player arrives during an active match:
- they become a spectator
- they can join the next match

If an active player disconnects:
design the simplest robust policy.

Preferred:
- short reconnect grace period if easy
- otherwise mark disconnected
- if Mafia leaves, village wins
- if enough players leave that game is no longer viable, safely end/cancel match

Do not allow disconnect behavior to leave the state machine permanently stuck.

==================================================
7. LOBBY
==================================================

The lobby must feel understandable within seconds.

Requirements:

- clearly show "MAFIA"
- subtitle such as "4–5 players • Talk. Suspect. Vote."
- show currently connected/eligible players
- show player count:
  2 / 4 needed
  3 / 4 needed
  etc.
- large READY button
- clearly show each player's ready state
- game may start when at least 4 players are present and all required players are ready
- maximum 5 active players
- additional visitors spectate/wait for next match

Do not require a separate host/moderator.

The game must run automatically.

Add an optional short countdown before starting:

3
2
1

Do not create a long tutorial.

Include a small "HOW TO PLAY" button that opens a very short explanation:

"One player is Mafia.
At night, roles act secretly.
During the day, talk and find the Mafia.
Vote someone out before Mafia takes over."

No wall of text.

==================================================
8. MOBILE-FIRST UI
==================================================

Use the installed build-ui skill.

Core game interactions should use React-ECS / screen-space UI.

Do NOT make essential gameplay depend on:
- tiny text
- hovering
- keyboard shortcuts
- precise crosshair targeting
- tiny 3D objects
- desktop-only interaction patterns

Design first for a phone screen.

Requirements:

- large readable typography
- large touch targets
- high contrast
- clear visual hierarchy
- minimal text
- safe margins from Decentraland/platform controls
- buttons visually react immediately when tapped
- selected targets are unmistakable
- disabled buttons look disabled
- phase timer is always obvious
- action confirmation is obvious

UI components should include:

LobbyScreen
RoleRevealScreen
PhaseBanner
NightActionScreen
WaitingNightScreen
DetectiveResultScreen
MorningScreen
DiscussionHUD
VotingScreen
RunoffVotingScreen
EliminationScreen
SpectatorHUD
GameOverScreen
HowToPlayModal

Avoid excessive simultaneous overlays.

Only show UI relevant to the current phase.

==================================================
9. NIGHT ACTION UX
==================================================

Do NOT require players to walk over and click another avatar during night.

Use large player target cards.

Example Mafia screen:

MAFIA
Choose tonight's target

[ Alice ]
[ Bob ]
[ Charlie ]

12s

After tap:

TARGET: ALICE
[ CONFIRM ]

or preferably a single tap selects and a large Confirm button commits.

Doctor:

DOCTOR
Protect one player tonight

[player cards]

If repeat-save restriction applies, visually disable last night's saved target with a clear reason.

Detective:

DETECTIVE
Investigate one player

[player cards]

After server response:

INVESTIGATION
ALICE
NOT MAFIA

Keep result private.

Villager:

THE VILLAGE SLEEPS
The night will end soon...
12s

==================================================
10. NIGHT RESOLUTION
==================================================

Server/game authority resolves in a deterministic order.

Conceptually:

Mafia target selected
Doctor protection selected

If Mafia target == Doctor protected target:
- nobody dies

Else:
- Mafia target dies

Detective investigation does not affect kill resolution.

No client decides whether someone died.

Only the authoritative game authority computes and publishes the public morning result.

Morning UX:

If someone died:

"DAWN BREAKS"
"[Name] was taken during the night."

If Doctor saved the target:

"DAWN BREAKS"
"Everyone survived the night."

Do not publicly reveal which player Doctor protected.

==================================================
11. DISCUSSION / VOICE
==================================================

Decentraland provides player communications/voice.

We are NOT building our own VoIP stack.

Our game simply creates a strong discussion phase around it.

Discussion UI:

DAY 2
DISCUSS
00:45

"Who is the Mafia?"

Optional small reminders:
- share suspicions
- defend yourself
- listen carefully

Environment should visibly shift from night to day if practical.

Examples:
- sky/lighting change
- central light/fire changes
- phase banner animation
- audio cue

Do not make voice technically mandatory to complete UI/game logic:
players should still be able to vote even if they have voice disabled.

Do not attempt unsupported voice moderation APIs.

==================================================
12. VOTING
==================================================

Voting must be one of the best-polished pieces of UI.

Display living candidates as large cards.

Each card:
- display name
- avatar image/representation if practical
- alive indicator

Do not include yourself as selectable.

Tap player
→ obvious selected state
→ large VOTE / CONFIRM button

After vote:
"Vote locked"
and waiting state.

Do NOT show live vote counts while voting.
That would encourage bandwagoning.

When everyone has voted or timer expires:
- authoritative server tallies
- resolves highest total
- handles tie

After resolution:

show votes visually.

Example:

ALICE     2 votes
BOB       1 vote
CARLOS    1 vote

Then:

"ALICE WAS ELIMINATED"

dramatic pause

"ALICE WAS THE DOCTOR"

If Mafia:
game ends immediately with Village victory.

==================================================
13. SPECTATOR MODE
==================================================

Eliminated players remain in the experience.

Requirements:

- cannot vote
- cannot submit night action
- cannot trigger state-changing controls
- see match progression
- visually marked as spectator
- can wait for next match

Add a clear banner:

SPECTATING
Don't reveal secret information.

If useful and easy, place eliminated avatars/spectators in a visually distinct spectator area/balcony.

But do not build complicated spectator infrastructure.

==================================================
14. GAME OVER / RETENTION
==================================================

Village victory:

VILLAGE WINS
The Mafia was exposed.

Mafia victory:

MAFIA WINS
The village has fallen.

Then reveal all remaining roles.

Show a compact match recap if easy:

Mafia: Alice
Detective: Bob
Doctor: Carlos
Villager: Dana

Primary button:

PLAY AGAIN

Replay should be frictionless.

Reset all ephemeral match state safely.

New match should reshuffle roles.

Do not require users to leave/re-enter the World.

==================================================
15. CREATIVE DIRECTION / ORIGINALITY
==================================================

Mechanically this is classic Mafia.

Our originality should come from making it feel native to Decentraland rather than adding unnecessary rules.

Initial visual concept:

"Moonlit Village Council"

Compact circular council square.

Players gather around a central table / fire / glowing voting monument.

Visual state:

LOBBY:
warm neutral village

NIGHT:
dark blue/moonlit atmosphere
central fire dims
role UI takes focus

MORNING:
sunrise/warm light

DISCUSSION:
council area illuminated

VOTING:
central voting monument glows
dramatic pulses

ELIMINATION:
brief visual/sound effect

GAME OVER:
celebratory or ominous environment effect

Prioritize:
- simple primitives
- Creator Hub composites already in the project
- low-poly geometry
- performant materials
- lighting changes
- UI polish
- modest particles

DO NOT download external assets without asking me first.

Build a good-looking placeholder environment using primitives/current local assets first.

Do not spend most of development on scenery.

==================================================
16. AUDIO / FEEDBACK
==================================================

Consult audio-video and particle/animation skills.

Use lightweight feedback for:

- game start
- role reveal
- night begins
- dawn
- voting begins
- vote confirmed
- elimination
- victory/defeat

If no appropriate local audio assets exist:
do NOT fetch copyrighted/random external files without asking.

Implement hooks/placeholders cleanly so audio can be added later.

Animations should be simple and performant.

==================================================
17. PERFORMANCE
==================================================

Mobile performance is a judging criterion.

Consult game-design and optimize-scene throughout development.

Principles:

- compact environment
- low entity count
- simple collision
- avoid unnecessary systems running every frame
- avoid allocation-heavy update loops
- avoid excessive particles
- avoid many unique materials
- avoid huge textures
- avoid expensive transparency
- keep visual effects short
- remove inactive mini systems rather than letting them constantly process
- reuse entities/components where sensible

Do not wait until the final hour to optimize.

Maintain a PERFORMANCE section in BUILD_STATUS.md.

If Explorer MCP performance measurement is available, record:
- approximate FPS
- entities
- triangles
- materials/textures
- obvious bottlenecks

==================================================
18. EXPLORER MCP / SELF-TESTING
==================================================

Inspect whether the unity-explorer-mcp skill is installed and whether this Codex environment can connect to the running Explorer MCP server.

If MCP is supported:

use it extensively.

The scene can be launched with the current documented MCP preview flow.

Then use Explorer capabilities to:

- inspect scene visually
- read console/log errors
- take targeted screenshots
- move the player
- click/interact
- confirm UI appears
- confirm environment loads
- inspect performance
- verify changes instead of merely claiming they work

Ask for/log proof where possible.

Do not spam screenshots unnecessarily.

If MCP is NOT available in this Codex environment:
do not block development.
Use builds/tests and clearly give me exact manual preview checks to perform.

==================================================
19. TESTABILITY
==================================================

Create clean separation between:

- authoritative game logic
- network messages
- presentation/UI
- environment
- Decentraland-specific adapters

Where practical, make pure game-rule functions independently testable.

Test at least:

ROLE ASSIGNMENT
- exactly one Mafia
- exactly one Doctor
- exactly one Detective
- correct number of Villagers
- random assignment
- only eligible players receive roles

NIGHT
- Mafia cannot self-target
- dead Mafia cannot act
- Doctor save cancels kill
- invalid/stale actions rejected
- Detective result correct
- dead players cannot act

VOTING
- one vote per living player
- cannot vote self
- dead players cannot vote
- invalid targets rejected
- tie detection
- runoff
- second tie = no elimination

WIN CONDITIONS
- Mafia dead -> Village win
- Mafia reaches parity -> Mafia win
- otherwise continue

RESET
- old roles cleared
- old votes cleared
- old actions cleared
- spectators eligible for next game
- new roles reshuffled

==================================================
20. FILE / CODE ARCHITECTURE
==================================================

Do not create one giant index.ts.

Adapt to the repository, but target a modular structure approximately like:

src/
  index.ts

  config/
    constants.ts

  game/
    types.ts
    game-state.ts
    game-rules.ts
    game-controller.ts
    timers.ts
    role-assignment.ts
    win-conditions.ts

  server/
    authority.ts
    messages.ts
    validators.ts
    private-state.ts

  multiplayer/
    client-network.ts
    public-sync.ts
    player-registry.ts

  players/
    player-state.ts
    player-utils.ts

  ui/
    ui-root.tsx
    theme.ts
    components/
      button.tsx
      player-card.tsx
      timer.tsx
      phase-banner.tsx
    screens/
      lobby.tsx
      role-reveal.tsx
      night-action.tsx
      waiting-night.tsx
      detective-result.tsx
      morning.tsx
      discussion.tsx
      voting.tsx
      elimination.tsx
      spectator.tsx
      game-over.tsx

  world/
    environment.ts
    phase-visuals.ts
    spawn-layout.ts

  effects/
    audio.ts
    vfx.ts

Adjust this to Decentraland/Creator Hub conventions when necessary.

Keep index.ts primarily as initialization/composition.

Avoid circular dependencies.

Use strongly typed enums/unions/interfaces.

==================================================
21. LOGGING / DEBUG MODE
==================================================

Create a development/debug mode that can help us test quickly.

But NEVER log hidden roles or private actions to ordinary client logs in production.

Useful safe debug information:
- current phase
- phase transition
- connected player count
- server/client role
- public elimination
- invalid action reasons

If a secret-state debug log is absolutely needed locally:
- server-only
- clearly gated behind development flag
- never sent to clients
- never enabled in production by default

==================================================
22. FIRST DEVELOPMENT MILESTONE
==================================================

DO NOT BEGIN BY IMPLEMENTING THE WHOLE GAME.

Milestone 1 is a technical vertical slice proving the architecture.

Complete ONLY:

A. PROJECT HEALTH
- inspect repo
- install/fix only genuinely necessary dependencies
- build succeeds
- document architecture

B. ENVIRONMENT
- compact placeholder Moonlit Village Council arena
- clear lobby location
- simple central table/fire/monument using primitives or existing local assets

C. BASIC UI
- mobile-safe UI root/theme
- lobby screen
- player count
- ready button
- placeholder phase timer

D. PUBLIC PLAYER REGISTRY
- detect eligible connected players using current SDK-supported patterns
- support up to 5
- identify spectators/waiting players

E. AUTHORITATIVE MULTIPLAYER PROOF
Before implementing secret roles:
- configure the current official authoritative-server pattern according to installed skill
- prove server/client code branches correctly
- create one harmless server-owned public value, e.g. match counter
- create one harmless PLAYER-SPECIFIC private test message/value
- verify private test payload only reaches/intends to reach its target using the official supported messaging mechanism
- do not expose real Mafia roles yet

F. STATE MACHINE SKELETON
Implement:
BOOT
LOBBY
STARTING
ROLE_REVEAL
NIGHT_ACTION
MORNING
DISCUSSION
VOTING
ELIMINATION
GAME_OVER

Transitions can be debug/manual placeholders initially.

G. TEST / VERIFY
- run typecheck/build
- fix every error
- run available automated tests
- preview if available
- use Explorer MCP if connected
- inspect console
- verify no obvious runtime errors

H. DOCUMENT
Update:
docs/ARCHITECTURE.md
docs/BUILD_STATUS.md
docs/TEST_PLAN.md

BUILD_STATUS must say exactly:
- completed
- tested
- untested
- blocked
- next milestone

STOP after Milestone 1.

Do not build real role assignment, killing, doctor, detective, voting, or final art yet.

Give me:
1. concise summary of files changed
2. commands you ran
3. build/test results
4. whether authoritative private messaging was successfully proven
5. exact manual actions I need to perform in Creator Hub/Explorer
6. any blocker
7. recommendation for Milestone 2

==================================================
23. FUTURE MILESTONES — DO NOT DO YET
==================================================

For planning purposes only:

MILESTONE 2
Private role assignment + Role Reveal UI

MILESTONE 3
Night actions:
Mafia
Doctor
Detective
Villager waiting state

MILESTONE 4
Night resolution + Morning

MILESTONE 5
Discussion phase + day/night atmosphere

MILESTONE 6
Voting + runoff + elimination

MILESTONE 7
Win conditions + spectator + replay/reset

MILESTONE 8
Full 4–5 player multiplayer testing and disconnect handling

MILESTONE 9
Mobile UX pass on real phone

MILESTONE 10
Visual/audio/VFX polish

MILESTONE 11
Performance optimization with measured evidence

MILESTONE 12
README, submission documentation, production deployment preparation

Do not skip directly to later milestones.

==================================================
24. QUALITY BAR
==================================================

At every milestone ask:

- Does it compile?
- Does it run?
- Is the state authoritative where it needs to be?
- Is hidden information actually hidden?
- Can dead/spectating players cheat through UI/network calls?
- Does this work with 4–5 players?
- Is the UI usable on a small touch screen?
- Is the interaction obvious without a tutorial?
- Is performance reasonable?
- Did we introduce unnecessary complexity?
- Can the next developer understand this code?

Never mark a milestone complete because the code "looks right."

Verify it.

Begin now with repository inspection and Milestone 1 only.