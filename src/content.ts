export type Category = 'body' | 'blood' | 'voice' | 'history' | 'weapon' | 'sigil';
export type Tag = 'conductive' | 'living' | 'phase' | 'authority' | 'resonant' | 'shadow' | 'engineer' | 'fire' | 'reach';
export interface Trait { id: string; name: string; subtitle: string; description: string; tags: Tag[]; hp?: number; focus?: number; power?: number; }
export const CATEGORIES: { id: Category; name: string; label: string }[] = [
  {id:'body', name:'Body', label:'What holds you together'},
  {id:'blood', name:'Blood', label:'What moves beneath your skin'},
  {id:'voice', name:'Voice', label:'How the world hears you'},
  {id:'history', name:'History', label:'What you remember'},
  {id:'weapon', name:'Weapon', label:'What you carry'},
  {id:'sigil', name:'Inscription', label:'What your appearance promises'},
];
export const TRAITS: Record<Category, Trait[]> = {
  body: [
    {id:'iron',name:'Ironbound',subtitle:'A body of brass & borrowed bone',description:'+5 vitality. Conduct electricity through yourself. Anchor machinery and endure close combat.',tags:['conductive'],hp:5},
    {id:'veil',name:'Hollowglass',subtitle:'A reflection that learned to breathe',description:'+2 focus. Step through occupied spaces and evade a round of attacks. Slip through warded doors.',tags:['phase'],focus:2},
    {id:'root',name:'Briarborn',subtitle:'Something green beneath the ribs',description:'+3 vitality. Bind enemies with living roots and grow paths through flooded ruins.',tags:['living'],hp:3},
  ],
  blood: [
    {id:'storm',name:'Stormblood',subtitle:'Lightning remembers its way home',description:'Unlock Arc: electricity spreads through connected water and conductive targets. Conductive bodies amplify it.',tags:['conductive']},
    {id:'ember',name:'Cinderblood',subtitle:'The warmth of a stolen sun',description:'Unlock Kindle: a ranged flame that burns for another turn. Living roots feed the flame.',tags:['fire'],power:1},
    {id:'sap',name:'Greensap',subtitle:'Life refuses to leave you',description:'Unlock Mend and Bind. Living bodies improve healing. Restore life to forgotten mechanisms.',tags:['living']},
  ],
  voice: [
    {id:'command',name:'Sovereign',subtitle:'A voice that expects an answer',description:'Unlock Command: interrupt an enemy for one turn. Claim authority with sentries and the warden.',tags:['authority']},
    {id:'whisper',name:'Undertone',subtitle:'Words arrive before the speaker',description:'+1 focus. Unlock Veil and hidden approaches. Your first strike from Veil deals +2 damage.',tags:['shadow'],focus:1},
    {id:'chorus',name:'Many-voiced',subtitle:'You never speak alone',description:'Your Arc and Bind reach one tile farther. Mend restores an extra point. Read the archive’s resonant lock.',tags:['resonant']},
  ],
  history: [
    {id:'engineer',name:'Bellwright',subtitle:'You once repaired the city’s heart',description:'+1 focus. Rewire archive systems and expose the warden’s shutdown sequence.',tags:['engineer'],focus:1},
    {id:'courtier',name:'Disgraced envoy',subtitle:'The right name still opens doors',description:'Authority in faction encounters. Command costs one less focus. A keeper’s seal can end the pursuit.',tags:['authority']},
    {id:'smuggler',name:'Name smuggler',subtitle:'Every locked door has a price',description:'Unlock hidden passages and Veil. Move up to four tiles per action instead of three.',tags:['shadow']},
  ],
  weapon: [
    {id:'hook',name:'Tetherblade',subtitle:'A curved blade on a brass chain',description:'Strike from two tiles away. Unlock Hook to pull a target closer. Anchor a bridge without machinery.',tags:['reach']},
    {id:'rapier',name:'Memory needle',subtitle:'It remembers where armor fails',description:'+1 strike damage. From Veil, your first strike gains another +1 damage.',tags:[],power:1},
    {id:'staff',name:'Reliquary staff',subtitle:'A little sanctuary for lost souls',description:'+2 focus. Arc and Kindle deal +1 damage. A resourceful caster’s companion.',tags:[],focus:2},
  ],
  sigil: [
    {id:'circuit',name:'Gilded circuit',subtitle:'A current written across the skin',description:'Conductive inscription. Unlock Arc even without stormblood; amplify it when both are chosen.',tags:['conductive']},
    {id:'moon',name:'Broken halo',subtitle:'A reflection the world overlooks',description:'Shadow inscription. Unlock Veil and concealed routes regardless of body or history.',tags:['shadow']},
    {id:'briar',name:'Thornscript',subtitle:'A promise that puts down roots',description:'Living inscription. Unlock Mend and Bind regardless of blood or body.',tags:['living']},
  ],
};
export interface Character {
  name: string; pronouns: string; skin: string; hair: 'swept' | 'shorn' | 'crown';
  frame: 'slender' | 'balanced' | 'broad'; palette: string;
  body: string; blood: string; voice: string; history: string; weapon: string; sigil: string;
  oath: 'rescue' | 'reclaim' | 'expose';
}
export const PALETTES = [
  {id:'teal',name:'Verdigris',value:'#78b9b1'}, {id:'gold',name:'Old gold',value:'#d6b77a'},
  {id:'plum',name:'Mourning violet',value:'#ad95bf'}, {id:'rust',name:'Cinder red',value:'#d98f79'},
];
export const SKINS = ['#d8bca2','#b78769','#80583f','#4a342d','#c7d6d1','#81959b'];
export const DEFAULT_CHARACTER: Character = {
  name:'Vesper',pronouns:'they / them',skin:SKINS[1],hair:'swept',frame:'balanced',palette:'teal',
  body:'iron',blood:'storm',voice:'command',history:'engineer',weapon:'hook',sigil:'circuit',oath:'rescue',
};
export const PRESETS: {id:string; name:string; description:string; character:Character}[] = [
  {id:'storm',name:'Storm engineer',description:'Conduct · Pull · Rewire',character:{...DEFAULT_CHARACTER}},
  {id:'phantom',name:'Phantom envoy',description:'Conceal · Command · Pierce',character:{...DEFAULT_CHARACTER,name:'Leth',body:'veil',blood:'ember',voice:'whisper',history:'courtier',weapon:'rapier',sigil:'moon',palette:'plum',hair:'shorn',frame:'slender',oath:'reclaim'}},
  {id:'guardian',name:'Living guardian',description:'Bind · Restore · Resonate',character:{...DEFAULT_CHARACTER,name:'Rowan',body:'root',blood:'sap',voice:'chorus',history:'smuggler',weapon:'staff',sigil:'briar',palette:'gold',hair:'crown',frame:'broad',oath:'expose'}},
];
export const OATHS = {
  rescue:{name:'Bring her home',description:'Mara’s name was taken. Return it before she forgets herself.',target:'mara'},
  reclaim:{name:'Remember yourself',description:'Your first life is locked in the archive. Take it back.',target:'self'},
  expose:{name:'Tell the city',description:'Steal proof of the names the city erased. Make them answer.',target:'evidence'},
} as const;
export function trait(c:Character, category:Category):Trait { return TRAITS[category].find(t=>t.id===c[category])!; }
export function tags(c:Character):Set<Tag> { return new Set(CATEGORIES.flatMap(k=>trait(c,k.id).tags)); }
export function stats(c:Character) {
  const selected = CATEGORIES.map(k=>trait(c,k.id));
  return {hp:18+selected.reduce((n,t)=>n+(t.hp||0),0),focus:6+selected.reduce((n,t)=>n+(t.focus||0),0),power:3+selected.reduce((n,t)=>n+(t.power||0),0),reach:c.weapon==='hook'?2:1,move:c.history==='smuggler'?4:3};
}
export function combinations(c:Character):{name:string;description:string}[] {
  const t=tags(c), out:{name:string;description:string}[]=[];
  const conductors=CATEGORIES.filter(k=>trait(c,k.id).tags.includes('conductive')).length;
  if(conductors>1) out.push({name:'Living circuit',description:'Multiple conductive traits amplify Arc by '+(conductors-1)+' damage. Water carries it to connected enemies.'});
  if(t.has('living')&&t.has('fire')) out.push({name:'Wildfire garden',description:'Kindle deals +2 damage to a rooted enemy. Your own Bind supplies the roots.'});
  if(t.has('living')&&t.has('resonant')) out.push({name:'Choir of roots',description:'Bind reaches farther. Mend restores an extra point of vitality.'});
  if((t.has('shadow')||t.has('phase'))&&c.weapon==='rapier') out.push({name:'A beautiful absence',description:'Strike from Veil for +3 damage, then disappear from the target’s reach.'});
  if(t.has('authority')&&c.history==='courtier') out.push({name:'The old protocols',description:'Command costs only 1 focus. With a keeper’s seal, the warden will recognize your claim.'});
  if(t.has('conductive')&&t.has('reach')) out.push({name:'Storm tether',description:'Hook a distant enemy onto flooded ground, then let Arc travel through the water.'});
  if(t.has('living')&&c.body==='root') out.push({name:'Deep roots',description:'Mend restores +2 vitality. Regrow the sluice crossing and protect the people stranded there.'});
  if(!out.length) out.push({name:'An adaptable soul',description:'Your independent tools cover different situations. Pair properties during creation to specialize further.'});
  return out;
}
