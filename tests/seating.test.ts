import { councilSeatIndex } from '../src/world/seat-assignment'
import { GamePhase, PublicPlayer } from '../src/game/types'
import { councilAvatarPosition } from '../src/world/seat-position'

function assert(value: boolean, reason: string) { if (!value) throw new Error(reason) }
const players: PublicPlayer[] = Array.from({length: 5}, (_, i) => ({ id: `p${i}`, name: `Player ${i}`, alive: true, connected: true, ready: true, status: 'PLAYER', matchParticipant: true }))
const indices = players.map(p => councilSeatIndex(players, p.id, GamePhase.NIGHT_ACTION))
assert(new Set(indices).size === 5 && indices.every(i => i >= 0), 'Five unique council chairs')
const changed = players.map(p => ({...p}))
changed[0].alive = false; changed[0].status = 'SPECTATOR'
changed[1].connected = false
assert(councilSeatIndex(changed, 'p0', GamePhase.NIGHT_ACTION) === -1, 'Dead player rejected')
assert(councilSeatIndex(changed, 'p1', GamePhase.NIGHT_ACTION) === -1, 'Disconnected player rejected')
assert(councilSeatIndex(changed, 'p4', GamePhase.NIGHT_ACTION) === 4, 'Survivor keeps original seat')
changed[1].connected = true
assert(councilSeatIndex(changed, 'p1', GamePhase.NIGHT_ACTION) === 1, 'Reconnect recovers original seat')
assert(councilSeatIndex(players, 'spectator', GamePhase.LOBBY) === -1, 'Spectator cannot take seat')
assert(councilSeatIndex(players, 'p0', GamePhase.GAME_OVER) === -1, 'Game over releases seating')
assert(councilSeatIndex(players, 'p0', GamePhase.LOBBY) === 0, 'New lobby permits seating')
console.log('PASS seating: five unique chairs, dead/spectator/disconnected rejection, stable survivors, reconnect and reset')
for (let i = 0; i < 5; i++) {
  const angle = Math.PI + i * Math.PI * 2 / 5
  const anchor = { x: 8 + Math.sin(angle) * 3.55, y: .1, z: 8 + Math.cos(angle) * 3.55 }
  const position = councilAvatarPosition(anchor)
  const dx = 8 - anchor.x, dz = 8 - anchor.z, distance = Math.hypot(dx, dz)
  assert(Math.abs(position.x - (anchor.x + dx / distance * .667)) < .00001, 'Preserve the tuned X seating correction')
  assert(Math.abs(position.z - (anchor.z + dz / distance * .467)) < .00001, 'Preserve the tuned Z seating correction')
  assert(position.y === anchor.y, 'Preserve floor-level anchor height')
}
assert(councilAvatarPosition({x:8,y:.1,z:8}).x === 8, 'Degenerate center position stays finite')
console.log('PASS seating pose: five tuned inward offsets, floor height and finite center fallback')
