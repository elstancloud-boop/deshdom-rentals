import { chromium } from "playwright";
const B = "http://localhost:3100"; const b = await chromium.launch();
const results = []; const ok = (n, c, x="") => { results.push([c?"PASS":"FAIL", n, x]); };
const errs = [];
const mk = async () => { const c = await b.newContext({ viewport: { width: 1360, height: 900 } }); const p = await c.newPage(); p.on("console", m => { if (m.type()==="error") errs.push(m.text()); }); p.on("pageerror", e => errs.push("PAGEERR "+e.message)); return p; };
const email = `t${Date.now()}@example.com`;
const p = await mk();

// register
await p.goto(B+"/register"); await p.fill("#name","Test Person"); await p.fill("#email",email); await p.fill("#password","short");
await p.click("button:has-text('Create account')"); await p.waitForTimeout(800);
ok("weak password rejected", (await p.textContent("body")).includes("at least 10"));
await p.fill("#password","GoodPass12345"); await p.click("button:has-text('Create account')"); await p.waitForURL("**/account", {timeout:8000});
ok("register + session", (await p.textContent("body")).includes("Hi Test"));
const cookies = await p.context().cookies(); const sc = cookies.find(c=>c.name==="kt_session");
ok("session cookie httpOnly+lax", sc?.httpOnly && sc.sameSite==="Lax");

// pick dates on home
await p.goto(B+"/");
const days = await p.$$("[role=gridcell]:not([disabled])");
await days[2].click(); await days[4].click();
await p.click("button:has-text(\"See what's free\")"); await p.waitForURL("**/browse");
ok("dates carried to browse", (await p.textContent("body")).includes("Showing stock for"));

// product + add
await p.goto(B+"/p/sony-a7-iv-mirrorless-body");
await p.click("button:has-text('Add to kit list')"); await p.waitForSelector("text=Added to your kit list");
ok("add to cart", true);
await p.goto(B+"/cart"); const cartTxt = await p.textContent("body");
ok("cart shows item + total", cartTxt.includes("Sony A7 IV") && cartTxt.includes("Due today"), cartTxt.match(/Due today\s*\$[\d,]+/)?.[0]);
// coupon
await p.fill("#code","BOGUS"); await p.click("button:has-text('Apply')"); await p.waitForSelector("text=isn't valid");
await p.fill("#code","WELCOME10"); await p.click("button:has-text('Apply')"); await p.waitForSelector("text=10% off applied"); ok("coupon", true);
await p.goto(B+"/cart"); ok("discount line", (await p.textContent("body")).includes("WELCOME10"));
await p.screenshot({path:"cart.png"});
console.log((await p.textContent("main")).slice(0,500)); await p.click("text=Continue to checkout"); await p.waitForURL("**/checkout");
await p.screenshot({path:"checkout.png"});
await p.click("button:has-text('Confirm booking')"); await p.waitForTimeout(500);
ok("terms required", (await p.url()).includes("/checkout"));
await p.check("input[name=terms]"); await p.click("button:has-text('Confirm booking')"); await p.waitForURL("**/account/bookings/**",{timeout:10000});
const ref = p.url().match(/KT-[0-9A-F]+/)[0]; ok("booking created "+ref, true);
ok("paid + confirmed", (await p.textContent("body")).includes("You're booked"));
await p.screenshot({path:"booking.png"});

// IDOR: other user can't see
const q = await mk(); await q.goto(B+"/login"); await q.fill("#email","ada@example.com"); await q.fill("#password","SeedPass2026x0"); await q.click("button:has-text('Sign in')").catch(()=>{});
await q.waitForURL("**/account",{timeout:8000}).catch(()=>{});
const r1 = await q.goto(B+"/account/bookings/"+ref); ok("IDOR blocked (404)", r1.status()===404, String(r1.status()));
// customer cannot access admin
const r2 = await q.goto(B+"/admin"); ok("customer redirected from /admin", !q.url().includes("/admin"), q.url());
// anonymous
const a = await mk(); await a.goto(B+"/admin/audit"); ok("anon -> login", a.url().includes("/login"));
// open redirect
await a.goto(B+"/login?next=//evil.com"); await a.fill("#email","demo@deshdom.test"); await a.fill("#password","DemoPass2026"); await a.click("button:has-text('Sign in')"); await a.waitForURL("**/account",{timeout:8000}).catch(()=>{});
ok("open redirect neutralised", new URL(a.url()).host==="localhost:3100", a.url());

