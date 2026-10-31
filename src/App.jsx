import React,{useEffect,useMemo,useRef,useState} from "react";
import { BarChart3, BriefcaseBusiness, Building2, Gavel, History, Home, Package, RefreshCw, Trophy, Wallet, Users, Send, TrendingDown, TrendingUp, Info, Plus, Minus, MessageCircle, PhoneCall } from "lucide-react";
import { STOCKS, ITEMS, COMPANIES, WORKERS, initialMarket, initialCompanies, initialWorkers, advanceMarket, advanceCompanies, analystReport, companyValue, netWorth, workerUpkeep } from "./systems/economy";
import { advanceAuctions, createInvestorCall, resolveItemId } from "./systems/engagement";
import {JOBS} from "./systems/jobs";
import {ACHIEVEMENTS} from "./systems/achievements";
import {saveGame,clearGame,getSession,getToken,clearSession,login,register,restoreSession,loadCloudGame,saveCloudGame,transferCredits} from "./systems/saveSystem";

const money=n=>`${Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} CR`;
const pct=n=>`${n>=0?"+":""}${Number(n).toFixed(1)}%`;

function fresh(){return {credits:10000,day:1,market:initialMarket(),companies:initialCompanies(),workers:initialWorkers(),history:[],auctions:[],messages:[],achievements:[],jobsCompleted:{},jobCooldowns:{},tutorialCompleted:false,seed:Math.floor(Math.random()*1e9),lastDayChange:0,started:true};}

function restoreGame(saved){
 const initial=fresh();
 const market=saved.market||{};
 return {
   ...initial,
   ...saved,
   market:{...initial.market,...market,stocks:{...initial.market.stocks,...market.stocks},items:{...initial.market.items,...market.items}},
   companies:{...initialCompanies(),...saved.companies},
   workers:{...initialWorkers(),...saved.workers},
   history:Array.isArray(saved.history)?saved.history:[],
   achievements:Array.isArray(saved.achievements)?saved.achievements.filter(id=>typeof id==="string"):[],
   jobsCompleted:saved.jobsCompleted&&typeof saved.jobsCompleted==="object"?saved.jobsCompleted:{},
   jobCooldowns:saved.jobCooldowns&&typeof saved.jobCooldowns==="object"?saved.jobCooldowns:{},
   tutorialCompleted:saved.tutorialCompleted??true,
   auctions:Array.isArray(saved.auctions)?saved.auctions.map(auction=>({...auction,itemId:auction.itemId||resolveItemId(auction.name),playerBid:Number(auction.playerBid)||0})):[],
   messages:Array.isArray(saved.messages)?saved.messages:[]
 };
}

