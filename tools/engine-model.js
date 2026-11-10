// Original, stylized F136-inspired NA V8 geometry. Generated offline only.
// Coordinates: crankshaft along Z, two four-cylinder banks at +/-45 degrees.
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const colors = { alloy:0xe8e9e7, machined:0xf5f5f1, steel:0x9ca6ad, dark:0x38434c, ceramic:0xfaf9f2, accent:0x8fa8c5, gasket:0x727d86, firing:0xd8783c };
const mat = Object.fromEntries(Object.entries(colors).map(([name,color])=>[name,new T.MeshStandardMaterial({color,roughness:.69,metalness:.08})]));
const ink = new T.LineBasicMaterial({color:0x464e55,transparent:true,opacity:.64});
const hull = new T.MeshBasicMaterial({color:0x4a5056,side:T.BackSide});
const Y = new T.Vector3(0,1,0);
const vec = a => new T.Vector3(...a);
const zs = [-1.53,-.51,.51,1.53];

function mesh(parent, geometry, material='alloy', pos=[0,0,0], edges=true) {
  const object = new T.Mesh(geometry,mat[material]);
  object.position.set(...pos);parent.add(object);
  if(edges) object.add(new T.LineSegments(new T.EdgesGeometry(geometry,32),ink));
  // Inverted surface hulls give curved parts their technical-illustration silhouette.
  const outline = new T.Mesh(geometry,hull);
  outline.scale.setScalar(1.005);object.add(outline);
  return object;
}
function box(p,w,h,d,pos,material='alloy',radius=.04) {
  return mesh(p,new RoundedBoxGeometry(w,h,d,2,Math.min(radius,w/4,h/4,d/4)),material,pos);
}
function cyl(p,r,h,pos,material='machined',rt=r,segments=48) {
  return mesh(p,new T.CylinderGeometry(rt,r,h,segments),material,pos);
}
function ring(p,r,t,pos,material='steel',axis='y') {
  const o=mesh(p,new T.TorusGeometry(r,t,8,64),material,pos,false);
  if(axis==='y')o.rotation.x=Math.PI/2;
  return o;
}
function rod(p,a,b,r,material='steel') {
  const av=vec(a),bv=vec(b),delta=bv.clone().sub(av);
  const o=cyl(p,r,delta.length(),av.clone().add(bv).multiplyScalar(.5).toArray(),material);
  o.quaternion.setFromUnitVectors(Y,delta.normalize());return o;
}
function tube(p,points,r=.13,material='machined') {
  return mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(vec)),40,r,12,false),material,[0,0,0],false);
}
function bolt(p,pos,axis='y',size=.055) {
  const o=cyl(p,size,.055,pos,'steel',size,6);
  if(axis==='z')o.rotation.x=Math.PI/2;
  if(axis==='x')o.rotation.z=Math.PI/2;
  return o;
}
function lathe(p,profile,pos=[0,0,0],material='machined') {
  return mesh(p,new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),64),material,pos);
}
function bank(parent,side) { const g=new T.Group();g.rotation.z=-side*Math.PI/4;parent.add(g);return g; }
function plateWithBores(parent) {
  const shape=new T.Shape();
  shape.moveTo(-.63,-2.12);shape.lineTo(-.47,-2.3);shape.lineTo(.47,-2.3);shape.lineTo(.63,-2.12);shape.lineTo(.63,2.12);shape.lineTo(.47,2.3);shape.lineTo(-.47,2.3);shape.lineTo(-.63,2.12);shape.closePath();
  zs.forEach(z=>{const hole=new T.Path();hole.absarc(0,z,.414,0,Math.PI*2,true);shape.holes.push(hole)});
  const g=new T.ExtrudeGeometry(shape,{depth:1.02,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:2,steps:1,curveSegments:36});
  g.rotateX(-Math.PI/2);
  return mesh(parent,g,'alloy',[0,.66,0]);
}

