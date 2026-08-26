import React,{useEffect,useMemo,useState} from "react";
import { BarChart3, BriefcaseBusiness, Building2, Gavel, History, Home, Package, RefreshCw, Trophy, Wallet, Users, TrendingDown, TrendingUp, Info, Plus, Minus } from "lucide-react";
import { STOCKS, ITEMS, COMPANIES, WORKERS, initialMarket, initialCompanies, initialWorkers, advanceMarket, advanceCompanies, analystReport, companyValue, netWorth, workerUpkeep } from "./systems/economy";
import {JOBS} from "./systems/jobs";
import {saveGame,clearGame,getSession,clearSession,login,register,loadCloudGame,saveCloudGame} from "./systems/saveSystem";

const money=n=>`${Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} CR`;
const pct=n=>`${n>=0?"+":""}${Number(n).toFixed(1)}%`;

function fresh(){return {credits:10000,day:1,market:initialMarket(),companies:initialCompanies(),workers:initialWorkers(),history:[],auctions:[],achievements:[],jobCooldowns:{},seed:Math.floor(Math.random()*1e9),lastDayChange:0,started:true};}

export default function App(){
 const [user,setUser]=useState(getSession);
 const [game,setGame]=useState(null);
 const [loadingGame,setLoadingGame]=useState(false);
 const [page,setPage]=useState("dashboard");
 const [toast,setToast]=useState(null);
 const [selected,setSelected]=useState(null);

 useEffect(()=>{
   if(!user)return;
   setLoadingGame(true);
  loadCloudGame().then(cloudGame=>setGame(cloudGame)).catch(()=>{clearSession();setUser(null)}).finally(()=>setLoadingGame(false));
 },[user]);
 useEffect(()=>{if(game){saveGame(game);saveCloudGame(game).catch(()=>{})}},[game]);
 useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(null),2600);return()=>clearTimeout(t)}},[toast]);

 const wealth=game?netWorth(game):0;
 const stockValue=game?STOCKS.reduce((n,s)=>n+game.market.stocks[s.id].owned*game.market.stocks[s.id].price,0):0;
 const itemValue=game?ITEMS.reduce((n,i)=>n+game.market.items[i.id].owned*game.market.items[i.id].price,0):0;

 function notify(text,type="ok"){setToast({text,type})}
 function start(){setGame(fresh());setPage("dashboard")}
 function reset(){if(confirm("Reset your Credit Empire? This deletes the saved game.")){clearGame();setGame(null)}}
 function logout(){clearSession();setUser(null);setGame(null)}
 function transact(type,id,qty){
   qty=Number(qty);
   if(!Number.isInteger(qty)||qty<=0)return notify("Enter a valid positive quantity.","bad");
   const isStock=STOCKS.some(x=>x.id===id);
   const book=isStock?game.market.stocks[id]:game.market.items[id];
   const cost=book.price*qty;
   if(type==="buy"&&cost>game.credits)return notify("Not enough Credits.","bad");
   if(type==="sell"&&qty>book.owned)return notify("You don't own that many.","bad");
   setGame(g=>({...g,credits:g.credits+(type==="buy"?-cost:cost),market:{...g.market,[isStock?"stocks":"items"]:{...g.market[isStock?"stocks":"items"],[id]:{...book,owned:book.owned+(type==="buy"?qty:-qty)}}}}));
   notify(`${type==="buy"?"Bought":"Sold"} ${qty} ${isStock?"share(s)":"item(s)"} for ${money(cost)}.`);
 }
 function nextDay(){
   setGame(current=>{
     const result=advanceMarket(current.market,current.day,current.seed);
    const companyResult=advanceCompanies(current.companies||initialCompanies(),current.day,current.seed,current.workers||initialWorkers());
    const salary=workerUpkeep(current.workers||initialWorkers());
     const before=netWorth(current);
    const cooldowns=Object.fromEntries(Object.entries(current.jobCooldowns||{}).map(([id,days])=>[id,Math.max(0,days-1)]));
    const next={...current,credits:current.credits+companyResult.revenue-salary,companies:companyResult.companies,day:current.day+1,market:result,jobCooldowns:cooldowns,history:[...(current.history||[]),{day:current.day,event:result.event.name,netWorth:before}],lastDayChange:0};
     next.lastDayChange=netWorth(next)-before;
    notify(`Day ${next.day}: ${result.event.icon} ${result.event.name}${companyResult.revenue?` · Companies earned ${money(companyResult.revenue)}`:""}${salary?` · Payroll ${money(salary)}`:""}`);
     return next;
   });
 }
 function doJob(job){
   const cd=game.jobCooldowns[job.id]||0;
   if(cd>0)return notify(`${job.name} is ready in ${cd} day(s).`,"bad");
   setGame(g=>({...g,credits:g.credits+job.reward,jobCooldowns:{...g.jobCooldowns,[job.id]:job.cooldown}}));
   notify(`${job.icon} Job complete! +${money(job.reward)}`);
 }
 function advance(){ nextDay(); }

 if(!user) return <AuthScreen onAuth={setUser}/>;
 if(loadingGame) return <div className="start"><div className="startcard"><h1>Loading your empire...</h1></div></div>;
 if(!game) return <StartScreen onStart={start} user={user} onLogout={logout}/>;

 const gainers=[...STOCKS].sort((a,b)=>game.market.stocks[b.id].change-game.market.stocks[a.id].change);
 return <div className="app">
   <header className="topbar">
     <div className="brand"><div className="logo">CR</div><div><b>Credit Empire</b><small>Fictional finance simulator</small></div></div>
     <div className="topstats"><div><span>Credits</span><strong>{money(game.credits)}</strong></div><div><span>Net Worth</span><strong>{money(wealth)}</strong></div><button className="daybtn" onClick={advance}>📅 Day {game.day} · Next Day</button></div>
   </header>
   <div className="layout">
    <aside className="sidebar">
      <Nav icon={<Home/>} text="Dashboard" active={page==="dashboard"} onClick={()=>setPage("dashboard")}/>
      <Nav icon={<BarChart3/>} text="Stocks" active={page==="stocks"} onClick={()=>setPage("stocks")}/>
      <Nav icon={<Package/>} text="Market" active={page==="market"} onClick={()=>setPage("market")}/>
      <Nav icon={<Building2/>} text="Companies" active={page==="companies"} onClick={()=>setPage("companies")}/>
      <Nav icon={<Users/>} text="Workers" active={page==="workers"} onClick={()=>setPage("workers")}/>
      <Nav icon={<Gavel/>} text="Auctions" active={page==="auctions"} onClick={()=>setPage("auctions")}/>
      <Nav icon={<Wallet/>} text="Portfolio" active={page==="portfolio"} onClick={()=>setPage("portfolio")}/>
      <Nav icon={<BriefcaseBusiness/>} text="Jobs" active={page==="jobs"} onClick={()=>setPage("jobs")}/>
      <Nav icon={<History/>} text="History" active={page==="history"} onClick={()=>setPage("history")}/>
      <div className="sidebottom"><button onClick={()=>setPage("achievements")}><Trophy/> Achievements</button><button onClick={reset}><RefreshCw/> Reset Game</button></div>
    </aside>
    <main>
      <div className="disclaimer"><Info size={16}/> Simulation only — Credits and every company/asset are fictional. No real-money trading or financial advice.</div>
      {page==="dashboard"&&<Dashboard game={game} wealth={wealth} stockValue={stockValue} itemValue={itemValue} gainers={gainers} nextDay={advance}/>}
      {page==="stocks"&&<Stocks game={game} transact={transact} selected={selected} setSelected={setSelected}/>}
      {page==="market"&&<Market game={game} transact={transact}/>}
        {page==="companies" && <Companies game={game} setGame={setGame} notify={notify} />} 
        {page==="workers" && <Workers game={game} setGame={setGame} notify={notify} />} 
      {page==="portfolio"&&<Portfolio game={game} wealth={wealth} stockValue={stockValue} itemValue={itemValue}/>}
      {page==="jobs"&&<Jobs game={game} doJob={doJob}/>}
      {page==="auctions"&&<Auctions game={game} setGame={setGame} notify={notify}/>}
      {page==="history"&&<HistoryPage game={game}/>}
      {page==="achievements"&&<Achievements game={game}/>}
    </main>
   </div>
   {toast&&<div className={`toast ${toast.type}`}>{toast.text}</div>}
 </div>
}

