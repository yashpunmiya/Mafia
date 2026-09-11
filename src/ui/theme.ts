import { Color4 } from '@dcl/sdk/math'

export const COLORS = {
  overlay: Color4.create(0.015, 0.025, 0.045, 0.32),
  panel: Color4.create(0.025, 0.045, 0.065, 0.97),
  panelSoft: Color4.create(0.065, 0.09, 0.115, 0.98),
  border: Color4.create(0.34, 0.29, 0.20, 1),
  gold: Color4.create(0.79, 0.65, 0.40, 1),
  text: Color4.create(0.95, 0.91, 0.82, 1),
  muted: Color4.create(0.57, 0.63, 0.66, 1),
  ready: Color4.create(0.25, 0.8, 0.54, 1),
  danger: Color4.create(0.92, 0.3, 0.34, 1),
  detective: Color4.create(0.3, 0.68, 0.98, 1),
  doctor: Color4.create(0.28, 0.84, 0.64, 1),
  villager: Color4.create(0.92, 0.78, 0.45, 1),
  disabled: Color4.create(0.13, 0.17, 0.19, 1),
  ink: Color4.create(0.035, 0.045, 0.055, 1),
  selected: Color4.create(0.24, 0.085, 0.085, 1),
  parchment: Color4.create(.87, .81, .68, 1)
} as const
