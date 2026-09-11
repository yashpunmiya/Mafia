// Reproducible, original low-poly courtyard mesh. No external art downloads.
// Run only with the scene closed in Creator Hub (it owns the composite).
// Legacy generator: the detailed, chair-calibrated model is now edited in Blender.
// Explicit opt-in prevents accidentally replacing it with the old basic village.
if (!process.argv.includes('--legacy')) throw Error('Legacy courtyard generator disabled. Edit scripts/village.blend; --legacy deliberately restores the old basic geometry.')
const fs = require('fs')
const materials = [
  ['limestone', [.29,.32,.35,1]], ['stone-light', [.39,.41,.43,1]],
  ['timber', [.12,.075,.045,1]], ['brass', [.57,.38,.13,1]],
  ['slate', [.045,.095,.15,1]], ['velvet', [.18,.035,.045,1]],
  ['leaves', [.07,.16,.12,1]], ['lantern', [1,.53,.14,1]],
  ['midnight', [.025,.045,.07,1]]
].map(([name,color])=>({name,pbrMetallicRoughness:{baseColorFactor:color,metallicFactor:name==='brass'?.65:0,roughnessFactor:.86},...(name==='lantern'?{emissiveFactor:[1,.48,.08]}:{})}))
const groups = materials.map(()=>({p:[],n:[]}))
const collisionGroup = {p:[],n:[]}
let colliderMode = false
function tri(m,a,b,c) {
  // DCL's GLTF import includes a 180-degree Y rotation as well as the
  // handedness conversion: net SDK mapping is (-gltf.x, gltf.y, gltf.z).
  // Confirmed in installed Inspector GLTFLoader AUTO and Bevy gltf_container.rs.
  // Keep the existing parcel-corner pivot; reverse winding for reflection.
  const toGltf = ([x,y,z]) => [-x,y,z]
  const originalB = b
  a = toGltf(a); b = toGltf(c); c = toGltf(originalB)
  const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i])
  const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]], l=Math.hypot(...n)||1
  const group = colliderMode ? collisionGroup : groups[m]
  group.p.push(...a,...b,...c); for(let i=0;i<3;i++)group.n.push(...n.map(x=>x/l))
}
function box(m,x,y,z,w,h,d,yaw=0) {
  const pts=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(([a,b,c])=>[x+a*w/2*Math.cos(yaw)+c*d/2*Math.sin(yaw),y+b*h/2,z-a*w/2*Math.sin(yaw)+c*d/2*Math.cos(yaw)])
  for(const [a,b,c,e] of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]]){tri(m,pts[a],pts[b],pts[c]);tri(m,pts[a],pts[c],pts[e])}
}
function cone(m,x,y,z,r,h,top=0,n=12) {
  for(let i=0;i<n;i++){
    const a=i*Math.PI*2/n,b=(i+1)*Math.PI*2/n
    const p=[x+r*Math.sin(a),y,z+r*Math.cos(a)],q=[x+r*Math.sin(b),y,z+r*Math.cos(b)],u=[x+top*Math.sin(a),y+h,z+top*Math.cos(a)],v=[x+top*Math.sin(b),y+h,z+top*Math.cos(b)]
    tri(m,p,q,v);tri(m,p,v,u);tri(m,[x,y,z],q,p);if(top)tri(m,[x,y+h,z],u,v)
  }
}
// Irregular concentric stone paving with visible mortar joints.
for(let ring=2;ring<=7;ring++)for(let i=0;i<ring*9;i++){
  const a=i*Math.PI*2/(ring*9),r=ring*.79
  box((i+ring)%3===0?1:0,8+Math.sin(a)*r,.125,8+Math.cos(a)*r,.47,.07,.68,a)
}
// Low enclosure leaves a generous south entry and east/west paths.
for(let i=0;i<24;i++){
  const a=i*Math.PI*2/24
  if([5,6,7,11,12,13,17,18,19].includes(i))continue
  for(let row=0;row<3;row++)box(row%2?1:0,8+Math.sin(a)*5.9,.29+row*.3,8+Math.cos(a)*5.9,1.42,.28,.40,a)
  box(1,8+Math.sin(a)*5.9,1.10,8+Math.cos(a)*5.9,1.48,.15,.55,a)
}
// Council thrones: five original timber / crimson upholstered modeled chairs.
for(let i=0;i<5;i++){
  const a=Math.PI+i*Math.PI*2/5,x=8+Math.sin(a)*3.55,z=8+Math.cos(a)*3.55,yaw=a+Math.PI
  const part=(m,dx,y,dz,w,h,d)=>box(m,x+dx*Math.cos(yaw)+dz*Math.sin(yaw),y,z-dx*Math.sin(yaw)+dz*Math.cos(yaw),w,h,d,yaw)
  part(2,0,.56,0,1.05,.18,1.05);part(5,0,.70,0,.87,.15,.85)
  part(2,0,1.36,-.46,1.1,1.55,.16);part(5,0,1.48,-.35,.82,1.16,.09)
  for(const dx of [-.5,.5]){part(3,dx,1.37,-.46,.08,1.72,.19);part(2,dx,.89,.04,.12,.12,1.07);for(const dz of [-.4,.4])part(2,dx,.33,dz,.12,.46,.12)}
  part(3,0,2.13,-.45,1.17,.09,.22);part(3,0,1.56,-.29,.08,.42,.035);part(3,0,1.56,-.29,.32,.07,.04)
}
// Rear monument, dais and obelisk. Decorative, deliberately not climb-blocking.
for(let i=0;i<3;i++)box(0,8,.16+i*.17,13.35,4.2-i*.45,.19,2.5-i*.4)
box(1,8,.85,13.55,1.55,.8,1.25);box(4,8,2.48,13.55,1.14,2.55,.83)
cone(3,8,3.75,13.55,.83,.82,0,4)
box(3,8,2.65,13.11,.10,1.3,.055);box(3,8,2.65,13.10,.62,.1,.06)
for(const x of [5.9,10.1]){box(0,x,1.52,13.7,.42,2.65,.42);cone(1,x,2.85,13.7,.38,.6,0,4)}
// Spectator pergola (east) with two benches.
for(const x of [12.9,15])for(const z of [5.5,10.5])box(2,x,1.5,z,.19,2.8,.19)
for(const x of [12.9,15])box(2,x,2.94,8,.24,.23,5.5)
for(let z=5.4;z<=10.7;z+=.55)box(2,13.95,3.10,z,2.6,.14,.16)
for(const z of [6,10]){box(2,14,.61,z,1.8,.17,.55);for(const x of [13.3,14.7])box(2,x,.34,z,.15,.5,.38)}
// Compact gabled village houses along the rear corners, fully inside parcel.
for(const x of [2,14]){
  box(0,x,1.47,13.65,2.35,2.6,2.45)
  // Four-sided roof with ridge.
  const a=[x-1.38,2.8,12.2],b=[x+1.38,2.8,12.2],c=[x+1.38,2.8,15.1],d=[x-1.38,2.8,15.1],e=[x,4.05,12.2],f=[x,4.05,15.1]
  tri(4,a,e,f);tri(4,a,f,d);tri(4,e,b,c);tri(4,e,c,f);tri(2,a,b,e);tri(2,d,f,c)
  box(2,x,1.47,12.40,.12,2.6,.12);box(2,x,2.25,12.39,2.35,.12,.12)
  for(const dx of [-.64,.64]){box(7,x+dx,1.65,12.39,.43,.63,.04);box(2,x+dx,1.65,12.35,.04,.69,.06);box(2,x+dx,1.65,12.35,.49,.04,.06)}
}
// Lobby noticeboard and a small grove framing the entrance.
for(const x of [1.25,3.95])box(2,x,1.33,3.1,.19,2.45,.2)
box(2,2.6,1.75,3.1,3,.95,.19);box(3,2.6,2.28,3.1,3.1,.10,.27)
for(const [x,z] of [[1.5,6],[1.4,9],[3,11],[14.4,2.1],[12,14.4]]){
  cone(2,x,.1,z,.19,2.1,.10,7);cone(6,x,1.1,z,.88,1.6,.1,7);cone(6,x,2,z,.65,1.4,0,7)
}
// Lantern fixtures; real local lights are added in the composite, not baked.
const lanterns=[[4,4],[12,4],[4,11.4],[12,11.4]]
for(const [x,z] of lanterns){box(0,x,.71,z,.55,1.2,.55);box(1,x,1.35,z,.68,.14,.68);box(7,x,1.63,z,.23,.43,.23);cone(2,x,1.86,z,.27,.25,0,4);for(const dx of [-.15,.15])for(const dz of [-.15,.15])box(2,x+dx,1.63,z+dz,.035,.49,.035)}
// Compact glTF binary with shared materials and a single mesh.
// Dedicated low-poly physics geometry; foliage and chair cushions stay clear.
colliderMode = true
for(const x of [2,14])box(0,x,1.47,13.65,2.35,2.6,2.45)
for(let i=0;i<24;i++){
  if([5,6,7,11,12,13,17,18,19].includes(i))continue
  const a=i*Math.PI*2/24
  box(0,8+Math.sin(a)*5.9,.65,8+Math.cos(a)*5.9,1.48,1.05,.55,a)
}
for(const [x,z] of lanterns)box(0,x,.71,z,.55,1.2,.55)
for(const [x,z] of [[1.5,6],[1.4,9],[3,11],[14.4,2.1],[12,14.4]])box(0,x,1.05,z,.35,1.9,.35)
for(const x of [12.9,15])for(const z of [5.5,10.5])box(0,x,1.5,z,.19,2.8,.19)
for(const z of [6,10])box(0,14,.40,z,1.8,.6,.55)
box(0,8,2.05,13.55,1.55,3.8,1.25)
for(const x of [1.25,3.95])box(0,x,1.33,3.1,.19,2.45,.2)
box(0,2.6,1.75,3.1,3,.95,.19)
for(let i=0;i<5;i++){
  const a=Math.PI+i*Math.PI*2/5,x=8+Math.sin(a)*3.55,z=8+Math.cos(a)*3.55,yaw=a+Math.PI
  box(0,x-Math.sin(yaw)*.46,1.36,z-Math.cos(yaw)*.46,1.1,1.55,.16,yaw)
}
colliderMode = false
const chunks=[],views=[],accessors=[],primitives=[];let offset=0,triangles=0
function buffer(values){const data=Buffer.from(new Float32Array(values).buffer);const id=views.length;views.push({buffer:0,byteOffset:offset,byteLength:data.length});chunks.push(data);offset+=data.length;return id}
for(let m=0;m<groups.length;m++){
  const {p,n}=groups[m];if(!p.length)continue
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];p.forEach((v,i)=>{min[i%3]=Math.min(min[i%3],v);max[i%3]=Math.max(max[i%3],v)})
  // Test rendered SDK bounds, not raw right-handed glTF bounds.
  if(-max[0]<0||min[2]<0||-min[0]>16||max[2]>16||max[1]>20)throw Error('Rendered parcel bounds exceeded')
  const pi=accessors.length;accessors.push({bufferView:buffer(p),componentType:5126,count:p.length/3,type:'VEC3',min,max},{bufferView:buffer(n),componentType:5126,count:n.length/3,type:'VEC3'})
  primitives.push({attributes:{POSITION:pi,NORMAL:pi+1},material:m});triangles+=p.length/9
}
const collisionAccessor=accessors.length
const collisionMin=[Infinity,Infinity,Infinity],collisionMax=[-Infinity,-Infinity,-Infinity]
collisionGroup.p.forEach((v,i)=>{collisionMin[i%3]=Math.min(collisionMin[i%3],v);collisionMax[i%3]=Math.max(collisionMax[i%3],v)})
accessors.push({bufferView:buffer(collisionGroup.p),componentType:5126,count:collisionGroup.p.length/3,type:'VEC3',min:collisionMin,max:collisionMax})
const gltf={asset:{version:'2.0',generator:'Moonlit Council original mesh builder'},scene:0,scenes:[{nodes:[0,1]}],nodes:[{mesh:0,name:'Courtyard visual'},{mesh:1,name:'courtyard_collider'}],meshes:[{name:'Moonlit courtyard',primitives},{name:'courtyard_collider',primitives:[{attributes:{POSITION:collisionAccessor}}]}],materials,buffers:[{byteLength:offset}],bufferViews:views,accessors}
let json=Buffer.from(JSON.stringify(gltf));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const bin=Buffer.concat(chunks),header=Buffer.alloc(20),bh=Buffer.alloc(8)
header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+bin.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);bh.writeUInt32LE(bin.length,0);bh.writeUInt32LE(0x004e4942,4)
fs.mkdirSync('assets/models',{recursive:true});fs.writeFileSync('assets/models/moonlit-courtyard.glb',Buffer.concat([header,json,bh,bin]))
if (process.argv.includes('--model-only')) {
  console.log(`Rebuilt courtyard GLB: ${triangles} triangles; SDK-space bounds verified. Composite unchanged.`)
  process.exit(0)
}
// Mechanical composite migration keeps every editor schema and unrelated entity intact.
const file='assets/scene/main.composite',c=JSON.parse(fs.readFileSync(file,'utf8'))
function comp(name){let v=c.components.find(x=>x.name===name);if(!v){v={name,data:{}};c.components.push(v)}return v.data}
function put(name,id,value){comp(name)[id]={json:value}}
const names=comp('core-schema::Name'),nodes=comp('inspector::Nodes')['0'].json.value
let next=Math.max(...c.components.flatMap(x=>Object.keys(x.data||{}).map(Number)))+1
function entity(name,pos,scale=[1,1,1]){let id=Object.keys(names).find(id=>names[id].json.value===name);if(!id){id=String(next++);nodes.find(x=>x.entity===0).children.push(Number(id));nodes.push({entity:Number(id),children:[]})}put('core-schema::Name',id,{value:name});put('inspector::TransformConfig',id,{});put('core::Transform',id,{position:{x:pos[0],y:pos[1],z:pos[2]},scale:{x:scale[0],y:scale[1],z:scale[2]},rotation:{x:0,y:0,z:0,w:1},parent:0});return id}
const id=entity('Moonlit Courtyard Architecture',[0,0,0]);put('core::GltfContainer',id,{src:'assets/models/moonlit-courtyard.glb',visibleMeshesCollisionMask:0,invisibleMeshesCollisionMask:3})
for(let i=0;i<5;i++){
  const a=Math.PI+i*Math.PI*2/5,id=entity(`Council Seat ${i+1}`,[8+Math.sin(a)*3.55,.1,8+Math.cos(a)*3.55]);delete comp('core::MeshRenderer')[id];delete comp('core::MeshCollider')[id]
}
entity('Council Dais',[8,.08,8],[12,.05,12]);entity('Council Table',[8,.39,8],[2.6,.58,2.6]);entity('Voting Monument',[8,.62,8],[1.7,.12,1.7]);entity('Council Flame',[8,1.02,8],[.48,.9,.48]);entity('Lobby Sign',[2.6,1.83,2.96],[.55,.55,.55])
// A board-mounted label must stay flush with the board, never face the camera.
const boardLabel=Object.keys(names).find(id=>names[id].json.value==='Lobby Sign')
delete comp('core::Billboard')[boardLabel]
// Remove the old glowing lobby disk; retain its named anchor for scene logic.
const marker=Object.keys(names).find(id=>names[id].json.value==='Lobby Marker')
delete comp('core::MeshRenderer')[marker]
for(const name of ['Council Floor','Council Dais']) {
  const id=Object.keys(names).find(id=>names[id].json.value===name)
  put('core::Material',id,{material:{$case:'pbr',pbr:{albedoColor:{r:.19,g:.21,b:.23,a:1},metallic:0,roughness:.95}}})
}
for(const [x,z] of lanterns){const id=entity(`Courtyard Lantern ${x} ${z}`,[x,1.68,z]);put('core::LightSource',id,{active:true,color:{r:1,g:.59,b:.25},intensity:130,range:6,shadow:false,type:{$case:'point',point:{}}})}
fs.writeFileSync(file,JSON.stringify(c,null,2)+'\n')
console.log(`Courtyard: ${triangles} triangles, ${materials.length} materials; all mesh bounds inside 16 x 16 parcel. Existing editor data preserved.`)
