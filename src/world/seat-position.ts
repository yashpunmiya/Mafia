export const COUNCIL_SITTING_EMOTE = 'assets/models/council_sitting_emote.glb'

/** The bundled clip needs a device-tested, axis-specific root correction.
 * Move the feet toward the table so the hips, not the feet, land on the cushion.
 * Its hip height is 0.641m above the root; retain the floor-level anchor Y.
 */
export function councilAvatarPosition(anchor: { x: number; y: number; z: number }) {
  const dx = 8 - anchor.x, dz = 8 - anchor.z
  const distance = Math.hypot(dx, dz)
  if (distance < .001) return { ...anchor }
  return { x: anchor.x + dx / distance * .667, y: anchor.y, z: anchor.z + dz / distance * .467 }
}
