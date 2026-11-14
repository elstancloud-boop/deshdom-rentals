import { chromium, devices } from "playwright";
const B="http://localhost:3100"; const b = await chromium.launch();
const login = async (p,e,pw,n="/account")=>{ await p.goto(B+"/login"); await p.fill("#email",e); await p.fill("#password",pw); await p.click("button:has-text('Sign in')"); await p.waitForTimeout(1800); };
const run = async (w,h,tag)=>{
  const ctx = await b.newContext({ viewport:{width:w,height:h}, isMobile:true, hasTouch:true, deviceScaleFactor:2 }); const p = await ctx.newPage();
  const pages = ["/","/browse","/browse?cat=outdoor","/p/sony-a7-iv-mirrorless-body","/cart","/login","/register"];
  const check = async (u)=>{ await p.goto(B+u,{waitUntil:"networkidle"}); await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=400){scrollTo(0,y);await new Promise(r=>setTimeout(r,60))}scrollTo(0,0)}); await p.waitForTimeout(400);
    const r = await p.evaluate(()=>{const W=innerWidth; const bad=[...document.querySelectorAll("body *")].filter(e=>{const r=e.getBoundingClientRect(); return r.width>0 && (r.right>W+1) && !e.closest(".ticker,[class*=overflow-x-auto],[class*=overflow-hidden]")}).slice(0,4).map(e=>e.tagName+"."+String(e.className).slice(0,50)); const small=[...document.querySelectorAll("a,button,input,select")].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.height<32)}).length; return {sw:document.documentElement.scrollWidth,W,bad,small}});
    console.log(tag,u,JSON.stringify(r)); await p.screenshot({path:`m_${tag}_${u.replace(/\W+/g,"_")}.png`,fullPage:true}); };
  for (const u of pages) await check(u);
  await login(p,"demo@deshdom.test","DemoPass2026");
  await p.goto(B+"/p/sony-a7-iv-mirrorless-body"); const d=await p.$$("[role=gridcell]:not([disabled])"); await d[3].click(); await d[5].click(); await p.click("button:has-text('Add to kit list')"); await p.waitForTimeout(600);
  for (const u of ["/cart","/checkout","/account"]) await check(u);
  await ctx.close();
};
await run(390,844,"390"); await run(360,740,"360"); await run(320,640,"320");
await b.close();
