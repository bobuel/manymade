import { CATEGORIES, DEFAULT_CHARACTER, OATHS, PALETTES, SKINS, TRAITS, stats, tags, trait, type Character, type Tag } from './content';

export type Stage = 'gate'|'sluice'|'keeper'|'ledger'|'escape'|'combat'|'ending';
export type ActionId = 'move'|'strike'|'arc'|'kindle'|'bind'|'veil'|'command'|'mend'|'guard'|'hook';
export interface Point {x:number;y:number}
export interface Enemy extends Point {id:string;name:string;hp:number;maxHp:number;damage:number;range:number;conductive:boolean;stun:number;root:number;burn:number}
export interface Combat {origin:'gate'|'escape'; round:number;ap:number;player:Point;enemies:Enemy[];water:Point[];walls:Point[];guard:boolean;veiled:boolean; width:number;height:number}
export interface Run {
  version:1;character:Character;seed:string;condition:'flood'|'lockdown'|'fading';stage:Stage;hp:number;focus:number;
  elapsed:number;paused:boolean;alarm:number;flags:string[];log:string[];combat:Combat|null;ending:string|null;turns:number;
}
export const LIMIT_MS=45*60*1000;
export interface Choice {id:string;title:string;description:string;effect:string;enabled:boolean;reason?:string}
export interface Action {id:ActionId;name:string;cost:number;target:'tile'|'enemy'|'self';description:string}
const clone=<T>(x:T):T=>structuredClone(x);
const same=(a:Point,b:Point)=>a.x===b.x&&a.y===b.y;
export const distance=(a:Point,b:Point)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export function seedNumber(seed:string) {let hash=2166136261;for(const char of seed) hash=Math.imul(hash^char.charCodeAt(0),16777619);return hash>>>0}
export function createRun(character:Character,seed:string):Run {
  const c=validateCharacter(character), seedText=(seed.trim()||'VESPER').slice(0,40);
  return {version:1,character:c,seed:seedText,condition:(['flood','lockdown','fading'] as const)[seedNumber(seedText)%3],stage:'gate',hp:stats(c).hp,focus:stats(c).focus,elapsed:0,paused:false,alarm:0,flags:[],log:['You arrive at the archive. Somewhere inside, a name is still alive.'],combat:null,ending:null,turns:0};
}
export function validateCharacter(value:unknown):Character {
  if(!value||typeof value!=='object') throw new Error('This character blueprint is incomplete.');
  const c=value as Character;
  for(const category of CATEGORIES) if(!TRAITS[category.id].some(t=>t.id===c[category.id])) throw new Error('Unknown character trait.');
  if(!Object.keys(OATHS).includes(c.oath)||!PALETTES.some(p=>p.id===c.palette)||!SKINS.includes(c.skin)||!['swept','shorn','crown'].includes(c.hair)||!['slender','balanced','broad'].includes(c.frame)) throw new Error('Unknown character appearance or oath.');
  if(typeof c.name!=='string'||typeof c.pronouns!=='string'||c.name.length>32||c.pronouns.length>32) throw new Error('Names and pronouns must be 32 characters or fewer.');
  return {...DEFAULT_CHARACTER,...Object.fromEntries(Object.keys(DEFAULT_CHARACTER).map(k=>[k,c[k as keyof Character]])),name:c.name.trim()||'Vesper'} as Character;
}
function log(s:Run,message:string) {s.log=[message,...s.log].slice(0,35)}
function flag(s:Run,value:string) {if(!s.flags.includes(value)) s.flags.push(value)}
const has=(s:Run,t:Tag)=>tags(s.character).has(t);
function recover(s:Run,hp:number,focus:number) {s.hp=Math.min(stats(s.character).hp,s.hp+hp);s.focus=Math.min(stats(s.character).focus,s.focus+focus)}
function finish(s:Run,id:string) {s.stage='ending';s.ending=id;s.combat=null;s.paused=false}
export function objectiveMet(s:Run) {return s.flags.includes(OATHS[s.character.oath].target)&&s.ending!=='fallen'&&s.ending!=='bell'}
export function advanceTime(run:Run,ms:number):Run {
  if(run.paused||run.stage==='ending')return run;
  const s=clone(run);s.elapsed=Math.min(LIMIT_MS,s.elapsed+Math.max(0,ms));
  if(s.elapsed>=LIMIT_MS){log(s,'The last bell sounds. The archive seals, taking its remaining names into the dark.');finish(s,'bell')}
  else if(s.elapsed>=40*60*1000&&!s.flags.includes('last-bell')){
    flag(s,'last-bell');log(s,'Five minutes remain. The warden has found you. The final reckoning begins.');
    s.combat=null;s.stage='escape';
  }
  return s;
}
export const CONDITION_TEXT={
  flood:{name:'High water',description:'The lower archive is flooded. Arc deals +1 damage and water connects more of the battlefield.'},
  lockdown:{name:'City lockdown',description:'The archive expects intruders. Each enemy has +2 vitality.'},
  fading:{name:'Failing bells',description:'The machine leaks power. Recover 2 focus at the start of each combat round.'},
};
export function choices(s:Run):Choice[] {
  const c=s.character, focus=s.focus;
  const option=(id:string,title:string,description:string,effect:string,enabled=true,reason='')=>({id,title,description,effect,enabled,reason});
  switch(s.stage){
    case 'gate':return [
      option('rewire','Become the current','Lay your hand on the ward. Let the circuit recognize something familiar.','2 focus · bypass guards · +1 alarm',(has(s,'conductive')||has(s,'engineer'))&&focus>=2,'Requires conductivity or Bellwright history, and 2 focus'),
      option('deceive','Wear a borrowed authority','The sentries remember titles longer than they remember faces.','Bypass guards · no alarm',has(s,'authority'),'Requires an authoritative voice or envoy history'),
      option('slip','Enter between reflections','The arch has a shadow. There is room inside it for someone like you.','1 focus · concealed entry',(has(s,'phase')||has(s,'shadow'))&&focus>=1,'Requires Hollowglass or a shadow trait, and 1 focus'),
      option('climb','Grow your own way in','Roots find the cracks the architects forgot.','1 focus · living passage',has(s,'living')&&focus>=1,'Requires a living trait and 1 focus'),
      option('fight','Face the brass sentries','They have orders. You have your own reasons.','Tactical encounter · +1 alarm'),
    ];
    case 'sluice':return [
      option('bridge','Anchor the broken causeway','Catch the fallen chain and pull the two banks together.','Safe crossing · recover 1 focus',c.body==='iron'||c.weapon==='hook'||has(s,'engineer'),'Requires Ironbound, Tetherblade, or Bellwright'),
      option('ground','Drink the storm','A broken transformer hisses in the water. Give the current somewhere to go.','Recover 4 vitality · recover 1 focus',has(s,'conductive'),'Requires a conductive trait'),
      option('grow','Raise a bridge of roots','The stranded people watch green shoots find purchase in the stone.','Save the stranded · recover 1 focus',has(s,'living'),'Requires a living trait'),
      option('phase','Follow the other reflection','The water reflects a bridge that no longer exists. You walk across that one.','1 focus · silent crossing',(has(s,'phase')||has(s,'shadow'))&&focus>=1,'Requires a phase or shadow trait, and 1 focus'),
      option('wade','Take the flooded stairs','Cold water. Broken glass. A way through, whatever you are made of.','Lose 3 vitality · recover 2 focus',s.hp>3,'Requires more than 3 vitality'),
    ];
    case 'keeper':return [
      option('help','Share a little of your life','The keeper is more wounded than hostile. Help them hold their shape.','Lose 2 vitality · gain the keeper’s seal',s.hp>2,'Requires more than 2 vitality'),
      option('heal','Teach the wound to close','What is broken is not always finished.','1 focus · keeper’s seal · recover 2 vitality',has(s,'living')&&focus>=1,'Requires a living trait and 1 focus'),
      option('repair','Repair the keeper’s heart','A damaged escapement clicks beneath their ribs. You know the pattern.','1 focus · keeper’s seal',has(s,'engineer')&&focus>=1,'Requires Bellwright history and 1 focus'),
      option('listen','Listen to all their voices','Their memories have fallen out of harmony. Answer with a chord.','Keeper’s seal · recover 1 focus',has(s,'resonant'),'Requires Many-voiced'),
      option('leave','Leave before the warden arrives','You came here for a name. You cannot carry every life.','Continue without the seal'),
    ];
    case 'ledger':return [
      option('mara','Take Mara’s name','A small glass vessel. Inside, someone is remembering the sea.','Rescue oath fulfilled if you escape · shutdown key'),
      option('self','Take your first memory','A familiar handwriting. A face that once belonged to you.','Reclaim oath fulfilled if you escape · shutdown key'),
      option('evidence','Take the book of erasures','Thousands of names, crossed out by the same careful hand.','Expose oath fulfilled if you escape · shutdown key'),
    ];
    case 'escape':return [
      option('release','Invoke the keeper’s seal','The warden lowers its blade. For a moment, law and mercy mean the same thing.','Escape by authority',s.flags.includes('seal')&&has(s,'authority'),'Requires keeper’s seal and authority'),
      option('shutdown','Speak the shutdown sequence','A stolen key and a familiar machine. You reach for the seam in its instructions.','2 focus · disable the warden',s.flags.includes('key')&&(has(s,'engineer')||has(s,'conductive'))&&focus>=2,'Requires the archive key, conductivity or Bellwright, and 2 focus'),
      option('vanish','Leave through a forgotten name','The smuggling route is not a passage. It is an omission in the archive’s memory.','2 focus · escape unseen',s.flags.includes('key')&&(has(s,'shadow')||has(s,'phase'))&&focus>=2,'Requires the archive key, phase or shadow, and 2 focus'),
      option('bloom','Let the archive reclaim its guardian','Roots and voices wind around the warden. Its next step will take a hundred years.','3 focus · bind the warden',has(s,'living')&&has(s,'resonant')&&focus>=3,'Requires living and resonant traits, and 3 focus'),
      option('duel','Make your own ending','The warden raises a blade engraved with a thousand stolen names.','Tactical encounter · defeat the warden'),
    ];
    default:return [];
  }
}
export function choose(run:Run,id:string):Run {
  if(run.paused)throw new Error('Resume your journey first.');
  const option=choices(run).find(c=>c.id===id);
  if(!option?.enabled)throw new Error(option?.reason||'That choice is not available.');
  const s=clone(run);s.turns++;log(s,option.title+'. '+option.effect+'.');
  switch(s.stage){
    case 'gate':
      if(id==='fight'){s.alarm++;startCombat(s,'gate');break}
      if(id==='rewire'){s.focus-=2;s.alarm++;flag(s,'rewired')}
      if(id==='slip'||id==='climb')s.focus--;
      flag(s,'entry-'+id);s.stage='sluice';break;
    case 'sluice':
      if(id==='phase')s.focus--;
      if(id==='wade'){s.hp-=3;recover(s,0,2)}
      if(id==='bridge'||id==='grow')recover(s,0,1);
      if(id==='ground')recover(s,4,1);
      if(id==='grow')flag(s,'stranded');
      s.stage='keeper';break;
    case 'keeper':
      if(id==='help')s.hp-=2;
      if(id==='heal'){s.focus--;recover(s,2,0)}
      if(id==='repair')s.focus--;
      if(id==='listen')recover(s,0,1);
      if(id!=='leave')flag(s,'seal');
      s.stage='ledger';break;
    case 'ledger':
      flag(s,id);flag(s,'key');recover(s,3,2);s.stage='escape';break;
    case 'escape':
      if(id==='duel'){startCombat(s,'escape');break}
      if(id==='shutdown'||id==='vanish')s.focus-=2;
      if(id==='bloom')s.focus-=3;
      finish(s,id);break;
  }
  return s;
}
function startCombat(s:Run,origin:'gate'|'escape') {
  const bonus=s.condition==='lockdown'?2:0, flipped=seedNumber(s.seed)%2===0;
  const enemies:Enemy[]=origin==='gate'?[
    {id:'sentry',name:'Brass sentry',x:6,y:2,hp:9+bonus,maxHp:9+bonus,damage:3,range:1,conductive:true,stun:0,root:0,burn:0},
    {id:'hound',name:'Ink hound',x:6,y:4,hp:7+bonus,maxHp:7+bonus,damage:2,range:1,conductive:false,stun:0,root:0,burn:0},
  ]:[{id:'warden',name:'The Nameless Warden',x:6,y:3,hp:19+bonus+s.alarm*2,maxHp:19+bonus+s.alarm*2,damage:4,range:2,conductive:true,stun:0,root:0,burn:0}];
  const water:Point[]=[{x:3,y:2},{x:4,y:2},{x:5,y:2},{x:4,y:3},{x:5,y:3},{x:5,y:4},{x:6,y:4}];
  if(s.condition==='flood')water.push({x:3,y:3},{x:3,y:4},{x:4,y:4},{x:6,y:2});
  if(flipped)water.forEach(p=>p.y=6-p.y);
  s.stage='combat';
  s.combat={origin,round:1,ap:2,player:{x:1,y:3},enemies,water,walls:[{x:2,y:1},{x:2,y:5},{x:6,y:1},{x:6,y:5}],guard:false,veiled:false,width:9,height:7};
}
export function availableActions(s:Run):Action[] {
  const list:Action[]=[
    {id:'move',name:'Move',cost:0,target:'tile',description:'Move up to '+stats(s.character).move+' tiles. Each move uses 1 action.'},
    {id:'strike',name:'Strike',cost:0,target:'enemy',description:'Deal '+stats(s.character).power+' damage within '+stats(s.character).reach+' tile(s). Veil adds surprise damage.'},
  ];
  if(has(s,'conductive'))list.push({id:'arc',name:'Arc',cost:2,target:'enemy',description:'Shock a target within '+(has(s,'resonant')?5:4)+' tiles. Electricity spreads through connected water.'});
  if(has(s,'fire'))list.push({id:'kindle',name:'Kindle',cost:2,target:'enemy',description:'Burn a target within 4 tiles. +2 damage against roots; water reduces fire damage by 1.'});
  if(has(s,'living'))list.push({id:'bind',name:'Bind',cost:2,target:'enemy',description:'Deal 2 damage and root a target for two turns within '+(has(s,'resonant')?5:4)+' tiles.'},{id:'mend',name:'Mend',cost:2,target:'self',description:'Restore '+(4+(s.character.body==='root'?2:0)+(has(s,'resonant')?1:0))+' vitality.'});
  if(has(s,'phase')||has(s,'shadow'))list.push({id:'veil',name:'Veil',cost:2,target:'self',description:'Evade the next enemy round. Your next strike gains surprise damage; attacking breaks Veil.'});
  if(has(s,'authority'))list.push({id:'command',name:'Command',cost:s.character.history==='courtier'?1:2,target:'enemy',description:'Interrupt a target within 4 tiles. It misses its next turn.'});
  if(s.character.weapon==='hook')list.push({id:'hook',name:'Hook',cost:1,target:'enemy',description:'Deal 2 damage and pull an enemy up to 2 tiles toward you. Range 4.'});
  list.push({id:'guard',name:'Guard',cost:0,target:'self',description:'Reduce incoming damage by 2 this round. Recover 1 focus.'});
  return list;
}
function inside(b:Combat,p:Point) {return Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.x<b.width&&p.y>=0&&p.y<b.height}
function blocked(b:Combat,p:Point,ignoreEnemies=false) {return !inside(b,p)||b.walls.some(w=>same(w,p))||(!ignoreEnemies&&b.enemies.some(e=>e.hp>0&&same(e,p)))}
export function path(b:Combat,from:Point,to:Point,phase=false):Point[]|null {
  if(!inside(b,to)||b.walls.some(p=>same(p,to)))return null;
  const queue:{p:Point;steps:Point[]}[]=[{p:from,steps:[]}],seen=new Set([from.x+','+from.y]);
  while(queue.length){const item=queue.shift()!;if(same(item.p,to))return item.steps;
    for(const p of [{x:item.p.x+1,y:item.p.y},{x:item.p.x-1,y:item.p.y},{x:item.p.x,y:item.p.y+1},{x:item.p.x,y:item.p.y-1}]){
      const key=p.x+','+p.y;if(seen.has(key)||blocked(b,p,phase))continue;seen.add(key);queue.push({p,steps:[...item.steps,p]});
    }
  }return null;
}
function waterNetwork(b:Combat,p:Point):Point[] {
  if(!b.water.some(w=>same(w,p)))return [];
  const result=[p];for(let i=0;i<result.length;i++)for(const tile of b.water)if(distance(result[i],tile)===1&&!result.some(w=>same(w,tile)))result.push(tile);
  return result;
}
export interface Resolution {state:Run;messages:string[];affected:string[]}
export function resolveAction(run:Run,id:ActionId,target?:Point):Resolution {
  const s=clone(run),b=s.combat;
  if(s.paused||s.stage!=='combat'||!b)throw new Error('No active encounter.');
  if(b.ap<1)throw new Error('No actions remain. End your turn.');
  const action=availableActions(s).find(a=>a.id===id);
  if(!action)throw new Error('Your build does not grant that action.');
  if(s.focus<action.cost)throw new Error('Not enough focus. Guard or end your turn to recover.');
  const messages:string[]=[],affected:string[]=[];
  let enemy:Enemy|undefined;
  if(action.target==='enemy'){
    enemy=b.enemies.find(e=>e.hp>0&&target&&same(e,target));
    if(!enemy)throw new Error('Select a living enemy.');
    const reach=id==='strike'?stats(s.character).reach:((id==='arc'||id==='bind')&&has(s,'resonant')?5:4);
    if(distance(b.player,enemy)>reach)throw new Error('Target is out of range. Move closer.');
  }
  if(id==='move'){
    if(!target||b.enemies.some(e=>e.hp>0&&same(e,target)))throw new Error('Choose an empty floor tile.');
    const route=path(b,b.player,target,has(s,'phase'));
    if(!route||route.length===0||route.length>stats(s.character).move)throw new Error('Choose a reachable tile within '+stats(s.character).move+' steps.');
    b.player={...target};messages.push('Move '+route.length+' tiles.');
  }
  const damage=(e:Enemy,n:number)=>{const amount=Math.min(e.hp,n);e.hp-=amount;affected.push(e.id);messages.push(e.name+' takes '+amount+' damage'+(e.hp===0?' and falls.':'.'))};
  if(id==='strike'){damage(enemy!,stats(s.character).power+(b.veiled?2+(s.character.weapon==='rapier'?1:0):0));b.veiled=false}
  if(id==='arc'){
    const count=CATEGORIES.filter(k=>trait(s.character,k.id).tags.includes('conductive')).length;
    const amount=3+Math.max(0,count-1)+(s.condition==='flood'?1:0)+(s.character.weapon==='staff'?1:0);
    const water=waterNetwork(b,enemy!);
    const hit=b.enemies.filter(e=>e.hp>0&&(e.id===enemy!.id||water.some(w=>same(w,e))||(e.conductive&&enemy!.conductive&&distance(e,enemy!)===1)));
    hit.forEach(e=>damage(e,amount));if(hit.length>1)messages.push('Living circuit: the current jumps to '+(hit.length-1)+' more target(s).');b.veiled=false;
  }
  if(id==='kindle'){const rooted=enemy!.root>0;damage(enemy!,3+(s.character.weapon==='staff'?1:0)+(rooted?2:0)-(b.water.some(w=>same(w,enemy!))?1:0));if(enemy!.hp>0)enemy!.burn=1;messages.push(rooted?'Wildfire garden adds 2 damage.':'Burn deals 2 more damage at the next enemy turn.');b.veiled=false}
  if(id==='bind'){damage(enemy!,2);enemy!.root=2;messages.push('Roots prevent movement for two enemy turns.');b.veiled=false}
  if(id==='command'){enemy!.stun=1;affected.push(enemy!.id);messages.push(enemy!.name+' will miss its next turn.');b.veiled=false}
  if(id==='hook'){
    damage(enemy!,2);
    for(let i=0;i<2&&distance(b.player,enemy!)>1;i++){
      const candidates=[{x:enemy!.x+Math.sign(b.player.x-enemy!.x),y:enemy!.y},{x:enemy!.x,y:enemy!.y+Math.sign(b.player.y-enemy!.y)}];
      const p=candidates.find(p=>!same(p,enemy!)&&!same(p,b.player)&&!blocked(b,p));
      if(!p)break;enemy!.x=p.x;enemy!.y=p.y;
    }
    messages.push('Tether pulls the target toward you.');b.veiled=false;
  }
  if(id==='veil'){b.veiled=true;messages.push('Veil: evade the next enemy round, or strike for bonus damage.')}
  if(id==='mend'){const before=s.hp;recover(s,4+(s.character.body==='root'?2:0)+(has(s,'resonant')?1:0),0);messages.push('Restore '+(s.hp-before)+' vitality.')}
  if(id==='guard'){b.guard=true;recover(s,0,1);messages.push('Guard: incoming damage reduced by 2. Recover 1 focus.')}
  s.focus-=action.cost;b.ap--;s.turns++;
  for(const message of messages)log(s,message);
  if(b.enemies.every(e=>e.hp<=0))winCombat(s);
  return {state:s,messages,affected};
}
export function preview(run:Run,id:ActionId,target?:Point):{valid:boolean;text:string;resolution?:Resolution} {
  try{const resolution=resolveAction(run,id,target);return {valid:true,text:resolution.messages.join(' '),resolution}}
  catch(error){return {valid:false,text:(error as Error).message}}
}
export function enemyIntent(s:Run,e:Enemy):string {
  const b=s.combat!;
  if(e.hp<=0)return 'Defeated';
  if(e.stun)return 'Interrupted · skips turn';
  if(b.veiled)return 'Searching · cannot see you';
  if(distance(e,b.player)<=e.range)return 'Attack · '+Math.max(0,e.damage-(b.guard?2:0))+' damage';
  if(e.root)return 'Rooted · cannot reach you';
  return 'Advance · up to 2 tiles';
}
export function endTurn(run:Run):Run {
  const s=clone(run),b=s.combat;
  if(s.paused||s.stage!=='combat'||!b)throw new Error('No active encounter.');
  for(const e of b.enemies.filter(e=>e.hp>0)){
    if(e.burn){e.hp=Math.max(0,e.hp-2);e.burn--;log(s,e.name+' takes 2 burn damage.');if(e.hp===0)continue}
    if(e.stun){e.stun--;if(e.root)e.root--;log(s,e.name+' is interrupted.');continue}
    if(b.veiled){if(e.root)e.root--;log(s,e.name+' searches for you.');continue}
    if(distance(e,b.player)<=e.range){
      const amount=Math.max(0,e.damage-(b.guard?2:0));s.hp=Math.max(0,s.hp-amount);log(s,e.name+' strikes for '+amount+'.');
    }else if(!e.root){
      for(let i=0;i<2;i++){
        if(distance(e,b.player)<=e.range)break;
        const candidates=[{x:e.x+1,y:e.y},{x:e.x-1,y:e.y},{x:e.x,y:e.y+1},{x:e.x,y:e.y-1}]
          .filter(p=>!blocked(b,p)&&!same(p,b.player)).sort((a,z)=>distance(a,b.player)-distance(z,b.player));
        const p=candidates.find(p=>distance(p,b.player)<distance(e,b.player));if(!p)break;e.x=p.x;e.y=p.y;
      }log(s,e.name+' advances.');
    }else log(s,e.name+' struggles against the roots.');
    if(e.root)e.root--;
    if(s.hp===0){finish(s,'fallen');return s}
  }
  if(b.enemies.every(e=>e.hp<=0)){winCombat(s);return s}
  b.round++;b.ap=2;b.guard=false;b.veiled=false;recover(s,0,s.condition==='fading'?2:1);s.turns++;
  return s;
}
function winCombat(s:Run) {
  const origin=s.combat!.origin;log(s,origin==='gate'?'The sentries fall silent. The archive opens.':'The warden’s blade strikes the floor. The exit is yours.');
  s.combat=null;recover(s,2,2);
  if(origin==='gate'){s.stage='sluice';flag(s,'entry-fight')}else finish(s,'victory');
}
export function retreat(run:Run):Run {
  const s=clone(run);if(s.stage!=='combat'||!s.combat||s.paused)throw new Error('No active encounter.');
  s.hp=Math.max(1,s.hp-2);s.alarm++;s.stage=s.combat.origin==='gate'?'gate':'escape';s.combat=null;
  log(s,'You retreat. Lose up to 2 vitality; the archive’s alarm rises.');return s;
}
export function endingText(s:Run) {
  const endings:Record<string,{title:string;text:string}>={
    release:{title:'Even iron remembers mercy.',text:'The keeper’s seal turns in the warden’s palm. Its blade lowers. A law older than the archive lets you pass.'},
    shutdown:{title:'A silence you made yourself.',text:'You speak the machine’s forgotten command. The warden kneels. Behind you, the bells lose a beat.'},
    vanish:{title:'The city forgets to stop you.',text:'Between one name and the next, there is a space the archive cannot see. You step into it, and out into the rain.'},
    bloom:{title:'Something living takes its place.',text:'Roots climb the warden’s brass ribs. Your voices sing it into a patient, flowering sleep.'},
    victory:{title:'You write the last word.',text:'The warden falls. Its blade cracks, releasing a murmur of stolen names. The rain beyond the doors feels like a beginning.'},
    fallen:{title:'Another name for the shelves.',text:'The archive is patient. It gathers what remains of you into a glass vessel. Somewhere, someone will come looking.'},
    bell:{title:'The city turns without you.',text:'The final bell sounds. The archive folds its doors into stone. The names you could not carry fade into another life.'},
  };
  return endings[s.ending||'bell'];
}
export function serialize(s:Run) {return JSON.stringify({kind:'manymade-save',version:1,run:s})}
export function deserialize(text:string):Run {
  if(text.length>200000)throw new Error('Save file is too large.');
  const parsed=JSON.parse(text);
  if(parsed.kind!=='manymade-save'||parsed.version!==1)throw new Error('This is not a compatible Manymade save.');
  const s=parsed.run as Run;
  if(!s||s.version!==1)throw new Error('Missing run data.');
  s.character=validateCharacter(s.character);
  if(!['gate','sluice','keeper','ledger','escape','combat','ending'].includes(s.stage)||!['flood','lockdown','fading'].includes(s.condition))throw new Error('Unknown scene in save.');
  for(const key of ['hp','focus','elapsed','alarm','turns'] as const)if(!Number.isFinite(s[key])||s[key]<0)throw new Error('Invalid saved resources.');
  if(s.hp>stats(s.character).hp||s.focus>stats(s.character).focus||s.elapsed>LIMIT_MS||typeof s.paused!=='boolean'||typeof s.seed!=='string'||s.seed.length>40)throw new Error('Invalid saved state.');
  if(!Array.isArray(s.flags)||s.flags.length>40||s.flags.some(f=>typeof f!=='string'||f.length>80)||!Array.isArray(s.log)||s.log.length>35||s.log.some(l=>typeof l!=='string'||l.length>600))throw new Error('Invalid journal.');
  const validEndings=['release','shutdown','vanish','bloom','victory','fallen','bell'];
  if(s.stage==='ending'&&!validEndings.includes(s.ending||''))throw new Error('Invalid ending.');
  if(s.stage==='combat'){
    const b=s.combat;if(!b||b.width!==9||b.height!==7||!['gate','escape'].includes(b.origin)||!Number.isInteger(b.ap)||b.ap<0||b.ap>2||!Number.isInteger(b.round)||b.round<1||typeof b.guard!=='boolean'||typeof b.veiled!=='boolean')throw new Error('Invalid battle.');
    if(!b.player||!inside(b,b.player)||!Array.isArray(b.water)||!Array.isArray(b.walls)||b.water.length>63||b.walls.length>63||[...b.water,...b.walls].some(p=>!p||!inside(b,p)))throw new Error('Invalid battlefield.');
    if(!Array.isArray(b.enemies)||b.enemies.length<1||b.enemies.length>5)throw new Error('Invalid enemies.');
    for(const e of b.enemies)if(!e||!inside(b,e)||typeof e.name!=='string'||e.name.length>80||!['sentry','hound','warden'].includes(e.id)||typeof e.conductive!=='boolean'||['hp','maxHp','damage','range','stun','root','burn'].some(k=>!Number.isFinite(e[k as keyof Enemy])||Number(e[k as keyof Enemy])<0)||e.hp>e.maxHp||e.maxHp>100||e.range>9||e.damage>20)throw new Error('Invalid enemy state.');
    if(b.walls.some(w=>same(w,b.player))||b.enemies.some(e=>e.hp>0&&same(e,b.player)))throw new Error('Invalid occupied position.');
  }else if(s.combat!==null)throw new Error('Unexpected battle data.');
  return s;
}
