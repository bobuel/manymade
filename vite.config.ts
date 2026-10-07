import { defineConfig } from 'vite';
import {execFileSync} from 'node:child_process';
export default defineConfig({
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 1700 },
  plugins:[{
    name:'build-identity',
    generateBundle(){
      let revision=process.env.GITHUB_SHA||'local';
      if(revision==='local')try{revision=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim()}catch{}
      this.emitFile({type:'asset',fileName:'build-info.json',source:JSON.stringify({game:'Manymade: The Drowned Archive',version:'0.1.0',revision})});
    },
  }],
});
