import * as T from 'three';
import { createDisplay } from './engine-model.js';

const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
renderer.setSize(1200,960);renderer.setPixelRatio(1);
renderer.setClearColor(0xffffff,0);
renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.NoToneMapping;
document.body.appendChild(renderer.domElement);
const scene=new T.Scene();
scene.add(new T.HemisphereLight(0xffffff,0xc5c7ca,2.1));
const key=new T.DirectionalLight(0xffffff,2.2);key.position.set(3,8,5);scene.add(key);
const fill=new T.DirectionalLight(0xc9d9ed,1.1);fill.position.set(-6,2,-3);scene.add(fill);
const camera=new T.OrthographicCamera(-5,5,4,-4,.1,100);
let current=null, center=new T.Vector3(), distance=1;
window.setPart=(id)=>{
  if(current)scene.remove(current.root);
  current=createDisplay(id);scene.add(current.root);
  current.pose(0);current.root.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(current.root);
  bounds.getCenter(center);
  const size=bounds.getSize(new T.Vector3());
  // Almost level, oblique side view: enough depth to read both cylinder banks.
  const direction=id==='spark'?new T.Vector3(5,1.8,7):new T.Vector3(7,3.5,8.5);
  camera.position.copy(center).add(direction);camera.lookAt(center);camera.updateMatrixWorld(true);
  // Fit projected bounds, avoiding model-dependent clipping.
  const points=[];
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])points.push(new T.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
  const width=Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x));
  const height=Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y));
  distance=Math.max(height/2,width/2/1.25)*1.12;
  camera.left=-distance*1.25;camera.right=distance*1.25;camera.top=distance;camera.bottom=-distance;camera.updateProjectionMatrix();
  renderer.render(scene,camera);
};
window.captureFrame=(phase=0)=>{
  current.pose(phase);renderer.render(scene,camera);
  return renderer.domElement.toDataURL('image/png').split(',')[1];
};
window.ready=true;
