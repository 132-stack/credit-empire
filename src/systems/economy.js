import { mulberry32, range, weighted, round2 } from "./random";

export const STOCKS = [
  {id:"nvt", name:"NovaTech", ticker:"NVT", base:125, volatility:.9, sector:"Technology"},
  {id:"pfx", name:"PixelForge", ticker:"PFX", base:82, volatility:1.05, sector:"Gaming"},
  {id:"atc", name:"AstroCore", ticker:"ATC", base:210, volatility:1.15, sector:"Space"},
  {id:"mm", name:"MegaMart", ticker:"MGM", base:64, volatility:.55, sector:"Retail"},
  {id:"ql", name:"Quantum Labs", ticker:"QTL", base:155, volatility:1.7, sector:"Research"},
  {id:"bw", name:"BlockWorks", ticker:"BLK", base:96, volatility:1.25, sector:"Construction"},
  {id:"sr", name:"SkyRail", ticker:"SKR", base:118, volatility:.75, sector:"Transport"},
  {id:"ob", name:"OceanByte", ticker:"OCB", base:73, volatility:1.0, sector:"Tech"},
  {id:"sol", name:"Solaris Grid", ticker:"SLG", base:142, volatility:.85, sector:"Clean Energy"},
  {id:"med", name:"MedicaNova", ticker:"MDN", base:188, volatility:1.2, sector:"Healthcare"},
  {id:"fin", name:"Crownline Bank", ticker:"CRB", base:94, volatility:.65, sector:"Finance"},
  {id:"food", name:"Harvest Foods", ticker:"HFD", base:58, volatility:.5, sector:"Food"},
  {id:"auto", name:"Volt Motors", ticker:"VMT", base:132, volatility:1.4, sector:"Automotive"},
  {id:"media", name:"Lumen Media", ticker:"LUM", base:106, volatility:1.1, sector:"Media"},
  {id:"aero", name:"AeroWorks", ticker:"AWR", base:174, volatility:1.25, sector:"Aerospace"},
  {id:"bio", name:"Verdant Bio", ticker:"VDB", base:116, volatility:1.55, sector:"Biotechnology"}
];

export const ITEMS = [
  {id:"diamond", name:"Diamond", icon:"💎", base:500, volatility:.9},
  {id:"gold", name:"Gold", icon:"🥇", base:300, volatility:.55},
  {id:"iron", name:"Iron", icon:"⛓️", base:80, volatility:.35},
  {id:"emerald", name:"Emerald", icon:"💚", base:420, volatility:1.0},
  {id:"energy", name:"Energy Cell", icon:"🔋", base:260, volatility:1.1},
  {id:"crystal", name:"Space Crystal", icon:"🔮", base:900, volatility:1.5},
  {id:"coin", name:"Ancient Coin", icon:"🪙", base:650, volatility:1.25},
  {id:"core", name:"Quantum Core", icon:"⚛️", base:1800, volatility:1.8},
  {id:"lithium", name:"Lithium", icon:"🔋", base:340, volatility:1.15},
  {id:"copper", name:"Copper", icon:"🟠", base:120, volatility:.5},
  {id:"grain", name:"Golden Grain", icon:"🌾", base:95, volatility:.4},
  {id:"medicine", name:"Med Kits", icon:"🧰", base:280, volatility:.75},
  {id:"art", name:"Gallery Art", icon:"🖼️", base:1250, volatility:1.3},
  {id:"fuel", name:"Fusion Fuel", icon:"🛢️", base:720, volatility:1.4},
  {id:"fabric", name:"Smart Fabric", icon:"🧵", base:190, volatility:.8},
  {id:"data", name:"Data Chips", icon:"💾", base:460, volatility:1.2}
];

export const COMPANIES = [
  {id:"nova_cafe", name:"Nova Cafe", icon:"☕", sector:"Hospitality", price:6500, revenue:260, description:"A small chain with loyal customers and steady cash flow."},
  {id:"pixel_studio", name:"Pixel Studio", icon:"🎮", sector:"Entertainment", price:12000, revenue:520, description:"A creative game studio with bigger upside and more volatility."},
  {id:"orbit_logistics", name:"Orbit Logistics", icon:"🚚", sector:"Transport", price:22000, revenue:900, description:"A delivery network that benefits from scale and efficiency."},
  {id:"quantum_energy", name:"Quantum Energy", icon:"⚡", sector:"Technology", price:40000, revenue:1800, description:"An ambitious energy company built for long-term growth."},
  {id:"harvest_table", name:"Harvest Table", icon:"🥗", sector:"Food & Beverage", price:9000, revenue:360, description:"A farm-to-city food network with reliable daily demand."},
  {id:"crownline_bank", name:"Crownline Bank", icon:"🏦", sector:"Finance", price:28000, revenue:1250, description:"A growing financial group serving businesses across the city."},
  {id:"medica_care", name:"Medica Care", icon:"🩺", sector:"Healthcare", price:18500, revenue:760, description:"A neighborhood clinic network focused on accessible care."},
  {id:"volt_motors", name:"Volt Motors", icon:"🚗", sector:"Automotive", price:34000, revenue:1450, description:"An electric vehicle maker with ambitious production plans."},
  {id:"verdant_farms", name:"Verdant Farms", icon:"🌱", sector:"Agriculture", price:14500, revenue:590, description:"Efficient indoor farms supplying fresh produce year-round."},
  {id:"lumen_media", name:"Lumen Media", icon:"🎬", sector:"Media", price:16500, revenue:680, description:"A digital studio producing shows, music, and interactive stories."},
  {id:"aeroworks", name:"AeroWorks", icon:"✈️", sector:"Aerospace", price:52000, revenue:2250, description:"A specialist aircraft and satellite engineering company."},
  {id:"copperfield_mining", name:"Copperfield Mining", icon:"⛏️", sector:"Materials", price:24500, revenue:1020, description:"A responsible materials company supplying the clean-energy boom."}
];

