import { engine, InputAction, InputModifier, TouchScreenControls } from '@dcl/sdk/ecs'

let currentMovementLock: boolean | null = null

/**
 * Declutter the native mobile HUD for this UI-driven game.
 * The Explorer-owned emote control is intentionally untouched.
 */
export function setupMobileControls(): void {
  applyGameplayMovementLock(false)
}

/**
 * Active participants remain at the council table. Camera movement, UI input,
 * chat, voice and the Explorer-owned emote menu remain available.
 */
export function applyGameplayMovementLock(locked: boolean): void {
  if (locked === currentMovementLock) return
  currentMovementLock = locked

  TouchScreenControls.createOrReplace(engine.RootEntity, {
    hideJoystick: locked,
    hideCrosshair: true,
    touchInputs: [
      { inputAction: InputAction.IA_JUMP, hide: true },
      { inputAction: InputAction.IA_POINTER, hide: true },
      { inputAction: InputAction.IA_PRIMARY, hide: true },
      { inputAction: InputAction.IA_SECONDARY, hide: true },
      { inputAction: InputAction.IA_ACTION_3, hide: true },
      { inputAction: InputAction.IA_ACTION_4, hide: true },
      { inputAction: InputAction.IA_ACTION_5, hide: true },
      { inputAction: InputAction.IA_ACTION_6, hide: true }
    ]
  })

  if (locked) {
    InputModifier.createOrReplace(engine.PlayerEntity, {
      mode: InputModifier.Mode.Standard({
        disableWalk: true,
        disableJog: true,
        disableRun: true,
        disableJump: true,
        disableDoubleJump: true,
        disableGliding: true
      })
    })
  } else if (InputModifier.has(engine.PlayerEntity)) {
    InputModifier.deleteFrom(engine.PlayerEntity)
  }
}