function Nav({icon,text,active,onClick}){return <button className={active?"nav active":"nav"} onClick={onClick}>{icon}<span>{text}</span></button>}

function AuthScreen({onAuth}){
 const [mode,setMode]=useState("login");
 const [username,setUsername]=useState("");
 const [password,setPassword]=useState("");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 async function submit(event){
   event.preventDefault();setBusy(true);setError("");
   try{const user=mode==="login"?await login(username,password):await register(username,password);onAuth(user)}catch(error){setError(error.message)}finally{setBusy(false)}
 }
 return <div className="start"><form className="startcard authcard" onSubmit={submit}><div className="biglogo">CR</div><h1>Credit Empire</h1><p>{mode==="login"?"Log in to your empire.":"Create an account with a username only."}</p><label>Username<input autoComplete="username" value={username} onChange={event=>setUsername(event.target.value)} required /></label><label>Password<input type="password" autoComplete={mode==="login"?"current-password":"new-password"} value={password} onChange={event=>setPassword(event.target.value)} minLength="6" required /></label>{error&&<div className="autherror">{error}</div>}<button className="primary big" disabled={busy}>{busy?"Please wait...":mode==="login"?"Log In":"Create Account"}</button><button type="button" className="learn" onClick={()=>{setMode(mode==="login"?"register":"login");setError("")}}>{mode==="login"?"Need an account? Create one":"Already have an account? Log in"}</button></form></div>
}
function StartScreen({onStart,user,onLogout}){return <div className="start"><div className="startcard"><div className="biglogo">CR</div><h1>Credit Empire</h1><p>Welcome back, <b>{user.username}</b>. Build a fictional fortune, trade stocks, and learn how markets move.</p><div className="fakebalance">10,000 CR</div><button className="primary big" onClick={onStart}>🚀 Start New Game</button><button className="learn" onClick={onLogout}>Log out</button><div className="rules"><span>📈 Fictional stocks</span><span>💎 Dynamic items</span><span>🏷️ NPC auctions</span><span>👷 Jobs</span></div></div></div>}