export const WORKERS = [
  {id:"analyst", name:"Data Analyst", icon:"🧠", price:3000, salary:160, description:"Reads market momentum and identifies the biggest rises, crashes, and investment opportunities."},
  {id:"operations", name:"Operations Manager", icon:"⚙️", price:4500, salary:220, description:"Improves the daily output of every company you own."},
  {id:"sales", name:"Sales Director", icon:"📣", price:6000, salary:280, description:"Finds customers and increases company income even further."},
  {id:"broker", name:"Investment Broker", icon:"🤝", price:7000, salary:320, description:"Negotiates investor and buyer offers that are 10% higher."},
  {id:"accountant", name:"Payroll Accountant", icon:"🧮", price:5200, salary:190, description:"Keeps the books and reduces total daily employee payroll by 15%."},
  {id:"auctioneer", name:"Auction Specialist", icon:"🔨", price:6500, salary:260, description:"Uses expert timing to reduce the chance NPCs outbid you at auction."},
  {id:"business", name:"Business Development Lead", icon:"🚀", price:8500, salary:350, description:"Builds partnerships that increase company income by 12%."}
];

export function initialWorkers() {
  return Object.fromEntries(WORKERS.map(worker => [worker.id, {hired:false,days:0}]));
}

export function workerUpkeep(workers) {
  const payroll = WORKERS.reduce((total, worker) => total + (workers?.[worker.id]?.hired ? worker.salary : 0), 0);
  return Math.round(payroll * (workers?.accountant?.hired ? .85 : 1));
}

export function analystReport(market) {
  const stocks = STOCKS.map(stock => ({asset:stock, data:market.stocks[stock.id]}));
  const items = ITEMS.map(item => ({asset:item, data:market.items[item.id]}));
  const biggestRise = [...stocks].sort((a,b) => b.data.change - a.data.change)[0];
  const biggestCrash = [...stocks].sort((a,b) => a.data.change - b.data.change)[0];
  const strongestMarket = [...items].sort((a,b) => b.data.change - a.data.change)[0];
  const weakestMarket = [...items].sort((a,b) => a.data.change - b.data.change)[0];
  const stockTip = biggestRise.data.change > 0 ? biggestRise : [...stocks].sort((a,b) => a.data.price/a.asset.base - b.data.price/b.asset.base)[0];
  return {biggestRise,biggestCrash,strongestMarket,weakestMarket,stockTip};
}

export function workerEffects(workers) {
  return {companyMultiplier:1 + (workers?.operations?.hired ? .12 : 0) + (workers?.sales?.hired ? .16 : 0) + (workers?.business?.hired ? .12 : 0)};
}

export function initialCompanies() {
  return Object.fromEntries(COMPANIES.map(company => [company.id, {owned:false, level:1, investment:0, strategy:"balanced", lastRevenue:0, totalRevenue:0}]));
}

export function companyValue(companies) {
  return COMPANIES.reduce((total, company) => {
    const holding = companies?.[company.id];
    if (!holding?.owned) return total;
    return total + company.price + holding.investment + (holding.level - 1) * company.price * .2;
  }, 0);
}

export function advanceCompanies(companies, day, seed, workers) {
  const rng = mulberry32(seed + day * 1543);
  const next = structuredClone(companies || initialCompanies());
  let revenue = 0;
  for (const company of COMPANIES) {
    const holding = next[company.id];
    if (!holding?.owned) continue;
    const strategyMultiplier = {balanced:1, growth:1.25, efficiency:.82}[holding.strategy] || 1;
    const earned = Math.max(0, Math.round(company.revenue * holding.level * strategyMultiplier * workerEffects(workers).companyMultiplier * (.9 + rng() * .25) + holding.investment * .018));
    holding.lastRevenue = earned;
    holding.totalRevenue = (holding.totalRevenue || 0) + earned;
    revenue += earned;
  }
  return {companies:next,revenue};
}

