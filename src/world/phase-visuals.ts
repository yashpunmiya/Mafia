import { engine, LightSource, Material, SkyboxTime } from '@dcl/sdk/ecs'
import { Color3, Color4 } from '@dcl/sdk/math'
import { GamePhase } from '../game/types'

const NIGHT_PHASES = new Set([GamePhase.ROLE_REVEAL, GamePhase.NIGHT_ACTION])

export function applyPhaseVisuals(phase: GamePhase): void {
  const flame = engine.getEntityOrNullByName('Council Flame')
  if (!flame) return

  const night = NIGHT_PHASES.has(phase)
  const voting =
    phase === GamePhase.VOTING || phase === GamePhase.RUNOFF_VOTING || phase === GamePhase.ELIMINATION
  const glow = voting ? Color3.create(1, 0.30, 0.12) : Color3.create(1, 0.55, 0.18)

  Material.setPbrMaterial(flame, {
    albedoColor: Color4.create(glow.r * 0.4, glow.g * 0.4, glow.b * 0.4, 1),
    emissiveColor: glow,
    emissiveIntensity: voting ? 4 : 2.5,
    roughness: 0.45,
    metallic: 0
  })

  const light = LightSource.getMutableOrNull(flame)
  if (light) {
    light.color = glow
    light.intensity = voting ? 420 : night ? 240 : 320
    light.range = 9
  }

  SkyboxTime.createOrReplace(engine.RootEntity, {
    fixedTime: night || phase === GamePhase.LOBBY ? 79_200 : phase === GamePhase.MORNING ? 25_200 : 61_200
  })
}