function Dashboard({game,wealth,stockValue,itemValue,gainers,nextDay}){
 const best=gainers[0], worst=gainers.at(-1);
 return <Page title="Dashboard" sub="Your command center for the fictional economy.">
  <div className="hero"><div><span className="eyebrow">DAY {game.day}</span><h2>Build your Credit Empire.</h2><p>Every day changes the market. Make your move, then advance the day to see what happens.</p></div><button className="primary" onClick={nextDay}>📅 Advance Day</button></div>
  <div className="cards four"><Stat title="Credits" value={money(game.credits)} icon="💰"/><Stat title="Net Worth" value={money(wealth)} icon="🏦"/><Stat title="Stocks" value={money(stockValue)} icon="📈"/><Stat title="Items" value={money(itemValue)} icon="💎"/></div>
  <div className="grid2"><section className="panel"><SectionTitle title="Today's market" icon="⚡"/><div className="marketmove"><MiniMarket title="Top gainer" stock={best} data={game.market.stocks[best.id]}/><MiniMarket title="Biggest drop" stock={worst} data={game.market.stocks[worst.id]}/></div></section>
  <section className="panel"><SectionTitle title="How to play" icon="🧠"/><ul className="tips"><li>Buy low and sell higher to grow your fictional wealth.</li><li>Spread your assets instead of putting everything in one place.</li><li>Jobs give steady income while markets can be risky.</li><li>Press <b>Next Day</b> to update prices and trigger events.</li></ul></section></div>
  <section className="panel"><SectionTitle title="Recent events" icon="📰"/>{game.history.length?<div className="eventlist">{game.history.slice(-5).reverse().map((h,i)=><div className="eventrow" key={i}><span>📅 Day {h.day}</span><b>{h.event}</b><small>Net worth: {money(h.netWorth)}</small></div>)}</div>:<Empty text="No market events yet. Advance the day to start the economy."/ >}</section>
 </Page>
}

function Stat({title,value,icon}){return <div className="stat"><span>{icon}</span><div><small>{title}</small><strong>{value}</strong></div></div>}
function SectionTitle({title,icon}){return <div className="sectitle"><h3>{icon} {title}</h3></div>}
function MiniMarket({title,stock,data}){return <div className="mini"><small>{title}</small><b>{stock.name}</b><strong>{money(data.price)}</strong><span className={data.change>=0?"up":"down"}>{pct(data.change)}</span></div>}
function Page({title,sub,children}){return <div className="page"><div className="pagetitle"><h1>{title}</h1><p>{sub}</p></div>{children}</div>}
function Empty({text}){return <div className="empty">{text}</div>}

