import ReactEcs, { Label, UiEntity } from '@dcl/sdk/react-ecs'
import { PlayerRole } from '../../game/types'
import { RoleEmblem } from './role-emblem'
import { COLORS } from '../theme'

/** Call only with the local private role or an explicitly public server reveal. */
export function RevealedCard(props: { role: PlayerRole; name: string; compact?: boolean }) {
  return <UiEntity uiTransform={{ width: props.compact ? 148 : 174, height: props.compact ? 226 : 264, padding: props.compact ? 6 : 8, margin: props.compact ? '4px' : '6px', flexDirection: 'column', alignItems: 'center', borderWidth: 1, borderColor: COLORS.gold, flexShrink: 0 }} uiBackground={{ color: COLORS.ink }}>
    <RoleEmblem role={props.role} size={props.compact ? 128 : 154} />
    <Label value={props.role} font="serif" fontSize={props.compact ? 19 : 23} color={COLORS.gold} uiTransform={{ width: '100%', height: props.compact ? 38 : 44 }} />
    <Label value={props.name.slice(0,22)} textWrap="wrap" fontSize={props.compact ? 15 : 18} color={COLORS.text} uiTransform={{ width: '100%', height: 42 }} />
  </UiEntity>
}
