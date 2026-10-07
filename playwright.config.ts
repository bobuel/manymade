import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',
  fullyParallel:false,
  workers:1,
  use:{baseURL:process.env.GAME_URL||'http://127.0.0.1:4185',headless:true,viewport:{width:1440,height:1050},screenshot:'only-on-failure'},
  reporter:'list',
  webServer:process.env.GAME_URL?undefined:{command:'npm run dev',url:'http://127.0.0.1:4185',reuseExistingServer:true},
});
