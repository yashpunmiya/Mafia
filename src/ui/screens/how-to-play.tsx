import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { isMobile } from '@dcl/sdk/platform'
import { PlayerRole } from '../../game/types'
import { LargeButton } from '../components/button'
import { CardFrame, CardEyebrow } from '../components/card-frame'
import { RoleEmblem } from '../components/role-emblem'
import { COLORS } from '../theme'

let page = 0
const roles = [
  { role: PlayerRole.MAFIA, title: 'MAFIA', text: 'Choose another living player at night. Blend into the discussion. Win when Mafia equals or outnumbers everyone else alive.' },
  { role: PlayerRole.DOCTOR, title: 'DOCTOR', text: 'Protect one living player each night, including yourself. You cannot protect the same person two nights in a row.' },
  { role: PlayerRole.DETECTIVE, title: 'DETECTIVE', text: 'Investigate another living player each night. Only you receive MAFIA or NOT MAFIA. Use that knowledge wisely.' },
  { role: PlayerRole.VILLAGER, title: 'VILLAGER', text: 'No night action. Listen, question contradictions and vote. You, the Doctor and Detective win by removing the Mafia.' }
]
const steps = [
  ['01 / TAKE YOUR PLACE', 'Gather 4 or 5 players. Everyone taps READY TO PLAY. Sitting is optional; MINIMIZE lets you explore the village.'],
  ['02 / KEEP YOUR SECRET', 'Your role appears privately for 7 seconds. There is one Mafia, one Doctor, one Detective and 1 or 2 Villagers.'],
  ['03 / NIGHT FALLS', 'You have 30 seconds. Tap a target card, then CONFIRM. Accepted actions lock. No submission means no action.'],
  ['04 / DISCUSS & VOTE', 'After morning, discuss for 45 seconds using Decentraland voice. Then choose who you suspect. The night/day cycle repeats.']
]
const voting = [
  ['MAKE YOUR CASE', 'Use the platform voice controls; the scene has no separate voice chat. Share suspicions during discussion, not private screenshots.'],
  ['ONE LOCKED VOTE', 'Living players have 15 seconds to choose another living player and confirm. No self-vote or changes. Live totals stay hidden.'],
  ['TIES & REVEALS', 'A top-vote tie opens a 10-second runoff between tied candidates. Another tie means no elimination. A voted-out role is revealed.'],
  ['WIN OR WATCH', 'Village wins when Mafia is gone. Mafia wins at parity. Dead players cannot act or vote: spectate without revealing secrets. PLAY AGAIN starts fresh.']
]

export function HowToPlayModal(props: { visible: boolean; onClose: () => void }) {
  const mobile = isMobile()
  return <UiEntity uiTransform={{ display: props.visible ? 'flex' : 'none', positionType: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', pointerFilter: 'block', zIndex: 20 }}>
    <CardFrame width={mobile ? '94%' : 1040} height={mobile ? '94%' : 650}>
      <CardEyebrow text="THE COUNCIL HANDBOOK" />
      <Label value="Trust is the game." font="serif" fontSize={mobile ? 36 : 44} color={COLORS.text} uiTransform={{ width: '100%', height: 60, flexShrink: 0 }} />
      <UiEntity uiTransform={{ width: '100%', height: 52, justifyContent: 'space-between', flexShrink: 0 }}>
        {['QUICK START', 'THE FOUR ROLES', 'VOTING & WINNING'].map((title, i) => <UiEntity uiTransform={{ width: '32%', height: 48, borderWidth: 1, borderColor: page === i ? COLORS.gold : COLORS.border }} uiBackground={{ color: page === i ? COLORS.panelSoft : COLORS.ink }} onMouseDown={() => { page = i }}>
          <Label value={title} textWrap="wrap" fontSize={mobile ? 16 : 20} color={page === i ? COLORS.gold : COLORS.muted} uiTransform={{ width: '100%', height: '100%' }} />
        </UiEntity>)}
      </UiEntity>
      <UiEntity uiTransform={{ width: '100%', height: 342, margin: '8px 0 0', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'space-between', overflow: 'hidden' }}>
        {page === 1 ? roles.map(r => <UiEntity uiTransform={{ width: '24%', height: 336, padding: mobile ? 8 : 12, flexDirection: 'column', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border }} uiBackground={{ color: COLORS.panelSoft }}>
          <RoleEmblem role={r.role} size={mobile ? 86 : 100} />
          <Label value={r.title} font="serif" fontSize={mobile ? 21 : 25} color={COLORS.gold} uiTransform={{ width: '100%', height: 40, flexShrink: 0 }} />
          <Label value={r.text} textWrap="wrap" fontSize={mobile ? 15 : 18} textAlign="top-left" color={COLORS.text} uiTransform={{ width: '100%', height: 188, flexShrink: 0 }} />
        </UiEntity>) : (page === 0 ? steps : voting).map(([title, text]) => <UiEntity uiTransform={{ width: '49%', height: 166, margin: '0 0 6px', padding: mobile ? 11 : 16, flexDirection: 'column', borderWidth: 1, borderColor: COLORS.border }} uiBackground={{ color: COLORS.panelSoft }}>
          <Label value={title} textWrap="wrap" fontSize={mobile ? 17 : 20} textAlign="middle-left" color={COLORS.gold} uiTransform={{ width: '100%', height: 38, flexShrink: 0 }} />
          <Label value={text} textWrap="wrap" fontSize={mobile ? 16 : 19} textAlign="top-left" color={COLORS.text} uiTransform={{ width: '100%', height: 104, flexShrink: 0 }} />
        </UiEntity>)}
      </UiEntity>
      <LargeButton label="BACK TO THE VILLAGE" secondary onPress={props.onClose} />
    </CardFrame>
  </UiEntity>
}
