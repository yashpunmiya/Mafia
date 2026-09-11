const assert = require('node:assert/strict')
const fs = require('fs')
const emote = fs.readFileSync('assets/models/council_sitting_emote.glb')
assert.equal(emote.readUInt32LE(0), 0x46546c67)
assert.equal(emote.readUInt32LE(8), emote.length)
const emoteGltf = JSON.parse(emote.subarray(20, 20 + emote.readUInt32LE(12)))
assert.equal(emoteGltf.animations[0].name, 'Sitting_Chair_v02')
assert(emoteGltf.animations[0].channels.some(c => emoteGltf.nodes[c.target.node].name === 'Avatar_Hips'))
assert(emoteGltf.buffers.every(b => !b.uri), 'Sitting animation must be bundled, not externally streamed')
console.log('PASS bundled council sitting animation: valid GLB, avatar hip channel and no external buffers')
const b = fs.readFileSync('assets/models/moonlit-courtyard.glb')
assert.equal(b.readUInt32LE(0), 0x46546c67)
assert.equal(b.readUInt32LE(8), b.length)
const gltf = JSON.parse(b.subarray(20,20+b.readUInt32LE(12)))
let triangles = 0
for (const p of gltf.meshes[0].primitives) {
  const a = gltf.accessors[p.attributes.POSITION]
  triangles += (p.indices === undefined ? a.count : gltf.accessors[p.indices].count) / 3
  // Inspector AUTO: rotate Y 180 then reflect Z => SDK (-X,Y,Z).
  // Bevy rotates GLTF roots Y 180 before its SDK Z conversion: same mapping.
  assert(-a.max[0] >= 0 && a.min[2] >= 0 && -a.min[0] <= 16 && a.max[2] <= 16 && a.max[1] <= 20)
  assert.equal(a.count, gltf.accessors[p.attributes.NORMAL].count)
}
assert(triangles < 9500, 'Detailed courtyard must retain headroom below the 10k scene budget')
assert(gltf.materials.length <= 9)
assert(gltf.materials.every(m => m.name === 'lantern' || !m.emissiveFactor), 'Architecture must not glow')
const colliderNode = gltf.nodes.find(n => n.name?.endsWith('_collider'))
assert(colliderNode, 'Courtyard must include dedicated structural collision geometry')
const collider = gltf.accessors[gltf.meshes[colliderNode.mesh].primitives[0].attributes.POSITION]
assert(collider.count >= 100, 'Collision geometry must cover more than one object')
assert(-collider.max[0] >= 0 && -collider.min[0] <= 16 && collider.min[2] >= 0 && collider.max[2] <= 16)
const c = JSON.parse(fs.readFileSync('assets/scene/main.composite', 'utf8'))
const get = name => c.components.find(x => x.name === name).data
const names = get('core-schema::Name')
const nodes = get('inspector::Nodes')['0'].json.value
const find = name => Object.keys(names).find(id => names[id].json.value === name)
const boardId = find('Lobby Sign')
assert(boardId, 'Board label must exist')
assert(!c.components.find(x => x.name === 'core::Billboard')?.data[boardId], 'Mounted board label must not track the camera')
assert.equal(get('core::Transform')[boardId].json.parent, 0, 'Board label stays attached to the scene, not the player or camera')
console.log('PASS board label: static scene orientation, no camera-facing Billboard')
assert(find('Moonlit Courtyard Architecture'))
const container = get('core::GltfContainer')[find('Moonlit Courtyard Architecture')].json
assert.equal(container.visibleMeshesCollisionMask, 0, 'Do not block sitting with cushion meshes')
assert.equal(container.invisibleMeshesCollisionMask & 2, 2, 'Structural physics must be enabled')
const architecture = get('core::Transform')[find('Moonlit Courtyard Architecture')].json
assert.deepEqual(architecture.position, {x:0,y:0,z:0})
assert.deepEqual(architecture.scale, {x:1,y:1,z:1})
assert.deepEqual(architecture.rotation, {x:0,y:0,z:0,w:1})
// Compare actual exported velvet geometry with every chair's SDK anchor.
const velvet = gltf.meshes[0].primitives.find(p=>gltf.materials[p.material].name==='velvet')
const accessor=gltf.accessors[velvet.attributes.POSITION], bufferView=gltf.bufferViews[accessor.bufferView]
const binaryOffset=28+b.readUInt32LE(12)
const velvetPositions=[]
for(let i=0;i<accessor.count;i++){
  const off=binaryOffset+(bufferView.byteOffset||0)+(accessor.byteOffset||0)+i*12
  velvetPositions.push([-b.readFloatLE(off),b.readFloatLE(off+4),b.readFloatLE(off+8)])
}
const positions = new Set()
for (let i = 1; i <= 5; i++) {
  const id = find(`Council Seat ${i}`)
  assert(id)
  assert(nodes.some(n => n.entity === Number(id)))
  assert(!get('core::MeshCollider')[id], 'Seat must not block the sitting avatar')
  const anchor=get('core::Transform')[id].json.position
  const cushion=velvetPositions.filter(([x,y,z])=>y<.8&&Math.hypot(x-anchor.x,z-anchor.z)<.8)
  assert(cushion.length>=6, `Chair ${i}: exported cushion does not line up with avatar anchor`)
  const cushionTop = Math.max(...cushion.map(v => v[1]))
  assert(Math.abs(cushionTop - .675) < .005, `Chair ${i}: cushion must be lowered to the calibrated .675m height`)
  positions.add(JSON.stringify(get('core::Transform')[id].json.position))
}
assert.equal(positions.size, 5)
for(const [id] of Object.entries(get('core::Transform'))) assert(nodes.some(n=>n.entity===Number(id)), `Editor node missing: ${id}`)
console.log(`PASS courtyard: importer-space bounds, ${triangles} triangles, materials, actual cushion/seat alignment and editor registry`)
console.log('PASS dedicated courtyard collision mesh and enabled physics mask')