export default function App(){
 const [user,setUser]=useState(getSession);
 const [game,setGame]=useState(null);
 const [loadingGame,setLoadingGame]=useState(false);
 const [page,setPage]=useState("dashboard");
 const [toast,setToast]=useState(null);
 const [selected,setSelected]=useState(null);
 const [selectedMessage,setSelectedMessage]=useState(null);
 const [incomingCall,setIncomingCall]=useState(null);
 const saveFailureShown=useRef(false);

 useEffect(()=>{
   if(!user)return;
   const token=getToken();
   setLoadingGame(true);
   restoreSession().then(canonicalUser=>{
     if(!canonicalUser)return;
     if(canonicalUser.id!==user.id){
       setGame(null);
       setUser(canonicalUser);
       return;
     }
     if(canonicalUser.username!==user.username)setUser(canonicalUser);
     return loadCloudGame().then(cloudGame=>setGame(cloudGame?restoreGame(cloudGame):null));
   }).catch(()=>{
     if(token===getToken()){clearSession();setUser(null);setGame(null)}
   }).finally(()=>setLoadingGame(false));
 },[user]);
 useEffect(()=>{
   if(!game)return;
   saveGame(game);
   saveCloudGame(game).then(()=>{saveFailureShown.current=false}).catch(error=>{
     console.error("Could not save the game to the server.",error);
     if(!saveFailureShown.current){
       saveFailureShown.current=true;
       setToast({text:"Cloud save failed. Your local save is still available; check your connection and log in again.",type:"bad"});
     }
   });
 },[game]);
 useEffect(()=>{
   if(!game)return;
   const claimed=new Set(game.achievements||[]);
   const ready=ACHIEVEMENTS.filter(achievement=>!claimed.has(achievement.id)&&achievement.check(game));
   if(!ready.length)return;
   const reward=ready.reduce((total,achievement)=>total+(achievement.reward||0),0);
   setGame(current=>{
     const currentClaims=new Set(current.achievements||[]);
     const newlyCompleted=ACHIEVEMENTS.filter(achievement=>!currentClaims.has(achievement.id)&&achievement.check(current));
     if(!newlyCompleted.length)return current;
     return {...current,credits:current.credits+newlyCompleted.reduce((total,achievement)=>total+(achievement.reward||0),0),achievements:[...currentClaims,...newlyCompleted.map(achievement=>achievement.id)]};
   });
   const extremeCount=ready.filter(achievement=>achievement.extreme).length;
   setToast({text:reward?`${ready.length} achievement(s) unlocked! ${money(reward)} prize${extremeCount===1?"":"s"} earned.`:`${ready.length} achievement(s) unlocked!`,type:"ok"});
 },[game]);
 useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(null),2600);return()=>clearTimeout(t)}},[toast]);

 const wealth=game?netWorth(game):0;
 const stockValue=game?STOCKS.reduce((n,s)=>n+game.market.stocks[s.id].owned*game.market.stocks[s.id].price,0):0;
 const itemValue=game?ITEMS.reduce((n,i)=>n+game.market.items[i.id].owned*game.market.items[i.id].price,0):0;

 function notify(text,type="ok"){setToast({text,type})}
 function start(){setGame(fresh());setPage("dashboard")}
 function reset(){if(confirm("Reset your Credit Empire? This deletes the saved game.")){clearGame();setGame(null)}}
 function logout(){clearSession();setUser(null);setGame(null);setSelectedMessage(null);setIncomingCall(null)}
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
   const current=game;
   const result=advanceMarket(current.market,current.day,current.seed);
   const companyResult=advanceCompanies(current.companies,current.day,current.seed,current.workers);
   const salary=workerUpkeep(current.workers);
   const auctions=advanceAuctions(current.auctions,current.seed,current.day,result.event.auctionBoost,current.workers?.auctioneer?.hired);
   const market={...result,items:{...result.items}};
   for(const itemId of auctions.awards){
     const item=market.items[itemId];
     market.items[itemId]={...item,owned:item.owned+1};
   }
   const investorCall=createInvestorCall(current.companies,current.day,current.seed,current.workers?.broker?.hired);
   const before=netWorth(current);
   const cooldowns=Object.fromEntries(Object.entries(current.jobCooldowns||{}).map(([id,days])=>[id,Math.max(0,days-1)]));
   let profitShareTotal=0;
   const messages=(current.messages||[]).map(thread=>{
     if(thread.status!=="accepted"||!thread.countered||thread.type!=="invest"||!thread.profitShareRate||!thread.profitShareCap)return thread;
     const holding=companyResult.companies[thread.companyId];
     if(!holding?.owned)return thread;
     const revenue=holding.lastRevenue||0;
     const companyProfit=Math.max(0,revenue-(companyResult.revenue?salary*revenue/companyResult.revenue:0));
     const paid=Number(thread.profitSharePaid)||0;
     const payment=Math.min(thread.profitShareCap-paid,Math.round(companyProfit*thread.profitShareRate*100)/100);
     if(payment<=0)return thread;
     profitShareTotal+=payment;
     return {...thread,profitSharePaid:Math.round((paid+payment)*100)/100};
   });
   if(investorCall)messages.push(investorCall);
   const next={...current,credits:current.credits+companyResult.revenue-salary+auctions.refund-profitShareTotal,companies:companyResult.companies,day:current.day+1,market,auctions:auctions.auctions,messages,jobCooldowns:cooldowns,history:[...(current.history||[]),{day:current.day,event:result.event.name,netWorth:before}],lastDayChange:0};
   next.lastDayChange=netWorth(next)-before;
   setGame(next);
   notify(`Day ${next.day}: ${result.event.icon} ${result.event.name}${companyResult.revenue?` · Companies earned ${money(companyResult.revenue)}`:""}${salary?` · Payroll ${money(salary)}`:""}${profitShareTotal?` · Investor profit share ${money(profitShareTotal)}`:""}${auctions.refund?` · Auction refund ${money(auctions.refund)}`:""}${auctions.awards.length?` · Won ${auctions.awards.length} auction item(s)`:""}`);
   if(investorCall)setIncomingCall(investorCall);
 }
 function doJob(job){
   const cd=game.jobCooldowns[job.id]||0;
   if(cd>0)return notify(`${job.name} is ready in ${cd} day(s).`,"bad");
   setGame(g=>({...g,credits:g.credits+job.reward,jobCooldowns:{...g.jobCooldowns,[job.id]:job.cooldown},jobsCompleted:{...(g.jobsCompleted||{}),[job.id]:(g.jobsCompleted?.[job.id]||0)+1}}));
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
      <Nav icon={<MessageCircle/>} text="Messages" active={page==="messages"} onClick={()=>setPage("messages")}/>
      <Nav icon={<Wallet/>} text="Portfolio" active={page==="portfolio"} onClick={()=>setPage("portfolio")}/>
      <Nav icon={<Send/>} text="Send Credits" active={page==="transfer"} onClick={()=>setPage("transfer")}/>
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
        {page==="messages"&&<MessagesPage game={game} setGame={setGame} notify={notify} selectedMessage={selectedMessage} setSelectedMessage={setSelectedMessage}/>}
        {page==="transfer"&&<TransferCredits game={game} user={user} setGame={setGame} notify={notify}/>} 
      {page==="jobs"&&<Jobs game={game} doJob={doJob}/>}
      {page==="auctions"&&<Auctions game={game} setGame={setGame} notify={notify}/>}
      {page==="history"&&<HistoryPage game={game}/>}
      {page==="achievements"&&<Achievements game={game}/>}
    </main>
   </div>
   {toast&&<div className={`toast ${toast.type}`}>{toast.text}</div>}
   {incomingCall&&<InvestorCallDialog call={incomingCall} onAnswer={()=>{setPage("messages");setSelectedMessage(incomingCall.id);setIncomingCall(null)}} onIgnore={()=>setIncomingCall(null)}/>}
   {!game.tutorialCompleted&&<Tutorial onFinish={()=>setGame(current=>({...current,tutorialCompleted:true}))}/>}
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

function Tutorial({onFinish}){
 const [step,setStep]=useState(0);
 const steps=[
   {title:"Welcome to Credit Empire",text:"Build a fictional business empire with 10,000 starting Credits. Your progress saves automatically."},
   {title:"Trade the markets",text:"Buy and sell fictional stocks and items. Prices change each day, so diversify and only spend what you can afford."},
   {title:"Grow your businesses",text:"Buy companies for daily income, upgrade them, and hire employees for useful bonuses. Keep an eye on payroll."},
   {title:"Advance a day",text:"Each new day moves prices, pays company income and payroll, advances auctions, and may bring an investor offer. Investor counteroffers can include a capped share of company profits."}
 ];
 return <div className="tutorialdrop"><section className="tutorialcard"><span className="eyebrow">YOUR FIRST EMPIRE · {step+1} OF {steps.length}</span><h2>{steps[step].title}</h2><p>{steps[step].text}</p><div className="tutorialprogress">{steps.map((item,index)=><span className={index<=step?"current":""} key={item.title}/>)}</div><div className="tutorialactions"><button className="learn" onClick={onFinish}>Skip tutorial</button><button className="primary" onClick={()=>step===steps.length-1?onFinish():setStep(step+1)}>{step===steps.length-1?"Start playing":"Next"}</button></div></section></div>;
}

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

function TransferCredits({game,user,setGame,notify}){
 const [username,setUsername]=useState("");
 const [amount,setAmount]=useState("");
 const [busy,setBusy]=useState(false);
 async function submit(event){
   event.preventDefault();
   setBusy(true);
   try{
     const result=await transferCredits(username,Number(amount));
     setGame(result.game);
     setUsername("");
     setAmount("");
     notify(`Sent ${money(result.amount)} to ${result.recipient}.`);
   }catch(error){notify(error.message,"bad")}
   finally{setBusy(false)}
 }
 return <Page title="Send Credits" sub="Transfer fictional Credits to another registered player."><section className="panel"><SectionTitle title="Player transfer" icon="💸"/><form className="transferform" onSubmit={submit}><label>Recipient username<input value={username} onChange={event=>setUsername(event.target.value)} placeholder="Username" pattern="[a-zA-Z0-9_]{3,24}" required /></label><label>Amount<input type="number" min="0.01" max={game.credits} step="0.01" value={amount} onChange={event=>setAmount(event.target.value)} placeholder="0.00" required /></label><p className="muted">Available: {money(game.credits)} · Signed in as {user.username}</p><button className="primary" disabled={busy}>{busy?"Sending...":"Send Credits"}</button></form></section></Page>}

function Auctions({game,setGame,notify}){
 const [bid,setBid]=useState({});
 const active=game.auctions.filter(auction=>!auction.done);
 function create(){
   const item=ITEMS[Math.floor(Math.random()*ITEMS.length)];
   const start=Math.round(item.base*(.7+Math.random()*.8));
   const auction={id:Date.now(),itemId:item.id,name:`Rare ${item.name}`,icon:item.icon,current:start,buyout:Math.round(start*2.5),time:3,bidder:"Starting Bid",playerBid:0,done:false};
   setGame(current=>({...current,auctions:[...current.auctions,auction]}));
   notify("A new NPC auction has started.");
 }
 function bidOn(auction){
   const amount=Number(bid[auction.id]||auction.current+100);
   if(!Number.isFinite(amount)||amount<=auction.current)return notify("Your bid must beat the current bid.","bad");
   if(amount>auction.buyout)return notify("Your bid cannot exceed the buyout price.","bad");
   const held=auction.bidder==="You"?auction.playerBid||0:0;
   if(amount>game.credits+held)return notify("Not enough available Credits for this bid.","bad");
   const additional=amount-held;
   const winsNow=amount>=auction.buyout;
   setGame(current=>{
     const market={...current.market,items:{...current.market.items}};
     if(winsNow)market.items[auction.itemId]={...market.items[auction.itemId],owned:market.items[auction.itemId].owned+1};
     return {...current,credits:current.credits-additional,market,auctions:current.auctions.map(item=>item.id===auction.id?{...item,current:amount,bidder:"You",playerBid:winsNow?0:amount,done:winsNow,winner:winsNow?"You":undefined,time:winsNow?0:item.time}:item)};
   });
   setBid(current=>({...current,[auction.id]:""}));
   notify(winsNow?`Buyout complete. You won ${auction.name}.`:`Bid placed: ${money(amount)}`);
 }
 function buyout(auction){
   const held=auction.bidder==="You"?auction.playerBid||0:0;
   if(auction.buyout>game.credits+held)return notify("Not enough available Credits for the buyout.","bad");
   const additional=auction.buyout-held;
   setGame(current=>{
     const market={...current.market,items:{...current.market.items,[auction.itemId]:{...current.market.items[auction.itemId],owned:current.market.items[auction.itemId].owned+1}}};
     return {...current,credits:current.credits-additional,market,auctions:current.auctions.map(item=>item.id===auction.id?{...item,current:auction.buyout,bidder:"You",playerBid:0,done:true,winner:"You",time:0}:item)};
   });
   notify(`Buyout complete. You won ${auction.name}.`);
 }
 const completed=game.auctions.filter(auction=>auction.done);
 return <Page title="Auction Hall" sub="Place bids on fictional collectibles. Your bid is held until you are outbid or the auction ends.">
   <div className="hero small"><div><h2>🏷️ Auction House</h2><p>NPCs can outbid you as days pass. Win an item by leading when the timer expires or use its buyout.</p></div><button className="primary" onClick={create}>+ Create NPC Auction</button></div>
   {active.length?<div className="auctiongrid">{active.map(auction=><div className="auction" key={auction.id}>
     <div className="auctiontop"><span>{auction.icon}</span><div><b>{auction.name}</b><small>{auction.bidder==="You"?"You're winning!":auction.bidder}</small></div></div>
     <div className="bidline"><span>Current bid</span><strong>{money(auction.current)}</strong></div>
     <div className="bidline"><span>Buyout</span><strong>{money(auction.buyout)}</strong></div>
     <div className="timer">⏱️ {auction.time} day(s) left</div>
     {auction.bidder==="You"&&<p className="muted">Held bid: {money(auction.playerBid)}</p>}
     <div className="trade"><input type="number" min={auction.current+1} max={auction.buyout} placeholder={auction.current+100} value={bid[auction.id]||""} onChange={event=>setBid({...bid,[auction.id]:event.target.value})}/><button onClick={()=>bidOn(auction)}>Bid</button><button className="secondary" onClick={()=>buyout(auction)}>Buyout</button></div>
   </div>)}</div>:<Empty text="No active auctions. Create one to get the hall moving."/>}
   <section className="panel"><SectionTitle title="Auction history" icon="📜"/>{completed.length?<div className="eventlist">{completed.slice().reverse().map(auction=><div className="eventrow" key={auction.id}><span>{auction.icon} {auction.name}</span><b>{money(auction.current)}</b><small>{auction.winner||"NPC"} won</small></div>)}</div>:<Empty text="Completed auctions will appear here."/ >}</section>
 </Page>;
}

function MessagesPage({game,setGame,notify,selectedMessage,setSelectedMessage}){
 const threads=(game.messages||[]).slice().reverse();
 const selected=threads.find(thread=>thread.id===selectedMessage)||threads[0];
 const [draft,setDraft]=useState("");
 function updateThread(id,update){
   setGame(current=>({...current,messages:(current.messages||[]).map(thread=>thread.id===id?update(thread):thread)}));
 }
 function sendMessage(event){
   event.preventDefault();
   const text=draft.trim();
   if(!text||!selected)return;
   updateThread(selected.id,thread=>({...thread,messages:[...thread.messages,{from:"you",text},{from:"them",text:thread.status==="pending"?"Thanks for the message. You can accept or decline my offer whenever you're ready.":"Thanks for getting back to me."}]}));
   setDraft("");
 }
 function counterOffer(){
   if(!selected||selected.status!=="pending"||selected.countered)return;
   const amount=Math.ceil(selected.amount*1.25/100)*100;
   const counterMessage=selected.type==="buy"
     ? `I'd accept the sale for ${money(amount)} instead.`
     : `I'd accept ${money(amount)} in investment, in exchange for 10% of this company's daily profit until your total share payments reach ${money(amount*2)}.`;
   updateThread(selected.id,thread=>({...thread,amount,countered:true,messages:[...thread.messages,{from:"you",text:counterMessage},{from:"them",text:"I can agree to those updated terms. The counteroffer is yours to accept or decline."}]}));
   notify(`Counteroffer ready: ${money(amount)}.`);
 }
 function decide(accepted){
   if(!selected||selected.status!=="pending")return;
   const company=COMPANIES.find(item=>item.id===selected.companyId);
   const holding=game.companies?.[selected.companyId];
   if(accepted&&(!company||!holding?.owned))return notify("This company is no longer available for the offer.","bad");
   const response=accepted
     ? selected.type==="buy"?"Deal accepted. The company is mine now.":selected.countered?"Investment accepted. I'll fund the company, and the agreed profit share will be paid from its profits.":"Investment accepted. I'll fund the company now."
     : "Thanks, but I'll pass on this offer.";
   setGame(current=>{
     let companies=current.companies||initialCompanies();
     let credits=current.credits;
     if(accepted&&selected.type==="buy"){
       companies={...companies,[selected.companyId]:{owned:false,level:1,investment:0,strategy:"balanced",lastRevenue:0,totalRevenue:0}};
       credits+=selected.amount;
     }else if(accepted){
       companies={...companies,[selected.companyId]:{...companies[selected.companyId],investment:companies[selected.companyId].investment+selected.amount}};
     }
     return {...current,credits,companies,messages:(current.messages||[]).map(thread=>thread.id===selected.id?{...thread,status:accepted?"accepted":"declined",profitShareRate:accepted&&thread.countered&&thread.type==="invest"?0.1:undefined,profitShareCap:accepted&&thread.countered&&thread.type==="invest"?thread.amount*2:undefined,profitSharePaid:0,messages:[...thread.messages,{from:"you",text:accepted?`I accept your ${thread.countered?"counteroffer":thread.type==="buy"?"buyout":"investment"} offer.`:"I decline the offer."},{from:"them",text:response}]}:thread)};
   });
   notify(accepted?`${selected.type==="buy"?"Company sold":"Company funded"}: ${money(selected.amount)}.`:"Offer declined.");
 }
 return <Page title="Messages" sub="Take calls from fictional investors, negotiate offers, and keep in touch with business contacts. Counter once for 25% more; countered investments pay 10% of company profit until the investor receives 2× the investment.">
   <div className="messenger">
     <aside className="threadlist">{threads.length?threads.map(thread=><button className={selected?.id===thread.id?"thread active":"thread"} key={thread.id} onClick={()=>setSelectedMessage(thread.id)}><b>{thread.contact}</b><span>{thread.companyName} · Day {thread.day}</span><small>{thread.messages?.at(-1)?.text||"New investor message"}</small></button>):<Empty text="No messages yet. Investor calls may arrive as your businesses grow."/ >}</aside>
     {selected?<section className="chatpanel">
       <div className="chatheading"><div><h2>{selected.contact}</h2><p>{selected.companyName} · Investor offer · Day {selected.day}</p></div><span className={`offerstatus ${selected.status}`}>{selected.status}</span></div>
       {selected.profitShareRate&&<div className="profitshare"><b>Profit-sharing agreement</b><span>{pct(selected.profitShareRate*100)} of daily company profit · {money(selected.profitSharePaid||0)} / {money(selected.profitShareCap)} paid</span></div>}
       <div className="chatmessages">{(selected.messages||[]).map((message,index)=><div className={`bubble ${message.from==="you"?"sent":"received"}`} key={index}><small>{message.from==="you"?"You":selected.contact}</small><p>{message.text}</p></div>)}</div>
       {selected.status==="pending"&&<div className="offeractions">{!selected.countered&&<button className="secondary" onClick={counterOffer}>More money</button>}<button className="primary" onClick={()=>decide(true)}>{selected.countered?"Accept counteroffer":"Accept offer"} · {money(selected.amount)}</button><button className="secondary" onClick={()=>decide(false)}>Decline offer</button></div>}
       <form className="messageform" onSubmit={sendMessage}><input value={draft} onChange={event=>setDraft(event.target.value)} placeholder="Write a message..." maxLength="300"/><button className="primary" disabled={!draft.trim()}>Send</button></form>
     </section>:<Empty text="Select a conversation to read and reply."/ >}
   </div>
 </Page>;
}

function InvestorCallDialog({call,onAnswer,onIgnore}){
 return <div className="callbackdrop"><section className="calldialog"><div className="callicon"><PhoneCall size={28}/></div><small>INCOMING INVESTOR CALL · DAY {call.day}</small><h2>{call.contact}</h2><p>{call.type==="buy"?`Wants to buy your ${call.companyName}.`:`Wants to invest in your ${call.companyName}.`}</p><strong>{money(call.amount)}</strong><div><button className="primary" onClick={onAnswer}>Answer & view message</button><button className="secondary" onClick={onIgnore}>Ignore for now</button></div></section></div>;
}

function HistoryPage({game}){return <Page title="History" sub="Your recent market timeline.">{game.history.length?<div className="timeline">{game.history.slice().reverse().map((h,i)=><div className="timelineitem" key={i}><div className="dot"></div><div><small>DAY {h.day}</small><h3>{h.event}</h3><p>Recorded net worth: {money(h.netWorth)}</p></div></div>)}</div>:<Empty text="Your timeline is empty. Advance the day to generate your first market event."/ >}</Page>}

function Achievements({game}){
 const completed=new Set(game.achievements||[]);
 const earned=ACHIEVEMENTS.filter(achievement=>completed.has(achievement.id)).length;
 return <Page title="Achievements" sub={`${earned} of ${ACHIEVEMENTS.length} milestones complete. The 10 extreme challenges award Credits when unlocked.`}><div className="achgrid">{ACHIEVEMENTS.map(achievement=>{
   const done=completed.has(achievement.id);
   return <div className={`achievement${done?" done":""}${achievement.extreme?" extreme":""}`} key={achievement.id}><span>{achievement.icon}</span><div><b>{achievement.name}</b><small>{achievement.description}</small>{achievement.extreme&&<em>EXTREME · {money(achievement.reward)} prize</em>}</div>{done&&<Trophy size={20}/>}</div>;
 })}</div></Page>;
}

function Achievements({game}){const nw=netWorth(game);const list=[["💰","First 1,000 CR",game.credits>=1000],["📈","First stock purchase",STOCKS.some(s=>game.market.stocks[s.id].owned>0)],["💎","First item purchase",ITEMS.some(i=>game.market.items[i.id].owned>0)],["🏆","10,000 CR net worth",nw>=10000],["👑","100,000 CR net worth",nw>=100000],["🧾","Own 100 shares",STOCKS.reduce((n,s)=>n+game.market.stocks[s.id].owned,0)>=100],["🔥","Make a 50% profit",nw>=15000],["📉","Survive a market crash",game.history.some(h=>h.event.includes("Market Crash"))]];return <Page title="Achievements" sub="Milestones turn your market journey into a collection game."><div className="achgrid">{list.map(([icon,name,done])=><div className={done?"achievement done":"achievement"} key={name}><span>{icon}</span><div><b>{name}</b><small>{done?"Unlocked!":"Keep playing to unlock."}</small></div>{done&&<Trophy size={20}/>}</div>)}</div></Page>}
