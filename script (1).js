const startBtn=document.getElementById('start')
const pauseBtn=document.getElementById('pause')
const statusEl=document.getElementById('status')
const counts1=document.getElementById('counts1')
const counts2=document.getElementById('counts2')
const bar1=document.getElementById('bar1')
const bar2=document.getElementById('bar2')
const prog1=document.getElementById('prog1')
const prog2=document.getElementById('prog2')
const overlay=document.getElementById('overlay')
const overlayTitle=document.getElementById('overlayTitle')
const overlayImg=document.getElementById('overlayImg')
const finalEl=document.getElementById('final')
const ovRetry=document.getElementById('ovRetry')
const bgm=document.getElementById('bgm')
const wg=document.getElementById('wordgame')
const wgTotal=document.getElementById('wgTotal')
const wgTurn=document.getElementById('wgTurn')
const wgPlayer=document.getElementById('wgPlayer')
const wgLast=document.getElementById('wgLast')
const wgText=document.getElementById('wgText')
const wgSubmit=document.getElementById('wgSubmit')
const wgP1=document.getElementById('wgP1')
const wgP2=document.getElementById('wgP2')
const char1=document.getElementById('char1')
const char2=document.getElementById('char2')
const blocks1=document.getElementById('blocks1')
const blocks2=document.getElementById('blocks2')

const types=[
  {key:'sand',name:'모래',ms:1200,count:7},
  {key:'dirt',name:'흙',ms:2000,count:6},
  {key:'stone',name:'돌',ms:3000,count:5},
  {key:'obsidian',name:'흑요석',ms:4000,count:4}
]

function makePlayer(){return{counts:Object.fromEntries(types.map(t=>[t.key,t.count])),mining:null,progress:0,total:types.reduce((a,t)=>a+t.count,0),elapsed:0,timer:null,bar:null,progEl:null,countsEl:null,words:0}}
const p=[makePlayer(),makePlayer()]
p[0].bar=bar1;p[1].bar=bar2;p[0].progEl=prog1;p[1].progEl=prog2;p[0].countsEl=counts1;p[1].countsEl=counts2
let running=false
let startTs
let rafId
let miniActive=false
let miniTotalId
let miniTurnId
let miniTurnLeft=7
let miniTotalLeft=90
let miniTurn=0
let lastWord='가'
let seq=[[],[]]