function block() {
  const g=new T.Group();
  box(g,1.72,.88,4.62,[0,.08,0],'alloy',.16);
  box(g,1.84,.12,4.72,[0,-.42,0],'machined');
  box(g,1.48,.49,4.3,[0,-.7,0],'alloy',.15);
  for(const side of [-1,1]) {
    const b=bank(g,side);plateWithBores(b);
    zs.forEach(z=>{
      ring(b,.418,.017,[0,1.7,z],'steel');
      box(b,.11,.95,.12,[side*.67,1.1,z],'alloy');
      for(const x of [-.52,.52])for(const dz of [-.34,.34])bolt(b,[x,1.72,z+dz]);
      box(g,.13,.55,.14,[side*.87,-.05,z]);
      bolt(g,[side*.83,-.32,z]);
    });
    for(let z=-2.1;z<=2.1;z+=.42)bolt(g,[side*.85,-.47,z]);
    for(let z=-1.9;z<=1.9;z+=.38)box(g,.05,.18,.08,[side*.75,-.75,z]);
  }
  for(const z of [-2.34,2.34]) {
    const front=cyl(g,.71,.14,[0,.1,z],'alloy');front.rotation.x=Math.PI/2;
    ring(g,.34,.06,[0,.1,z+Math.sign(z)*.08],'steel','z');
    for(let i=0;i<8;i++){const a=i*Math.PI/4;bolt(g,[Math.cos(a)*.56,.1+Math.sin(a)*.56,z+Math.sign(z)*.1],'z')}
  }
  return g;
}
function heads() {
  const g=new T.Group();
  for(const side of [-1,1]) {
    const b=bank(g,side);
    box(b,1.34,.27,4.76,[0,1.88,0],'machined');
    box(b,1.3,.09,4.7,[0,2.04,0],'gasket');
    box(b,1.22,.33,4.6,[0,2.22,0],'alloy',.12);
    // Twin cam galleries and cast cover ridges.
    for(const x of [-.35,.35]) {
      const cam=cyl(b,.22,4.38,[x,2.34,0],'alloy');cam.rotation.x=Math.PI/2;
      for(const z of [-2.2,2.2]){const cap=cyl(b,.245,.075,[x,2.34,z]);cap.rotation.x=Math.PI/2}
    }
    box(b,.36,.045,2.9,[0,2.4,0],'accent');
    for(let z=-1.8;z<=1.8;z+=.15)box(b,.24,.014,.022,[0,2.43,z],'machined',.002);
    for(const z of zs){cyl(b,.14,.14,[0,2.46,z],'dark');for(const x of [-.56,.56])bolt(b,[x,2.34,z])}
    const oil=cyl(b,.19,.16,[.35,2.59,1.7],'dark');
    for(let i=0;i<12;i++){const a=i*Math.PI/6;box(b,.035,.12,.035,[.35+.18*Math.cos(a),2.59,1.7+.18*Math.sin(a)],'steel')}
  }
  return g;
}
function plug() {
  const g=new T.Group();
  lathe(g,[[.042,0],[.052,.02],[.052,.09],[.055,.1],[.055,.35],[.1,.36],[.1,.4],[.08,.43],[.07,.47],[.062,.82],[.045,.86],[.045,.98],[.034,1.01]]);
  cyl(g,.105,.11,[0,.4,0],'steel',.105,6);
  lathe(g,[[.055,.48],[.059,.5],[.063,.79],[.048,.84]], [0,0,0],'ceramic');
  for(let y=.53;y<.8;y+=.048)ring(g,.064,.013,[0,y,0],'ceramic');
  for(let y=.1;y<.35;y+=.025)ring(g,.055,.006,[0,y,0],'steel');
  rod(g,[0,0,0],[0,-.06,0],.015,'steel');
  tube(g,[[.045,.035,0],[.045,-.075,0],[.01,-.085,0]],.012,'steel');
  ring(g,.085,.012,[0,.35,0],'gasket');
  return g;
}
function pistonUnit() {
  const g=new T.Group();
  lathe(g,[[.34,-.23],[.39,-.18],[.39,.16],[.397,.2],[.397,.23],[.35,.245],[.28,.215],[0,.215]]);
  for(const y of [.08,.135,.19])ring(g,.395,.012,[0,y,0],'dark');
  const pin=cyl(g,.09,.78,[0,-.07,0],'steel');pin.rotation.z=Math.PI/2;
  // Forged connecting rod: flanged I-section with a bored big end.
  box(g,.13,.78,.11,[0,-.65,0],'steel');
  for(const z of [-.065,.065])box(g,.22,.82,.035,[0,-.65,z],'machined');
  ring(g,.195,.075,[0,-1.08,0],'machined','z');
  ring(g,.14,.018,[0,-1.08,.073],'steel','z');
  box(g,.45,.105,.23,[0,-1.24,0]);
  for(const x of [-.2,.2]){bolt(g,[x,-1.18,0]);rod(g,[x,-1.34,0],[x,-1.11,0],.035)}
  return g;
}
function crankshaft() {
  const g=new T.Group();
  const shaft=cyl(g,.16,5.45,[0,0,0],'steel');shaft.rotation.x=Math.PI/2;
  for(let i=0;i<5;i++){const z=-2.04+i*1.02;const bearing=cyl(g,.245,.28,[0,0,z]);bearing.rotation.x=Math.PI/2;ring(g,.245,.012,[0,0,z+.1],'dark','z')}
  zs.forEach((z,i)=>{
    const offset=(i===0||i===3?1:-1)*.32;
    for(const dz of [-.32,.32]) {
      // Rounded counterweights opposite each flat-plane throw.
      const w=cyl(g,.41,.16,[0,-offset*.6,z+dz],'steel');w.rotation.x=Math.PI/2;
      box(g,.36,.55,.15,[0,offset*.25,z+dz],'steel',.07);
    }
    const pin=cyl(g,.18,.49,[0,offset,z]);pin.rotation.x=Math.PI/2;
    for(const dz of [-.2,.2])ring(g,.18,.01,[0,offset,z+dz],'dark','z');
  });
  const flange=cyl(g,.49,.18,[0,0,2.68]);flange.rotation.x=Math.PI/2;
  for(let i=0;i<8;i++){const a=i*Math.PI/4;bolt(g,[.35*Math.cos(a),.35*Math.sin(a),2.79],'z')}
  const pulley=cyl(g,.55,.24,[0,0,-2.73],'dark');pulley.rotation.x=Math.PI/2;
  for(const z of [-2.85,-2.77,-2.69])ring(g,.55,.018,[0,0,z],'steel','z');
  const hub=cyl(g,.17,.28,[0,0,-2.78]);hub.rotation.x=Math.PI/2;
  return g;
}
function intake() {
  const g=new T.Group();
  for(const side of [-1,1]) {
    box(g,.68,.49,4.05,[side*.46,2.35,0],'accent',.2);
    for(const z of zs) {
      tube(g,[[side*.47,2.28,z],[side*.68,2.12,z],[side*.98,1.99,z],[side*1.2,1.7,z]],.16);
      ring(g,.17,.027,[side*1.2,1.7,z],'steel');
    }
    const throttle=cyl(g,.28,.45,[side*.46,2.35,2.2]);throttle.rotation.x=Math.PI/2;
    ring(g,.28,.04,[side*.46,2.35,2.44],'steel','z');
    const opening=cyl(g,.235,.014,[side*.46,2.35,2.45],'dark');opening.rotation.x=Math.PI/2;
    for(let z=-1.7;z<1.8;z+=.22)box(g,.45,.025,.045,[side*.46,2.6,z],'machined');
  }
  tube(g,[[-.46,2.35,-1.4],[0,2.45,-1.4],[.46,2.35,-1.4]],.13);
  return g;
}
function headers() {
  const g=new T.Group();
  for(const side of [-1,1]) {
    zs.forEach((z,i)=>{
      box(g,.09,.35,.48,[side*1.52,1.25,z],'steel');
      for(const dz of [-.18,.18])bolt(g,[side*1.58,1.25,z+dz],'x');
      tube(g,[[side*1.53,1.25,z],[side*1.93,1.21,z],[side*(2.22+i*.12),.72,z+.13],[side*(2.26+i*.09),.07,z+.4],[side*2.19,-.16,2.4],[side*2.18,-.16,2.85]],.135);
    });
    const collector=cyl(g,.3,.63,[side*2.18,-.16,3.07],'alloy',.21);collector.rotation.x=Math.PI/2;
    ring(g,.3,.028,[side*2.18,-.16,3.4],'steel','z');
    const opening=cyl(g,.262,.018,[side*2.18,-.16,3.41],'dark');opening.rotation.x=Math.PI/2;
    for(let i=0;i<3;i++)ring(g,.292,.008,[side*2.18,-.16,2.9+i*.08],'steel','z');
    rod(g,[side*2.21,.08,2.6],[side*2.27,.4,2.6],.045,'steel');
  }
  return g;
}
function transmission() {
  const g=new T.Group();
  // Bellhousing and ribbed transaxle case, longitudinal to the crankshaft.
  const bell=cyl(g,.63,1.1,[0,0,3.23],'alloy',.95);bell.rotation.x=Math.PI/2;
  ring(g,.94,.045,[0,0,2.68],'machined','z');
  box(g,1.15,1.0,1.7,[0,-.1,4.45],'alloy',.2);
  for(let z=3.8;z<5.2;z+=.19){box(g,1.21,.055,.05,[0,.44,z]);box(g,.055,1.05,.05,[-.59,-.08,z]);box(g,.055,1.05,.05,[.59,-.08,z])}
  for(let i=0;i<12;i++){const a=i*Math.PI/6;bolt(g,[.86*Math.cos(a),.86*Math.sin(a),2.63],'z');rod(g,[.84*Math.cos(a),.84*Math.sin(a),2.77],[.55*Math.cos(a),.55*Math.sin(a),3.75],.026)}
  for(const side of [-1,1]) {const shaft=cyl(g,.18,.7,[side*.75,-.12,4.7],'steel');shaft.rotation.z=Math.PI/2;ring(g,.24,.06,[side*.62,-.12,4.7],'steel').rotation.z=Math.PI/2}
  return g;
}
function ecu() {
  const g=new T.Group();
  box(g,1.28,.18,1.72,[0,0,0],'alloy');box(g,1.13,.07,1.52,[0,.11,0],'machined');
  for(let x=-.5;x<=.5;x+=.09)box(g,.032,.08,1.36,[x,.18,0],'alloy');
  for(const z of [-.58,.04,.6]){box(g,.34,.22,.4,[.75,0,z],'dark');for(let i=0;i<4;i++)rod(g,[.8,.04,z-.12+i*.08],[1.02,.04,z-.12+i*.08],.016,'machined')}
  for(const x of [-.55,.55])for(const z of [-.75,.75])bolt(g,[x,.16,z]);
  for(let i=0;i<5;i++)tube(g,[[.95,-.04,-.58+i*.1],[1.22,-.1,-.4+i*.1],[1.37,-.32,.5+i*.1],[.9,-.45,1.2+i*.05]],.025,'gasket');
  box(g,.55,.02,.55,[-.1,.24,0],'accent');
  return g;
}