export const EVENTS = [
  {name:"NovaTech released a revolutionary gadget!", icon:"🚀", effects:{nvt:18,pfx:4}, text:"NovaTech gets a huge product boost."},
  {name:"A clean-energy subsidy was approved.", icon:"☀️", effects:{sol:17,auto:6,lithium:10}, text:"Renewable energy and battery makers rally."},
  {name:"A medical breakthrough made headlines.", icon:"🩺", effects:{med:15,bio:18,medicine:12}, text:"Healthcare and biotechnology assets surge."},
  {name:"A global food contract was awarded.", icon:"🌾", effects:{food:13,grain:16}, text:"Food producers receive a boost."},
  {name:"A new satellite network launched.", icon:"🛰️", effects:{aero:14,media:5,data:9}, text:"Aerospace and data suppliers gain attention."},
  {name:"Quantum Labs suffered a production delay.", icon:"⚠️", effects:{ql:-23,atc:-5}, text:"Research stocks take a hit."},
  {name:"MegaMart reported record sales.", icon:"📦", effects:{mm:9}, text:"Retail demand is booming."},
  {name:"A mysterious space signal was detected.", icon:"🛸", effects:{atc:16,crystal:20}, text:"Space-related assets surge."},
  {name:"A city transport contract was announced.", icon:"🚄", effects:{sr:14,bw:7}, text:"Infrastructure companies rally."},
  {name:"OceanByte found a massive data reserve.", icon:"🌊", effects:{ob:17,pfx:6}, text:"Digital assets gain attention."},
  {name:"💎 Diamond Rush", icon:"💎", effects:{diamond:16}, text:"Diamonds become temporarily scarce."},
  {name:"📉 Market Crash", icon:"📉", crash:true, text:"Most stocks fall sharply today."},
  {name:"🚀 Tech Boom", icon:"🚀", effects:{nvt:12,pfx:15,ob:13,ql:10}, text:"Technology companies surge."},
  {name:"🤑 Investor Frenzy", icon:"🤑", auctionBoost:true, text:"NPCs bid more aggressively at auctions."},
  {name:"⛏️ Mining Discovery", icon:"⛏️", effects:{diamond:12,emerald:15,gold:8}, text:"Rare resources are discovered."},
  {name:"📦 Supply Shortage", icon:"📦", randomItem:true, text:"A random resource becomes much harder to find."}
];

export function initialMarket() {
  return {
    stocks:Object.fromEntries(STOCKS.map(s => [s.id,{price:s.base,previous:s.base,change:0,history:[s.base],owned:0}])),
    items:Object.fromEntries(ITEMS.map(i => [i.id,{price:i.base,previous:i.base,change:0,supply:100,demand:100,owned:0}]))
  };
}

function movement(rng, volatility) {
  const event = weighted(rng, [
    {weight:70,value:"normal"},{weight:20,value:"strong"},
    {weight:9,value:"major"},{weight:1,value:"crazy"}
  ]);
  const ranges = {
    normal:[-10,10], strong:[-20,20], major:[-30,30], crazy:[-40,50]
  };
  const [a,b] = ranges[event];
  return range(rng,a,b) * volatility;
}

export function advanceMarket(market, day, seed) {
  const rng = mulberry32(seed + day * 7919);
  const stocks = structuredClone(market.stocks);
  const items = structuredClone(market.items);
  let event = EVENTS[Math.floor(rng()*EVENTS.length)];
  let effects = {...(event.effects||{})};

  if (event.randomItem) {
    const item = ITEMS[Math.floor(rng()*ITEMS.length)];
    effects[item.id] = 18;
    event = {...event, name:`Supply Shortage: ${item.name}`, text:`${item.name} supply dropped, so its value jumped.`};
  }

  for (const s of STOCKS) {
    const m = event.crash ? -Math.abs(range(rng,5,25)) : movement(rng,s.volatility);
    const pct = m + (effects[s.id] || 0);
    const old = stocks[s.id].price;
    const next = Math.max(1, round2(old * (1+pct/100)));
    stocks[s.id] = {...stocks[s.id], previous:old, price:next, change:round2((next/old-1)*100),
      history:[...stocks[s.id].history,next].slice(-20)};
  }

  for (const i of ITEMS) {
    let supply = Math.max(10, Math.min(200, items[i.id].supply + Math.round(range(rng,-18,18))));
    let demand = Math.max(10, Math.min(200, items[i.id].demand + Math.round(range(rng,-18,18))));
    let pct = movement(rng,i.volatility)*.7 + ((effects[i.id]||0));
    pct += (demand-supply)*.035;
    const old = items[i.id].price;
    const next = Math.max(1, round2(old*(1+pct/100)));
    items[i.id] = {...items[i.id], previous:old, price:next, change:round2((next/old-1)*100), supply, demand};
  }
  return {stocks,items,event};
}

export function netWorth(game) {
  const stockValue = STOCKS.reduce((n,s)=>n+game.market.stocks[s.id].owned*game.market.stocks[s.id].price,0);
  const itemValue = ITEMS.reduce((n,i)=>n+game.market.items[i.id].owned*game.market.items[i.id].price,0);
  const auctionEscrow=(game.auctions||[]).reduce((total,auction)=>total+(!auction.done&&auction.bidder==="You"?Number(auction.playerBid)||0:0),0);
  return round2(game.credits+stockValue+itemValue+companyValue(game.companies)+auctionEscrow);
}
