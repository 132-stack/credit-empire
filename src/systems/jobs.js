import { STOCKS } from "./economy";

export const JOBS = [
 {id:"miner",name:"Miner",icon:"⛏️",desc:"Mine fictional ores for a steady reward.",reward:250,cooldown:2,task:"Collect 3 ore samples."},
 {id:"trader",name:"Trader",icon:"📈",desc:"Study the market and make a trading call.",reward:320,cooldown:3,task:"Use the market report to call its direction."},
 {id:"delivery",name:"Delivery Worker",icon:"📦",desc:"Deliver a package across the city.",reward:180,cooldown:1,task:"Choose the fastest delivery route."},
 {id:"engineer",name:"Engineer",icon:"🔧",desc:"Repair a fictional machine.",reward:450,cooldown:4,task:"Solve the machine calibration puzzle."},
 {id:"farmer",name:"Farmer",icon:"🌾",desc:"Harvest a crop shipment.",reward:210,cooldown:2,task:"Harvest the crop when it is ripe."},
 {id:"analyst",name:"Data Analyst",icon:"🧠",desc:"Analyze a market report.",reward:380,cooldown:3,task:"Find the stock with the strongest momentum."},
 {id:"auctioneer",name:"Auctioneer",icon:"🏷️",desc:"Host an auction.",reward:300,cooldown:3,task:"Identify the highest bidder."}
];

export function createJobTask(job,game) {
 const day=Number(game.day)||1;

 if(job.id==="miner")return {type:"collect",prompt:"Collect three ore samples from the mine.",target:3};

 if(job.id==="trader"){
   const stocks=STOCKS.map(stock=>({stock,data:game.market.stocks[stock.id]})).filter(entry=>entry.data);
   const average=stocks.reduce((total,entry)=>total+(Number(entry.data.change)||0),0)/Math.max(stocks.length,1);
   const changes=stocks.slice(0,4).map(({stock,data})=>`${stock.ticker} ${Number(data.change||0)>=0?"+":""}${Number(data.change||0).toFixed(1)}%`).join(" · ");
   const options=["Market rising","Market falling"];
   return {type:"choice",prompt:`Market bulletin: ${changes}. Based on their average movement, is the market rising or falling?`,options,answer:average>=0?options[0]:options[1]};
 }

 if(job.id==="delivery"){
   const options=[{label:"Riverside Road · 12 min",value:12},{label:"Market Street · 8 min",value:8},{label:"Hill Pass · 15 min",value:15}];
   return {type:"choice",prompt:"Choose the fastest route for this delivery.",options:options.map(option=>option.label),answer:options.reduce((fastest,option)=>option.value<fastest.value?option:fastest).label};
 }

 if(job.id==="engineer"){
   const left=day+7;
   const right=(day%9)+4;
   const answer=left*right;
   const options=[answer,answer+left,answer-right,answer+right].sort((a,b)=>a-b).map(String);
   return {type:"choice",prompt:`Calibration check: ${left} × ${right} = ?`,options,answer:String(answer)};
 }

 if(job.id==="farmer"){
   const options=["Seedling","Growing","Ripe","Withered"];
   return {type:"choice",prompt:"Inspect each crop stage and harvest the ready crop.",options,answer:"Ripe"};
 }

 if(job.id==="analyst"){
   const stocks=STOCKS.map(stock=>({stock,data:game.market.stocks[stock.id]})).filter(entry=>entry.data);
   const candidates=stocks.slice((day-1)%Math.max(1,stocks.length),((day-1)%Math.max(1,stocks.length))+4);
   const options=candidates.map(({stock,data})=>`${stock.name} (${Number(data.change||0)>=0?"+":""}${Number(data.change||0).toFixed(1)}%)`);
   const strongest=candidates.reduce((best,current)=>Number(current.data.change||0)>Number(best.data.change||0)?current:best);
   return {type:"choice",prompt:"Choose the stock with the strongest current momentum.",options,answer:`${strongest.stock.name} (${Number(strongest.data.change||0)>=0?"+":""}${Number(strongest.data.change||0).toFixed(1)}%)`};
 }

 if(job.id==="auctioneer"){
   const bids=[{name:"Mira",amount:140+day*5},{name:"Jax",amount:185+day*3},{name:"Sol",amount:160+day*4}];
   const answer=bids.reduce((highest,bid)=>bid.amount>highest.amount?bid:highest);
   return {type:"choice",prompt:`Bids for the rare item: ${bids.map(bid=>`${bid.name} ${bid.amount} CR`).join(" · ")}. Who is the highest bidder?`,options:bids.map(bid=>bid.name),answer:answer.name};
 }

 throw new Error(`No task is configured for job "${job.id}".`);
}
