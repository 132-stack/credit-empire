import { COMPANIES, ITEMS, STOCKS, WORKERS, companyValue, netWorth } from "./economy";
import { JOBS } from "./jobs";

const stockCount = game => STOCKS.reduce((total, stock) => total + (game.market.stocks[stock.id]?.owned || 0), 0);
const itemCount = game => ITEMS.reduce((total, item) => total + (game.market.items[item.id]?.owned || 0), 0);
const companyCount = game => COMPANIES.filter(company => game.companies?.[company.id]?.owned).length;
const jobCount = game => Object.values(game.jobsCompleted || {}).reduce((total, count) => total + count, 0);
const auctionWins = game => (game.auctions || []).filter(auction => auction.done && auction.winner === "You").length;
const daysPlayed = game => (game.history || []).length;

export const ACHIEVEMENTS = [
  {id:"first-credits",icon:"💰",name:"First Credits",description:"Hold at least 1,000 CR.",check:game=>game.credits>=1000},
  {id:"cash-25k",icon:"💵",name:"Cash Cushion",description:"Hold 25,000 CR.",check:game=>game.credits>=25000},
  {id:"cash-100k",icon:"🪙",name:"Six-Figure Cash",description:"Hold 100,000 CR.",check:game=>game.credits>=100000},
  {id:"worth-25k",icon:"🏦",name:"Getting Established",description:"Reach 25,000 CR net worth.",check:game=>netWorth(game)>=25000},
  {id:"worth-100k",icon:"📈",name:"Worth a Hundred",description:"Reach 100,000 CR net worth.",check:game=>netWorth(game)>=100000},
  {id:"worth-1m",icon:"💎",name:"Millionaire",description:"Reach 1 million CR net worth.",check:game=>netWorth(game)>=1e6},
  {id:"worth-10m",icon:"👑",name:"Ten Million Club",description:"Reach 10 million CR net worth.",check:game=>netWorth(game)>=1e7},
  {id:"worth-100m",icon:"🌟",name:"Empire Builder",description:"Reach 100 million CR net worth.",check:game=>netWorth(game)>=1e8},
  {id:"first-stock",icon:"📊",name:"Market Entry",description:"Buy your first share.",check:game=>stockCount(game)>=1},
  {id:"shares-10",icon:"🧾",name:"Small Portfolio",description:"Own 10 shares in total.",check:game=>stockCount(game)>=10},
  {id:"shares-100",icon:"📚",name:"Growing Portfolio",description:"Own 100 shares in total.",check:game=>stockCount(game)>=100},
  {id:"shares-1000",icon:"🏢",name:"Shareholder",description:"Own 1,000 shares in total.",check:game=>stockCount(game)>=1000},
  {id:"stocks-4",icon:"🌐",name:"Diversified",description:"Own shares in 4 different companies.",check:game=>STOCKS.filter(stock=>game.market.stocks[stock.id]?.owned>0).length>=4},
  {id:"all-stocks",icon:"🗂️",name:"Market Collector",description:"Own at least one share in every listed company.",check:game=>STOCKS.every(stock=>game.market.stocks[stock.id]?.owned>0)},
  {id:"first-item",icon:"💠",name:"First Collectible",description:"Buy your first market item.",check:game=>itemCount(game)>=1},
  {id:"items-10",icon:"🎒",name:"Collector",description:"Own 10 market items in total.",check:game=>itemCount(game)>=10},
  {id:"items-100",icon:"🧰",name:"Treasure Trove",description:"Own 100 market items in total.",check:game=>itemCount(game)>=100},
  {id:"item-stack-100",icon:"📦",name:"Bulk Buyer",description:"Own 100 of a single market item.",check:game=>ITEMS.some(item=>game.market.items[item.id]?.owned>=100)},
  {id:"item-types-5",icon:"🌈",name:"Wide Collection",description:"Own 5 different kinds of market item.",check:game=>ITEMS.filter(item=>game.market.items[item.id]?.owned>0).length>=5},
  {id:"item-value-50k",icon:"💍",name:"Valuable Cargo",description:"Hold at least 50,000 CR in market items.",check:game=>ITEMS.reduce((total,item)=>total+(game.market.items[item.id]?.owned||0)*(game.market.items[item.id]?.price||0),0)>=50000},
  {id:"first-company",icon:"🏬",name:"Business Owner",description:"Buy your first company.",check:game=>companyCount(game)>=1},
  {id:"companies-3",icon:"🏙️",name:"Local Tycoon",description:"Own 3 companies.",check:game=>companyCount(game)>=3},
  {id:"companies-6",icon:"🗺️",name:"Regional Empire",description:"Own 6 companies.",check:game=>companyCount(game)>=6},
  {id:"all-companies",icon:"🏙️",name:"Corporate Empire",description:"Own every available company.",check:game=>companyCount(game)===COMPANIES.length},
  {id:"company-level-5",icon:"⬆️",name:"Leveling Up",description:"Upgrade a company to level 5.",check:game=>COMPANIES.some(company=>(game.companies?.[company.id]?.level||1)>=5)},
  {id:"company-levels-20",icon:"🏗️",name:"Built to Scale",description:"Reach 20 combined company levels.",check:game=>COMPANIES.reduce((total,company)=>total+(game.companies?.[company.id]?.owned?game.companies[company.id].level:0),0)>=20},
  {id:"daily-income-1k",icon:"💸",name:"Steady Income",description:"Earn at least 1,000 CR from companies in one day.",check:game=>COMPANIES.reduce((total,company)=>total+(game.companies?.[company.id]?.lastRevenue||0),0)>=1000},
  {id:"company-revenue-10k",icon:"📒",name:"Business Is Booming",description:"Earn 10,000 CR in total company revenue.",check:game=>COMPANIES.reduce((total,company)=>total+(game.companies?.[company.id]?.totalRevenue||0),0)>=10000},
  {id:"first-employee",icon:"👥",name:"First Hire",description:"Hire your first employee.",check:game=>WORKERS.some(worker=>game.workers?.[worker.id]?.hired)},
  {id:"employees-3",icon:"🤝",name:"Growing Team",description:"Hire 3 employees.",check:game=>WORKERS.filter(worker=>game.workers?.[worker.id]?.hired).length>=3},
  {id:"day-10",icon:"📅",name:"Finding Your Feet",description:"Play through 10 market days.",check:game=>daysPlayed(game)>=10},
  {id:"day-50",icon:"🗓️",name:"Market Regular",description:"Play through 50 market days.",check:game=>daysPlayed(game)>=50},
  {id:"day-100",icon:"⏳",name:"Seasoned Trader",description:"Play through 100 market days.",check:game=>daysPlayed(game)>=100},
  {id:"day-365",icon:"🎂",name:"Year in Business",description:"Play through 365 market days.",check:game=>daysPlayed(game)>=365},
  {id:"survive-crash",icon:"🛡️",name:"Weather the Storm",description:"Make it through a market crash.",check:game=>(game.history||[]).some(entry=>entry.event.includes("Market Crash"))},
  {id:"three-crashes",icon:"🌧️",name:"Crash Veteran",description:"Survive 3 market crashes.",check:game=>(game.history||[]).filter(entry=>entry.event.includes("Market Crash")).length>=3},
  {id:"first-job",icon:"🧑‍💼",name:"Honest Work",description:"Complete your first job.",check:game=>jobCount(game)>=1},
  {id:"jobs-25",icon:"🛠️",name:"Hard Worker",description:"Complete 25 jobs.",check:game=>jobCount(game)>=25},
  {id:"all-jobs",icon:"🎖️",name:"Jack of All Trades",description:"Complete every kind of job at least once.",check:game=>JOBS.every(job=>(game.jobsCompleted?.[job.id]||0)>0)},
  {id:"auction-win",icon:"🔨",name:"Going Once",description:"Win your first auction.",check:game=>auctionWins(game)>=1},
  {id:"worth-1b",icon:"🚀",name:"Billionaire",description:"Reach 1 billion CR net worth.",extreme:true,reward:100000000,check:game=>netWorth(game)>=1e9},
  {id:"cash-500m",icon:"💰",name:"Half-Billion in the Bank",description:"Hold 500 million CR in cash.",extreme:true,reward:50000000,check:game=>game.credits>=5e8},
  {id:"shares-10k",icon:"📈",name:"Market Titan",description:"Own 10,000 shares in total.",extreme:true,reward:25000000,check:game=>stockCount(game)>=10000},
  {id:"all-companies-level-5",icon:"🏢",name:"Boardroom Legend",description:"Own every company and upgrade each to level 5.",extreme:true,reward:50000000,check:game=>COMPANIES.every(company=>game.companies?.[company.id]?.owned&&game.companies[company.id].level>=5)},
  {id:"all-employees",icon:"🌟",name:"Dream Team",description:"Hire every available employee.",extreme:true,reward:10000000,check:game=>WORKERS.every(worker=>game.workers?.[worker.id]?.hired)},
  {id:"day-1000",icon:"⌛",name:"A Thousand Days",description:"Play through 1,000 market days.",extreme:true,reward:15000000,check:game=>daysPlayed(game)>=1000},
  {id:"daily-income-50k",icon:"🏭",name:"Profit Machine",description:"Earn 50,000 CR from companies in one day.",extreme:true,reward:30000000,check:game=>COMPANIES.reduce((total,company)=>total+(game.companies?.[company.id]?.lastRevenue||0),0)>=50000},
  {id:"item-stack-1000",icon:"💎",name:"Legendary Hoard",description:"Own 1,000 of a single market item.",extreme:true,reward:20000000,check:game=>ITEMS.some(item=>game.market.items[item.id]?.owned>=1000)},
  {id:"auction-wins-100",icon:"🏆",name:"Auction Champion",description:"Win 100 auctions.",extreme:true,reward:25000000,check:game=>auctionWins(game)>=100},
  {id:"jobs-1000",icon:"🔥",name:"The Grind Never Stops",description:"Complete 1,000 jobs.",extreme:true,reward:20000000,check:game=>jobCount(game)>=1000},
];