function Stocks({game,transact,selected,setSelected}){
 return <Page title="Stock Market" sub="All companies are fictional. Prices are generated locally and can rise or fall.">
  <div className="cards three"><Stat title="Owned stock value" value={money(STOCKS.reduce((n,s)=>n+game.market.stocks[s.id].owned*game.market.stocks[s.id].price,0))} icon="📊"/><Stat title="Shares owned" value={STOCKS.reduce((n,s)=>n+game.market.stocks[s.id].owned,0)} icon="🧾"/><Stat title="Companies" value={STOCKS.length} icon="🏢"/></div>
  <div className="stockgrid">{STOCKS.map(s=><StockCard key={s.id} s={s} data={game.market.stocks[s.id]} buy={(q)=>transact("buy",s.id,q)} sell={(q)=>transact("sell",s.id,q)} selected={selected===s.id} setSelected={()=>setSelected(selected===s.id?null:s.id)}/>)}</div>
 </Page>
}
function StockCard({s,data,buy,sell,selected,setSelected}){
 const [q,setQ]=useState(1);
 return <div className="assetcard"><div className="assethead"><div><b>{s.name}</b><small>{s.ticker} · {s.sector}</small></div><span className={data.change>=0?"pill up":"pill down"}>{pct(data.change)}</span></div><strong className="price">{money(data.price)}</strong><Spark data={data.history} positive={data.change>=0}/><div className="owned">You own <b>{data.owned}</b> share(s)</div>{selected&&<div className="explainer">You own {data.owned} shares × {money(data.price)} each = <b>{money(data.owned*data.price)}</b>. The price changes when a new day begins.</div>}<div className="trade"><input type="number" min="1" value={q} onChange={e=>setQ(e.target.value)}/><button onClick={()=>buy(q)}>Buy</button><button className="secondary" onClick={()=>sell(q)}>Sell</button></div><button className="learn" onClick={setSelected}><Info size={14}/> {selected?"Hide":"Explain this stock"}</button></div>
}
function Spark({data}){const min=Math.min(...data),max=Math.max(...data);const pts=data.map((v,i)=>`${i*(100/(data.length-1||1))},${100-(v-min)/(max-min||1)*100}`).join(" ");return <svg className="spark" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={pts}/></svg>}

function Market({game,transact}){return <Page title="Player Market" sub="Trade fictional resources whose values react to supply and demand."><div className="itemgrid">{ITEMS.map(i=>{const d=game.market.items[i.id];return <ItemCard key={i.id} i={i} d={d} buy={q=>transact("buy",i.id,q)} sell={q=>transact("sell",i.id,q)}/>})}</div></Page>}

