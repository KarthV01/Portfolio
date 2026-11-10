"use strict";

const $ = id => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
// Original CAD-style images are rendered offline. No 3D runtime is downloaded.
const parts = [
  {id:'spark',name:'Spark plugs',title:'What’s my spark?',label:'01 / THE MOTIVATION',spec:'CERAMIC INSULATOR / THREADED STEEL SHELL',
    html:'<p>I’m drawn to engineering because it turns ideas into systems you can test, break, understand, and rebuild. I enjoy the point where software meets real constraints and correctness starts to matter.</p><p>I learn by building, breaking, and making the next version better.</p>'},
  {id:'head',name:'Cylinder heads',title:'A foundation for curiosity.',label:'02 / THE FOUNDATION',spec:'TWIN CYLINDER BANKS / DOUBLE OVERHEAD CAMS',
    html:'<p>B.S. Electrical &amp; Computer Engineering at Rutgers University, New Brunswick. Minors in Mathematics and Computer Science.</p><p class="role">EXPECTED MAY 2028</p><p>Connecting computer architecture, machine learning, and mathematics to the systems I build.</p>'},
  {id:'pistons',name:'Pistons & rods',title:'Experience in motion.',label:'03 / THE EXPERIENCE',spec:'EIGHT PISTONS / 90° V CONFIGURATION',motion:true,
    html:'<div class="project"><h3>Mind360 AI</h3><span class="role">SOFTWARE ENGINEER · MAY–AUG 2026</span><p>Integrated 8 prediction-market venues with concurrent requests and live order-book validation. Built checkpoint recovery and OCR workflows across model providers.</p></div><div class="project"><h3>Aviro AI · YC S25</h3><span class="role">ML RESEARCH INTERN · JAN–MAY 2026</span><p>Built enterprise evaluation environments, benchmarked 8 frontier models, and contributed to a 7,200-rollout reinforcement-training run.</p></div>'},
  {id:'crank',name:'Flat-plane crankshaft',title:'Ideas into output.',label:'04 / SELECTED PROJECTS',spec:'FLAT-PLANE CRANK / 180° THROWS',motion:true,
    html:'<div class="project"><h3>Nemesis</h3><p>Adversarial multi-agent reinforcement learning for cybersecurity. Attacker and defender agents evolve through self-play.</p><a href="https://github.com/KarthV01/Nemesis" target="_blank" rel="noopener">Source ↗</a></div><div class="project"><h3>Stratos</h3><p>Distributed edge computing for drone fleet mapping, with capacity-aware scheduling and restart-resilient survey processing.</p><a href="https://github.com/KarthV01/Stratos" target="_blank" rel="noopener">Source ↗</a></div><div class="project"><h3>Kairos</h3><p>Source-grounded funding discovery and application drafting with Amazon Bedrock agents.</p></div><div class="project"><h3>Fiducia</h3><p>Verified creator milestones and USDC escrow on Base.</p><a href="https://github.com/KarthV01/Fiducia" target="_blank" rel="noopener">Source ↗</a></div><div class="project"><h3>Future360</h3><p>A prediction-market terminal with cross-venue comparison, arbitrage detection, and coordinated multi-leg orders.</p></div>'},
  {id:'block',name:'Engine block',title:'Built to hold together.',label:'05 / THE TOOLKIT',spec:'ALUMINIUM CRANKCASE / TWO BANKS OF FOUR',
    html:'<p>I build reliable systems for applied AI: infrastructure that can recover interrupted work, reject stale data, and keep its claims grounded in evidence.</p><p class="tags">Python · Go · C / C++ · Java<br>TypeScript · SQL · React · FastAPI<br>Redis Streams · gRPC · PostgreSQL<br>AWS · Docker · Kubernetes</p>'},
  {id:'headers',name:'Exhaust headers',title:'Always exploring.',label:'06 / CURRENT DIRECTION',spec:'NATURAL ASPIRATION / FOUR-INTO-ONE PER BANK',
    html:'<p>I’m exploring adversarial multi-agent reinforcement learning, applied AI, and distributed infrastructure.</p><p>The questions that keep me building: how can intelligent systems coordinate reliably, reason over messy evidence, and hold up when things fail?</p>'},
  {id:'transmission',name:'Transmission',title:'The complete spec.',label:'07 / RÉSUMÉ',spec:'LONGITUDINAL TRANSAXLE / MACHINED BELLHOUSING',
    html:'<p>Experience, education, projects, and the technical details. Everything in one place.</p><a href="Karthik_Resume.pdf" target="_blank" rel="noopener">Open résumé ↗</a><a href="Karthik_Resume.pdf" download>Download PDF ↓</a>'},
  {id:'ecu',name:'ECU & wiring',title:'Let’s make a connection.',label:'08 / CONTACT',spec:'ENGINE CONTROL / SIGNALS INTO ACTION',
    html:'<p>Open to internships, collaborations, and interesting conversations. Have something worth building? I’d like to hear about it.</p><a href="mailto:karthik.v.voruganti@gmail.com">Email me ↗</a><a href="https://github.com/KarthV01" target="_blank" rel="noopener">GitHub ↗</a><a href="https://www.linkedin.com/in/karthik-voruganti-05b279326/" target="_blank" rel="noopener">LinkedIn ↗</a>'}
];
const commands = [
  {code:'engine.start();',label:'Start the V8',rpm:950,gear:'N',output:'[IGNITION] Eight cylinders. One curiosity.'},
  {code:'engine.throttle(0.42f);',label:'Give it some throttle',rpm:3500,gear:'1',output:'[THROTTLE] 42% · finding the rhythm.'},
  {code:'engine.transmission().shift_up();',label:'Shift into second',rpm:2400,gear:'2',output:'[GEAR] 1 → 2 · a little more headroom.'},
  {code:'engine.throttle(0.86f);',label:'Push a little further',rpm:7200,gear:'2',output:'[THROTTLE] 86% · approaching the limit.'},
  {code:'engine.redline();',label:'See what’s inside',rpm:9000,gear:'2',output:'[LIMITER] The interesting stuff is inside.'}
];
let state='intro',step=0,rpm=0,targetRpm=0,selected=0,busy=false,generation=0;
let soundEnabled=false,audioContext,oscillator,gain;
let telemetryFrame=0,lastTelemetry=0,lastSample=0,particles=[],particleFrame=0;
let transitionSerial=0,activeCard=null,cardAnimations=[];
const cachedImages=new Map();

