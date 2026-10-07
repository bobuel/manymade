import Phaser from 'phaser';
import {DEFAULT_CHARACTER,stats} from './content';
import {portrait} from './portrait';
import {enemyIntent,preview,type ActionId,type Point,type Run} from './engine';

const iso=(p:Point)=>({x:340+(p.x-p.y)*39,y:92+(p.x+p.y)*21});
export class ArchiveBoard {
  game:Phaser.Game;
  scene?:BattleScene;
  state:Run;
  action:ActionId;
  target?:Point;
  constructor(parent:HTMLElement,state:Run,action:ActionId,public onTarget:(p:Point)=>void){
    this.state=state;this.action=action;
    const owner=this;
    class Scene extends BattleScene {constructor(){super(owner)}}
    this.game=new Phaser.Game({type:Phaser.AUTO,parent,width:790,height:465,transparent:true,antialias:true,
      scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:Scene,
      audio:{noAudio:true},banner:false,render:{roundPixels:true}});
  }
  update(state:Run,action:ActionId,target?:Point){this.state=state;this.action=action;this.target=target;this.scene?.draw()}
  destroy(){this.game.destroy(true)}
}
class BattleScene extends Phaser.Scene {
  constructor(private owner:ArchiveBoard){super('archive')}
  preload(){
    this.load.svg('player','data:image/svg+xml;base64,'+btoa(portrait(this.owner.state.character)),{width:240,height:350});
    this.load.svg('enemy','data:image/svg+xml;base64,'+btoa(portrait({...DEFAULT_CHARACTER,body:'iron',hair:'shorn',weapon:'rapier',palette:'rust'},true)),{width:240,height:350});
  }
  create(){this.owner.scene=this;this.draw()}
  draw(){
    if(!this.add)return;
    this.children.removeAll(true);
    const s=this.owner.state,b=s.combat;if(!b)return;
    const g=this.add.graphics();
    const diamond=(x:number,y:number,color:number,alpha=1,stroke=0x435252)=>{
      g.fillStyle(color,alpha);g.lineStyle(1,stroke,.65);
      g.beginPath();g.moveTo(x,y-20);g.lineTo(x+38,y);g.lineTo(x,y+20);g.lineTo(x-38,y);g.closePath();g.fillPath();g.strokePath();
    };
    g.fillStyle(0x061215,.5);g.fillEllipse(385,320,680,210);
    for(let sum=0;sum<b.width+b.height;sum++)for(let x=0;x<b.width;x++){
      const y=sum-x;if(y<0||y>=b.height)continue;
      const p={x,y},v=iso(p),water=b.water.some(w=>w.x===x&&w.y===y),wall=b.walls.some(w=>w.x===x&&w.y===y);
      g.fillStyle(water?0x102b33:0x16262b);g.fillPoints([{x:v.x-38,y:v.y},{x:v.x,y:v.y+20},{x:v.x+38,y:v.y},{x:v.x+38,y:v.y+9},{x:v.x,y:v.y+29},{x:v.x-38,y:v.y+9}],true);
      diamond(v.x,v.y,water?0x24474d:((x+y)%2?0x394448:0x303c40),1,water?0x537a79:0x65706b);
      if(water){g.lineStyle(1,0x8dc7be,.32);g.lineBetween(v.x-21,v.y,v.x+5,v.y+10);g.lineBetween(v.x-2,v.y-8,v.x+20,v.y+3)}
      if(!wall){
        const pv=preview(s,this.owner.action,p);
        if(pv.valid)diamond(v.x,v.y,this.owner.action==='move'?0x72b9ae:0xcc9c62,.14,this.owner.action==='move'?0x75b7ab:0xd6ae77);
        const polygon=this.add.polygon(v.x,v.y,[38,0,76,20,38,40,0,20],0xffffff,0).setInteractive(new Phaser.Geom.Polygon([38,0,76,20,38,40,0,20]),Phaser.Geom.Polygon.Contains);
        polygon.on('pointerover',()=>polygon.setFillStyle(0xe7d9b7,.16));
        polygon.on('pointerout',()=>polygon.setFillStyle(0xffffff,0));
        polygon.on('pointerdown',()=>this.owner.onTarget(p));
      }
      if(this.owner.target?.x===x&&this.owner.target.y===y)diamond(v.x,v.y,0xe2c78c,.28,0xffe8b2);
    }
    // Archive pillars are permanent, blocking terrain.
    for(const p of b.walls){
      const v=iso(p);
      g.fillStyle(0x0b151a,.45);g.fillEllipse(v.x+12,v.y+7,60,18);
      g.fillStyle(0x243337);g.fillRect(v.x-13,v.y-79,26,76);
      g.fillStyle(0x455450);g.fillRect(v.x-16,v.y-83,32,9);g.fillRect(v.x-17,v.y-8,34,12);
      g.lineStyle(2,0xab9569,.5);g.lineBetween(v.x-7,v.y-70,v.x-7,v.y-13);g.lineBetween(v.x+7,v.y-70,v.x+7,v.y-13);
      g.fillStyle(0xd9b879,.7);g.fillCircle(v.x,v.y-86,3);
    }
    const actors=[{p:b.player,player:true,e:undefined},...b.enemies.filter(e=>e.hp>0).map(e=>({p:e,player:false,e}))].sort((a,z)=>(a.p.x+a.p.y)-(z.p.x+z.p.y));
    for(const a of actors){
      const v=iso(a.p),e=a.e,isWarden=e?.id==='warden',scale=isWarden?.39:.29;
      g.fillStyle(a.player?0x8bc3b6:0xc78e75,.2);g.fillEllipse(v.x,v.y+2,42,17);
      const hound=e?.id==='hound';
      if(hound){
        const ink=this.add.graphics();ink.fillStyle(0x101c28);ink.lineStyle(1.5,0x8ea4a5);
        ink.fillPoints([{x:v.x-27,y:v.y-25},{x:v.x-12,y:v.y-40},{x:v.x+14,y:v.y-33},{x:v.x+22,y:v.y-49},{x:v.x+29,y:v.y-35},{x:v.x+38,y:v.y-28},{x:v.x+22,y:v.y-19},{x:v.x+13,y:v.y-18},{x:v.x+9,y:v.y+1},{x:v.x+3,y:v.y+1},{x:v.x+3,y:v.y-18},{x:v.x-17,y:v.y-16},{x:v.x-22,y:v.y+2},{x:v.x-28,y:v.y+2}],true);
        ink.strokePoints([{x:v.x-28,y:v.y-25},{x:v.x-12,y:v.y-40},{x:v.x+14,y:v.y-33},{x:v.x+22,y:v.y-49},{x:v.x+29,y:v.y-35},{x:v.x+38,y:v.y-28}],false);
        ink.lineStyle(3,0x263d49);ink.lineBetween(v.x-26,v.y-28,v.x-41,v.y-45);
        ink.fillStyle(0xd6b987);ink.fillCircle(v.x+26,v.y-31,2);
        this.add.zone(v.x,v.y-22,80,54).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.owner.onTarget(a.p));
      }else{
        const sprite=this.add.image(v.x,v.y+8,a.player?'player':'enemy').setOrigin(.5,1).setScale(scale).setAlpha(a.player&&b.veiled?.5:1);
        sprite.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.owner.onTarget(a.p));
      }
      const hp=a.player?s.hp:e!.hp,max=a.player?stats(s.character).hp:e!.maxHp,top=v.y-(isWarden?128:hound?63:96);
      this.add.rectangle(v.x,top,44,4,0x152124).setOrigin(.5);
      this.add.rectangle(v.x-22,top,44*Math.min(1,hp/max),4,a.player?0x8abaae:0xd09a79).setOrigin(0,.5);
      this.add.text(v.x,top-18,a.player?'YOU':e!.name,{fontFamily:'DM Sans',fontSize:'10px',color:a.player?'#c1e0d5':'#e3c0a7',fontStyle:'bold'}).setOrigin(.5);
      if(e&&(e.root||e.stun||e.burn))this.add.text(v.x,v.y+17,[e.stun?'INTERRUPTED':'',e.root?'ROOTED':'',e.burn?'BURNING':''].filter(Boolean).join(' · '),{fontFamily:'DM Sans',fontSize:'8px',color:'#dccc9e'}).setOrigin(.5);
    }
    this.add.text(28,424,'FLOODED FLOOR',{fontFamily:'DM Sans',fontSize:'9px',color:'#8daba9',letterSpacing:2});
    this.add.rectangle(18,430,7,7,0x447578);
    this.add.text(745,424,'9 × 7',{fontFamily:'DM Sans',fontSize:'10px',color:'#8daba9'}).setOrigin(1,0);
  }
}
