import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { isMobile } from '@dcl/sdk/platform'
import { PlayerRole, ROLE_PROFILES } from '../../game/types'
import { ClientViewState } from '../../multiplayer/client-network'
import { PhaseTimer } from '../components/timer'
import { COLORS } from '../theme'
import { RoleEmblem } from '../components/role-emblem'

export function RoleRevealScreen(props: { view: ClientViewState; visible: boolean }) {
  const role = props.view.privateRoleMatchCounter === props.view.matchCounter ? props.view.privateRole : null
  const profile = role ? ROLE_PROFILES[role] : null
  const mobile = isMobile()
  const accent = role === PlayerRole.MAFIA ? COLORS.danger : role === PlayerRole.DOCTOR ? COLORS.doctor : role === PlayerRole.DETECTIVE ? COLORS.detective : COLORS.gold
  return <UiEntity uiTransform={{ display: props.visible ? 'flex' : 'none', positionType: 'absolute', width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', zIndex: 12 }}>
    <UiEntity uiTransform={{ width: mobile ? '88%' : 940, height: mobile ? '86%' : 550, padding: mobile ? 18 : 28, borderWidth: 1, borderColor: COLORS.border }} uiBackground={{ color: COLORS.panel }}>
      <UiEntity uiTransform={{ width: '33%', height: '100%', padding: 12, borderWidth: 1, borderColor: accent, flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between' }} uiBackground={{ color: role === PlayerRole.MAFIA ? COLORS.selected : COLORS.panelSoft }}>
        <Label value="THE MOONLIT COUNCIL" fontSize={16} color={COLORS.gold} uiTransform={{ width: '100%', height: 42 }} />
        {role ? <RoleEmblem role={role} size={mobile ? 220 : 268} /> : <Label value="SEALED" font="serif" fontSize={mobile ? 34 : 42} color={COLORS.gold} uiTransform={{ width: mobile ? 220 : 268, height: mobile ? 220 : 268 }} />}
        <Label value={profile?.name.toUpperCase() ?? 'SEALED'} font="serif" fontSize={29} color={COLORS.text} uiTransform={{ width: '100%', height: 64 }} />
      </UiEntity>
      <UiEntity uiTransform={{ width: '64%', height: '100%', margin: '0 0 0 3%', flexDirection: 'column' }}>
        <Label value="FOR YOUR EYES ONLY" fontSize={17} color={COLORS.gold} textAlign="middle-left" uiTransform={{ width: '100%', height: 42 }} />
        <Label textWrap="wrap" value={profile ? `You are the ${profile.name}.` : 'Your secret awaits.'} font="serif" fontSize={mobile ? 34 : 42} color={COLORS.text} textAlign="middle-left" uiTransform={{ width: '100%', height: 76 }} />
        <Label textWrap="wrap" value={profile?.description ?? 'Requesting your role through the private server channel.'} fontSize={mobile ? 20 : 23} color={COLORS.muted} textAlign="middle-left" uiTransform={{ width: '100%', height: 84 }} />
        <UiEntity uiTransform={{ width: '100%', height: 1, margin: '8px 0' }} uiBackground={{ color: COLORS.border }} />
        <Label value="YOUR PURPOSE" fontSize={16} color={accent} textAlign="middle-left" uiTransform={{ width: '100%', height: 32 }} />
        <Label textWrap="wrap" value={profile?.objective ?? 'Keep this screen private while delivery completes.'} fontSize={mobile ? 20 : 23} color={COLORS.text} textAlign="middle-left" uiTransform={{ width: '100%', height: 90 }} />
        <UiEntity uiTransform={{ width: '100%', height: 64, justifyContent: 'space-between' }}>
          <Label value="Remember your role.\nThe night is about to begin." textWrap="wrap" fontSize={mobile ? 15 : 17} color={COLORS.muted} textAlign="middle-left" uiTransform={{ width: '62%', height: 64 }} />
          <PhaseTimer seconds={props.view.secondsLeft} />
        </UiEntity>
      </UiEntity>
    </UiEntity>
  </UiEntity>
}