export function createModel() {
  const root=new T.Group(), groups={block:block(),head:heads(),crank:crankshaft(),intake:intake(),headers:headers(),transmission:transmission(),ecu:ecu(),spark:new T.Group(),pistons:new T.Group()};
  const pistonNodes=[];
  for(const side of [-1,1]) {
    const pb=bank(groups.pistons,side),sb=bank(groups.spark,side);
    zs.forEach((z,i)=>{
      const p=pistonUnit();p.position.set(0,1.37,z);pb.add(p);pistonNodes.push({object:p,i,side});
      const s=plug();s.position.set(0,1.95,z);sb.add(s);
    });
  }
  groups.ecu.position.set(-2.3,.25,-1.1);groups.ecu.rotation.z=Math.PI/2;
  Object.entries(groups).forEach(([name,g])=>{g.name=name;root.add(g)});
  function pose(phase) {
    groups.crank.rotation.z=phase;
    pistonNodes.forEach(({object,i,side})=>{
      const theta=phase+(i===0||i===3?0:Math.PI)+side*Math.PI/4;
      object.position.y=1.37+.2*Math.cos(theta);
      object.children[0].material=Math.cos(theta)>.88?mat.firing:mat.machined;
    });
  }
  return {root,groups,pose};
}

export function createDisplay(id) {
  const model=createModel();
  if(id==='engine')return {root:model.root,pose:model.pose};
  if(id==='spark') {
    const root=new T.Group(),s=plug();s.scale.setScalar(2.8);s.rotation.z=-.22;root.add(s);
    return {root,pose:()=>{}};
  }
  if(id==='pistons') {
    // Exposed eight-piston / flat-plane crank assembly, matching the reference.
    const root=new T.Group();root.add(model.groups.pistons,model.groups.crank);
    return {root,pose:model.pose};
  }
  const root=model.groups[id];root.position.set(0,0,0);root.rotation.set(0,0,0);
  return {root,pose:id==='crank'?phase=>root.rotation.z=phase:()=>{}};
}
