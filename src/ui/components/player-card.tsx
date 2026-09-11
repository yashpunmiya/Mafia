import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { isMobile } from '@dcl/sdk/platform'
import { COLORS } from '../theme'

/** A ballot contains public identity, never hidden roles or other players' choices. */
export function PlayerCard(props: { id: string; name: string; selected: boolean; disabled: boolean; onSelect: () => void }) {
  const mobile = isMobile()
  return <UiEntity uiTransform={{ width: mobile ? 154 : 174, height: mobile ? 230 : 250, margin: mobile ? '4px' : '6px', padding: 5, flexShrink: 0, borderWidth: 2, borderColor: props.selected ? COLORS.gold : COLORS.border, flexDirection: 'column' }}
    uiBackground={{ color: props.selected ? COLORS.gold : COLORS.ink }} onMouseDown={props.disabled ? undefined : props.onSelect}>
    <UiEntity uiTransform={{ width: '100%', height: mobile ? 144 : 162, padding: 6, flexDirection: 'column', alignItems: 'center' }} uiBackground={{ color: props.selected ? COLORS.selected : COLORS.panelSoft }}>
      <Label value={props.selected ? 'YOUR CHOICE' : 'COUNCIL DOSSIER'} fontSize={12} color={COLORS.gold} uiTransform={{ width: '100%', height: 20 }} />
      <UiEntity uiTransform={{ width: mobile ? 106 : 122, height: mobile ? 106 : 122, borderWidth: 1, borderColor: COLORS.gold }} uiBackground={{ avatarTexture: { userId: props.id }, textureMode: 'stretch' }} />
    </UiEntity>
    <UiEntity uiTransform={{ width: '100%', height: 70, flexDirection: 'column', alignItems: 'center', padding: '4px 6px' }} uiBackground={{ color: COLORS.parchment }}>
      <Label value={props.name.length > 18 ? `${props.name.slice(0,16)}...` : props.name} textWrap="wrap" font="serif" fontSize={mobile ? 19 : 23} color={COLORS.ink} uiTransform={{ width: '100%', height: 36 }} />
      <Label value={props.selected ? (props.disabled ? 'VOTE / ACTION SEALED' : 'SELECTED - CONFIRM BELOW') : props.disabled ? 'BALLOT CLOSED' : 'TAP TO CHOOSE'} textWrap="wrap" fontSize={mobile ? 10 : 11} color={COLORS.selected} uiTransform={{ width: '100%', height: 26 }} />
    </UiEntity>
  </UiEntity>
}
