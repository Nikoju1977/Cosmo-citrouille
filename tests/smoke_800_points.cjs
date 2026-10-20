'use strict';
const fs=require('node:fs'), path=require('node:path'),vm=require('node:vm'), assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../www/game.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../www/index.html'),'utf8');
assert(html.includes('0/800'), 'L\'affichage des points doit démarrer à 0/800.');
const storage=new Map([['cosmo-unlocked','140'],['cosmo-sound','off']]);
const elements=new Map();
const gradient={addColorStop(){}};
const ctx=new Proxy({}, {get(o,k){if(k==='createLinearGradient'||k==='createRadialGradient')return()=>gradient;
 if(k==='measureText')return()=>({width:30});
 if(k==='getImageData')return()=>({data:new Uint8ClampedArray(4)});
 return o[k]??(()=>{});},set(o,k,v){o[k]=v;return true;}});
function element(id){if(!elements.has(id))elements.set(id,{
 id,style:{setProperty(){}},classList:{toggle(){},add(){},remove(){}},dataset:{},
 textContent:'',innerHTML:'',disabled:false,
 getContext(){return ctx;},getBoundingClientRect(){return {width:390,height:844,left:0,top:0};},
 addEventListener(){},setAttribute(){},appendChild(){},setPointerCapture(){},closest(){return null;}
});return elements.get(id);}
const document={getElementById:element,querySelector:element,
 createElement(tag){return element('created-'+tag+Math.random());},addEventListener(){}};
const window={devicePixelRatio:1,addEventListener(){},performance:{now:()=>100}};
let callback=null,last=0;
const sandbox={window,document,navigator:{vibrate:null},performance:window.performance,
 localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))},
 console,requestAnimationFrame:cb=>{callback=cb;}};
vm.createContext(sandbox);
vm.runInContext(source,sandbox,{filename:'www/game.js'});
const t=window.__COSMO_TEST__;
assert(t, 'Interface de diagnostic absente');
const tick=(n=1)=>{for(let i=0;i<n;i++){last+=16;callback(last);}};
assert.equal(t.LEVELS.length,140);
assert.equal(t.LEVELS.filter(l=>l.boss).length,14);
assert(t.LEVELS.every(l=>l.goal===800&&l.seconds===120));
for(let n=1;n<=140;n++){
 t.startLevel(n);
 assert.equal(t.state.level,n);
 assert.equal(t.state.score,0);
 assert.equal(t.state.left,120);
 assert.equal(t.state.boss?.hp,t.LEVELS[n-1].bossHp||undefined);
}
t.startLevel(1);
t.state.score=775;t.state.combo=0;
t.collide(t.spawnObject('candy'));
assert.equal(t.state.score,800);
assert.equal(t.state.mode,'complete');
assert(t.state.unlocked>=2,'Le monde suivant doit se débloquer');
t.startLevel(2,true);
assert.equal(t.state.score,0,'Remise à zéro des points entre niveaux');
t.state.left=.01;tick(3);
assert.equal(t.state.mode,'over','Fin de temps = échec');
t.startLevel(10);
assert.equal(t.state.boss.hp,6);
t.state.score=800;t.collide(t.spawnObject('candy'));
assert.equal(t.state.mode,'playing','800 pts seuls ne suffisent pas contre un boss');
t.state.boss.hp=1;
let e=t.spawnObject('star');e.x=t.state.boss.x;e.y=t.state.boss.y+20;
t.collide(e);tick(5);
assert.equal(t.state.mode,'complete','Boss vaincu et 800 points = victoire');
t.startLevel(10);
t.state.score=100;t.state.boss.hp=1;
e=t.spawnObject('star');e.x=t.state.boss.x;e.y=t.state.boss.y+20;t.collide(e);tick(5);
assert.equal(t.state.mode,'playing','Boss vaincu sans les 800 points ne suffit pas');
assert(t.state.boss.defeated,'Le boss doit être marqué vaincu');
t.state.score=785;t.collide(t.spawnObject('candy'));
assert.equal(t.state.mode,'complete','800 points après le boss = victoire');
t.startLevel(140);
assert.equal(t.state.score,0);
assert.equal(t.state.boss.hp,12);
t.state.score=800;t.state.boss.hp=1;
e=t.spawnObject('star');e.x=t.state.boss.x;e.y=t.state.boss.y+20;t.collide(e);tick(5);
assert.equal(t.state.mode,'over','Le dernier boss conclut les 140 mondes');
assert.equal(t.state.completedFinal,true);
console.log('SUCCÈS : 140 mondes, 14 boss, 800 points, 120 s, sauvegarde, progression et final.');
