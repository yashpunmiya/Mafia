export function secondsRemaining(phaseEndsAt: number, now: number): number {
  if (phaseEndsAt <= 0) return 0
  return Math.max(0, Math.ceil((phaseEndsAt - now) / 1_000))
}
