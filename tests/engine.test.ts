import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CATEGORIES,DEFAULT_CHARACTER,OATHS,PRESETS,TRAITS,stats,type Character} from '../src/content';
import {LIMIT_MS,advanceTime,availableActions,choose,choices,createRun,deserialize,endTurn,objectiveMet,path,preview,resolveAction,retreat,serialize,type ActionId,type Run} from '../src/engine';

const combat=(c:Character=DEFAULT_CHARACTER)=>choose(createRun(c,'RAIN-17'),'fight');
const CONDITION_SEEDS=[...new Map(Array.from({length:100},(_,i)=>'test-'+i).map(seed=>[createRun(DEFAULT_CHARACTER,seed).condition,seed])).values()];
test('all 729 builds × 3 promises × 3 seed conditions have an affordable peaceful route to their intended ending',()=>{
  let covered=0;
  const visit=(c:Character,depth:number)=>{
    if(depth<CATEGORIES.length){const k=CATEGORIES[depth].id;for(const t of TRAITS[k])visit({...c,[k]:t.id},depth+1);return}
    for(const oath of Object.keys(OATHS) as Character['oath'][]){
      for(const seed of CONDITION_SEEDS){
        let s=createRun({...c,oath},seed);
        for(let i=0;i<5;i++){
          const list=choices(s).filter(x=>x.enabled);
          const selected=s.stage==='ledger'?list.find(x=>x.id===OATHS[oath].target):list.find(x=>!['fight','duel'].includes(x.id));
          assert.ok(selected,'No peaceful route for '+JSON.stringify(c)+' at '+s.stage);
          s=choose(s,selected.id);
        }
        assert.equal(s.stage,'ending');assert.equal(objectiveMet(s),true);covered++;
      }
    }
  };
  visit({...DEFAULT_CHARACTER},0);assert.equal(covered,6561);
});
test('seeded battle layouts and conditions reproduce exactly',()=>{
  assert.deepEqual(combat(),combat());
  const conditions=new Set(CONDITION_SEEDS.map(seed=>createRun(DEFAULT_CHARACTER,seed).condition));
  assert.equal(conditions.size,3);
  const s=combat();assert.ok(path(s.combat!,s.combat!.player,{x:7,y:3}));
});
test('preview is side-effect free and matches the committed action',()=>{
  const s=combat();s.combat!.enemies[0].x=3;s.combat!.enemies[0].y=3;
  const before=serialize(s),p=preview(s,'arc',s.combat!.enemies[0]);
  assert.equal(p.valid,true);assert.equal(serialize(s),before);
  assert.deepEqual(p.resolution,resolveAction(s,'arc',s.combat!.enemies[0]));
});
test('water conducts Arc to connected enemies and conductivity amplifies damage',()=>{
  const s=combat();s.combat!.player={x:2,y:2};s.combat!.water=[{x:3,y:2},{x:4,y:2}];
  Object.assign(s.combat!.enemies[0],{x:3,y:2});Object.assign(s.combat!.enemies[1],{x:4,y:2});
  const result=resolveAction(s,'arc',{x:3,y:2});
  assert.equal(result.affected.length,2);
  assert.ok(result.state.combat!.enemies.every(e=>e.hp<4));
  assert.equal(result.state.focus,s.focus-2);
});
test('wildfire consumes the tactical benefit of rooting, and burns next turn',()=>{
  let s=combat({...DEFAULT_CHARACTER,body:'root',blood:'ember',sigil:'briar'});
  s.combat!.enemies=[{...s.combat!.enemies[0],x:3,y:3,hp:20,maxHp:20}];s.combat!.water=[];
  s=resolveAction(s,'bind',{x:3,y:3}).state;
  const r=resolveAction(s,'kindle',{x:3,y:3});assert.equal(r.state.combat!.enemies[0].hp,13);
  assert.ok(r.messages.some(x=>x.includes('Wildfire')));
  const ended=endTurn(r.state);assert.equal(ended.combat!.enemies[0].hp,11);
});
test('Veil prevents an enemy round and adds surprise damage to strikes',()=>{
  let s=combat(PRESETS[1].character);s.combat!.enemies=[{...s.combat!.enemies[0],x:2,y:3,hp:20,maxHp:20}];
  const hp=s.hp;s=resolveAction(s,'veil').state;s=endTurn(s);assert.equal(s.hp,hp);
  s=resolveAction(s,'veil').state;s=resolveAction(s,'strike',{x:2,y:3}).state;
  assert.equal(s.combat!.enemies[0].hp,20-stats(s.character).power-3);assert.equal(s.combat!.veiled,false);
});
test('range, focus, action points, wall collision, unavailable actions, and pause are enforced',()=>{
  const s=combat();assert.equal(preview(s,'strike',{x:6,y:2}).valid,false);
  assert.equal(preview(s,'move',{x:2,y:1}).valid,false);
  assert.equal(preview(s,'mend').valid,false);
  s.focus=0;assert.equal(preview(s,'arc',{x:3,y:3}).valid,false);
  s.combat!.ap=0;assert.equal(preview(s,'guard').valid,false);
  s.combat!.ap=2;s.paused=true;assert.throws(()=>endTurn(s));assert.throws(()=>retreat(s));
});
test('Mend is bounded by maximum vitality, Guard cannot grant a third action',()=>{
  let s=combat(PRESETS[2].character);s.hp=stats(s.character).hp-1;
  s=resolveAction(s,'mend').state;assert.equal(s.hp,stats(s.character).hp);
  s=resolveAction(s,'guard').state;assert.equal(s.combat!.ap,0);
  assert.throws(()=>resolveAction(s,'guard'));assert.ok(s.focus<=stats(s.character).focus);
});
test('the final bell resolves once; pause freezes time; escalation does not invent objective success',()=>{
  let s=createRun(DEFAULT_CHARACTER,'bell');s.paused=true;
  assert.deepEqual(advanceTime(s,LIMIT_MS),s);s.paused=false;
  s=advanceTime(s,40*60*1000);assert.equal(s.stage,'escape');assert.equal(s.flags.includes('key'),false);
  s=advanceTime(s,5*60*1000);assert.equal(s.stage,'ending');assert.equal(s.ending,'bell');assert.equal(objectiveMet(s),false);
  assert.deepEqual(advanceTime(s,100000),s);
});
test('taking a different record yields escape but does not fulfill the selected oath',()=>{
  let s=createRun(DEFAULT_CHARACTER,'a');
  for(const id of ['deceive','bridge','help','evidence','release'])s=choose(s,id);
  assert.equal(s.stage,'ending');assert.equal(objectiveMet(s),false);
});
test('save round trips preserve state and reject malformed imports',()=>{
  const s=combat();assert.deepEqual(deserialize(serialize(s)),s);
  assert.throws(()=>deserialize('{"kind":"other"}'));
  const malformed=JSON.parse(serialize(s));malformed.run.combat.player.x=99;
  assert.throws(()=>deserialize(JSON.stringify(malformed)));
  const traits=JSON.parse(serialize(s));traits.run.character.body='unknown';
  assert.throws(()=>deserialize(JSON.stringify(traits)));
  const resources=JSON.parse(serialize(s));resources.run.focus=100000;
  assert.throws(()=>deserialize(JSON.stringify(resources)));
});
test('all three preset builds can win both encounters using the real action resolver',()=>{
  // A small deterministic tactical policy checks viable combat without changing
  // resources, damage, enemy state, or rules. This is not a difficulty verdict.
  const fight=(initial:Run)=>{
    let s=initial;
    for(let round=0;round<45&&s.stage==='combat';round++){
      while(s.stage==='combat'&&s.combat!.ap>0){
        const b=s.combat!,enemies=b.enemies.filter(e=>e.hp>0),candidate:{score:number;id:ActionId;p?:{x:number;y:number}}[]=[];
        for(const a of availableActions(s)){
          if(a.id==='move'){
            for(let y=0;y<7;y++)for(let x=0;x<9;x++){
              const p={x,y},pv=preview(s,a.id,p);if(!pv.valid)continue;
              const before=Math.min(...enemies.map(e=>Math.abs(e.x-b.player.x)+Math.abs(e.y-b.player.y)));
              const after=Math.min(...enemies.map(e=>Math.abs(e.x-x)+Math.abs(e.y-y)));
              candidate.push({score:(before-after)*.6,id:a.id,p});
            }
          }else{
            const targets=a.target==='self'?[undefined]:enemies;
            for(const p of targets){
              const pv=preview(s,a.id,p);if(!pv.valid)continue;
              const next=pv.resolution!.state;
              const before=enemies.reduce((n,e)=>n+e.hp,0),after=next.combat?.enemies.reduce((n,e)=>n+Math.max(0,e.hp),0)||0;
              let score=(before-after)*2+(next.hp-s.hp)*1.5;
              if(a.id==='guard')score=.15;
              if(a.id==='command')score+=1;
              if(a.id==='veil'&&enemies.some(e=>Math.abs(e.x-b.player.x)+Math.abs(e.y-b.player.y)<=e.range))score+=2;
              candidate.push({score,id:a.id,p});
            }
          }
        }
        candidate.sort((a,z)=>z.score-a.score);const choice=candidate[0];assert.ok(choice);
        s=resolveAction(s,choice.id,choice.p).state;
      }
      if(s.stage==='combat')s=endTurn(s);
    }
    assert.notEqual(s.ending,'fallen','Preset fell: '+s.character.name);
    assert.notEqual(s.stage,'combat','Combat failed to finish');
    return s;
  };
  for(const preset of PRESETS){
    let s=fight(combat(preset.character));assert.equal(s.stage,'sluice');
    const crossing=choices(s).find(c=>c.enabled)!;s=choose(s,crossing.id);
    s=choose(s,choices(s).find(c=>c.enabled)!.id);s=choose(s,OATHS[s.character.oath].target);
    s=fight(choose(s,'duel'));assert.equal(s.ending,'victory');assert.equal(objectiveMet(s),true);
  }
});