function renderCounts(){for(let i=0;i<2;i++){const s=p[i].counts;p[i].countsEl.textContent=`모래 ${s.sand} · 흙 ${s.dirt} · 돌 ${s.stone} · 흑요석 ${s.obsidian} / 총 ${p[i].progress}/${p[i].total}`};updateChars()}
function setStatus(t){statusEl.textContent=t}
function updateBars(){for(let i=0;i<2;i++){const b=p[i].bar;b.style.width=p[i].mining?`${p[i].mining.percent||0}%`:'0%';p[i].progEl.textContent=p[i].mining?`채광 중: ${p[i].mining.name}`:''};updateChars()}
function updateChars(){const r0=p[0].progress/p[0].total*100;const r1=p[1].progress/p[1].total*100;char1.style.left=`${r0}%`;char2.style.left=`${r1}%`}
function canMine(i,key){return running&&!miniActive&&!p[i].mining&&p[i].counts[key]>0}
function beginMine(i,key){if(!canMine(i,key))return;const type=types.find(t=>t.key===key);const st=Date.now();p[i].mining={key:type.key,ms:type.ms,start:st,percent:0,name:type.name};
  const target=seq[i].find(b=>b.key===key&&!b.broken&&!b.locked)
  if(target){target.locked=true;target.el.classList.add('breaking')}
  tickMine()
}
function tickMine(){cancelAnimationFrame(rafId);rafId=requestAnimationFrame(()=>{let cont=false;for(let i=0;i<2;i++){const m=p[i].mining;if(m){const dt=Date.now()-m.start;m.percent=Math.min(100,dt/m.ms*100);if(dt>=m.ms){completeMine(i)}else{cont=true;const t=seq[i].find(b=>b.key===m.key&&b.locked&&!b.broken);if(t){t.el.querySelector('.hp').style.width=`${m.percent}%`}}}}updateBars();if(cont)tickMine()})}
function completeMine(i){const m=p[i].mining;if(!m)return;p[i].mining=null;p[i].counts[m.key]-=1;p[i].progress+=1;renderCounts();updateBars();checkMid();checkWin();
  const t=seq[i].find(b=>b.key===m.key&&b.locked&&!b.broken);if(t){t.broken=true;t.locked=false;t.el.querySelector('.hp').style.width='100%';t.el.classList.remove('breaking');t.el.classList.add('broken')}
}
function checkWin(){for(let i=0;i<2;i++){if(p[i].progress>=p[i].total){finish(i);return}}}
function finish(i){running=false;setStatus(`플레이어 ${i+1} 도착`);if(bgm)bgm.pause();if(overlayTitle)overlayTitle.textContent=`플레이어 ${i+1} 승리`;if(overlayImg)overlayImg.style.display='block';if(finalEl)finalEl.textContent=`P1 ${p[0].progress}/${p[0].total} · P2 ${p[1].progress}/${p[1].total}`;if(overlay)overlay.classList.remove('hidden')}
function heavyKeys(){return ['obsidian','stone','dirt','sand']}
function applyBonus(i){const order=heavyKeys();let removed=0;for(let k of order){while(p[i].counts[k]>0&&removed<2){p[i].counts[k]-=1;p[i].progress+=1;removed+=1;const t=seq[i].find(b=>b.key===k&&!b.broken);if(t){t.broken=true;t.el.classList.add('broken');t.el.querySelector('.hp').style.width='100%'}}}renderCounts()}
function checkMid(){if(miniActive)return;const half=Math.floor(types.reduce((a,t)=>a+t.count,0)/2);if(p[0].progress>=half||p[1].progress>=half){startMini()}}
function startMini(){miniActive=true;running=false;wg.classList.remove('hidden');miniTotalLeft=90;miniTurnLeft=7;miniTurn=0;lastWord='가';wgLast.textContent=lastWord;wgP1.textContent='0';wgP2.textContent='0';wgPlayer.textContent='플레이어 1';setStatus('끝말잇기');if(miniTotalId)clearInterval(miniTotalId);if(miniTurnId)clearInterval(miniTurnId);miniTotalId=setInterval(()=>{miniTotalLeft-=1;wgTotal.textContent=String(miniTotalLeft);if(miniTotalLeft<=0){endMini(compareWords())}},1000);miniTurnId=setInterval(()=>{miniTurnLeft-=1;wgTurn.textContent=String(miniTurnLeft);if(miniTurnLeft<=0){endMini(1-miniTurn)}},1000)}
function compareWords(){return p[0].words===p[1].words?null:(p[0].words>p[1].words?0:1)}
function endMini(winner){clearInterval(miniTotalId);clearInterval(miniTurnId);miniActive=false;wg.classList.add('hidden');if(winner===null){running=true;setStatus('재개');return}applyBonus(winner);p[0].words=0;p[1].words=0;renderCounts();running=true;setStatus(`플레이어 ${winner+1} 보너스`)}
function submitWord(){const txt=wgText.value.trim();if(!txt)return;const ok=txt[0]===lastWord[lastWord.length-1];if(!ok){endMini(1-miniTurn);return}lastWord=txt;wgLast.textContent=lastWord;wgText.value='';p[miniTurn].words+=1;const v0=p[0].words;const v1=p[1].words;wgP1.textContent=String(v0);wgP2.textContent=String(v1);miniTurn=1-miniTurn;miniTurnLeft=7;wgTurn.textContent='7';wgPlayer.textContent=`플레이어 ${miniTurn+1}`}

function reset(){for(let i=0;i<2;i++){p[i]=makePlayer()}p[0].bar=bar1;p[1].bar=bar2;p[0].progEl=prog1;p[1].progEl=prog2;p[0].countsEl=counts1;p[1].countsEl=counts2;renderCounts();updateBars();updateChars();setStatus('대기');wg.classList.add('hidden');if(overlay)overlay.classList.add('hidden');buildBlocks(0,blocks1);buildBlocks(1,blocks2)}
function start(){if(running)return;running=true;setStatus('진행 중');if(bgm){bgm.currentTime=0;bgm.play().catch(()=>{})}}
function pause(){running=false;setStatus('일시정지');if(bgm)bgm.pause()}

startBtn.addEventListener('click',()=>{reset();start()})
pauseBtn.addEventListener('click',()=>{pause()})
ovRetry.addEventListener('click',()=>{if(overlay)overlay.classList.add('hidden');reset()})
document.querySelectorAll('.buttons button').forEach(btn=>{btn.addEventListener('click',()=>{beginMine(Number(btn.getAttribute('data-p')),btn.getAttribute('data-type'))})})
wgSubmit.addEventListener('click',()=>{submitWord()})
wgText.addEventListener('keydown',e=>{if(e.key==='Enter'){submitWord()}})

reset()
function buildBlocks(i,container){seq[i]=[];container.innerHTML='';const order=[{key:'sand',count:7},{key:'dirt',count:6},{key:'stone',count:5},{key:'obsidian',count:4}];for(let item of order){for(let c=0;c<item.count;c++){const el=document.createElement('div');el.className=`blk ${item.key}`;const hp=document.createElement('div');hp.className='hp';el.appendChild(hp);container.appendChild(el);seq[i].push({key:item.key,broken:false,locked:false,el})}}}
