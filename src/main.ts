import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import './style.css';
import { CATEGORIES, DEFAULT_CHARACTER, OATHS, PALETTES, PRESETS, SKINS, TRAITS, combinations, stats, tags, trait, type Category, type Character } from './content';
import { CONDITION_TEXT, LIMIT_MS, advanceTime, availableActions, choose, choices, createRun, deserialize, endTurn, endingText, enemyIntent, objectiveMet, preview, resolveAction, retreat, serialize, validateCharacter, type ActionId, type Point, type Run, type Stage } from './engine';
import {portrait,escapeHtml as esc} from './portrait';
import {ArchiveBoard} from './board';

const app=document.querySelector<HTMLDivElement>('#app')!;
const SAVE_KEY='manymade.archive.v1', BLUEPRINT_KEY='manymade.blueprint.v1';
let draft:Character={...DEFAULT_CHARACTER},run:Run|null=null,screen:'forge'|'journey'='forge';
let category:Category|'appearance'='body',selected:ActionId='move',target:Point|undefined;
let board:ArchiveBoard|undefined,help=false,pauseMenu=false,notice='',sound=false,audio:AudioContext|undefined;
let seed=new URLSearchParams(location.search).get('seed')?.slice(0,40)||'RAIN-17';
let lastTick=performance.now(),lastPersist=lastTick;
let storageAvailable=true;
try{
  const saved=localStorage.getItem(SAVE_KEY);
  if(saved){run=deserialize(saved);run.paused=true}
  const blueprint=localStorage.getItem(BLUEPRINT_KEY);
  if(blueprint)draft=validateCharacter(JSON.parse(blueprint));
}catch{notice='A saved file could not be read. You can start a new journey or import a backup.'}
function persist(){
  try{if(run)localStorage.setItem(SAVE_KEY,serialize(run))}
  catch{storageAvailable=false;notice='Browser storage is unavailable. Export your save from the pause menu to keep your journey.'}
}
function tone(kind:'click'|'action'|'end'='click'){
  if(!sound)return;
  try{
    audio??=new AudioContext();void audio.resume();
    const osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';
    osc.frequency.setValueAtTime(kind==='action'?220:kind==='end'?110:440,audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(kind==='action'?110:220,audio.currentTime+.2);
    gain.gain.setValueAtTime(.045,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.3);
    osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+.31);
  }catch{sound=false}
}
function remaining(s:Run){const secs=Math.max(0,Math.ceil((LIMIT_MS-s.elapsed)/1000));return Math.floor(secs/60).toString().padStart(2,'0')+':'+(secs%60).toString().padStart(2,'0')}
const icon=(name:string)=>({
  star:'✧',arrow:'↗',heart:'♡',focus:'◇',blade:'†',move:'↟',arc:'ϟ',kindle:'♨',bind:'❧',veil:'◌',command:'♜',mend:'✚',guard:'⬡',hook:'⤴',strike:'†',
}[name]||'✧');
function header(){
  const live=screen==='journey'&&run&&run.stage!=='ending';
  return `<header class="topbar"><button class="wordmark" data-action="home" aria-label="Manymade home"><span class="brand-seal">M</span><span>MANYMADE<small>A CITY OF BORROWED SOULS</small></span></button>
    <div class="edition">THE DROWNED ARCHIVE<span>PLAYABLE PROLOGUE · 01</span></div>
    <nav aria-label="Game controls"><button class="quiet" data-action="help">How to play</button><button class="sound-button" data-action="sound" aria-label="${sound?'Mute':'Enable'} sound">${sound?'♪ ON':'♪ OFF'}</button>${live?'<button class="quiet pause-button" data-action="pause">Ⅱ <span>Pause</span></button>':''}</nav></header>`;
}
function statbar(c:Character){
  const v=stats(c);
  return `<div class="stat-row"><div><span>♡</span><strong>${v.hp}</strong><small>VITALITY</small></div><div><span>◇</span><strong>${v.focus}</strong><small>FOCUS</small></div><div><span>†</span><strong>${v.power}</strong><small>STRIKE</small></div></div>`;
}
function forge(){
  const c=draft,combos=combinations(c);
  return `<main class="forge">
    <div class="forge-intro"><span class="eyebrow"><i></i> BEFORE THE LAST BELL</span><h1>Become someone<br> <em>impossible.</em></h1><p>Your body is a choice. Your past is negotiable.<br>What you do with them is yours.</p></div>
    <div class="forge-layout">
      <aside class="origin-column">
        <div class="section-label">01 / A PLACE TO BEGIN</div><h2>A borrowed shape</h2><p class="muted">Begin with an idea.<br>Change every part of it.</p>
        <div class="presets">${PRESETS.map((p,i)=>`<button class="preset ${CATEGORIES.every(k=>p.character[k.id]===c[k.id])?'active':''}" data-preset="${p.id}"><span class="preset-number">0${i+1}</span><span><strong>${p.name}</strong><small>${p.description}</small></span><span class="arrow">↗</span></button>`).join('')}</div>
        <div class="oath-block"><div class="section-label">02 / SOMETHING TO LIVE FOR</div><label for="oath">Your promise</label><select id="oath" data-field="oath">${Object.entries(OATHS).map(([id,o])=>`<option value="${id}" ${c.oath===id?'selected':''}>${o.name}</option>`).join('')}</select><p class="oath-description">“${OATHS[c.oath].description}”</p></div>
        <div class="mission-note"><span>✧</span><div><strong>One night. One stolen identity.</strong><p>A complete short mission with tactical combat, alternate routes, and consequences.</p></div></div>
      </aside>
      <section class="character-column" aria-label="Character preview">
        <div class="portrait-stage"><div class="halo halo-one"></div><div class="halo halo-two"></div><span class="portrait-coordinate">VESSEL / ${trait(c,'body').name.toUpperCase()}</span><div class="character-art">${portrait(c)}</div><div class="character-plinth"></div><span class="portrait-caption">A SOUL, ASSEMBLED</span></div>
        <div class="character-name"><h2>${esc(c.name||'Vesper')}</h2><span>${esc(c.pronouns)} · ${trait(c,'history').name}</span></div>
        ${statbar(c)}
        <div class="combo-summary"><div class="section-label">THE PARTS BECOME SOMETHING MORE</div>${combos.slice(0,2).map(x=>`<div class="combo"><span>✧</span><div><strong>${x.name}</strong><p>${x.description}</p></div></div>`).join('')}</div>
      </section>
      <section class="workbench" aria-label="Customize character">
        <div class="workbench-heading"><div><span class="section-label">03 / MAKE IT YOURS</span><h2>The making of you</h2></div><span class="tiny-seal">✧</span></div>
        <div class="trait-tabs" role="tablist" aria-label="Customization categories">${[...CATEGORIES.map(x=>({id:x.id,name:x.name})),{id:'appearance',name:'Appearance'}].map(x=>`<button role="tab" aria-selected="${category===x.id}" data-category="${x.id}" class="${category===x.id?'active':''}">${x.name}</button>`).join('')}</div>
        <div class="trait-content" role="tabpanel">${category==='appearance'?appearance():`<div class="trait-label">${CATEGORIES.find(k=>k.id===category)!.label}</div><div class="trait-options">${TRAITS[category].map(t=>`<button class="trait-option ${c[category as Category]===t.id?'chosen':''}" data-trait="${t.id}"><span class="radio-mark"></span><span><strong>${t.name}</strong><em>${t.subtitle}</em><small>${t.description}</small></span></button>`).join('')}</div>`}</div>
        <div class="build-tags">${[...tags(c)].map(t=>`<span>${t}</span>`).join('')}</div>
        <div class="embark"><label class="seed-field" for="seed">WORLD SEED<input id="seed" maxlength="40" value="${esc(seed)}" aria-label="World seed"><button data-action="random-seed" aria-label="Generate another world seed">↻</button></label>
        <button class="primary start-button" data-action="start">Enter the archive <span>↗</span></button><div class="embark-note">No account. Saves on this device. 45-minute active-play limit.</div>
        ${run?'<button class="resume-link" data-action="resume">Return to saved journey →</button>':''}</div>
      </section>
    </div>
    <footer class="forge-footer"><span>EVERY BODY TELLS A DIFFERENT STORY.</span><div><button data-action="import">Import journey</button><span>LOCAL PROTOTYPE · 0.1</span></div></footer>
  </main>`;
}
function appearance(){
  const c=draft;
  return `<div class="appearance-form"><div class="form-row"><label>Name<input data-field="name" maxlength="32" value="${esc(c.name)}"></label><label>Pronouns<input data-field="pronouns" maxlength="32" value="${esc(c.pronouns)}"></label></div>
    <div class="form-row"><label>Frame<select data-field="frame">${['slender','balanced','broad'].map(x=>`<option ${c.frame===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Hair<select data-field="hair">${['swept','shorn','crown'].map(x=>`<option ${c.hair===x?'selected':''}>${x}</option>`).join('')}</select></label></div>
    <label>Skin tone</label><div class="swatches">${SKINS.map((x,i)=>`<button aria-label="Skin tone ${i+1}" class="swatch ${c.skin===x?'selected':''}" style="--swatch:${x}" data-skin="${x}"></button>`).join('')}</div>
    <label>Cloth & accents</label><div class="swatches">${PALETTES.map(x=>`<button aria-label="${x.name}" title="${x.name}" class="swatch ${c.palette===x.id?'selected':''}" style="--swatch:${x.value}" data-palette="${x.id}"></button>`).join('')}</div>
    <p class="appearance-note">Your look belongs to you. Choose an <button data-category="sigil">inscription</button> to give your appearance a power—without restricting your identity.</p></div>`;
}
const SCENES:Record<string,{chapter:string;name:string;quote:string;text:string}> = {
  gate:{chapter:'I / THE THRESHOLD',name:'The archive remembers.',quote:'“Present your name. Present your purpose.”',text:'Two brass sentries watch the flooded steps. Beyond them, the archive holds every identity the city has ever taken. One of those names is why you came.'},
  sluice:{chapter:'II / THE FLOODLINE',name:'A river through the stacks.',quote:'The water is carrying whispers.',text:'The causeway has collapsed. A broken transformer turns the flood silver; on the far bank, a handful of people wait for someone who can make a way across.'},
  keeper:{chapter:'III / A SMALL MERCY',name:'The keeper is coming apart.',quote:'“I was supposed to remember all of them.”',text:'Under a fallen shelf, the keeper presses a hand against their broken brass heart. They still carry the archive’s seal. Helping them will cost something.'},
  ledger:{chapter:'IV / THE NAME VAULT',name:'What is worth carrying?',quote:'Every vessel contains a life that almost was.',text:'The shelves open. You can carry one record before the warden arrives. Each bears a shutdown key—but only one fulfills the promise that brought you here.'},
  escape:{chapter:'V / THE LAST DOOR',name:'The price of leaving.',quote:'“Nothing taken from this place belongs to you.”',text:'The Nameless Warden fills the archway. A thousand confiscated voices speak through its armor. What you became—and what you did here—will decide how you leave.'},
};
const STAGE_NAMES=['gate','sluice','keeper','ledger','escape'];
function profile(s:Run){
  const v=stats(s.character);
  return `<aside class="profile"><div class="small-portrait">${portrait(s.character)}</div><h2>${esc(s.character.name)}</h2><p class="profile-subtitle">${trait(s.character,'body').name} · ${trait(s.character,'history').name}</p>
    <div class="resource"><div><span>♡ Vitality</span><strong>${s.hp}<small> / ${v.hp}</small></strong></div><div class="meter"><i style="width:${s.hp/v.hp*100}%"></i></div></div>
    <div class="resource focus"><div><span>◇ Focus</span><strong>${s.focus}<small> / ${v.focus}</small></strong></div><div class="meter"><i style="width:${s.focus/v.focus*100}%"></i></div></div>
    <div class="promise"><span class="section-label">YOUR PROMISE</span><strong>${OATHS[s.character.oath].name}</strong><p>${OATHS[s.character.oath].description}</p></div>
    <div class="route"><span class="section-label">THROUGH THE ARCHIVE</span>${STAGE_NAMES.map((x,i)=>{const current=s.stage==='combat'?s.combat!.origin:s.stage,index=STAGE_NAMES.indexOf(current);return `<div class="route-step ${i===index?'current':i<index?'done':''}"><span>${i<index?'✓':('0'+(i+1))}</span>${['Threshold','Floodline','The keeper','Name vault','The last door'][i]}</div>`}).join('')}</div>
    <button class="text-button build-details" data-action="build">Inspect your making ↗</button></aside>`;
}
function timer(s:Run){
  return `<div class="run-strip"><div><span class="live-dot"></span><span>${CONDITION_TEXT[s.condition].name}</span><small>SEED ${esc(s.seed)}</small></div><div class="clock ${s.elapsed>=40*60*1000?'urgent':''}"><span>UNTIL THE LAST BELL</span><strong id="clock">${remaining(s)}</strong></div></div>`;
}
function story(s:Run){
  const scene=SCENES[s.stage],opts=choices(s),index=STAGE_NAMES.indexOf(s.stage);
  return `<div class="adventure-layout">${profile(s)}<section class="scene-column">
    <div class="scene-art scene-${s.stage}"><div class="scene-index">0${index+1}<span>/ 05</span></div><div class="scene-writing"><span class="eyebrow">${scene.chapter}</span><h1>${scene.name}</h1><blockquote>${scene.quote}</blockquote><p>${scene.text}</p></div></div>
    ${journal(s)}
    </section><section class="decision-column"><div class="section-label">THE WORLD ANSWERS WHAT YOU ARE</div><h2>Your way through</h2><p class="decision-intro">${s.stage==='ledger'?'One record. An irreversible choice for this run.':'Your choices reveal the character you made.'}</p>
    <div class="choices">${opts.map(o=>`<button data-choice="${o.id}" class="choice ${o.enabled?'':'locked'}" ${o.enabled?'':'disabled'}><div class="choice-title"><span>${o.enabled?'↗':'◌'}</span><strong>${o.title}</strong></div><p>${o.description}</p><small>${o.enabled?o.effect:o.reason}</small></button>`).join('')}</div>
    <div class="condition-note"><span>✧</span><p>${CONDITION_TEXT[s.condition].description}</p></div></section></div>`;
}
function journal(s:Run){
  return `<div class="journal"><div class="section-label">THE THREAD SO FAR</div><div aria-live="polite">${s.log.slice(0,3).map((l,i)=>`<p class="${i===0?'latest':''}"><span>${i===0?'◆':'·'}</span>${esc(l)}</p>`).join('')}</div></div>`;
}
function battle(s:Run){
  const b=s.combat!,actions=availableActions(s);
  const selectedAction=actions.find(a=>a.id===selected)||actions[0];
  selected=selectedAction.id;
  const pv=preview(s,selected,selectedAction.target==='self'?undefined:target);
  return `<div class="adventure-layout combat-layout">${profile(s)}<section class="battle-column">
    <div class="battle-heading"><div><span class="section-label">${b.origin==='gate'?'THE THRESHOLD':'THE LAST DOOR'} / ENCOUNTER</span><h1>${b.origin==='gate'?'Orders written in brass.':'The Nameless Warden.'}</h1></div><div class="round">ROUND<strong>${b.round.toString().padStart(2,'0')}</strong></div></div>
    <div class="battlefield-frame"><div id="battlefield" aria-label="Isometric tactical battlefield"></div><div class="battle-hint">${selectedAction.target==='self'?'Review the effect, then confirm.':'Choose '+(selectedAction.target==='tile'?'a highlighted tile':'an enemy')+' to preview your action.'}</div></div>
    <div class="action-tray"><div class="action-tray-label"><span>YOUR TURN</span><strong>${b.ap} <small>/ 2 ACTIONS</small></strong></div><div class="action-buttons">${actions.map(a=>`<button class="combat-action ${selected===a.id?'active':''}" data-combat-action="${a.id}" aria-pressed="${selected===a.id}" title="${esc(a.description)}" ${b.ap<1||s.focus<a.cost?'disabled':''}><span>${icon(a.id)}</span><strong>${a.name}</strong><small>${a.cost?'◇ '+a.cost:'FREE'}</small></button>`).join('')}</div></div>
    <details class="keyboard-map"><summary>Keyboard-accessible map & target controls</summary><p>Columns run west to east, rows north to south. Choose an action above, then a cell.</p><div class="accessible-grid" style="--cols:9">${Array.from({length:63},(_,i)=>{const x=i%9,y=Math.floor(i/9),enemy=b.enemies.find(e=>e.hp>0&&e.x===x&&e.y===y),wall=b.walls.some(w=>w.x===x&&w.y===y),player=b.player.x===x&&b.player.y===y;return `<button data-cell="${x},${y}" aria-label="Column ${x+1}, row ${y+1}${enemy?', '+enemy.name:player?', you':wall?', pillar':''}" ${wall?'disabled':''}>${enemy?'†':player?'●':wall?'▪':(x+1)+','+(y+1)}</button>`}).join('')}</div></details>
    ${journal(s)}
    </section><section class="combat-sidebar"><div class="section-label">INTENTIONS ARE VISIBLE</div><h2>Read the room</h2><div class="enemy-list">${b.enemies.map(e=>`<button class="enemy-card ${e.hp<=0?'defeated':''}" data-cell="${e.x},${e.y}" ${e.hp<=0?'disabled':''}><div><strong>${e.name}</strong><span>${e.hp} / ${e.maxHp} ♡</span></div><p>${enemyIntent(s,e)}</p><small>${e.conductive?'Conductive armor':'Unarmored'}${e.root?' · Rooted':''}${e.burn?' · Burning':''}</small></button>`).join('')}</div>
    <div class="action-preview" aria-live="polite"><div class="section-label">${selectedAction.name.toUpperCase()} / PREVIEW</div><p>${selectedAction.description}</p><div class="preview-result ${pv.valid?'valid':''}">${pv.valid?pv.text:target||selectedAction.target==='self'?pv.text:'Select a target to see the exact result.'}</div>
    <button class="primary" data-action="confirm-action" ${pv.valid?'':'disabled'}>Confirm ${selectedAction.name.toLowerCase()} <span>↗</span></button></div>
    <button class="secondary end-turn" data-action="end-turn">End turn <span>→</span></button><p class="turn-note">Enemies act, then recover ${s.condition==='fading'?2:1} focus and 2 actions.</p>
    <button class="text-button retreat" data-action="retreat">Retreat · lose up to 2 vitality</button>
    </section></div>`;
}
function ending(s:Run){
  const e=endingText(s),success=objectiveMet(s),escaped=!['fallen','bell'].includes(s.ending||'');
  return `<main class="ending-screen"><div class="ending-art"></div><div class="ending-content"><span class="eyebrow">THE DROWNED ARCHIVE / EPILOGUE</span><div class="ending-symbol">${escaped?'✧':'◌'}</div><h1>${e.title}</h1><p class="ending-prose">${e.text}</p>
    <div class="ending-verdict"><span>${success?'PROMISE KEPT':escaped?'A DIFFERENT ENDING':'PROMISE UNFINISHED'}</span><h2>${OATHS[s.character.oath].name}</h2><p>${success?(s.character.oath==='rescue'?'Mara speaks her own name again. She remembers the sea.':s.character.oath==='reclaim'?'Your first memory returns. What you become next is finally your choice.':'By morning, the city will know whose lives paid for its perfection.'):(escaped?'You left with something—but not the record you promised to bring home.':'The name you came for remains inside. Another shape, another approach, another chance.')}</p></div>
    <div class="ending-receipts"><div><span>THE KEEPER</span><strong>${s.flags.includes('seal')?'A mercy remembered':'Left behind'}</strong></div><div><span>THE STRANDED</span><strong>${s.flags.includes('stranded')?'A living way home':'Still waiting'}</strong></div><div><span>YOUR PATH</span><strong>${s.flags.includes('entry-fight')?'Through the sentries':'Around the sentries'}</strong></div></div>
    <div class="ending-stats"><span>${esc(s.character.name)} · ${trait(s.character,'body').name}</span><span>${Math.max(1,Math.ceil(s.elapsed/60000))} MIN · ${s.turns} DECISIONS</span></div>
    <div class="ending-actions"><button class="primary" data-action="another">Become someone else <span>↗</span></button><button class="secondary" data-action="copy-seed">Copy this world’s link</button></div><p class="muted ending-footnote">This is the first complete mission. The wider city is still to come.</p></div></main>`;
}
function helpDialog(){
  return `<div class="overlay" role="dialog" aria-modal="true" aria-label="How to play"><div class="modal help-modal"><button class="modal-close" data-action="close-help" aria-label="Close help">×</button><span class="eyebrow">A FEW THINGS WORTH REMEMBERING</span><h2>Make your own way.</h2><div class="help-grid"><div><h3>Keep your promise</h3><p>Your chosen oath tells you which record to take from the archive. Reach the final door with it and find a way out.</p></div><div><h3>Use what you are</h3><p>Body, blood, voice, history, weapon, and inscription grant actions and story routes. Locked choices explain what would make them possible.</p></div><div><h3>Two actions. Then theirs.</h3><p>Move or use an ability, up to twice. Select a target on the map or enemy list, review the preview, then confirm. End turn lets enemies act.</p></div><div><h3>Read the intentions</h3><p>Enemies show whether they will attack or advance. Guard reduces damage and restores focus. Focus also returns each round. Water carries electricity.</p></div><div><h3>The last bell</h3><p>The journey has a 45-minute active-play limit. At 40 minutes the warden finds you; at 45 the archive seals. Character creation is untimed in this prologue. Pause hides the encounter and freezes time.</p></div><div><h3>Your journey stays here</h3><p>Progress saves after every action. Use the pause menu to export a backup or import one. Audio is optional. Keyboard map controls are below the battlefield.</p></div></div><button class="primary" data-action="close-help">Understood <span>↗</span></button></div></div>`;
}
function pauseDialog(s:Run){
  return `<div class="overlay pause-overlay" role="dialog" aria-modal="true" aria-label="Journey paused"><div class="modal pause-modal"><span class="eyebrow">THE CITY CAN WAIT</span><h2>A moment between bells.</h2><p>Your journey is paused. ${remaining(s)} remain.</p><button class="primary" data-action="unpause">Return to the archive <span>↗</span></button><div class="pause-tools"><button class="secondary" data-action="export">Export save</button><button class="secondary" data-action="import">Import save</button><button class="secondary" data-action="copy-seed">Copy world link</button><button class="secondary" data-action="forge-return">Character workshop</button></div><p class="muted">${storageAvailable?'Your progress is saved in this browser.':'Local saving is unavailable. Export a backup before leaving.'}</p></div></div>`;
}
let buildOpen=false;
function buildDialog(s:Run){
  return `<div class="overlay" role="dialog" aria-modal="true" aria-label="Your character build"><div class="modal"><button class="modal-close" data-action="close-build" aria-label="Close build">×</button><span class="eyebrow">THE MAKING OF ${esc(s.character.name.toUpperCase())}</span><h2>More than the sum.</h2><div class="build-inventory">${CATEGORIES.map(k=>`<div><span>${k.name}</span><strong>${trait(s.character,k.id).name}</strong><p>${trait(s.character,k.id).description}</p></div>`).join('')}</div>${combinations(s.character).map(c=>`<div class="combo"><span>✧</span><div><strong>${c.name}</strong><p>${c.description}</p></div></div>`).join('')}</div></div>`;
}
function render(){
  const keepBoard=screen==='journey'&&run?.stage==='combat'&&!run.paused&&!help&&!buildOpen;
  const oldBoard=document.querySelector<HTMLElement>('#battlefield');
  if(keepBoard&&board&&oldBoard)oldBoard.remove();
  else if(board){board.destroy();board=undefined}
  app.innerHTML=header()+(screen==='forge'?forge():run?run.stage==='ending'?ending(run):`<main class="journey">${timer(run)}${run.paused?'<div class="paused-backdrop"></div>':run.stage==='combat'?battle(run):story(run)}</main>`:'')+
    (notice?`<div class="toast" role="status">${esc(notice)}<button data-action="dismiss" aria-label="Dismiss notice">×</button></div>`:'')+
    (help?helpDialog():buildOpen&&run?buildDialog(run):screen==='journey'&&run?.paused?pauseDialog(run):'')+
    '<input type="file" id="import-file" accept=".json,application/json" hidden>';
  if(keepBoard){
    const parent=document.querySelector<HTMLElement>('#battlefield')!;
    if(board&&oldBoard){parent.replaceWith(oldBoard);board.update(run!,selected,target)}
    else board=new ArchiveBoard(parent,run!,selected,p=>{target=p;render()});
  }
}
function commit(next:Run){
  const prev=run?.stage;run=next;target=undefined;if(prev!==run.stage)selected='move';
  persist();render();if(prev!==run.stage)window.scrollTo(0,0);tone(run.stage==='ending'?'end':'action');
}
function setPause(paused:boolean){if(run&&run.stage!=='ending'){run.paused=paused;lastTick=performance.now();persist()}}
function download(){
  if(!run)return;
  const url=URL.createObjectURL(new Blob([serialize(run)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='manymade-'+run.seed.replace(/[^a-z0-9-]/gi,'_')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function copySeed(){
  const url=new URL(location.href);url.search='';url.searchParams.set('seed',run?.seed||seed);
  try{await navigator.clipboard.writeText(url.href);notice='World link copied. The same seed recreates the same conditions.'}
  catch{notice='World seed: '+(run?.seed||seed)+'. Enter it in the character workshop to replay.'}
  render();
}
app.addEventListener('click',event=>{
  const button=(event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if(!button||button.disabled)return;
  try{
    if(button.dataset.preset){draft={...PRESETS.find(p=>p.id===button.dataset.preset)!.character};render();tone();return}
    if(button.dataset.category){category=button.dataset.category as Category|'appearance';render();return}
    if(button.dataset.trait&&category!=='appearance'){draft[category]=button.dataset.trait;render();tone();return}
    if(button.dataset.skin){draft.skin=button.dataset.skin;render();return}
    if(button.dataset.palette){draft.palette=button.dataset.palette;render();return}
    if(button.dataset.choice&&run){commit(choose(run,button.dataset.choice));return}
    if(button.dataset.combatAction){selected=button.dataset.combatAction as ActionId;target=undefined;render();return}
    if(button.dataset.cell){const [x,y]=button.dataset.cell.split(',').map(Number);target={x,y};render();return}
    switch(button.dataset.action){
      case 'start':
        if(run&&run.stage!=='ending'&&!confirm('Start a new journey? This replaces your current saved run. Export it from the pause menu first if you want to keep it.'))return;
        run=createRun(draft,seed);screen='journey';selected='move';lastTick=performance.now();
        try{localStorage.setItem(BLUEPRINT_KEY,JSON.stringify(draft))}catch{storageAvailable=false}
        persist();render();window.scrollTo(0,0);tone('action');break;
      case 'resume':if(run){screen='journey';setPause(false);render();window.scrollTo(0,0)}break;
      case 'home':case 'forge-return':setPause(true);screen='forge';pauseMenu=false;help=false;buildOpen=false;render();break;
      case 'pause':setPause(true);render();break;
      case 'unpause':setPause(false);render();break;
      case 'help':help=true;setPause(true);render();focusDialog();break;
      case 'close-help':help=false;render();break;
      case 'build':buildOpen=true;setPause(true);render();focusDialog();break;
      case 'close-build':buildOpen=false;render();break;
      case 'sound':sound=!sound;tone();render();break;
      case 'confirm-action':if(run)commit(resolveAction(run,selected,target).state);break;
      case 'end-turn':if(run)commit(endTurn(run));break;
      case 'retreat':if(run&&confirm('Withdraw from this encounter? Lose up to 2 vitality and raise the alarm.'))commit(retreat(run));break;
      case 'export':download();break;
      case 'import':document.querySelector<HTMLInputElement>('#import-file')!.click();break;
      case 'copy-seed':void copySeed();break;
      case 'another':if(run)draft={...run.character};screen='forge';category='body';render();window.scrollTo(0,0);break;
      case 'random-seed':seed='RAIN-'+crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().slice(0,5);render();break;
      case 'dismiss':notice='';render();break;
    }
  }catch(error){notice=(error as Error).message;render()}
});
app.addEventListener('input',event=>{
  const input=event.target as HTMLInputElement;
  if(input.id==='seed')seed=input.value;
  if(input.dataset.field==='name'||input.dataset.field==='pronouns'){
    draft[input.dataset.field]=input.value;
    const name=document.querySelector('.character-name h2'),identity=document.querySelector('.character-name>span');
    if(name)name.textContent=draft.name||'Vesper';
    if(identity)identity.textContent=draft.pronouns+' · '+trait(draft,'history').name;
  }
});
app.addEventListener('change',async event=>{
  const input=event.target as HTMLInputElement;
  if(input.id==='import-file'&&input.files?.[0]){
    try{
      if(input.files[0].size>200000)throw new Error('Save file is too large.');
      const imported=deserialize(await input.files[0].text());
      if(run&&run.stage!=='ending'&&!confirm('Replace the current journey with this imported save?'))return;
      run=imported;run.paused=true;screen='journey';help=false;buildOpen=false;notice='Journey imported. Resume whenever you are ready.';persist();render();
    }catch(error){notice='Could not import: '+(error as Error).message;render()}return;
  }
  if(input.dataset.field){
    if(input.dataset.field==='name'||input.dataset.field==='pronouns')return;
    draft={...draft,[input.dataset.field]:input.value};render();
  }
});
function focusDialog(){setTimeout(()=>document.querySelector<HTMLButtonElement>('.modal button')?.focus(),0)}
document.addEventListener('keydown',event=>{
  const dialog=document.querySelector<HTMLElement>('[role="dialog"]');
  if(event.key==='Escape'){
    if(help){help=false;render()}else if(buildOpen){buildOpen=false;render()}else if(screen==='journey'&&run?.stage!=='ending'){setPause(!run?.paused);render()}return;
  }
  if(event.key==='Tab'&&dialog){
    const focusable=[...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,a[href]')];
    const first=focusable[0],last=focusable.at(-1);
    if(event.shiftKey&&document.activeElement===first){last?.focus();event.preventDefault()}
    else if(!event.shiftKey&&document.activeElement===last){first?.focus();event.preventDefault()}
  }
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&screen==='journey'&&run?.stage!=='ending'){setPause(true);render()}lastTick=performance.now()});
window.addEventListener('pagehide',persist);
setInterval(()=>{
  const now=performance.now(),delta=now-lastTick;lastTick=now;
  if(screen!=='journey'||!run||run.paused||run.stage==='ending')return;
  const previous=run.stage;run=advanceTime(run,delta);
  if(previous!==run.stage){persist();render()}
  else{const clock=document.querySelector('#clock');if(clock)clock.textContent=remaining(run)}
  if(now-lastPersist>5000){persist();lastPersist=now}
},250);
render();
