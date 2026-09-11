import { isServer } from '@dcl/sdk/network'
import './shared/messages'
import './shared/schemas'

export async function main(): Promise<void> {
  if (isServer()) {
    const { setupAuthority } = await import('./server/authority')
    setupAuthority()
    return
  }

  const [{ setupClientNetwork }, { setupUi }, { setupEnvironment }] = await Promise.all([
    import('./multiplayer/client-network'),
    import('./ui'),
    import('./world/environment')
  ])
  setupClientNetwork()
  setupEnvironment()
  setupUi()
}