function Companies({game,setGame,notify}){
 const holdings=game.companies||initialCompanies();
 function buy(company){
   if(game.credits<company.price)return notify("Not enough Credits to buy this company.","bad");
   setGame(g=>({...g,credits:g.credits-company.price,companies:{...(g.companies||initialCompanies()),[company.id]:{...holdings[company.id],owned:true}}}));
   notify(`${company.name} is now part of your empire.`);
 }
 function changeStrategy(company,strategy){setGame(g=>({...g,companies:{...(g.companies||initialCompanies()),[company.id]:{...holdings[company.id],strategy}}}));notify(`${company.name} strategy changed to ${strategy}.`)}
 function invest(company){
   const amount=Math.min(5000,Math.floor(game.credits/1000)*1000);
   if(amount<1000)return notify("You need at least 1,000 Credits to invest.","bad");
   setGame(g=>({...g,credits:g.credits-amount,companies:{...(g.companies||initialCompanies()),[company.id]:{...holdings[company.id],investment:holdings[company.id].investment+amount}}}));
   notify(`Invested ${money(amount)} into ${company.name}.`);
 }
 function upgrade(company){
   const holding=holdings[company.id], cost=company.price*holding.level*.35;
   if(game.credits<cost)return notify("Not enough Credits for this upgrade.","bad");
   setGame(g=>({...g,credits:g.credits-cost,companies:{...(g.companies||initialCompanies()),[company.id]:{...holdings[company.id],level:holding.level+1}}}));
   notify(`${company.name} upgraded to level ${holding.level+1}.`);
 }
 return <Page title="Company Holdings" sub="Buy the businesses behind the economy, then decide how they grow."><div className="cards three"><Stat title="Company value" value={money(companyValue(holdings))} icon="🏢"/><Stat title="Businesses owned" value={COMPANIES.filter(c=>holdings[c.id]?.owned).length} icon="🧾"/><Stat title="Operating income" value={money(COMPANIES.reduce((n,c)=>n+(holdings[c.id]?.lastRevenue||0),0))} icon="💵"/></div><div className="companygrid">{COMPANIES.map(company=>{const holding=holdings[company.id];const cost=company.price*holding.level*.35;return <div className={holding.owned?"companycard ownedcompany":"companycard"} key={company.id}><div className="companytop"><span className="companyicon">{company.icon}</span><div><h3>{company.name}</h3><small>{company.sector} · Level {holding.level}</small></div></div><p>{company.description}</p>{holding.owned?<><div className="companystats"><span>Value <b>{money(companyValue({[company.id]:holding}))}</b></span><span>Last income <b className="up">+{money(holding.lastRevenue)}</b></span><span>Invested <b>{money(holding.investment)}</b></span></div><label className="selectlabel">Operating strategy<select value={holding.strategy} onChange={e=>changeStrategy(company,e.target.value)}><option value="balanced">Balanced</option><option value="growth">Growth</option><option value="efficiency">Efficiency</option></select></label><div className="companyactions"><button className="primary" onClick={()=>invest(company)}>Invest up to 5,000 CR</button><button className="secondary" onClick={()=>upgrade(company)}>Upgrade · {money(cost)}</button></div></>:<><strong className="price">{money(company.price)}</strong><button className="primary" onClick={()=>buy(company)}>Buy company</button></>}</div>})}</div></Page>
}

function Workers({game,setGame,notify}){
 const workers=game.workers||initialWorkers();
 const analyst=workers.analyst?.hired?analystReport(game.market):null;
 function hire(worker){
   if(game.credits<worker.price)return notify("Not enough Credits to hire this worker.","bad");
   setGame(g=>({...g,credits:g.credits-worker.price,workers:{...(g.workers||initialWorkers()),[worker.id]:{hired:true,days:0}}}));
   notify(`${worker.name} joined your empire.`);
 }
 return <Page title="Your Workforce" sub="Hire specialists who improve your empire and keep you informed."><div className="cards three"><Stat title="Workers hired" value={WORKERS.filter(worker=>workers[worker.id]?.hired).length} icon="👥"/><Stat title="Daily payroll" value={money(workerUpkeep(workers))} icon="💳"/><Stat title="Analyst status" value={workers.analyst?.hired?"Active":"Not hired"} icon="🧠"/></div>{analyst&&<section className="panel analystpanel"><SectionTitle title="Analyst Briefing" icon="🧠"/><div className="briefinggrid"><Brief title="Biggest rise" item={analyst.biggestRise.asset.name} value={analyst.biggestRise.data.change} detail="Current stock momentum"/><Brief title="Biggest crash" item={analyst.biggestCrash.asset.name} value={analyst.biggestCrash.data.change} detail="Current stock momentum"/><Brief title="Market to watch" item={analyst.strongestMarket.asset.name} value={analyst.strongestMarket.data.change} detail="Strongest resource demand"/><Brief title="Market under pressure" item={analyst.weakestMarket.asset.name} value={analyst.weakestMarket.data.change} detail="Weakest resource movement"/></div><div className="recommendation"><b>Investment call:</b> Consider {analyst.stockTip.asset.name} at {money(analyst.stockTip.data.price)}. It is {analyst.stockTip.data.change>0?"showing positive momentum":"trading below its starting price"}; review the trend before spending Credits.</div></section>}<div className="workergrid">{WORKERS.map(worker=>{const hired=workers[worker.id]?.hired;return <div className={hired?"workercard hiredworker":"workercard"} key={worker.id}><div className="companytop"><span className="companyicon">{worker.icon}</span><div><h3>{worker.name}</h3><small>{hired?"Employed · Active every day":"Available to hire"}</small></div></div><p>{worker.description}</p><div className="workerpay"><span>Hiring fee <b>{money(worker.price)}</b></span><span>Daily salary <b>{money(worker.salary)}</b></span></div>{hired?<div className="hiredbadge">✓ Working in your empire</div>:<button className="primary" onClick={()=>hire(worker)}>Hire worker</button>}</div>})}</div></Page>
}

