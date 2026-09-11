# MAFIA Game Rules

## Sitting in the lobby

Use **MINIMIZE** to explore without the large lobby panel; **OPEN LOBBY** restores it. Minimizing does not change Ready. **HOW TO PLAY** contains Quick Start, role guides, and voting/winning rules.

Tap **SIT AT COUNCIL** beside Ready to move to your assigned chair and request the seated emote. In the lobby, tap **STAND UP / LEAVE SEAT** or walk to leave. Once a match starts, living participants are automatically seated and movement-locked at the council table until they become spectators or the game ends. Sitting does not mark you ready and never changes server-side action eligibility. A fifth seat is reserved for five-player matches; spectators cannot claim participant chairs.


## Players and roles

MAFIA supports exactly:

- 4 players: 1 Mafia, 1 Doctor, 1 Detective, 1 Villager
- 5 players: 1 Mafia, 1 Doctor, 1 Detective, 2 Villagers

Roles are assigned randomly by the server. During Role Reveal, each participant sees only their own role name, short description, and objective for approximately seven seconds. A reconnecting participant recovers the same current-match role. New or overflow visitors spectate.

## Night

- Mafia privately chooses one other living player.
- Doctor privately protects one living player and may protect themself, but cannot protect the same player on consecutive nights.
- Detective privately investigates one other living player and receives `MAFIA` or `NOT MAFIA`.
- Villagers wait.

The night lasts 30 seconds. Each accepted action locks. Missing Mafia means no attack; missing Doctor means no protection; missing Detective means no result. If Mafia and Doctor choose the same target, nobody dies. Otherwise the Mafia target dies. The server alone resolves the night.

A night victim becomes a spectator, but their role remains hidden until Game Over. Detective results remain private even when resolution ends the match.

## Morning and Discussion

Morning publicly announces only who died or that nobody died. Discussion follows for 45 seconds with the large prompt `DISCUSS - WHO IS THE MAFIA?`

Living participants can use Quick Discussion without a keyboard: `SUSPECT`, `DEFEND`, `CLAIM`, and `REACT` open short, touch-friendly phrase choices. Accusations and player-referencing claims target living participants only. A 1.5-second cooldown limits spam, and the public feed keeps the latest 20 statements.

Public role claims are intentionally unverified and may be lies. Any living player, including the Mafia, may claim Detective, Doctor, or Villager and may make a false investigation/save claim. The Claims Board shows only the latest public role claim and never the real private role.

Dead players and visitors may read the feed but cannot send statements. The scene does not create custom text, microphone, WebRTC, or voice infrastructure. Decentraland native text chat and platform voice remain available as optional companion channels. Only living participants continue to Voting.

## Voting

- Every living participant may vote once for one other living participant.
- Self-votes are forbidden.
- Dead players and spectators cannot vote.
- The first accepted vote is locked.
- Vote targets and live totals remain private.
- Voting ends when every eligible living participant has voted or the timer expires.
- A missing vote stays missing; the server never invents a default.

The unique highest-voted player is eliminated. Their role is publicly revealed, they become a spectator, and they cannot affect later nights or votes.

## Ties

A first-place tie starts a 10-second `RUNOFF_VOTING` phase. Only tied candidates may receive runoff votes, though every living participant may vote subject to the no-self-vote rule.

If the runoff has a unique leader, that player is eliminated. If the runoff ties again, nobody is eliminated and there is no third ballot.

## Win conditions

The server checks wins after every authoritative death/elimination:

- Village wins when no Mafia remains alive.
- Mafia wins when living Mafia is equal to or greater than living non-Mafia.

Clients never decide or submit a winner.

## Repeated rounds

If nobody wins after daytime resolution, the round increments and the surviving players return to Night. Roles and living status persist. The server clears the prior night's submissions and Detective result, every vote, runoff candidates, and temporary elimination state. Only the Doctor's prior protection target persists privately for the consecutive-night restriction.

## Game Over and Play Again

Game Over publicly shows the winning team, every role, and a compact recap of public outcomes. It remains until an original match participant selects `PLAY AGAIN`.

Play Again clears private roles, night actions, Detective results, Doctor history, ballots, living/dead state, public reveals, winner, recap, temporary phase state, and ready flags before returning to the lobby. Players then use the normal Ready flow for a new match.

## Spectator conduct

Dead participants and visitors see:

`SPECTATING — Don't reveal secret information.`

They cannot ready into an active match, receive a role or private action state, vote, or perform night actions.

## Match flow

```text
Lobby -> Ready countdown -> Private Role Reveal -> Night Action
-> Morning -> 45s Discussion -> Vote -> optional 10s Runoff
-> Elimination -> Win check -> next Night or Game Over -> Play Again
```

Milestone 5 adds the mobile Quick Discussion layer without changing the existing gameplay loop. Persistence, rewards, moderation/admin features, custom voice, deployment, and signing are outside this milestone.
