/** Platform-independent sequence, injected so mobile RPC failures can be tested. */
export async function performSeating(steps: {
  move: () => Promise<unknown>
  settle: () => Promise<boolean>
  valid: () => boolean
  play: () => Promise<unknown>
  stage: (stage: 'move' | 'pose') => void
}): Promise<boolean> {
  steps.stage('move')
  await steps.move()
  if (!steps.valid() || !await steps.settle() || !steps.valid()) return false
  steps.stage('pose')
  await steps.play()
  return steps.valid()
}