// double booking: stock 3 for sony; try booking 4 units same dates
const c = await mk(); await c.goto(B+"/login"); await c.fill("#email","demo@deshdom.test"); await c.fill("#password","DemoPass2026"); await c.click("button:has-text('Sign in')"); await c.waitForURL("**/account");
await c.goto(B+"/p/canon-rf-24-70mm-f-2-8l"); // stock 2
const d = await c.$$("[role=gridcell]:not([disabled])"); await d[8].click(); await d[9].click();
for (let i=0;i<2;i++){ await c.click("button[aria-label=More]").catch(()=>{}); }
await c.click("button:has-text('Add to kit list')"); await c.waitForSelector("text=Added to your kit list");
await c.goto(B+"/cart"); const qtyTxt=(await c.inputValue("input[type=number]")); ok("qty capped to stock on product page", qtyTxt==="2", qtyTxt);
// tamper cart quantity to 5 via update
await c.fill("input[type=number]","5"); await c.click("button:has-text('Update')"); await c.waitForTimeout(800); await c.goto(B+"/cart");
ok("over-stock flagged in cart", (await c.textContent("body")).includes("Only 2 left")); 
ok("checkout blocked", await c.locator("button:has-text('Fix the items')").count()===1);

// admin
const ad = await mk(); await ad.goto(B+"/login?next=/admin"); await ad.fill("#email","admin@deshdom.test"); await ad.fill("#password","ChangeMe!2026-Admin"); await ad.click("button:has-text('Sign in')"); await ad.waitForURL(u=>u.pathname==="/admin",{timeout:8000});
ok("admin login", (await ad.textContent("body")).includes("Overview")); await ad.screenshot({path:"admin.png", fullPage:true});
await ad.goto(B+"/admin/bookings?q="+ref); await ad.click("button:has-text('Mark picked up')"); await ad.waitForSelector("text=Mark returned"); ok("admin: picked up", true);
await ad.click("button:has-text('Mark returned')"); await ad.waitForTimeout(800); await ad.reload(); ok("admin: returned", (await ad.textContent("body")).includes("Returned"));
await ad.goto(B+"/admin/products/new"); await ad.fill("#name","Test Drone"); await ad.fill("#summary","A drone for tests"); await ad.fill("#description","A long enough description for the test."); await ad.fill("#daily","40"); await ad.fill("#deposit","100");
await ad.click("button:has-text('Save item')"); await ad.waitForURL("**/admin/products"); ok("admin: product created", (await ad.textContent("body")).includes("Test Drone"));
await ad.goto(B+"/admin/audit"); ok("audit log has entries", (await ad.textContent("body")).includes("booking.returned"));
await ad.screenshot({path:"audit.png"});
// review after return (as the test user)
await p.goto(B+"/p/sony-a7-iv-mirrorless-body"); ok("review form for verified renter", await p.locator("text=Rate your rental").count()===1);

// rate limit
const rl = await mk(); let locked=false;
for (let i=0;i<10;i++){ await rl.goto(B+"/login"); await rl.fill("#email","ratelimit@example.com"); await rl.fill("#password","wrongwrong1"); await rl.click("button:has-text('Sign in')"); await rl.waitForTimeout(450); if ((await rl.textContent("body")).includes("Too many attempts")) { locked=true; break; } }
ok("login rate limit kicks in", locked);

for (const r of results) console.log(r.join(" | ")); console.log("console errors:", errs.length? errs.slice(0,5): "none"); await b.close();
