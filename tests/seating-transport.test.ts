import { performSeating } from '../src/world/seating-transport'

function assert(value: boolean, reason: string) { if (!value) throw new Error(reason) }
async function main() {
  const calls: string[] = []
  const steps = {
    move: async () => { calls.push('move'); return {} },
    settle: async () => { calls.push('settle'); return true },
    valid: () => true,
    play: async () => { calls.push('play') },
    stage: (value: 'move' | 'pose') => { calls.push(value + '-stage') }
  }
  assert(await performSeating(steps), 'Legacy movement response without success flag works')
  assert(calls.join(',') === 'move-stage,move,settle,pose-stage,play', 'Move settles before pose, no prerequisite stop RPC')
  calls.length = 0
  assert(!await performSeating({...steps, valid: () => false}), 'Cancelled match does not start pose')
  assert(!calls.includes('play'), 'No late pose after cancellation')
  calls.length = 0
  assert(!await performSeating({...steps, settle: async () => false}), 'Unsettled position rejected')
  assert(!calls.includes('play'), 'No pose at wrong chair position')
  let stage = ''
  try { await performSeating({...steps, stage: s => {stage=s}, move: async () => {throw new Error('RPC unavailable')} }) } catch { assert(stage === 'move', 'Movement failure identified') }
  try { await performSeating({...steps, stage: s => {stage=s}, play: async () => {throw new Error('Asset failed')} }) } catch { assert(stage === 'pose', 'Animation failure identified') }
  console.log('PASS seating transport: legacy RPC, ordering, cancellation, unsettled position and failure stages')
}
void main().catch(error => { throw error })
