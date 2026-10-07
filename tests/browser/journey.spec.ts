import {test,expect} from '@playwright/test';
test('storm engineer keeps the rescue promise, reloads a save, and completes the archive',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('./');
  await expect(page.getByRole('heading',{name:'Become someone impossible.'})).toBeVisible();
  await page.screenshot({path:'qa/screenshots/workshop.png',fullPage:true});
  await page.getByRole('button',{name:'Enter the archive'}).click();
  await page.getByRole('button',{name:/Wear a borrowed authority/}).click();
  await page.getByRole('button',{name:/Drink the storm/}).click();
  await page.reload();
  await page.getByRole('button',{name:'Return to saved journey'}).click();
  await expect(page.getByRole('heading',{name:'The keeper is coming apart.'})).toBeVisible();
  await page.getByRole('button',{name:/Repair the keeper/}).click();
  await page.getByRole('button',{name:/Take Mara/}).click();
  await page.getByRole('button',{name:/Invoke the keeper/}).click();
  await expect(page.getByText('PROMISE KEPT',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Even iron remembers mercy.'})).toBeVisible();
  await page.screenshot({path:'qa/screenshots/ending.png',fullPage:true});
  expect(errors).toEqual([]);
});
test('phantom and guardian use their own routes and different endings',async({page})=>{
  for(const route of [
    {preset:'Phantom envoy',steps:[/Enter between reflections/,/Follow the other reflection/,/Share a little/,/Take your first memory/,/Leave through a forgotten name/],ending:'The city forgets to stop you.'},
    {preset:'Living guardian',steps:[/Grow your own way in/,/Raise a bridge of roots/,/Listen to all their voices/,/Take the book of erasures/,/Let the archive reclaim/],ending:'Something living takes its place.'},
  ]){
    await page.goto('./');await page.getByRole('button',{name:new RegExp(route.preset)}).click();
    await page.getByRole('button',{name:'Enter the archive'}).click();
    for(const name of route.steps)await page.getByRole('button',{name}).click();
    await expect(page.getByRole('heading',{name:route.ending})).toBeVisible();
    await expect(page.getByText('PROMISE KEPT',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Become someone else'}).click();
  }
});
test('combat supports preview, confirmation, enemy turns, pause, and keyboard map',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('./');await page.getByRole('button',{name:'Enter the archive'}).click();
  await page.getByRole('button',{name:/Face the brass sentries/}).click();
  await expect(page.locator('#battlefield canvas')).toBeVisible();
  const canvas=page.locator('#battlefield canvas');
  const bounds=await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  // Tile (3,3) is at virtual canvas (340,218). Pointer and rules coordinates agree.
  await canvas.click({position:{x:340*bounds!.width/790,y:218*bounds!.height/465}});
  await expect(page.locator('.preview-result')).toHaveText('Move 2 tiles.');
  await page.getByText('Keyboard-accessible map & target controls',{exact:true}).click();
  await page.getByRole('button',{name:'Column 3, row 4',exact:true}).click();
  await expect(page.getByText('Move 1 tiles.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Confirm move'}).click();
  await page.getByRole('button',{name:/Arc.*2/}).click();
  await page.getByRole('button',{name:/Ink hound/}).click();
  // If not in range, moving and Guard remain available; confirmation never lies.
  await page.getByRole('button',{name:/Guard.*FREE/}).click();
  await page.getByRole('button',{name:'Confirm guard'}).click();
  await page.getByRole('button',{name:'End turn'}).click();
  await expect(page.locator('.round strong')).toHaveText('02');
  await page.screenshot({path:'qa/screenshots/combat.png',fullPage:true});
  await page.getByRole('button',{name:'Ⅱ Pause'}).click();
  await expect(page.getByRole('dialog',{name:'Journey paused'})).toBeVisible();
  await expect(page.locator('#battlefield')).toHaveCount(0);
  await page.getByRole('button',{name:'Return to the archive'}).click();
  await expect(page.locator('#battlefield canvas')).toBeVisible();
  expect(errors).toEqual([]);
});
test('invalid import preserves the current journey; export round-trips through the UI',async({page})=>{
  await page.goto('./');await page.getByRole('button',{name:'Enter the archive'}).click();
  await page.getByRole('button',{name:/Wear a borrowed authority/}).click();
  await page.getByRole('button',{name:'Ⅱ Pause'}).click();
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export save',exact:true}).click();
  const download=await downloadPromise,downloadPath=await download.path();
  await page.locator('#import-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"kind":"wrong"}')});
  await expect(page.getByRole('status')).toContainText('Could not import');
  await page.getByRole('button',{name:'Return to the archive'}).click();
  await expect(page.getByRole('heading',{name:'A river through the stacks.'})).toBeVisible();
  await page.getByRole('button',{name:/Drink the storm/}).click();
  await page.getByRole('button',{name:'Ⅱ Pause'}).click();
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#import-file').setInputFiles(downloadPath!);
  await page.getByRole('button',{name:'Return to the archive'}).click();
  await expect(page.getByRole('heading',{name:'A river through the stacks.'})).toBeVisible();
});
test('phone layout stays within viewport and permits a complete journey',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('./');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('tab',{name:'Appearance',exact:true}).click();
  await page.getByLabel('Name',{exact:true}).fill('Ash');
  await page.getByLabel('Pronouns',{exact:true}).fill('she / her');
  await expect(page.getByLabel('Name',{exact:true})).toHaveValue('Ash');
  await expect(page.getByLabel('Pronouns',{exact:true})).toHaveValue('she / her');
  await expect(page.locator('.character-name>span')).toContainText('she / her');
  await page.screenshot({path:'qa/screenshots/phone-workshop.png',fullPage:true});
  await page.getByRole('button',{name:'Enter the archive'}).click();
  for(const name of [/Wear a borrowed authority/,/Anchor the broken causeway/,/Share a little/,/Take Mara/,/Invoke the keeper/])await page.getByRole('button',{name}).click();
  await expect(page.getByText('PROMISE KEPT',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