function loadImage(url) {
  if(!cachedImages.has(url)) {
    const image=new Image();image.src=url;
    cachedImages.set(url,image.decode().catch(()=>{}));
  }
  return cachedImages.get(url);
}
function setState(next) {
  state=next;document.body.dataset.state=next;
  document.querySelector('meta[name="theme-color"]').content=next==='inspecting'?'#171d1c':'#fafaf9';
}
function renderCommand() {
  const c=commands[step];$('command').textContent=c.code;$('execute-label').textContent=c.label;
  $('step-label').textContent=`${String(step+1).padStart(2,'0')} — 05`;
}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,reducedMotion.matches?0:ms));
async function execute() {
  if(busy||state==='inspecting')return;
  const token=generation,c=commands[step];busy=true;$('execute').disabled=true;
  if(state==='intro')setState('running');
  ensureAudio();targetRpm=c.rpm;startTelemetry();$('gear').textContent=c.gear;
  const entry=document.createElement('div');entry.className='history-entry';
  const command=document.createElement('div');command.className='history-command';command.textContent='❯ '+c.code;
  const output=document.createElement('div');output.className='history-output';output.textContent=c.output;
  entry.append(command,output);$('history').append(entry);$('command-line').hidden=true;
  if(step===4) {
    setState('redlining');$('scene-status').textContent='REDLINE / 9,000 RPM';
    await wait(1100);if(token!==generation)return;burst();
    await wait(260);if(token!==generation)return;inspect();
  } else {
    await wait(step===2?850:650);if(token!==generation)return;
    step++;renderCommand();$('command-line').hidden=false;$('scene-status').textContent='V8 RUNNING / PRESS ENTER';
  }
  if(token!==generation)return;
  busy=false;$('execute').disabled=false;
  const content=document.querySelector('.terminal-content');content.scrollTop=state==='inspecting'?0:content.scrollHeight;
}
function inspect() {
  setState('inspecting');targetRpm=0;startTelemetry();
  $('history').hidden=true;$('command-line').hidden=true;$('component-nav').hidden=false;
  $('selector-controls').hidden=false;$('skip').hidden=true;$('replay').hidden=false;
  $('scene-status').textContent='COMPONENT SELECT';$('footer-note').textContent='← PREVIOUS / NEXT →';$('gear').textContent='—';
  $('execute-label').textContent='Next component';$('step-label').textContent='← → TO SELECT';$('execute').disabled=false;
  document.querySelector('.scene-heading h1').textContent='The sum of my parts.';
  document.querySelector('.scene-heading p').textContent='Eight components. One story. Take a closer look.';
  $('announcement').textContent='Component selector. Use left and right arrows to switch parts.';
  selectPart(0,1,true);
  try {sessionStorage.setItem('kv-engine-visited','1')}catch{}
}
function updateDescription(index,direction) {
  const p=parts[index];
  document.querySelectorAll('[data-part]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
  $('inspection').hidden=false;
  $('inspection').innerHTML=`<span class="eyebrow">${p.label}</span><h2>${p.name}<br>${p.title}</h2>${p.html}`;
  document.querySelector('.terminal-content').scrollTop=0;
  $('part-number').textContent=`${String(index+1).padStart(2,'0')} / 08`;
  $('selector-counter').textContent=$('part-number').textContent;
  $('part-label').textContent=p.name;$('part-spec').textContent=p.spec;
  $('engine').setAttribute('aria-label',`${p.name}, component ${index+1} of ${parts.length}`);
  if(!reducedMotion.matches) {
    $('inspection').getAnimations().forEach(a=>a.cancel());
    $('inspection').animate([{opacity:.2,transform:`translateY(${direction*8}px)`},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'ease-out'});
  }
}
async function selectPart(index,direction=1,initial=false) {
  selected=(index+parts.length)%parts.length;
  const p=parts[selected],serial=++transitionSerial;
  // Keep keyboard state, copy, and requested item synchronized under rapid input.
  updateDescription(selected,direction);
  const url=`assets/engine/${p.id}.webp`;
  await loadImage(url);
  if(serial!==transitionSerial||state!=='inspecting')return;
  cardAnimations.forEach(a=>a.cancel());cardAnimations=[];
  // There can only ever be one outgoing and one incoming layer.
  $('component-display').querySelectorAll('.component-card').forEach(el=>{if(el!==activeCard)el.remove()});
  const previous=activeCard;
  const card=document.createElement('div');card.className='component-card';card.dataset.component=p.id;
  const image=document.createElement('img');image.src=url;image.alt='';image.width=1200;image.height=960;image.draggable=false;
  card.append(image);$('component-display').append(card);activeCard=card;
  $('engine').dataset.active=p.id;$('engine').dataset.switching='true';
  if(reducedMotion.matches) {previous?.remove();$('engine').dataset.switching='false'}
  else {
    const duration=initial?700:480;
    if(previous)cardAnimations.push(previous.animate([
      {opacity:1,transform:'translateX(0) scale(1)'},
      {opacity:0,transform:`translateX(${-direction*32}%) rotateY(${-direction*18}deg) scale(.82)`}
    ],{duration:duration*.85,easing:'cubic-bezier(.4,0,.8,1)',fill:'forwards'}));
    const incoming=card.animate([
      {opacity:0,transform:`translateX(${direction*32}%) rotateY(${direction*18}deg) scale(.82)`},
      {opacity:1,transform:'translateX(0) rotateY(0) scale(1)'}
    ],{duration,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
    cardAnimations.push(incoming);
    await incoming.finished.catch(()=>{});
    if(serial!==transitionSerial)return;
    previous?.remove();cardAnimations.forEach(a=>a.cancel());cardAnimations=[];
    $('engine').dataset.switching='false';
  }
  if(serial!==transitionSerial)return;
  // Only selected mechanisms get a short, pre-rendered, ten-frame motion loop.
  if(p.motion&&!reducedMotion.matches) {
    const spriteUrl=`assets/engine/${p.id}-motion.webp`;
    await loadImage(spriteUrl);
    if(serial!==transitionSerial||state!=='inspecting')return;
    const sprite=document.createElement('div');sprite.className='mechanism-sprite';sprite.style.backgroundImage=`url("${spriteUrl}")`;
    card.append(sprite);card.classList.add('has-motion');
  }
  // Decode only immediate neighbors; no eager decoding of all motion strips.
  for(const offset of [-1,1])loadImage(`assets/engine/${parts[(selected+offset+parts.length)%parts.length].id}.webp`);
}
function navigate(key) {const direction=key==='ArrowLeft'||key==='ArrowUp'?-1:1;selectPart(selected+direction,direction)}
function clearSelection() {
  transitionSerial++;cardAnimations.forEach(a=>a.cancel());cardAnimations=[];
  $('component-display').replaceChildren();activeCard=null;
  delete $('engine').dataset.active;delete $('engine').dataset.switching;
}
function skip() {generation++;busy=false;clearParticles();inspect()}
function replay() {
  generation++;busy=false;step=0;rpm=0;targetRpm=0;clearSelection();clearParticles();setState('intro');
  $('history').innerHTML='';$('history').hidden=false;$('command-line').hidden=false;$('inspection').hidden=true;
  $('component-nav').hidden=true;$('selector-controls').hidden=true;$('replay').hidden=true;$('skip').hidden=false;$('execute').disabled=false;
  $('gear').textContent='N';$('scene-status').textContent='SYSTEM OFFLINE';$('footer-note').textContent='PRESS ENTER TO BEGIN';
  $('engine').setAttribute('aria-label','Detailed naturally aspirated V8 engine');
  document.querySelector('.scene-heading h1').textContent='Built from curiosity.';
  document.querySelector('.scene-heading p').textContent='A little code. Eight cylinders. A lot of curiosity.';
  renderCommand();startTelemetry();
}

// Numeric telemetry runs only while RPM is changing or the engine is running.
// Static inspection has no application animation-frame loop.
function startTelemetry() {if(!telemetryFrame&&!document.hidden){lastTelemetry=performance.now();telemetryFrame=requestAnimationFrame(tickTelemetry)}}
function tickTelemetry(time) {
  telemetryFrame=0;
  if(document.hidden)return;
  const dt=Math.min((time-lastTelemetry)/1000,.05);lastTelemetry=time;
  rpm+=(targetRpm-rpm)*Math.min(1,dt*4);
  if(Math.abs(targetRpm-rpm)<3)rpm=targetRpm;
  if(time-lastSample>80||rpm===targetRpm) {
    $('rpm').textContent=String(Math.round(rpm/10)*10).padStart(4,'0');$('rpm-bar').style.width=`${rpm/90}%`;lastSample=time;
  }
  if(gain&&audioContext) {
    gain.gain.setTargetAtTime(soundEnabled&&rpm>50?.02:0,audioContext.currentTime,.1);
    oscillator.frequency.setTargetAtTime(30+rpm/15,audioContext.currentTime,.08);
  }
  if(rpm!==targetRpm)telemetryFrame=requestAnimationFrame(tickTelemetry);
}
function ensureAudio() {
  if(!soundEnabled)return;
  try {
    if(!audioContext) {
      audioContext=new(window.AudioContext||window.webkitAudioContext)();oscillator=audioContext.createOscillator();gain=audioContext.createGain();
      const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=850;
      oscillator.type='sawtooth';oscillator.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);gain.gain.value=0;oscillator.start();
    }
    audioContext.resume().catch(()=>{});startTelemetry();
  } catch {soundEnabled=false;$('sound').textContent='Sound unavailable';$('sound').setAttribute('aria-pressed','false')}
}
const canvas=$('explosion'),ctx=canvas.getContext('2d');
function sizeCanvas() {const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
function clearParticles() {cancelAnimationFrame(particleFrame);particleFrame=0;particles=[];ctx.clearRect(0,0,innerWidth,innerHeight)}
function burst() {
  if(reducedMotion.matches)return;
  sizeCanvas();const bounds=$('engine').getBoundingClientRect(),x=bounds.left+bounds.width/2,y=bounds.top+bounds.height/2;
  particles=Array.from({length:64},()=>{const angle=Math.random()*Math.PI*2,speed=50+Math.random()*260;return{x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,size:4+Math.floor(Math.random()*3)*4,life:.5+Math.random()*.45,age:0,color:['#e8e9e7','#8fa8c5','#d78255','#e5484d'][Math.floor(Math.random()*4)]}});
  let last=performance.now();
  const tick=time=>{
    const dt=Math.min((time-last)/1000,.05);last=time;ctx.clearRect(0,0,innerWidth,innerHeight);
    particles=particles.filter(p=>p.age<p.life);
    for(const p of particles){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=100*dt;ctx.globalAlpha=Math.max(0,1-p.age/p.life);ctx.fillStyle=p.color;ctx.fillRect(Math.round(p.x/p.size)*p.size,Math.round(p.y/p.size)*p.size,p.size,p.size)}
    ctx.globalAlpha=1;particleFrame=particles.length?requestAnimationFrame(tick):0;
  };
  particleFrame=requestAnimationFrame(tick);
}

const navLabels=['Spark plugs','Heads','Pistons','Crankshaft','Block','Headers','Résumé','Contact'];
$('component-nav').innerHTML=parts.map((p,i)=>`<button type="button" data-part="${i}" aria-label="${p.name}" aria-pressed="false"><span>${String(i+1).padStart(2,'0')}</span> ${navLabels[i]}</button>`).join('');
$('component-nav').addEventListener('click',e=>{const b=e.target.closest('button');if(b){const i=Number(b.dataset.part);selectPart(i,i<selected?-1:1)}});
$('previous-part').addEventListener('click',()=>navigate('ArrowLeft'));
$('next-part').addEventListener('click',()=>navigate('ArrowRight'));
$('execute').addEventListener('click',()=>state==='inspecting'?navigate('ArrowRight'):execute());
$('skip').addEventListener('click',skip);$('replay').addEventListener('click',replay);
$('sound').addEventListener('click',()=>{
  soundEnabled=!soundEnabled;$('sound').textContent=soundEnabled?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(soundEnabled));
  if(soundEnabled)ensureAudio();else if(gain)gain.gain.setTargetAtTime(0,audioContext.currentTime,.08);
});
addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select'))return;
  if(e.key==='Escape'&&state!=='inspecting'){e.preventDefault();skip();return}
  if(state==='inspecting'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();navigate(e.key);return}
  if(e.target.closest('a,button'))return;
  if(e.key==='Enter'){e.preventDefault();state==='inspecting'?navigate('ArrowRight'):execute()}
  if(e.key.toLowerCase()==='r'&&state==='inspecting')replay();
});
let touchStart=null;
$('engine').addEventListener('touchstart',e=>{if(e.touches.length===1)touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY}}, {passive:true});
$('engine').addEventListener('touchend',e=>{
  if(!touchStart)return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;touchStart=null;
  if(state==='inspecting'&&Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy))navigate(dx>0?'ArrowLeft':'ArrowRight');
},{passive:true});
document.addEventListener('visibilitychange',()=>{
  document.body.classList.toggle('is-background',document.hidden);
  if(document.hidden){cancelAnimationFrame(telemetryFrame);telemetryFrame=0;clearParticles();if(gain)gain.gain.setTargetAtTime(0,audioContext.currentTime,.05)}
  else startTelemetry();
});
reducedMotion.addEventListener('change',()=>{clearSelection();if(reducedMotion.matches)skip();else if(state==='inspecting')selectPart(selected,1,true)});
sizeCanvas();renderCommand();
let visited=false;try{visited=sessionStorage.getItem('kv-engine-visited')==='1'}catch{}
if(reducedMotion.matches||visited)inspect();
