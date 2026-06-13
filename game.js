(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('characterOverlay');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const grid = document.getElementById('characterGrid');
  const stageList = document.getElementById('stageList');
  const hud = {
    player: document.getElementById('hudPlayer'), stage: document.getElementById('hudStage'),
    boss: document.getElementById('hudBoss'), lives: document.getElementById('hudLives'), score: document.getElementById('hudScore')
  };
  const img = name => { const i = new Image(); i.src = name; return i; };
  const assetUrl = name => name.split('/').map(encodeURIComponent).join('/');
  const snd = name => { const a = new Audio(assetUrl(name)); a.preload = 'auto'; return a; };
  const assets = {
    bg: img('Background (Space).png'), fg: img('Foreground (Platform).png'), laser: img('BigCore_Laser.png'),
    hit: snd('HitBoss.wav'), shoot: snd('Player_FireShoot.wav'), jump: snd('Jump.wav'), hurt: snd('PlayerHurt.wav'),
    death: snd('PlayerDeath.wav'), warn: snd('BossWarning.wav'), boom: snd('BossDefeat_Explosion.wav'),
    clear: snd('23. Stage Clear.mp3'), over: snd('21. Game Over.mp3'), music: snd('13 Last Evil [Boss Battle].mp3')
  };
  assets.music.loop = true; assets.music.volume = 0.35;
  const characters = [
    { name:'Fireboy', sprite:'Fireboy (Playable Characters).png', power:'Flame Shot', speed:4.8, color:'#ff6a33', hp:4 },
    { name:'Caroline', sprite:'Caroline (Playable Characters).png', power:'Star Volley', speed:5.2, color:'#ff9dde', hp:3 },
    { name:'Butch', sprite:'Butch (Playable Characters).png', power:'Rowdy Punch', speed:4.3, color:'#75ff77', hp:5 },
    { name:'Anabel', sprite:'Anabel (Playable Characters).png', power:'Moon Spark', speed:5.6, color:'#9bd7ff', hp:3 }
  ];
  characters.forEach(c => c.image = img(c.sprite));
  const stages = [
    { title:'Stage 1', boss:'Double Mecha Rocket', sub:'Big Core MK.I + Fire Breath', sprite:'Big Core MK.I (Boss).png', hp:95, color:'#ff6148', gimmick:'laser-wall', music:'Mecha ignition', sound:'BigCore_Laser.wav' },
    { title:'Stage 2', boss:'Butch', sub:'Rowdyruff Boys rival', sprite:'Fake Butch (Boss).png', hp:115, color:'#56ff6d', gimmick:'mirror-rival', music:'Rowdy showdown', sound:'Impact2.wav' },
    { title:'Stage 3', boss:'Mandler', sub:'Terra Cresta invader', sprite:'Mandler from Terra Cresta (Boss).png', hp:125, color:'#ffcf4a', gimmick:'swarm', music:'Cresta assault', sound:'Strain.wav' },
    { title:'Stage 4', boss:'Crusher-Bot MK.II', sub:'Industrial crusher unit', sprite:'Crusher-Bot MK.II (Boss).png', hp:140, color:'#a7b4c9', gimmick:'crushers', music:'Factory panic', sound:'Impact2.wav' },
    { title:'Stage 5', boss:'Metal Sonic', sub:'Hyper-speed nemesis', sprite:'Metal Sonic (Boss).png', hp:155, color:'#4ac9ff', gimmick:'speed-echo', music:'Metal pursuit', sound:'Strain2.wav' },
    { title:'Stage 6 Finale', boss:'The Roaring Knight', sub:'Final Boss', sprite:'Roaring Knight from Deltarune (Final Boss).png', hp:185, color:'#c16cff', gimmick:'darkness', music:'Last evil', sound:'BossWarning.wav' },
    { title:'Stage 7 True Finale', boss:'Roaring Metal', sub:'True Final Boss', sprite:'Roaring Metal - Roaring Knight x Metal Sonic (True Final Boss).png', hp:230, color:'#ff3b8f', gimmick:'fusion-chaos', music:'True finale', sound:'Strain2.wav' }
  ];
  stages.forEach(s => { s.image = img(s.sprite); s.audio = snd(s.sound); });
  const keys = {}, touch = {x:0,y:0,shoot:false};
  let state = 'select', hero = null, player, boss, bullets = [], enemy = [], particles = [], stageIndex = 0, score = 0, shake = 0, last = 0, flash = 0;

  function play(a){ try { a.currentTime = 0; a.play(); } catch(e){} }
  function buildUI(){
    characters.forEach((c,i)=>{ const b=document.createElement('button'); b.className='character-card'; const ci=document.createElement('img'); ci.src=c.sprite; ci.alt=c.name; const cn=document.createElement('strong'); cn.textContent=c.name; const cs=document.createElement('span'); cs.textContent=`${c.power} \u2022 Speed ${c.speed}`; b.appendChild(ci); b.appendChild(cn); b.appendChild(cs); b.onclick=()=>start(c); grid.appendChild(b); });
    stages.forEach((s,i)=>{ const r=document.createElement('div'); r.className='stage-row'; r.id='stage-'+i; const rt=document.createElement('span'); rt.textContent=s.title; const rb=document.createElement('strong'); rb.textContent=s.boss; r.appendChild(rt); r.appendChild(rb); stageList.appendChild(r); });
  }
  function start(c){
    hero = c; player = { x:120,y:canvas.height-130,w:44,h:62,vx:0,vy:0,on:false,hp:c.hp,max:c.hp,ifr:0,cool:0,img:c.image };
    stageIndex = 0; score = 0; bullets=[]; enemy=[]; particles=[]; overlay.classList.remove('active'); assets.music.play().catch(()=>{}); loadStage(); state='play';
  }
  function loadStage(){
    const s = stages[stageIndex]; boss = { x:canvas.width-230,y:115,w:130,h:100,hp:s.hp,max:s.hp,t:0,phase:0,img:s.image }; enemy=[]; bullets=[]; flash=90; play(assets.warn); play(s.audio); updateHud();
  }
  function updateHud(){
    hud.player.textContent = hero ? hero.name : 'Select'; hud.stage.textContent = stages[stageIndex]?.title || '-'; hud.boss.textContent = stages[stageIndex]?.boss || '-';
    hud.lives.textContent = player ? Math.max(0, player.hp) : 3; hud.score.textContent = score;
    stages.forEach((_,i)=>document.getElementById('stage-'+i).classList.toggle('active', i===stageIndex));
  }
  function rect(a,b){ return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }
  function addParticle(x,y,c,n=10){ for(let i=0;i<n;i++) particles.push({x,y,vx:(Math.random()-.5)*8,vy:(Math.random()-.5)*8,life:30+Math.random()*25,c}); }
  function shoot(){ if(!player || player.cool>0) return; player.cool = hero.name==='Caroline'?10:15; bullets.push({x:player.x+player.w-4,y:player.y+player.h*.42,w:18,h:7,vx:9,vy:0,c:hero.color,d:hero.name==='Butch'?3:2}); play(assets.shoot); }
  function bossShot(x,y,vx,vy,w=18,h=18,c='#ff305f'){ enemy.push({x,y,w,h,vx,vy,c}); }
  function update(dt){
    if(state!=='play') return; const s=stages[stageIndex]; boss.t += dt; flash=Math.max(0,flash-dt); shake=Math.max(0,shake-dt); player.ifr=Math.max(0,player.ifr-dt); player.cool=Math.max(0,player.cool-dt);
    let ax = (keys.ArrowRight||keys.KeyD?1:0) - (keys.ArrowLeft||keys.KeyA?1:0) + touch.x; player.vx = ax*hero.speed; if((keys.ArrowUp||keys.KeyW||keys.Space||touch.y<-.4) && player.on){ player.vy=-12; player.on=false; play(assets.jump); }
    if(keys.KeyZ || keys.KeyX || touch.shoot) shoot(); player.vy += .62; player.x += player.vx; player.y += player.vy; const floor=canvas.height-92; if(player.y+player.h>floor){player.y=floor-player.h;player.vy=0;player.on=true;} player.x=Math.max(18,Math.min(canvas.width-player.w-18,player.x));
    boss.y = 95 + Math.sin(boss.t/36)*45; boss.x = canvas.width-230 + Math.sin(boss.t/59)*38;
    if(boss.t % 52 < dt) bossShot(boss.x, boss.y+boss.h/2, -5-stageIndex*.45, Math.sin(boss.t/20)*2, 24, 14, s.color);
    if(s.gimmick==='laser-wall' && boss.t%140<dt) for(let y=70;y<canvas.height-120;y+=76) bossShot(boss.x-20,y,-8,0,70,9,'#ff3030');
    if(s.gimmick==='mirror-rival' && boss.t%90<dt) bossShot(player.x+130, 70, -2, 6, 32, 32, '#56ff6d');
    if(s.gimmick==='swarm' && boss.t%28<dt) bossShot(canvas.width-30, 60+Math.random()*360, -3-Math.random()*4, Math.random()*2-1, 16, 16, '#ffcf4a');
    if(s.gimmick==='crushers' && boss.t%120<dt) bossShot(180+Math.random()*520, -80, 0, 7, 54, 90, '#a7b4c9');
    if(s.gimmick==='speed-echo' && boss.t%32<dt) bossShot(boss.x-10, boss.y+Math.random()*boss.h, -9, Math.random()*4-2, 28, 12, '#4ac9ff');
    if(s.gimmick==='darkness' && boss.t%160<dt) flash=50;
    if(s.gimmick==='fusion-chaos' && boss.t%42<dt){ bossShot(boss.x,boss.y, -7, -2, 30,14,'#ff3b8f'); bossShot(boss.x,boss.y+boss.h, -7, 2, 30,14,'#c16cff'); }
    bullets.forEach(b=>{ b.x+=b.vx; b.y+=b.vy; if(rect(b,boss)){ b.dead=true; boss.hp-=b.d; score+=10; shake=5; play(assets.hit); addParticle(b.x,b.y,hero.color,4); }}); bullets=bullets.filter(b=>!b.dead && b.x<canvas.width+40);
    enemy.forEach(e=>{ e.x+=e.vx; e.y+=e.vy; if(player.ifr<=0 && rect(e,player)){ e.dead=true; player.hp--; player.ifr=90; shake=12; play(assets.hurt); addParticle(player.x+20,player.y+20,'#fff',14); if(player.hp<=0) gameOver(); }}); enemy=enemy.filter(e=>!e.dead && e.x>-120 && e.y<canvas.height+120);
    if(player.ifr<=0 && rect(player,boss)){ player.hp--; player.ifr=90; shake=12; play(assets.hurt); }
    particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.12;p.life--;}); particles=particles.filter(p=>p.life>0);
    if(boss.hp<=0) nextStage(); updateHud();
  }
  function nextStage(){ score += 1000 + stageIndex*500; play(assets.boom); play(assets.clear); addParticle(boss.x+boss.w/2,boss.y+boss.h/2,stages[stageIndex].color,60); stageIndex++; if(stageIndex>=stages.length){ state='win'; assets.music.pause(); } else loadStage(); }
  function gameOver(){ state='over'; assets.music.pause(); play(assets.death); play(assets.over); }
  function drawBar(x,y,w,h,p,c,label){ ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(x,y,w,h); ctx.fillStyle=c; ctx.fillRect(x,y,w*Math.max(0,p),h); ctx.strokeStyle='rgba(255,255,255,.55)'; ctx.strokeRect(x,y,w,h); ctx.fillStyle='#fff'; ctx.font='700 14px Trebuchet MS'; ctx.fillText(label,x+8,y+h-6); }
  function draw(){
    ctx.save(); if(shake>0) ctx.translate(Math.random()*shake-shake/2,Math.random()*shake-shake/2); ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let x=0;x<canvas.width;x+=323) for(let y=0;y<canvas.height;y+=230) ctx.drawImage(assets.bg,x,y,323,230);
    ctx.fillStyle='rgba(3,7,24,.38)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(assets.fg,0,canvas.height-150,canvas.width,150);
    if(state==='select'){ ctx.restore(); title('Choose Your Fighter','Fireboy, Caroline, Butch, or Anabel'); return; }
    if(player){ ctx.globalAlpha=player.ifr>0 && Math.floor(player.ifr/6)%2?0.38:1; ctx.drawImage(player.img,player.x,player.y,player.w,player.h); ctx.globalAlpha=1; }
    if(boss){ const scale = stageIndex===6 ? 1.25 : 1; ctx.drawImage(boss.img,boss.x,boss.y,boss.w*scale,boss.h*scale); drawBar(canvas.width-420,24,380,22,boss.hp/boss.max,stages[stageIndex].color,`${stages[stageIndex].boss} HP`); }
    bullets.forEach(b=>{ctx.fillStyle=b.c;ctx.fillRect(b.x,b.y,b.w,b.h);}); enemy.forEach(e=>{ctx.fillStyle=e.c;ctx.fillRect(e.x,e.y,e.w,e.h);});
    particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/50);ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,4,4);ctx.globalAlpha=1;});
    drawBar(24,24,250,20,player.hp/player.max,hero.color,`${hero.name} HP`); ctx.fillStyle='#fff'; ctx.font='800 18px Trebuchet MS'; ctx.fillText(`${stages[stageIndex].title}: ${stages[stageIndex].sub}`,24,72);
    if(flash>0){ ctx.fillStyle=`rgba(255,255,255,${Math.min(.35,flash/150)})`; ctx.fillRect(0,0,canvas.width,canvas.height); }
    if(stages[stageIndex]?.gimmick==='darkness'){ const g=ctx.createRadialGradient(player.x+20,player.y+20,60,player.x+20,player.y+20,430); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.78)'); ctx.fillStyle=g; ctx.fillRect(0,0,canvas.width,canvas.height); }
    ctx.restore(); if(state==='win') title('Boss Rush Complete!','Roaring Metal has fallen. Terra Nemesis is saved. Refresh to play again.'); if(state==='over') title('Game Over','Refresh or select a new run to challenge the Boss Rush again.');
  }
  function title(a,b){ ctx.fillStyle='rgba(0,0,0,.62)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.textAlign='center'; ctx.fillStyle='#45e1ff'; ctx.font='900 46px Trebuchet MS'; ctx.fillText(a,canvas.width/2,canvas.height/2-16); ctx.fillStyle='#fff'; ctx.font='700 20px Trebuchet MS'; ctx.fillText(b,canvas.width/2,canvas.height/2+24); ctx.textAlign='left'; }
  function loop(t){ const dt=Math.min(3,(t-last)/16.67||1); last=t; update(dt); draw(); requestAnimationFrame(loop); }
  function togglePause(){ if(state==='play'){ state='pause'; pauseOverlay.classList.add('active'); assets.music.pause(); } else if(state==='pause'){ state='play'; pauseOverlay.classList.remove('active'); assets.music.play().catch(()=>{}); } }
  addEventListener('keydown',e=>{ keys[e.code]=true; if(e.code==='KeyP') togglePause(); if(e.code==='Space') e.preventDefault(); }); addEventListener('keyup',e=>keys[e.code]=false);
  document.getElementById('resumeButton').onclick=togglePause; document.getElementById('pauseTouch').onclick=togglePause;
  const shootTouch=document.getElementById('shootTouch'); ['pointerdown','pointerup','pointercancel','pointerleave'].forEach(ev=>shootTouch.addEventListener(ev,e=>{ touch.shoot=ev==='pointerdown'; shootTouch.classList.toggle('pressed',touch.shoot); e.preventDefault(); }));
  const dpad=document.getElementById('dpad'); function dmove(e){ const r=dpad.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5; touch.x=Math.max(-1,Math.min(1,x*2)); touch.y=Math.max(-1,Math.min(1,y*2)); dpad.classList.add('pressed'); }
  dpad.addEventListener('pointerdown',e=>{dpad.setPointerCapture(e.pointerId);dmove(e);}); dpad.addEventListener('pointermove',dmove); ['pointerup','pointercancel','pointerleave'].forEach(ev=>dpad.addEventListener(ev,()=>{touch.x=0;touch.y=0;dpad.classList.remove('pressed');}));
  buildUI(); updateHud(); requestAnimationFrame(loop);
})();
