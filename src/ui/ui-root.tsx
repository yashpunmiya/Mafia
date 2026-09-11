import ReactEcs, { ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { GamePhase } from '../game/types'
import { getClientViewState } from '../multiplayer/client-network'
import { PhaseBanner } from './components/phase-banner'
import { HowToPlayModal } from './screens/how-to-play'
import { LobbyScreen } from './screens/lobby'
import { DetectiveResultScreen, NightActionScreen } from './screens/night-action'
import { RoleRevealScreen } from './screens/role-reveal'
import { PlayerRole } from '../game/types'
import {
  EliminationScreen,
  GameOverScreen,
  SpectatingScreen,
  VotingScreen
} from './screens/daytime'
import { DiscussionScreen } from './screens/discussion'

let howToPlayVisible = false

export function setupUi(): void {
  ReactEcsRenderer.setUiRenderer(UiRoot, {
    virtualWidth: 1920,
    virtualHeight: 1080,
    screenInset: 'interactable'
  })
}

function UiRoot() {
  const view = getClientViewState()
  // Never let a lobby help modal obscure the timed private role reveal.
  if (view.phase !== GamePhase.LOBBY) howToPlayVisible = false
  const localPlayer = view.players.find((player) => player.id === view.localPlayerId)
  const privateRevealVisible =
    view.phase === GamePhase.ROLE_REVEAL &&
    (localPlayer?.status === 'PLAYER' || view.privateRoleMatchCounter === view.matchCounter)
  const privateNightVisible =
    view.phase === GamePhase.NIGHT_ACTION && localPlayer?.status === 'PLAYER' && localPlayer.alive
  const detectiveResultVisible =
    view.phase === GamePhase.MORNING &&
    localPlayer?.matchParticipant === true &&
    view.privateRole === PlayerRole.DETECTIVE
  const discussionVisible = view.phase === GamePhase.DISCUSSION
  const votingVisible =
    (view.phase === GamePhase.VOTING || view.phase === GamePhase.RUNOFF_VOTING) &&
    localPlayer?.status === 'PLAYER' &&
    localPlayer.alive
  const eliminationVisible = view.phase === GamePhase.ELIMINATION
  const gameOverVisible = view.phase === GamePhase.GAME_OVER
  const spectatorVisible =
    localPlayer?.status === 'SPECTATOR' &&
    !detectiveResultVisible &&
    (view.phase === GamePhase.NIGHT_ACTION ||
      view.phase === GamePhase.MORNING ||
      view.phase === GamePhase.VOTING ||
      view.phase === GamePhase.RUNOFF_VOTING)
  return (
    <UiEntity uiTransform={{ width: '100%', height: '100%' }}>
      <LobbyScreen view={view} onHowToPlay={() => (howToPlayVisible = true)} />
      <RoleRevealScreen view={view} visible={privateRevealVisible} />
      <NightActionScreen view={view} visible={privateNightVisible} />
      <DetectiveResultScreen view={view} visible={detectiveResultVisible} />
      <DiscussionScreen view={view} visible={discussionVisible} />
      <VotingScreen view={view} visible={votingVisible} />
      <EliminationScreen view={view} visible={eliminationVisible} />
      <GameOverScreen view={view} visible={gameOverVisible} />
      <SpectatingScreen view={view} visible={spectatorVisible} />
      <PhaseBanner
        view={view}
        visible={
          view.phase !== GamePhase.LOBBY &&
          !privateRevealVisible &&
          !privateNightVisible &&
          !detectiveResultVisible &&
          !discussionVisible &&
          !votingVisible &&
          !eliminationVisible &&
          !gameOverVisible &&
          !spectatorVisible
        }
      />
      <HowToPlayModal visible={howToPlayVisible} onClose={() => (howToPlayVisible = false)} />
    </UiEntity>
  )
}