function Brief({title,item,value,detail}){return <div className="brief"><small>{title}</small><b>{item}</b><strong className={value>=0?"up":"down"}>{pct(value)}</strong><span>{detail}</span></div>}
function ItemCard({i,d,buy,sell}){const [q,setQ]=useState(1);return <div className="itemcard"><div className="itemicon">{i.icon}</div><div className="assethead"><div><b>{i.name}</b><small>Supply {d.supply} · Demand {d.demand}</small></div><span className={d.change>=0?"pill up":"pill down"}>{pct(d.change)}</span></div><strong className="price">{money(d.price)}</strong><p className="muted">{d.change>=0?"Demand is pushing this value up.":"Supply/demand pressure is pushing this value down."}</p><div className="owned">Owned: <b>{d.owned}</b></div><div className="trade"><input type="number" min="1" value={q} onChange={e=>setQ(e.target.value)}/><button onClick={()=>buy(q)}>Buy</button><button className="secondary" onClick={()=>sell(q)}>Sell</button></div></div>}

function Portfolio({game,wealth,stockValue,itemValue}){const initial=10000;const overall=wealth-initial;const best=STOCKS.map(s=>({s,d:game.market.stocks[s.id]})).filter(x=>x.d.owned).sort((a,b)=>(b.d.price-b.d.previous)-(a.d.price-a.d.previous))[0];return <Page title="Portfolio" sub="A simple view of what your fictional empire is worth."><div className="cards four"><Stat title="Cash" value={money(game.credits)} icon="💰"/><Stat title="Stock value" value={money(stockValue)} icon="📈"/><Stat title="Item value" value={money(itemValue)} icon="💎"/><Stat title="Net worth" value={money(wealth)} icon="🏆"/></div><div className="panel"><SectionTitle title="Performance" icon="📊"/><div className="perf"><div><small>Overall profit/loss</small><b className={overall>=0?"up":"down"}>{money(overall)} ({pct(overall/initial*100)})</b></div><div><small>Today's change</small><b className={game.lastDayChange>=0?"up":"down"}>{money(game.lastDayChange)}</b></div><div><small>Best current mover</small><b>{best?best.s.name:"No stock owned yet"}</b></div></div></div><div className="panel"><SectionTitle title="Holdings" icon="🧾"/><table><thead><tr><th>Asset</th><th>Owned</th><th>Price</th><th>Value</th><th>Day</th></tr></thead><tbody>{STOCKS.map(s=>{const d=game.market.stocks[s.id];return d.owned?<tr key={s.id}><td>{s.name}</td><td>{d.owned}</td><td>{money(d.price)}</td><td>{money(d.price*d.owned)}</td><td className={d.change>=0?"up":"down"}>{pct(d.change)}</td></tr>:null})}{ITEMS.map(i=>{const d=game.market.items[i.id];return d.owned?<tr key={i.id}><td>{i.icon} {i.name}</td><td>{d.owned}</td><td>{money(d.price)}</td><td>{money(d.price*d.owned)}</td><td className={d.change>=0?"up":"down"}>{pct(d.change)}</td></tr>:null})}</tbody></table></div></Page>}

function Jobs({game,doJob}){return <Page title="Jobs" sub="Earn steady Credits without depending entirely on the market."><div className="jobgrid">{JOBS.map(j=>{const cd=game.jobCooldowns[j.id]||0;return <div className="jobcard" key={j.id}><div className="jobicon">{j.icon}</div><h3>{j.name}</h3><p>{j.desc}</p><small>Task: {j.task}</small><strong>+{money(j.reward)}</strong><button disabled={cd>0} className="primary" onClick={()=>doJob(j)}>{cd?`Ready in ${cd} day(s)`:"Complete Job"}</button></div>})}</div></Page>}

function Auctions({game,setGame,notify}){
  const [bid,setBid]=useState({});
  const [custom,setCustom]=useState("");

  const active=game.auctions.filter(a=>!a.done);

  const create=()=>{
    const item=ITEMS[Math.floor(Math.random()*ITEMS.length)];
    const start=Math.round(item.base*(.7+Math.random()*.8));

    const a={
      id:Date.now(),
      name:`Rare ${item.name}`,
      icon:item.icon,
      current:start,
      buyout:start*2.5,
      time:3,
      bidder:"Starting Bid",
      done:false
    };

    setGame(g=>({
      ...g,
      auctions:[...g.auctions,a]
    }));

    notify("New auction created.");
  };

  const place=(a)=>{
    const amount=Number(bid[a.id]||a.current+100);

    if(amount<=a.current)
      return notify("Your bid must beat the current bid.","bad");

    if(amount>game.credits)
      return notify("Not enough Credits.","bad");

    setGame(g=>({
      ...g,
      credits:g.credits-amount,
      auctions:g.auctions.map(x=>
        x.id===a.id
          ? {
              ...x,
              current:amount,
              bidder:"You",
              playerBid:amount
            }
          : x
      )
    }));

    notify(`Bid placed: ${money(amount)}`);
  };

  return (
    <Page
      title="Auction Hall"
      sub="NPC-style auctions for fictional collectibles. Bids are game Credits only."
    >
      <div className="hero small">
        <div>
          <h2>🏷️ Auction House</h2>
          <p>
            NPCs can bid aggressively as days pass. Win rare items for your collection.
          </p>
        </div>

        <button className="primary" onClick={create}>
          + Create NPC Auction
        </button>
      </div>

      {active.length ? (
        <div className="auctiongrid">
          {active.map(a=>(
            <div className="auction" key={a.id}>
              <div className="auctiontop">
                <span>{a.icon}</span>

                <div>
                  <b>{a.name}</b>
                  <small>
                    {a.bidder==="You" ? "You're winning!" : a.bidder}
                  </small>
                </div>
              </div>

              <div className="bidline">
                <span>Current bid</span>
                <strong>{money(a.current)}</strong>
              </div>

              <div className="bidline">
                <span>Buyout</span>
                <strong>{money(a.buyout)}</strong>
              </div>

              <div className="timer">
                ⏱️ {a.time} day(s) left
              </div>

              <div className="trade">
                <input
                  type="number"
                  min={a.current+1}
                  placeholder={a.current+100}
                  value={bid[a.id]||""}
                  onChange={e=>
                    setBid({
                      ...bid,
                      [a.id]:e.target.value
                    })
                  }
                />

                <button onClick={()=>place(a)}>
                  Bid
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty text="No active auctions. Create one to get the hall moving."/>
      )}

      <section className="panel">
        <SectionTitle title="Auction history" icon="📜"/>

        {game.auctions.filter(a=>a.done).length ? (
          <div className="eventlist">
            {game.auctions
              .filter(a=>a.done)
              .map(a=>(
                <div className="eventrow" key={a.id}>
                  <span>{a.icon} {a.name}</span>
                  <b>{money(a.current)}</b>
                  <small>{a.winner||"NPC"} won</small>
                </div>
              ))}
          </div>
        ) : (
          <Empty text="Completed auctions will appear here."/>
        )}
      </section>
    </Page>
  );
}

function HistoryPage({game}){return <Page title="History" sub="Your recent market timeline.">{game.history.length?<div className="timeline">{game.history.slice().reverse().map((h,i)=><div className="timelineitem" key={i}><div className="dot"></div><div><small>DAY {h.day}</small><h3>{h.event}</h3><p>Recorded net worth: {money(h.netWorth)}</p></div></div>)}</div>:<Empty text="Your timeline is empty. Advance the day to generate your first market event."/ >}</Page>}

function Achievements({game}){const nw=netWorth(game);const list=[["💰","First 1,000 CR",game.credits>=1000],["📈","First stock purchase",STOCKS.some(s=>game.market.stocks[s.id].owned>0)],["💎","First item purchase",ITEMS.some(i=>game.market.items[i.id].owned>0)],["🏆","10,000 CR net worth",nw>=10000],["👑","100,000 CR net worth",nw>=100000],["🧾","Own 100 shares",STOCKS.reduce((n,s)=>n+game.market.stocks[s.id].owned,0)>=100],["🔥","Make a 50% profit",nw>=15000],["📉","Survive a market crash",game.history.some(h=>h.event.includes("Market Crash"))]];return <Page title="Achievements" sub="Milestones turn your market journey into a collection game."><div className="achgrid">{list.map(([icon,name,done])=><div className={done?"achievement done":"achievement"} key={name}><span>{icon}</span><div><b>{name}</b><small>{done?"Unlocked!":"Keep playing to unlock."}</small></div>{done&&<Trophy size={20}/>}</div>)}</div></Page>}
