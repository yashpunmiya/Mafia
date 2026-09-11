# Publish MAFIA to feelsbar.dcl.eth

Prepared without gameplay changes. Nothing was deployed or signed.

## Exact relevant scene.json configuration

```json
{
  "authoritativeMultiplayer": true,
  "worldConfiguration": {
    "name": "feelsbar.dcl.eth"
  },
  "featureToggles": {
    "voiceChat": "enabled",
    "portableExperiences": "enabled",
    "nearbyVoiceChat": "enabled"
  }
}
```

This is an excerpt, not a replacement for the complete scene.json.

## Readiness

Typecheck, automated tests, build, SDK scene schema, World/voice invariants, and publishable-file checks pass. DEBUG_MODE remains false. No localhost runtime endpoint was found. Sources and working files are excluded from publishing; all runtime assets remain included (~12.55 MB total at preparation).

Before a public release, complete the 4-5 player and physical-phone checks in TEST_PLAN.md, including both wins, ties/runoff, reconnect, private action/role isolation, repeated rounds and Play Again. Check sitting on both avatar body shapes and measure runtime performance. Automated build checks cannot certify those live behaviors.

## Creator Hub clicks (owner performs these)

1. Reopen this scene project to load the edited scene.json.
2. Use Preview for the final multiplayer/mobile checks.
3. Click **Publish** at the top right, then **PUBLISH TO WORLD**.
4. Connect the wallet owning feelsbar.dcl.eth (or one granted deployment permission). Select **feelsbar.dcl.eth** as the destination, not LAND or a test server. If it is missing, stop and check wallet/World permissions.
5. Review the scene details, thumbnail, available World storage and any existing-content replacement warning. Do not enable Multi-Scene World unless that is separately intended.
6. Continue through the publishing confirmation and approve the deployment signature yourself in the browser/wallet when ready. Never share a seed phrase or private key.
7. Wait for asset conversion, then enter the World and verify the authoritative server connects and 4-5 clients can join, ready, receive private roles and complete a match with voice available. Do not assume a successful upload alone proves multiplayer server health.

Official flow: https://docs.decentraland.org/creator/scenes-sdk7/publishing/publishing
