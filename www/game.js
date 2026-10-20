/* Cosmo Citrouille — jeu original HTML5 Canvas, sans dépendance ni publicité. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('space'), ctx = canvas.getContext('2d', {alpha:false});
  const stage = $('stage');
  const dom = {menu:$('menu'),hud:$('hud'),pause:$('pause-screen'),result:$('result'),
    toast:$('toast'),sound:$('sound'),count:$('candy-count'),hearts:$('hearts'),
    progress:$('progress-bar'),score:$('score'),timer:$('timer')};
  const TAU=Math.PI*2;
  // Fourteen illustrated galaxies, ten individual missions in each: 140 playable worlds.
  const SECTORS=[
    {name:'Jardins stellaires',icon:'🌟',bossName:'Roi Guimauve',a:'#5336a5',b:'#a65cb5',sky:'#1d0c47'},
    {name:'Océan des sucettes',icon:'🍭',bossName:'Méduse Caramelle',a:'#0f839d',b:'#bc4db0',sky:'#053959'},
    {name:'Bal des fantômes',icon:'👻',bossName:'Duchesse Bouh',a:'#6946b5',b:'#de77bb',sky:'#302059'},
    {name:'Forêt des citrouilles',icon:'🎃',bossName:'Citrouille Géante',a:'#bb5743',b:'#a44f9b',sky:'#49203b'},
    {name:'Nébuleuse sucrée',icon:'🍬',bossName:'Capitaine Réglisse',a:'#a24578',b:'#ef9a76',sky:'#3e174c'},
    {name:'Château des chauves-souris',icon:'🦇',bossName:'Comte Biscuit',a:'#4751ae',b:'#97409e',sky:'#1b194c'},
    {name:'Arc-en-ciel cométaire',icon:'🌈',bossName:'Licorne Comète',a:'#429d99',b:'#dd6dba',sky:'#153e68'},
    {name:'Labyrinthe lunaire',icon:'🌙',bossName:'Minotaure Mousse',a:'#5367aa',b:'#b18ddb',sky:'#152651'},
    {name:'Brume des sorcières',icon:'🧙',bossName:'Sorcière Praline',a:'#6d57a8',b:'#77bb94',sky:'#22364c'},
    {name:'Volcans chocolat',icon:'🍫',bossName:'Dragon Cacao',a:'#b75839',b:'#db8d5c',sky:'#4b183c'},
    {name:'Glaciers fantômes',icon:'❄️',bossName:'Yéti Chantilly',a:'#3c9fae',b:'#87a9df',sky:'#133958'},
    {name:'Temple des étoiles',icon:'🔮',bossName:'Sphinx Bonbon',a:'#8771c7',b:'#db8b9b',sky:'#29214f'},
    {name:'Carnaval cosmique',icon:'🎪',bossName:'Clown Cosmique',a:'#e2718d',b:'#c98450',sky:'#48154c'},
    {name:'Palais des mille lunes',icon:'👑',bossName:'Impératrice Guimauve',a:'#8e49a8',b:'#eb8cb8',sky:'#320c55'}
  ];
  const MISSION_NAMES=['Départ scintillant','Pluie de friandises','La danse zigzag',
    'Le passage des comètes','Météores farceurs','Valse des étoiles',
    'Couloir tourbillonnant','La course folle','Le grand défi'];
  const MISSION_HINTS=['Ramasse les bonbons','Bonbons sous les étoiles','Évite les zigzags',
    'Attention aux comètes','Des météores malins','Chasse aux étoiles',
    'Attention aux tourbillons','Vitesse cosmique','Survis à la tempête'];
  const LEVELS=Array.from({length:140},(_,i)=>{
    const sector=Math.floor(i/10),step=i%10,world=SECTORS[sector],boss=step===9;
    const modifiers=['drift','drift','zigzag','chase','storm','drift','zigzag','chase','storm','boss'];
    const goal=boss?6+Math.floor(sector/2):Math.min(29,9+Math.floor(i/10)+Math.floor(step/3)*2);
    return {name:boss?world.bossName:`${world.name} — ${MISSION_NAMES[step]}`,
      short:boss?world.bossName:MISSION_NAMES[step],sector,step,icon:boss?'👑':world.icon,
      hint:boss?`BOSS • ${goal} étoiles`:MISSION_HINTS[step],
      goal,seconds:boss?Math.max(105,130-sector):Math.max(85,105-sector),
      meteor:Math.min(.46,.15+sector*.014+step*.016),
      speed:Math.min(310,130+sector*9+step*6),
      spawn:Math.max(.34,.68-sector*.016-step*.015),
      a:world.a,b:world.b,sky:world.sky,boss,pattern:modifiers[step]};
  });
  let GOAL=LEVELS[0].goal,DURATION=LEVELS[0].seconds;
  const MAX_HEARTS=4;
  const rand = (a,b) => a + Math.random() * (b-a);
  const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
  const ease = (a,b,t) => a + (b-a)*t;
  const hypot = (a,b) => Math.hypot(a,b);
  const pick = arr => arr[(Math.random()*arr.length)|0];
  function storageGet(key, fallback){try{return localStorage.getItem(key) ?? fallback;}catch(_){return fallback;}}
  function storageSet(key,value){try{localStorage.setItem(key,String(value));}catch(_){}}
  class Music {
    constructor(){this.enabled=storageGet('cosmo-sound','on')!=='off';this.audio=null;this.noteIx=0;this.next=0;}
    unlock(){if(!this.enabled)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
      if(!this.audio)this.audio=new Audio();if(this.audio.state==='suspended')this.audio.resume().catch(()=>{});}catch(_){}}
    tone(freq,length=.12,kind='sine',volume=.045,delay=0){if(!this.enabled||!this.audio||this.audio.state!=='running')return;
      try {const t=this.audio.currentTime+delay;const osc=this.audio.createOscillator();const g=this.audio.createGain();
        osc.type=kind;osc.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(.0001,t);
        g.gain.exponentialRampToValueAtTime(Math.max(.001,volume),t+.012);
        g.gain.exponentialRampToValueAtTime(.0001,t+length);
        osc.connect(g).connect(this.audio.destination);osc.start(t);osc.stop(t+length+.035);
      }catch(_){}}
    pick(){this.tone(622,.10,'sine',.048);this.tone(932,.17,'triangle',.034,.085);}
    star(){[523,659,784,1047].forEach((n,i)=>this.tone(n,.18,'sine',.044,i*.07));}
    bump(){this.tone(175,.15,'triangle',.048);this.tone(132,.24,'sine',.03,.09);}
    shield(){this.tone(520,.16,'sine',.04);this.tone(780,.22,'sine',.04,.09);}
    finish(){[523,659,784,1047,1318].forEach((n,i)=>this.tone(n,.3,'sine',.055,i*.13));}
    boss(){[220,330,440,660].forEach((n,i)=>this.tone(n,.18,'triangle',.040,i*.09));}
    zap(){this.tone(920,.16,'sine',.048);this.tone(1180,.20,'triangle',.030,.075);}
    laugh(){[440,380,480].forEach((n,i)=>this.tone(n,.12,'sine',.032,i*.11));}
    playMusic(dt){if(!this.enabled||!this.audio||this.audio.state!=='running')return;
      this.next-=dt;if(this.next>0)return;this.next=.42;
      const notes=[392,0,494,587,523,0,494,659,392,494,587,0,523,494,392,0];
      const note=notes[this.noteIx++%notes.length];if(note)this.tone(note,.19,'sine',.014);
    }
  }
  const music=new Music();
  function updateSound(){dom.sound.textContent=music.enabled?'♫':'♪̸';dom.sound.classList.toggle('muted',!music.enabled);dom.sound.setAttribute('aria-label',music.enabled?'Couper le son':'Activer le son');}
  updateSound();
  dom.sound.addEventListener('click',()=>{music.enabled=!music.enabled;storageSet('cosmo-sound',music.enabled?'on':'off');music.unlock();updateSound();});

  let W=400,H=800,dpr=1,time=0,last=0,backCanvas=null,stars=[];
  const state={mode:'menu',score:0,best:Number(storageGet('cosmo-best',0))||0,candy:0,hearts:MAX_HEARTS,
    level:1,unlocked:clamp(Number(storageGet('cosmo-unlocked',1))||1,1,LEVELS.length),boss:null,
    mapSector:0,difficulty:storageGet('cosmo-difficulty','aventure')==='expert'?'expert':'aventure',wave:4,
    completedFinal:storageGet('cosmo-win140','no')==='yes',
    left:DURATION,elapsed:0,spawn:1,invuln:0,shield:0,combo:0,lastCandy:-999,shake:0,
    entities:[],particles:[],floatText:[],player:{x:200,y:620,tx:200,ty:620,vx:0,rot:0},
    pointer:false,toastUntil:0,finishWin:false};
  function resize(){const b=stage.getBoundingClientRect();const oldW=W,oldH=H;
    W=Math.max(260,b.width);H=Math.max(340,b.height);dpr=Math.min(2.5,window.devicePixelRatio||1);
    canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
    canvas.style.width=b.width+'px';canvas.style.height=b.height+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    if(oldW>0&&oldH>0){let sx=W/oldW,sy=H/oldH;state.player.x*=sx;state.player.tx*=sx;state.player.y*=sy;state.player.ty*=sy;
      state.entities.forEach(o=>{o.x*=sx;o.y*=sy;});state.particles.forEach(p=>{p.x*=sx;p.y*=sy;});}
    buildBackdrop();
  }
  function gradient(g,x1,y1,x2,y2,stops){let r=g.createLinearGradient(x1,y1,x2,y2);for(let s of stops)r.addColorStop(s[0],s[1]);return r;}
  function radial(g,x,y,r,stops){let gr=g.createRadialGradient(x,y,0,x,y,r);for(let s of stops)gr.addColorStop(s[0],s[1]);return gr;}
  function roundRect(g,x,y,w,h,r){if(g.roundRect){g.beginPath();g.roundRect(x,y,w,h,r);}else{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.closePath();}}
  function circle(g,x,y,r,color){g.fillStyle=color;g.beginPath();g.arc(x,y,r,0,TAU);g.fill();}
  function ellipse(g,x,y,rx,ry,color,rot=0){g.save();g.translate(x,y);g.rotate(rot);g.fillStyle=color;g.beginPath();g.ellipse(0,0,rx,ry,0,0,TAU);g.fill();g.restore();}
  function starPath(g,x,y,r,inner=r*.46,points=5,rot=-Math.PI/2){g.beginPath();for(let i=0;i<points*2;i++){const a=rot+i*Math.PI/points;const r2=i%2?inner:r;const xx=x+Math.cos(a)*r2,yy=y+Math.sin(a)*r2;if(i===0)g.moveTo(xx,yy);else g.lineTo(xx,yy);}g.closePath();}
  function glow(g,x,y,r,color){g.fillStyle=radial(g,x,y,r,[[0,color],[1,'rgba(0,0,0,0)']]);g.beginPath();g.arc(x,y,r,0,TAU);g.fill();}
  function buildBackdrop(){backCanvas=document.createElement('canvas');backCanvas.width=Math.ceil(W*dpr);backCanvas.height=Math.ceil(H*dpr);
    const g=backCanvas.getContext('2d');g.scale(dpr,dpr);
    const theme=LEVELS[state.level-1]||LEVELS[0];
    g.fillStyle=gradient(g,0,0,W,H,[[0,theme.sky],[.44,theme.b],[1,'#100d35']]);g.fillRect(0,0,W,H);
    glow(g,W*.1,H*.28,W*.74,'rgba(160,63,217,.34)');glow(g,W*.92,H*.55,W*.68,'rgba(51,210,208,.19)');
    glow(g,W*.3,H*.81,W*.85,'rgba(125,43,179,.30)');glow(g,W*.78,H*.14,W*.5,'rgba(212,69,153,.16)');
    g.fillStyle='#ba60e211';g.beginPath();g.moveTo(-90,H*.27);g.bezierCurveTo(W*.35,H*.17,W*.6,H*.37,W+80,H*.23);g.bezierCurveTo(W*.6,H*.46,W*.3,H*.31,-90,H*.48);g.fill();
    // Far-away Saturn-like pumpkin planet.
    g.save();g.translate(W*.85,H*.26);g.rotate(-.32);g.strokeStyle='#ce94f266';g.lineWidth=12;
    g.beginPath();g.ellipse(0,0,71,18,0,Math.PI,TAU);g.stroke();
    circle(g,0,0,49,radial(g,-18,-20,82,[[0,'#d989e8'],[.55,'#9252b8'],[1,'#543682']]));
    ellipse(g,-17,-11,11,7,'#ffffff22',-.4);ellipse(g,17,14,17,7,'#3f276955',-.4);
    g.strokeStyle='#e4aaf496';g.lineWidth=8;g.beginPath();g.ellipse(0,0,71,18,0,0,Math.PI);g.stroke();g.restore();
    // Candy-colored silhouettes of distant alien dunes.
    g.fillStyle='#37165d48';g.beginPath();g.moveTo(0,H*.92);g.bezierCurveTo(W*.23,H*.77,W*.56,H*.97,W,H*.84);g.lineTo(W,H);g.lineTo(0,H);g.fill();
    g.fillStyle='#130c3ca0';g.beginPath();g.moveTo(0,H*.97);g.bezierCurveTo(W*.2,H*.87,W*.55,H*.95,W,H*.91);g.lineTo(W,H);g.lineTo(0,H);g.fill();
    // Each new planet feels different, but the background stays behind collectibles.
    if(theme.sector===1){glow(g,W*.23,H*.39,W*.4,'rgba(89,248,211,.28)');
      g.save();g.translate(W*.19,H*.55);g.rotate(.35);g.strokeStyle='#bdfbff55';g.lineWidth=5;
      g.beginPath();g.ellipse(0,0,57,17,0,0,TAU);g.stroke();circle(g,0,0,29,'#ff9ec2');g.restore();}
    if(theme.sector===2){for(let i=0;i<4;i++){let xx=W*(i+.5)/4;glow(g,xx,H*.48,90,'rgba(207,168,255,.17)');
      g.strokeStyle='#ffedf258';g.lineWidth=2;g.beginPath();g.moveTo(xx-11,H*.63);g.quadraticCurveTo(xx,H*.61,xx+11,H*.63);g.stroke();}}
    if(theme.sector===3){for(let i=0;i<6;i++){let x=W*(i+.25)/6,y=H*(.18+(i%3)*.18);
      glow(g,x,y,65,'rgba(255,175,67,.20)');circle(g,x,y,7+(i%3)*3,'#ffb56555');}}
    if(theme.boss){glow(g,W*.5,H*.31,W*.68,'rgba(255,112,182,.38)');
      g.strokeStyle='#ffbfe428';g.lineWidth=3;for(let i=0;i<6;i++){g.beginPath();
      g.arc(W*.5,H*.30,90+i*31,Math.PI*.1,Math.PI*.9);g.stroke();}}
    // Distinct celestial scenery in every galaxy: luminous arches, crystal rings and planets.
    const s=theme.sector;
    for(let i=0;i<3+(s%4);i++){
      const xx=W*((i+.6)/(4+(s%4))), yy=H*(.24+.13*((i+s)%4));
      glow(g,xx,yy,48+(s%4)*11, s%2?'rgba(105,244,223,.17)':'rgba(255,199,143,.19)');
      g.save();g.translate(xx,yy);g.rotate((s+i)*.6);
      g.strokeStyle=s%2?'#bafefb55':'#ffdda857';g.lineWidth=2+(s%3);
      g.beginPath();g.ellipse(0,0,16+s%5*4,5+s%3*2,0,0,TAU);g.stroke();g.restore();
    }
    stars=Array.from({length:Math.min(115,Math.floor(W*H/3100))},(_,i)=>({x:Math.random()*W,y:Math.random()*H,
      size:rand(.55,2.3),phase:rand(0,TAU),speed:rand(.6,2.3),color:pick(['#fff4e5','#a1e7fa','#e9b7fa','#fffdf9']),cross:i%11===0}));
  }
  function drawBackdrop(t){if(backCanvas)ctx.drawImage(backCanvas,0,0,W,H);
    for(const s of stars){let a=.35+.55*(.5+.5*Math.sin(t*s.speed+s.phase));ctx.globalAlpha=a;
      if(s.cross){ctx.strokeStyle=s.color;ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(s.x-4,s.y);ctx.lineTo(s.x+4,s.y);ctx.moveTo(s.x,s.y-4);ctx.lineTo(s.x,s.y+4);ctx.stroke();}
      circle(ctx,s.x,s.y,s.size,s.color);}ctx.globalAlpha=1;
    // Cosmic sparkles are decorative rather than hazards.
    if(Math.sin(t*.35)>.985){const px=W*.16,py=H*.14;glow(ctx,px,py,20,'rgba(255,206,130,.18)');}
  }
  function drawGhost(x,y,scale,t,alpha=1){ctx.save();ctx.translate(x,y+Math.sin(t*2+x)*7*scale);ctx.rotate(Math.sin(t*1.2+x)*.09);
    ctx.scale(scale,scale);ctx.globalAlpha*=alpha;
    glow(ctx,0,0,62,'rgba(137,237,253,.18)');
    let gr=gradient(ctx,-25,-38,30,44,[[0,'#fff9fa'],[.5,'#e5fff8'],[1,'#8cd7dc']]);
    ctx.fillStyle=gr;ctx.strokeStyle='#72caca';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-33,10);ctx.lineTo(-34,-5);
    ctx.bezierCurveTo(-34,-48,34,-49,34,-5);ctx.lineTo(33,30);
    ctx.quadraticCurveTo(25,44,16,30);ctx.quadraticCurveTo(6,44,-2,30);ctx.quadraticCurveTo(-14,44,-22,31);ctx.quadraticCurveTo(-36,43,-33,10);ctx.closePath();ctx.fill();ctx.stroke();
    ellipse(ctx,-35,0,9,5,'#eafffa',-.4);ellipse(ctx,36,0,9,5,'#ddfff5',.4);
    ellipse(ctx,-12,-4,5,8,'#38245e');ellipse(ctx,12,-4,5,8,'#38245e');
    circle(ctx,-10,-7,1.8,'white');circle(ctx,14,-7,1.8,'white');
    ellipse(ctx,-20,10,7,4,'#ff94b183');ellipse(ctx,21,10,7,4,'#ff94b183');
    ctx.strokeStyle='#653478';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,8,7,.15,Math.PI-.15);ctx.stroke();ctx.restore();
  }
  function drawBat(x,y,scale,t){ctx.save();ctx.translate(x,y+Math.cos(t*2.3)*7);ctx.scale(scale,scale);let flap=Math.sin(t*9)*6;
    ctx.fillStyle='#38225b';ctx.strokeStyle='#a881b0';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(-5,-2);ctx.bezierCurveTo(-13,-17,-28,-13-flap,-34,-23-flap);
    ctx.quadraticCurveTo(-35,-5-flap,-22,9);ctx.quadraticCurveTo(-14,2,-6,10);
    ctx.lineTo(6,10);ctx.quadraticCurveTo(14,2,22,9);ctx.quadraticCurveTo(35,-5-flap,34,-23-flap);
    ctx.bezierCurveTo(28,-13-flap,13,-17,5,-2);ctx.closePath();ctx.fill();ctx.stroke();
    circle(ctx,0,0,12,'#59417a');ctx.fillStyle='#59417a';ctx.beginPath();ctx.moveTo(-10,-4);ctx.lineTo(-9,-18);ctx.lineTo(-2,-11);ctx.lineTo(3,-11);ctx.lineTo(10,-18);ctx.lineTo(10,-4);ctx.fill();
    ellipse(ctx,-4,-1,2.5,3,'#faffcb');ellipse(ctx,5,-1,2.5,3,'#faffcb');ctx.restore();}
  function drawCandy(x,y,r,type,t,rotation=0){ctx.save();ctx.translate(x,y);ctx.rotate(rotation+Math.sin(t*2+x*.1)*.1);let sc=r/20;ctx.scale(sc,sc);
    glow(ctx,0,0,36,'rgba(255,190,130,.20)');
    if(type==='lolly'){
      ctx.lineWidth=5;ctx.strokeStyle='#fdf1c8';ctx.lineCap='round';ctx.beginPath();ctx.moveTo(1,7);ctx.lineTo(8,32);ctx.stroke();
      circle(ctx,0,-4,18,radial(ctx,-7,-12,36,[[0,'#fff7ce'],[.19,'#ffb3b1'],[.75,'#f45a99'],[1,'#b72d78']]));
      ctx.strokeStyle='#ffefae';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,-4,13,-1.5,2.9);ctx.arc(1,-4,7,2.9,5.8);ctx.stroke();
      circle(ctx,-6,-11,4,'#ffffff77');
    }else if(type==='moon'){
      circle(ctx,0,0,19,radial(ctx,-7,-9,33,[[0,'#fffcd9'],[.7,'#fbd56c'],[1,'#d38335']]));
      ellipse(ctx,-7,0,4,6,'#de9948');circle(ctx,7,-6,3,'#e4a650');circle(ctx,5,9,5,'#efb963');
      circle(ctx,-5,-9,3,'#ffffffa0');
    }else if(type==='mint'){
      ctx.fillStyle='#71f5d7';ctx.strokeStyle='#218e98';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(-16,-10);ctx.lineTo(-30,-18);ctx.lineTo(-28,13);ctx.lineTo(-17,10);ctx.lineTo(18,10);ctx.lineTo(29,17);ctx.lineTo(29,-16);ctx.lineTo(16,-10);ctx.closePath();ctx.fill();ctx.stroke();
      roundRect(ctx,-17,-15,34,30,10);ctx.fillStyle=gradient(ctx,-16,-15,16,15,[[0,'#f8fff0'],[.4,'#74e8ef'],[1,'#159fb9']]);ctx.fill();ctx.stroke();
      ctx.lineWidth=4;ctx.strokeStyle='#ffffffaf';ctx.beginPath();ctx.moveTo(-8,-9);ctx.lineTo(3,8);ctx.moveTo(4,-11);ctx.lineTo(13,3);ctx.stroke();
    }else{
      ctx.fillStyle='#ff7fbd';ctx.strokeStyle='#913ca1';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(-17,-11);ctx.lineTo(-31,-20);ctx.lineTo(-27,13);ctx.lineTo(-16,9);ctx.lineTo(17,9);ctx.lineTo(29,18);ctx.lineTo(29,-19);ctx.lineTo(17,-10);ctx.closePath();ctx.fill();ctx.stroke();
      roundRect(ctx,-18,-15,36,30,10);ctx.fillStyle=gradient(ctx,-17,-15,15,16,[[0,'#fff3b7'],[.3,'#ff9fc2'],[1,'#d44b93']]);ctx.fill();ctx.stroke();
      ctx.fillStyle='#fffac5';starPath(ctx,0,0,10,5);ctx.fill();
    }ctx.restore();}
  function drawStarReward(x,y,r,t){ctx.save();ctx.translate(x,y);ctx.rotate(t*1.4);let rr=r+Math.sin(t*6)*1.8;
    glow(ctx,0,0,rr*2.5,'rgba(255,219,112,.32)');ctx.fillStyle='#b95742';starPath(ctx,1,3,rr+2,(rr+2)*.46);ctx.fill();
    ctx.fillStyle=gradient(ctx,0,-rr,0,rr,[[0,'#fff9bd'],[.57,'#ffe374'],[1,'#ffb94e']]);starPath(ctx,0,0,rr,rr*.49);ctx.fill();
    ctx.rotate(-t*1.4);ellipse(ctx,-5,-2,1.7,2.4,'#704479');ellipse(ctx,5,-2,1.7,2.4,'#704479');
    ctx.strokeStyle='#704479';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(0,3,4,0,Math.PI);ctx.stroke();ctx.restore();}
  function drawShield(x,y,r,t){ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*2)*.19);
    glow(ctx,0,0,r*2.3,'rgba(108,250,246,.3)');ctx.lineWidth=4;ctx.strokeStyle='#d7fff7';ctx.fillStyle=gradient(ctx,0,-r,0,r,[[0,'#8bf9f7'],[1,'#27a2d2']]);
    ctx.beginPath();ctx.moveTo(0,-r);ctx.quadraticCurveTo(r*.93,-r*.75,r*.82,-r*.08);
    ctx.quadraticCurveTo(r*.75,r*.75,0,r);ctx.quadraticCurveTo(-r*.75,r*.75,-r*.82,-r*.08);
    ctx.quadraticCurveTo(-r*.93,-r*.75,0,-r);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff3c6';starPath(ctx,0,0,r*.48,r*.22);ctx.fill();ctx.restore();}
  function drawMeteor(x,y,r,t,rot=0){ctx.save();ctx.translate(x,y);ctx.rotate(rot+t*.55);glow(ctx,0,0,r*1.9,'rgba(171,93,212,.19)');
    const outer=radial(ctx,-r*.32,-r*.42,r*1.45,[[0,'#ad8ad0'],[.6,'#70508f'],[1,'#3b2b68']]);
    ctx.fillStyle=outer;ctx.strokeStyle='#be87d0';ctx.lineWidth=1.5;
    ctx.beginPath();for(let i=0;i<11;i++){let a=i*TAU/11,cr=r*(.88+.12*Math.sin(i*3.7+rot));let px=Math.cos(a)*cr,py=Math.sin(a)*cr;
      if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();ctx.fill();ctx.stroke();
    ellipse(ctx,-r*.40,-r*.41,r*.25,r*.17,'#cba6db75',-.4);ellipse(ctx,r*.48,r*.40,r*.24,r*.18,'#2c244b8c');
    // Cartoon sleepy/annoyed eyes rather than anything frightening.
    ellipse(ctx,-r*.29,-r*.07,r*.16,r*.18,'#ffe9e5');ellipse(ctx,r*.29,-r*.07,r*.16,r*.18,'#ffe9e5');
    circle(ctx,-r*.28,-r*.03,r*.075,'#3c1c57');circle(ctx,r*.28,-r*.03,r*.075,'#3c1c57');
    ctx.lineWidth=2.8;ctx.strokeStyle='#37204f';ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-r*.48,-r*.29);ctx.lineTo(-r*.1,-r*.17);ctx.moveTo(r*.48,-r*.29);ctx.lineTo(r*.1,-r*.17);ctx.stroke();
    ctx.beginPath();ctx.arc(0,r*.31,r*.12,Math.PI,TAU);ctx.stroke();ctx.restore();}
  function drawPlayer(x,y,scale,t,rotation=0,shields=0){ctx.save();ctx.translate(x,y+Math.sin(t*8)*1.4);ctx.rotate(rotation);ctx.scale(scale,scale);
    if(shields>0){ctx.save();ctx.rotate(t*1.2);ctx.strokeStyle='#74ffecd7';ctx.lineWidth=3;
      ctx.setLineDash([12,8]);ctx.beginPath();ctx.arc(0,0,44,0,TAU);ctx.stroke();ctx.setLineDash([]);ctx.restore();glow(ctx,0,0,60,'rgba(73,242,220,.16)');}
    glow(ctx,0,15,67,'rgba(255,132,74,.19)');
    const f=6+Math.sin(t*20)*8;
    ctx.fillStyle=gradient(ctx,0,25,0,72+f,[[0,'#ffe275'],[.42,'#ff9e33'],[1,'#e8557e00']]);
    ctx.beginPath();ctx.moveTo(-14,26);ctx.quadraticCurveTo(-13,54+f,0,68+f);
    ctx.quadraticCurveTo(13,51+f,14,26);ctx.closePath();ctx.fill();
    ctx.fillStyle='#97f8fb';ctx.beginPath();ctx.moveTo(-8,26);ctx.quadraticCurveTo(-5,51,0,56+f*.4);ctx.quadraticCurveTo(7,43,8,26);ctx.fill();
    // Rocket fins and striped candy rockets.
    ctx.fillStyle='#8a69d7';ctx.strokeStyle='#362e7a';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-23,9);ctx.quadraticCurveTo(-39,14,-42,40);ctx.quadraticCurveTo(-19,31,-15,23);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(23,9);ctx.quadraticCurveTo(39,14,42,40);ctx.quadraticCurveTo(19,31,15,23);ctx.fill();ctx.stroke();
    ellipse(ctx,0,23,22,13,'#5f429c');ellipse(ctx,0,25,14,7,'#a582e4');
    // Pumpkin hull (lobed for a pumpkin shape).
    ellipse(ctx,-17,1,19,30,'#bd551a');ellipse(ctx,17,1,19,30,'#d87523');
    ellipse(ctx,0,1,29,33,gradient(ctx,-18,-30,24,32,[[0,'#ffe06b'],[.32,'#ffb93e'],[.75,'#f58330'],[1,'#bc4b3b']]));
    ctx.strokeStyle='#dc6a2f';ctx.lineWidth=1.6;
    ctx.beginPath();ctx.moveTo(-14,-25);ctx.bezierCurveTo(-26,-4,-24,18,-13,27);ctx.moveTo(14,-25);ctx.bezierCurveTo(26,-4,24,18,13,27);ctx.stroke();
    // A tiny cat pilot peeks through the glass cockpit.
    ellipse(ctx,0,-18,23,21,radial(ctx,-8,-27,40,[[0,'#d0faff'],[.65,'#80b7e4'],[1,'#4e74bd']]));
    ctx.fillStyle='#ffeec5';ctx.beginPath();ctx.moveTo(-14,-28);ctx.lineTo(-12,-40);ctx.lineTo(-3,-32);
    ctx.lineTo(3,-32);ctx.lineTo(12,-40);ctx.lineTo(14,-28);ctx.quadraticCurveTo(20,-10,0,-7);ctx.quadraticCurveTo(-20,-10,-14,-28);ctx.fill();
    ctx.fillStyle='#e8a4b2';ctx.beginPath();ctx.moveTo(-11,-34);ctx.lineTo(-10,-29);ctx.lineTo(-6,-31);ctx.fill();
    ctx.beginPath();ctx.moveTo(7,-31);ctx.lineTo(11,-34);ctx.lineTo(10,-29);ctx.fill();
    ellipse(ctx,-7,-22,2.7,4,'#392653');ellipse(ctx,7,-22,2.7,4,'#392653');
    ctx.fillStyle='#d66e81';ctx.beginPath();ctx.moveTo(-2,-16);ctx.lineTo(2,-16);ctx.lineTo(0,-13);ctx.fill();
    ctx.strokeStyle='#5c3a65';ctx.lineWidth=1.7;ctx.beginPath();ctx.arc(-3,-15,3,0,Math.PI*.77);ctx.arc(3,-15,3,Math.PI*.23,Math.PI);ctx.stroke();
    ctx.strokeStyle='#effeffb9';ctx.lineWidth=3;ctx.beginPath();ctx.arc(-3,-20,19,-2.4,-.65);ctx.stroke();
    // Happy jack-o'-lantern face on hull.
    ctx.fillStyle='#563254';ctx.beginPath();ctx.moveTo(-12,9);ctx.lineTo(-6,2);ctx.lineTo(-2,10);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(12,9);ctx.lineTo(6,2);ctx.lineTo(2,10);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#5b3150';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.beginPath();ctx.arc(0,11,10,.25,Math.PI-.25);ctx.stroke();
    ellipse(ctx,-17,-2,5,3,'#ffe6a264');ellipse(ctx,18,-2,5,3,'#ffe6a264');
    ctx.fillStyle='#63dcb6';ctx.beginPath();ctx.moveTo(-2,-39);ctx.quadraticCurveTo(0,-54,17,-48);ctx.quadraticCurveTo(9,-37,-2,-39);ctx.fill();
    ctx.strokeStyle='#487e69';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-35);ctx.lineTo(0,-43);ctx.stroke();ctx.restore();}
  function drawHUDWorld(){const p=state.player;
    if(state.mode==='playing' || state.mode==='paused'){
      ctx.save();if(state.invuln>0&&Math.floor(time*12)%2===0)ctx.globalAlpha=.36;
      drawPlayer(p.x,p.y,1.02,time,p.rot,state.shield);ctx.restore();
    }else if(state.mode==='menu'||state.mode==='levels'){
      glow(ctx,W*.5,H*.575,125,'rgba(255,161,111,.15)');
      const bob=Math.sin(time*2)*Math.min(10,H*.012);
      const shipY=H<650?H*.47:H<740?H*.51:H*.565;
      const shipScale=Math.min(1.7,W/260,clamp((H-450)/180,1.05,1.7));
      drawPlayer(W*.50,shipY+bob,shipScale,time,Math.sin(time)*.08,0);
      drawGhost(W*.14,H*.48,.64,time,.94);drawGhost(W*.85,H*.57,.79,time+1.4,.95);
      drawBat(W*.82,H*.35,.67,time);
      drawCandy(W*.19,H*.65,19,'lolly',time,.6);drawCandy(W*.78,H*.70,19,'mint',time,-.3);
      drawStarReward(W*.76,H*.45,14,time);drawStarReward(W*.25,H*.38,11,time+1);
    }else if(state.mode==='over'){
      drawGhost(W*.18,H*.50,.8,time);drawGhost(W*.82,H*.55,.75,time+1.3);
      drawPlayer(W*.51,H*.75,.95,time,.06,0);
    }
  }
  function emit(x,y,colors,count=12,speed=100,life=.55){for(let i=0;i<count;i++){
    const a=rand(0,TAU),s=rand(speed*.2,speed);state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-25,
      life:life*rand(.7,1.3),max:life*1.3,size:rand(2,6),color:pick(colors),kind:Math.random()<.22?'star':'circle',rot:rand(0,TAU)});
  }if(state.particles.length>260)state.particles.splice(0,state.particles.length-260);}
  function floatText(x,y,txt,color='#fff0b0'){state.floatText.push({x,y,text:txt,color,life:1.1,max:1.1});}
  function isExpert(){return state.difficulty==='expert';}
  function spawnObject(forcedType=null){
    const config=LEVELS[state.level-1],r=Math.random();
    const meteorChance=Math.min(.56,config.meteor+(isExpert()?.075:0));
    const type=forcedType || (r<meteorChance?'meteor':r<meteorChance+.035?'shield':r<meteorChance+.058?'heart':r<meteorChance+.125&&!config.boss?'star':'candy');
    const near=Math.random()<(type==='meteor'?.27:.69);
    const x=near?state.player.x+rand(-100,100):rand(38,W-38);
    const size=type==='meteor'?rand(18,27):type==='star'?20:type==='heart'?20:type==='shield'?21:rand(18,23);
    const e={type,x:clamp(x,32,W-32),y:-50,r:size,
      vy:rand(config.speed,config.speed+52)+(isExpert()?32:0),vx:rand(-18,18),
      phase:rand(0,TAU),rot:rand(-.2,.2),candyType:pick(['lolly','mint','wrapped','moon']),
      seed:rand(0,1000),pattern:config.pattern};
    state.entities.push(e);return e;
  }
  function spawnWave(){
    const type=LEVELS[state.level-1].boss?'meteor':'meteor';
    const n=isExpert()?3:2;const gap=W/(n+1);
    for(let i=0;i<n;i++){
      const e=spawnObject(type);e.x=clamp(gap*(i+1)+rand(-17,17),34,W-34);
      e.y=-45-i*31;e.r=19;e.vy*=.87;e.pattern='zigzag';e.phase=i*2;
      if(LEVELS[state.level-1].boss)e.jelly=true;
    }
  }
  function spawnBossStar(){const e=spawnObject('star');e.x=clamp(state.player.x+rand(-65,65),40,W-40);e.vy=rand(170,215);e.bossStar=true;return e;}
  function spawnBossJelly(){
    const e=spawnObject('meteor');e.x=clamp(state.player.x+rand(-115,115),35,W-35);
    e.y=state.boss.y+46;e.r=rand(16,23);e.vy=rand(155,215)+(state.level/20);
    e.jelly=true;e.pattern=state.boss.hp<state.boss.max*.5?'chase':'zigzag';return e;
  }
  function hud(){const isBoss=!!LEVELS[state.level-1].boss;
    dom.count.textContent=isBoss?`${GOAL-(state.boss?.hp??GOAL)}/${GOAL}`:`${Math.min(GOAL,state.candy)}/${GOAL}`;
    document.querySelector('.hud-icon').textContent=isBoss?'✨':'🍬';
    dom.hearts.textContent='♥ '.repeat(state.hearts).trim()+' ♡'.repeat(MAX_HEARTS-state.hearts);
    dom.hearts.setAttribute('aria-label',state.hearts+' cœurs restants');
    dom.progress.style.width=Math.min(100,(isBoss?GOAL-(state.boss?.hp??GOAL):state.candy)/GOAL*100)+'%';
    dom.hud.classList.toggle('boss-hud',isBoss);
    $('level-label').textContent=isBoss?`BOSS ${Math.floor((state.level-1)/10)+1}/14`:`MONDE ${state.level}/140`;
    dom.score.textContent='⭐ '+state.score;let n=Math.max(0,Math.ceil(state.left));dom.timer.textContent='⏱ '+Math.floor(n/60)+':'+String(n%60).padStart(2,'0');
  }
  function toast(text){dom.toast.textContent=text;dom.toast.classList.add('show');state.toastUntil=time+1.85;}
  function resetLevel(level,keepScore=false){
    state.level=level;state.mapSector=Math.floor((level-1)/10);GOAL=LEVELS[level-1].goal;DURATION=LEVELS[level-1].seconds*(isExpert()?.86:1);
    if(!keepScore)state.score=0;
    state.candy=0;state.hearts=keepScore?Math.min(MAX_HEARTS,Math.max(isExpert()?2:3,state.hearts+1)):(isExpert()?3:MAX_HEARTS);
    state.left=DURATION;state.elapsed=0;state.spawn=.65;state.wave=6;state.invuln=2;state.shield=0;
    state.combo=0;state.lastCandy=-999;state.shake=0;state.entities=[];state.particles=[];state.floatText=[];
    state.player={x:W*.5,y:H*.76,tx:W*.5,ty:H*.76,vx:0,rot:0};state.pointer=false;state.finishWin=false;
    state.boss=LEVELS[level-1].boss?{x:W*.5,y:Math.min(220,Math.max(177,H*.265)),hp:GOAL,max:GOAL,bolts:[],nextStar:1.7,nextMeteor:1.85,hitTimer:0}:null;
    buildBackdrop();hud();
  }
  function show(mode){state.mode=mode;stage.classList.toggle('is-browsing',mode==='levels');
    dom.menu.classList.toggle('active',mode==='menu');
    $('levels').classList.toggle('active',mode==='levels');
    dom.hud.classList.toggle('hidden',!['playing','paused'].includes(mode));
    dom.pause.classList.toggle('hidden',mode!=='paused');
    $('level-complete').classList.toggle('hidden',mode!=='complete');
    dom.result.classList.toggle('hidden',mode!=='over');
    dom.sound.classList.toggle('hidden',mode==='over'||mode==='complete');
    dom.toast.classList.remove('show');
  }
  function setDifficulty(mode){
    if(mode!=='aventure'&&mode!=='expert')return;
    state.difficulty=mode;storageSet('cosmo-difficulty',mode);
    $('mode-aventure').classList.toggle('selected',mode==='aventure');
    $('mode-expert').classList.toggle('selected',mode==='expert');
    $('mode-aventure').setAttribute('aria-pressed',String(mode==='aventure'));
    $('mode-expert').setAttribute('aria-pressed',String(mode==='expert'));
  }
  function levelMap(page=null){
    if(Number.isInteger(page))state.mapSector=clamp(page,0,SECTORS.length-1);
    else state.mapSector=clamp(state.mapSector,0,SECTORS.length-1);
    const sector=state.mapSector,world=SECTORS[sector];
    $('sector-icon').textContent=world.icon;
    $('sector-name').textContent=world.name;
    $('sector-count').textContent=`GALAXIE ${sector+1}/14 • MONDES ${sector*10+1}–${sector*10+10}`;
    $('galaxy-progress').textContent=`${Math.max(0,state.unlocked-1)+(state.completedFinal?1:0)}/140 mondes terminés`;
    $('prev-sector').disabled=sector===0;
    $('next-sector').disabled=sector===13;
    setDifficulty(state.difficulty);
    const grid=$('level-grid');grid.innerHTML='';
    for(let j=0;j<10;j++){
      const i=sector*10+j,level=LEVELS[i],unlocked=i+1<=state.unlocked;
      const b=document.createElement('button');
      b.className='level-tile'+(!unlocked?' locked':'')+(level.boss?' boss-tile':'');
      b.style.setProperty('--tileA',level.a);b.style.setProperty('--tileB',level.b);
      b.disabled=!unlocked;
      b.setAttribute('aria-label',unlocked?`Jouer au monde ${i+1} : ${level.name}`:`Monde ${i+1} verrouillé`);
      b.innerHTML=`<span class="tile-number">${level.boss?'⚔ BOSS':`MONDE ${i+1}`}</span>`+
        `<span class="tile-emoji" aria-hidden="true">${unlocked?level.icon:'🔒'}</span>`+
        `<span class="tile-name">${level.short}</span>`+
        `<span class="tile-detail">${unlocked?level.hint:'À DÉBLOQUER'}</span>`;
      b.addEventListener('click',()=>startLevel(i+1));grid.appendChild(b);
    }
    grid.scrollTop=0;
    show('levels');
  }
  function startLevel(number,keepScore=false){
    if(number>state.unlocked||number<1||number>LEVELS.length)return;
    music.unlock();resetLevel(number,keepScore);
    const e=spawnObject('candy');Object.assign(e,{x:W*.5,y:H*.25,r:23,candyType:'wrapped'});
    if(state.boss){const star=spawnBossStar();star.y=H*.42;
      music.boss();}
    else{const candy=spawnObject('candy');Object.assign(candy,{x:W*.77,y:H*.11,r:22,candyType:'lolly'});
      music.star();}
    show('playing');
    // Show is before toast, otherwise show() hides the message.
    if(state.boss)toast('✨ BOSS ! ATTRAPE LES ÉTOILES !');
    else toast(`${LEVELS[number-1].icon} ${LEVELS[number-1].name} !`);
  }
  function pause(){if(state.mode==='playing'){show('paused');}else if(state.mode==='paused'){show('playing');last=performance.now();}}
  function home(){state.entities=[];state.particles=[];state.floatText=[];state.boss=null;state.level=1;buildBackdrop();show('menu');}
  function fail(){
    if(state.mode!=='playing')return;
    if(state.score>state.best){state.best=state.score;storageSet('cosmo-best',state.best);}
    $('result-kicker').textContent='ENCORE UNE PARTIE !';
    $('result-title').textContent='TU PEUX LE FAIRE !';
    $('result-text').textContent=`Le monde ${state.level} t’attend. Tes mondes débloqués sont gardés !`;
    $('result-icon').textContent='🎃';$('final-score').textContent=state.score;$('best-score').textContent=state.best;
    $('replay').innerHTML='RÉESSAYER <span aria-hidden="true">🚀</span>';
    music.bump();show('over');
  }
  function finishBoss(){
    if(state.mode!=='playing')return;
    if(state.score>state.best){state.best=state.score;storageSet('cosmo-best',state.best);}
    state.unlocked=140;storageSet('cosmo-unlocked',state.unlocked);state.completedFinal=true;storageSet('cosmo-win140','yes');
    $('result-kicker').textContent='LES 140 MONDES SONT SAUVÉS !';
    $('result-title').textContent='REINE DES ÉTOILES !';
    $('result-text').textContent='Tu as vaincu l’Impératrice Guimauve et sauvé les 14 galaxies !';
    $('result-icon').textContent='🏆';$('final-score').textContent=state.score;$('best-score').textContent=state.best;
    emit(state.boss.x,state.boss.y,['#fff1a2','#ff90c5','#80fff2','#c1a6ff'],110,210,1.5);
    $('replay').innerHTML='REJOUER LE BOSS <span aria-hidden="true">🚀</span>';
    music.finish();show('over');
  }
  function completeLevel(){
    if(state.mode!=='playing')return;
    if(state.level===LEVELS.length){finishBoss();return;}
    state.unlocked=Math.max(state.unlocked,state.level+1);storageSet('cosmo-unlocked',state.unlocked);
    if(state.score>state.best){state.best=state.score;storageSet('cosmo-best',state.best);}
    const next=LEVELS[state.level];
    $('complete-icon').textContent=next.icon;
    $('complete-kicker').textContent=`MONDE ${state.level} TERMINÉ !`;
    $('complete-title').textContent=LEVELS[state.level-1].boss?'BOSS VAINCU !':'BRAVO, CAPITAINE !';
    $('complete-text').textContent=LEVELS[state.level-1].boss?`Une galaxie sauvée ! En route vers ${SECTORS[next.sector].name} !`:`Mission réussie ! À toi le monde ${state.level+1} !`;
    $('next-unlock').textContent=`🔓 ${next.name} débloqué !`;
    emit(state.player.x,state.player.y,['#fff1a2','#ff90c5','#80fff2','#c1a6ff'],80,190,1.4);
    music.finish();show('complete');
  }
  function damage(e){
    if(state.shield>0){state.score+=5;music.shield();emit(e.x,e.y,['#aafff1','#8bdbff','#e6fff9'],21,120,.6);floatText(e.x,e.y,'BOING ! +5','#aaffef');hud();}
    else if(state.invuln<=0){state.hearts--;state.invuln=2.5;state.shake=8;music.bump();
      emit(e.x,e.y,['#c5b5e6','#fff0a6','#ff9bbe'],22,125,.65);
      toast(pick(['OUPS, UN CAILLOU ! 😜','BOING ! 👻','MÊME PAS PEUR ! 🎃']));
      if(navigator.vibrate)try{navigator.vibrate(45);}catch(_){}hud();if(state.hearts<=0)fail();
    }
  }
  function collide(e){
    if(state.mode!=='playing')return;
    if(e.type==='candy'||e.type==='star'){
      if(state.boss&&e.type==='star'){
        music.star();state.score+=60;
        state.boss.bolts.push({x:e.x,y:e.y,life:1.15});
        emit(e.x,e.y,['#fff9c2','#ffb1e6','#b0fff4'],25,135,.72);
        floatText(e.x,e.y,'MAGIE ! ✨','#fff2a0');toast('✨ CHATOUILLE MAGIQUE !');hud();return;
      }
      if(state.boss&&e.type==='candy'){
        state.score+=15;music.pick();emit(e.x,e.y,['#ffe892','#ff9cc2'],12,100,.5);
        floatText(e.x,e.y,'+15','#ffe888');hud();return;
      }
      const val=e.type==='star'?3:1;state.candy+=val;
      const rapid=state.elapsed-state.lastCandy<2.5;state.combo=rapid?state.combo+1:1;
      state.lastCandy=state.elapsed;
      const points=(e.type==='star'?50:10)+(state.combo>=3?5:0);
      state.score+=points;music[e.type==='star'?'star':'pick']();
      emit(e.x,e.y,['#ffe892','#ff9cc2','#8af9df','#ffffff'],e.type==='star'?28:14,125,.67);
      floatText(e.x,e.y,(e.type==='star'?'+3 🍬 ':'+')+points,'#ffe888');
      if(e.type==='star')toast('ÉTOILE MAGIQUE ! ✨');else if(state.combo===4)toast('SUPER COMBO ! 🍭');
      hud();if(state.candy>=GOAL)completeLevel();
    } else if(e.type==='shield'){
      state.shield=isExpert()?6:8;music.shield();toast('BOUCLIER MAGIQUE ! 🛡️');emit(e.x,e.y,['#aafef3','#d1ffef','#72d8ff'],22,130,.75);
    } else if(e.type==='heart'){
      if(state.hearts<MAX_HEARTS){state.hearts++;music.star();toast('UN CŒUR RETROUVÉ ! 💗');hud();}
      else{state.score+=25;music.pick();floatText(e.x,e.y,'+25','#ffb4da');hud();}
      emit(e.x,e.y,['#ff9bcf','#ffe9ef','#fff6b4'],16,90,.6);
    } else if(e.type==='meteor')damage(e);
  }
  function update(dt){
    if(state.mode!=='playing'){
      for(const p of state.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}
      state.particles=state.particles.filter(p=>p.life>0);return;
    }
    state.left=Math.max(0,state.left-dt);state.elapsed+=dt;
    state.invuln=Math.max(0,state.invuln-dt);state.shield=Math.max(0,state.shield-dt);state.shake*=Math.max(0,1-dt*9);
    music.playMusic(dt);
    const p=state.player,before=p.x;const follow=1-Math.exp(-dt*13);
    p.x=ease(p.x,p.tx,follow);p.y=ease(p.y,p.ty,follow);
    p.x=clamp(p.x,32,W-32);p.y=clamp(p.y,H*.30,H-100);
    p.vx=(p.x-before)/Math.max(dt,.001);
    p.rot=ease(p.rot,clamp(p.vx/1250,-.37,.37),1-Math.exp(-dt*6));
    const level=LEVELS[state.level-1];
    if(state.elapsed>1){state.spawn-=dt;if(state.spawn<=0){spawnObject();state.spawn=rand(level.spawn*.78,level.spawn*1.20)/(isExpert()?1.16:1);}}
    if(level.pattern==='storm'||level.pattern==='zigzag'||(level.boss&&state.elapsed>15)){
      state.wave-=dt;if(state.wave<=0){spawnWave();state.wave=rand(isExpert()?5.5:7.5,isExpert()?7.5:10);}
    }
    if(Math.random()<Math.min(1,dt*25)){
      state.particles.push({x:p.x+rand(-7,7),y:p.y+36,vx:rand(-16,16),vy:rand(37,90),
        life:.35,max:.35,size:rand(2.5,6),color:pick(['#fdec8c','#ffb06c','#9de9f6']),kind:'circle',rot:0});
    }
    if(state.boss){const b=state.boss;
      b.x=W*.5+Math.sin(state.elapsed*(.95+level.sector*.065)) *Math.min(W*.24,100);
      b.hitTimer=Math.max(0,b.hitTimer-dt);
      b.nextStar-=dt;b.nextMeteor-=dt;
      if(b.nextStar<=0){spawnBossStar();b.nextStar=rand(2.4,3.2)*(isExpert()?1.1:1);}
      if(b.nextMeteor<=0){spawnBossJelly();if(b.hp<b.max*.5||isExpert())spawnBossJelly();b.nextMeteor=rand(1.3,2.15)/(1+level.sector*.023);}
      for(const bolt of b.bolts){const targetY=b.y+20;
        const dx=b.x-bolt.x,dy=targetY-bolt.y,len=Math.hypot(dx,dy)||1;
        let step=600*dt;
        if(len<=step+16){bolt.done=true;b.hp=Math.max(0,b.hp-1);b.hitTimer=.55;
          state.shake=3;music.zap();music.laugh();
          emit(b.x,b.y,['#ffe7a6','#f6a7fb','#9bfdea'],45,170,.85);
          floatText(b.x,b.y+48,'HÉ HÉ HÉ !','#fff8bf');hud();
          if(b.hp===0){if(state.level===LEVELS.length)finishBoss();else completeLevel();break;}
        }else{bolt.x+=dx/len*step;bolt.y+=dy/len*step;}
        bolt.life-=dt;if(bolt.life<=0)bolt.done=true;
      }
      b.bolts=b.bolts.filter(bolt=>!bolt.done);
    }
    if(state.mode!=='playing')return;
    for(const e of state.entities){
      e.y+=e.vy*dt;e.x+=e.vx*dt+Math.sin(state.elapsed*2+e.phase)*dt*11;
      if(e.type==='meteor'&&e.pattern==='zigzag')e.x+=Math.sin(state.elapsed*5.2+e.phase)*dt*68;
      if(e.type==='meteor'&&e.pattern==='chase'&&e.y<H*.51)e.x+=clamp(p.x-e.x,-1,1)*dt*(isExpert()?48:34);
      e.x=clamp(e.x,20,W-20);
      const pickup=e.type==='candy'||e.type==='star'||e.type==='heart'||e.type==='shield';
      if(hypot(e.x-p.x,e.y-p.y)<e.r+(pickup?39:23)){
        e.dead=true;collide(e);if(state.mode!=='playing')break;
      }
    }
    state.entities=state.entities.filter(e=>!e.dead&&e.y<H+70);
    for(const q of state.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=35*dt;q.life-=dt;q.rot+=dt*3;}
    state.particles=state.particles.filter(q=>q.life>0);
    for(const q of state.floatText){q.y-=38*dt;q.life-=dt;}
    state.floatText=state.floatText.filter(q=>q.life>0);
    if(state.left<=0&&state.mode==='playing')fail();
    hud();
  }
  function drawHeart(x,y,r,t){ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*2)*.13);
    glow(ctx,0,0,r*2.3,'rgba(255,128,183,.35)');ctx.fillStyle=gradient(ctx,0,-r,0,r,[[0,'#fff5da'],[.2,'#ffc5e1'],[.7,'#fa72a5'],[1,'#b63883']]);
    ctx.beginPath();ctx.moveTo(0,r*.87);ctx.bezierCurveTo(-r*.7,r*.25,-r*1.35,-r*.3,-r*.65,-r*.73);
    ctx.bezierCurveTo(-r*.2,-r,0,-r*.62,0,-r*.48);ctx.bezierCurveTo(r*.35,-r, r*1.12,-r*.75,r*.95,-r*.2);
    ctx.bezierCurveTo(r*.8,r*.3,r*.3,r*.64,0,r*.87);ctx.fill();ctx.restore();}
  function drawJelly(x,y,r,t){ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*6+x)*.18);
    glow(ctx,0,0,r*1.8,'rgba(255,132,198,.23)');ellipse(ctx,0,0,r,r*.87,radial(ctx,-r*.3,-r*.5,r*1.6,
      [[0,'#fff2c1'],[.23,'#ffbadb'],[.7,'#f67bab'],[1,'#a93c91']]));
    circle(ctx,-r*.28,-r*.12,r*.11,'#552559');circle(ctx,r*.28,-r*.12,r*.11,'#552559');
    ctx.strokeStyle='#552559';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,r*.06,r*.3,0,Math.PI);ctx.stroke();
    ellipse(ctx,-r*.57,r*.12,r*.16,r*.09,'#fff0e6a0');ellipse(ctx,r*.57,r*.12,r*.16,r*.09,'#fff0e6a0');ctx.restore();}
  // Original character, drawn with gradients and curves: the goofy final boss.
  function drawBoss(b,t){
    const sector=LEVELS[state.level-1].sector;
    const x=b.x,y=b.y+Math.sin(t*2.1)*5;
    ctx.save();ctx.filter=`hue-rotate(${sector*23}deg)`;ctx.translate(x,y);const scale=Math.min(1.04,W/390,clamp((H-275)/285,.52,1.04));ctx.scale(scale,scale);
    if(b.hitTimer>0){ctx.translate(Math.sin(t*61)*6,0);ctx.globalAlpha=.83;}
    glow(ctx,0,5,132,'rgba(255,138,229,.35)');glow(ctx,0,0,105,'rgba(166,103,255,.19)');
    ctx.save();ctx.rotate(t*.3);ctx.strokeStyle='#ffeacb77';ctx.lineWidth=2;ctx.setLineDash([7,13]);
    ctx.beginPath();ctx.arc(0,0,97,0,TAU);ctx.stroke();ctx.restore();
    // Marshmallow wings and waving arms.
    ellipse(ctx,-79,11,37,17,'#f2a9ef',-.47);ellipse(ctx,79,11,37,17,'#f2a9ef',.47);
    ellipse(ctx,-91,3,16,13,'#ffeaf1',-.4);ellipse(ctx,91,3,16,13,'#ffeaf1',.4);
    ctx.fillStyle=gradient(ctx,-60,-72,60,87,[[0,'#fffef1'],[.32,'#ffecf4'],[.76,'#efabef'],[1,'#a373d6']]);
    ctx.strokeStyle='#ffe6ff';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-67,14);ctx.bezierCurveTo(-71,-65,-36,-84,0,-84);
    ctx.bezierCurveTo(55,-84,75,-44,68,20);ctx.lineTo(65,70);
    ctx.quadraticCurveTo(54,92,40,71);ctx.quadraticCurveTo(28,92,15,76);
    ctx.quadraticCurveTo(0,102,-17,77);ctx.quadraticCurveTo(-36,100,-45,72);
    ctx.quadraticCurveTo(-61,92,-68,69);ctx.closePath();ctx.fill();ctx.stroke();
    // Whimsical candy crown and bright jewel.
    ctx.fillStyle='#fbdc6f';ctx.strokeStyle='#a8687d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-40,-68);
    ctx.lineTo(-45,-111);ctx.lineTo(-21,-93);ctx.lineTo(0,-128);ctx.lineTo(19,-93);ctx.lineTo(42,-111);
    ctx.lineTo(39,-67);ctx.closePath();ctx.fill();ctx.stroke();
    roundRect(ctx,-41,-78,81,14,5);ctx.fillStyle='#ff9b9f';ctx.fill();ctx.stroke();
    ctx.fillStyle='#78fff0';starPath(ctx,0,-100,11,5.5,5);ctx.fill();
    circle(ctx,-27,-93,5,'#ff94ca');circle(ctx,28,-93,5,'#ff94ca');
    // Expressions are oversized and friendly.
    ellipse(ctx,-25,-20,15,20,'#fffefa');ellipse(ctx,25,-20,15,20,'#fffefa');
    ellipse(ctx,-22,-16,7,12,'#593578');ellipse(ctx,28,-16,7,12,'#593578');
    circle(ctx,-25,-21,3.6,'#ffffff');circle(ctx,25,-21,3.6,'#ffffff');
    ellipse(ctx,-43,7,14,9,'#ff88ac8a');ellipse(ctx,44,7,14,9,'#ff88ac8a');
    ctx.fillStyle='#63317d';ctx.beginPath();ctx.ellipse(0,13,18,22,0,0,TAU);ctx.fill();
    ctx.fillStyle='#ffb3c9';ctx.beginPath();ctx.ellipse(0,24,12,8,0,0,Math.PI);ctx.fill();
    circle(ctx,-7,37,2.4,'#b97bc2');circle(ctx,10,41,3,'#b97bc2');
    ctx.fillStyle='#ffc1df';ctx.beginPath();ctx.moveTo(-2,57);ctx.lineTo(-24,48);ctx.lineTo(-21,70);
    ctx.lineTo(0,61);ctx.lineTo(21,70);ctx.lineTo(24,48);ctx.closePath();ctx.fill();circle(ctx,0,59,8,'#ffce70');
    if(b.hitTimer>0){ctx.fillStyle='#fff3ad';for(let i=0;i<5;i++){let a=t*3+i*TAU/5;
      starPath(ctx,Math.cos(a)*92,Math.sin(a)*75,7,3.4,5);ctx.fill();}}
    ctx.restore();
    // A different glowing magical insignia identifies each of the 14 themed bosses.
    ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
    const medal=SECTORS[sector].icon;
    glow(ctx,x,y+66,31,sector%2?'rgba(141,255,226,.27)':'rgba(255,193,135,.28)');
    ctx.font='24px "Apple Color Emoji","Segoe UI Emoji",sans-serif';ctx.fillText(medal,x,y+66);
    ctx.restore();
  }
  function drawMagicBolts(){if(!state.boss)return;
    for(const bolt of state.boss.bolts){ctx.save();glow(ctx,bolt.x,bolt.y,42,'rgba(255,229,115,.42)');
      ctx.fillStyle='#fff3a1';starPath(ctx,bolt.x,bolt.y,13,5.5,5,time*8);ctx.fill();
      circle(ctx,bolt.x,bolt.y,4,'#ffffff');ctx.restore();}
  }
  function drawEntities(){for(const e of state.entities){
      if(e.type==='candy')drawCandy(e.x,e.y,e.r,e.candyType,time,e.rot);
      else if(e.type==='meteor')e.jelly?drawJelly(e.x,e.y,e.r,time):drawMeteor(e.x,e.y,e.r,time,e.rot);
      else if(e.type==='star')drawStarReward(e.x,e.y,e.r,time);
      else if(e.type==='heart')drawHeart(e.x,e.y,e.r,time);
      else drawShield(e.x,e.y,e.r,time);
    }}
  function drawParticles(){for(const p of state.particles){ctx.save();ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;
      if(p.kind==='star'){ctx.translate(p.x,p.y);ctx.rotate(p.rot);starPath(ctx,0,0,p.size,p.size*.36,4);ctx.fill();}
      else circle(ctx,p.x,p.y,p.size*p.life/p.max+.3,p.color);ctx.restore();}
    ctx.save();ctx.font='1000 21px ui-rounded,"Trebuchet MS",sans-serif';ctx.textAlign='center';ctx.lineWidth=4;
    for(const q of state.floatText){ctx.globalAlpha=clamp(q.life/q.max,0,1);ctx.strokeStyle='#25113e';ctx.strokeText(q.text,q.x,q.y);ctx.fillStyle=q.color;ctx.fillText(q.text,q.x,q.y);}ctx.restore();}
  function draw(t){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.save();drawBackdrop(t);
    // Friendly Halloween creatures in the side lanes.
    if(state.mode==='playing'||state.mode==='paused'){
      drawGhost(W*.07,H*.39,.37,t,.48);drawGhost(W*.94,H*.71,.40,t+1.4,.48);
      drawBat(W*.12,H*.19,.38,t);
    }
    if(state.shake>0&&state.mode==='playing')ctx.translate(rand(-state.shake,state.shake),rand(-state.shake,state.shake));
    if(state.boss&&(state.mode==='playing'||state.mode==='paused'))drawBoss(state.boss,t);
    drawEntities();drawMagicBolts();drawHUDWorld();drawParticles();ctx.restore();}
  function tick(ts){if(!last)last=ts;const dt=Math.min((ts-last)/1000,.045);last=ts;
    time+=dt;update(dt);if(time>state.toastUntil)dom.toast.classList.remove('show');draw(time);
    requestAnimationFrame(tick);}
  function point(e){const b=stage.getBoundingClientRect();return{x:clamp(e.clientX-b.left,35,W-35),y:clamp(e.clientY-b.top-62,H*.29,H-105)};}
  // Finger is deliberately placed below the spaceship so it never hides the pilot.
  stage.addEventListener('pointerdown',e=>{if(state.mode!=='playing'||e.target.closest('button'))return;
    e.preventDefault();state.pointer=true;const p=point(e);state.player.tx=p.x;state.player.ty=p.y;
    try{stage.setPointerCapture(e.pointerId);}catch(_){};},{passive:false});
  stage.addEventListener('pointermove',e=>{if(state.mode!=='playing'||!state.pointer)return;
    e.preventDefault();const p=point(e);state.player.tx=p.x;state.player.ty=p.y;},{passive:false});
  const stopPointer=()=>{state.pointer=false;};
  stage.addEventListener('pointerup',stopPointer);stage.addEventListener('pointercancel',stopPointer);
  const keys=new Set();window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Escape'].includes(e.key))e.preventDefault();
    if(e.key==='Escape'||e.key===' '){if(state.mode==='playing'||state.mode==='paused')pause();return;}
    if(e.key==='Enter'&&state.mode==='menu'){levelMap();return;}
    keys.add(e.key.toLowerCase());});
  window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  // Smooth keyboard steering (laptop testing and alternative accessibility).
  const updateBase=update;
  update=function(dt){if(state.mode==='playing'&&!state.pointer){let dx=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0);
    let dy=(keys.has('arrowdown')||keys.has('s')?1:0)-(keys.has('arrowup')||keys.has('w')?1:0);
    if(dx||dy){state.player.tx=clamp(state.player.tx+dx*300*dt,32,W-32);state.player.ty=clamp(state.player.ty+dy*300*dt,H*.29,H-105);}}
    updateBase(dt);};
  $('prev-sector').addEventListener('click',()=>levelMap(state.mapSector-1));
  $('next-sector').addEventListener('click',()=>levelMap(state.mapSector+1));
  $('mode-aventure').addEventListener('click',()=>{setDifficulty('aventure');});
  $('mode-expert').addEventListener('click',()=>{setDifficulty('expert');});
  $('play').addEventListener('click',()=>levelMap(Math.floor((state.unlocked-1)/10)));$('levels-home').addEventListener('click',home);
  $('pause').addEventListener('click',pause);$('resume').addEventListener('click',pause);
  $('pause-home').addEventListener('click',levelMap);
  $('next-level').addEventListener('click',()=>startLevel(state.level+1,true));
  $('complete-levels').addEventListener('click',levelMap);
  $('replay').addEventListener('click',()=>startLevel(state.level));
  $('result-home').addEventListener('click',levelMap);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.mode==='playing')pause();last=performance.now();});
  window.addEventListener('blur',()=>{if(state.mode==='playing')pause();});
  window.addEventListener('resize',resize,{passive:true});
  resize();hud();requestAnimationFrame(tick);
  // Minimal read-only diagnostics for automated browser testing; not needed for gameplay.
  window.__COSMO_TEST__={state,spawnObject,spawnBossStar,spawnBossJelly,collide,fail,start:startLevel,
    startLevel,levelMap,completeLevel,finishBoss,home,resize,setDifficulty,LEVELS,SECTORS,get goal(){return GOAL;}};
})();
