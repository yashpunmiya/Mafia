import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'
import { PlayerRole } from '../../game/types'

/** All art ships publicly; which role is selected is PRIVATE until authorized reveal. */
export function RoleEmblem(props: { role: PlayerRole; size?: number }) {
  const right = props.role === PlayerRole.DOCTOR || props.role === PlayerRole.VILLAGER
  const bottom = props.role === PlayerRole.DETECTIVE || props.role === PlayerRole.VILLAGER
  const x = right ? .5 : 0, y = bottom ? 0 : .5
  return <UiEntity uiTransform={{ width: props.size ?? 240, height: props.size ?? 240, flexShrink: 0 }}
    uiBackground={{ texture: { src: 'assets/images/role-emblems.png' }, textureMode: 'stretch', uvs: [x,y,x,y+.5,x+.5,y+.5,x+.5,y] }} />
}
