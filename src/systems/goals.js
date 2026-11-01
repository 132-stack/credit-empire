const DAILY_CONTRACTS = [
  {id:"daily-trades",name:"Active Trader",description:"Complete 3 market trades.",stat:"trades",target:3,reward:300},
  {id:"daily-jobs",name:"A Day's Work",description:"Complete 2 jobs.",stat:"jobs",target:2,reward:450},
  {id:"daily-shares",name:"Build a Position",description:"Buy 5 stock shares.",stat:"sharesBought",target:5,reward:450},
  {id:"daily-revenue",name:"Business Day",description:"Earn 750 CR in company revenue.",stat:"companyRevenue",target:750,reward:500},
  {id:"daily-auction",name:"Auction Hunter",description:"Win an auction.",stat:"auctionWins",target:1,reward:500},
  {id:"daily-hire",name:"Team Builder",description:"Hire an employee.",stat:"employeeHires",target:1,reward:500}
];

const WEEKLY_CONTRACTS = [
  {id:"weekly-trades",name:"Market Regular",description:"Complete 15 market trades.",stat:"trades",target:15,reward:2200},
  {id:"weekly-jobs",name:"Clocking In",description:"Complete 8 jobs.",stat:"jobs",target:8,reward:2500},
  {id:"weekly-shares",name:"Long-Term Investor",description:"Buy 50 stock shares.",stat:"sharesBought",target:50,reward:2800},
  {id:"weekly-revenue",name:"Growth Week",description:"Earn 8,000 CR in company revenue.",stat:"companyRevenue",target:8000,reward:3000},
  {id:"weekly-auctions",name:"Auction Circuit",description:"Win 3 auctions.",stat:"auctionWins",target:3,reward:3000},
  {id:"weekly-upgrades",name:"Upgrade Cycle",description:"Upgrade companies 3 times.",stat:"companyUpgrades",target:3,reward:3200}
];

export const MILESTONES = [
  {id:"milestone-trades-25",name:"Market Mover",description:"Complete 25 trades over your career.",stat:"trades",target:25,reward:1500},
  {id:"milestone-jobs-25",name:"Reliable Worker",description:"Complete 25 jobs over your career.",stat:"jobs",target:25,reward:2000},
  {id:"milestone-shares-500",name:"Major Shareholder",description:"Buy 500 stock shares over your career.",stat:"sharesBought",target:500,reward:3000},
  {id:"milestone-auctions-10",name:"Auction Regular",description:"Win 10 auctions over your career.",stat:"auctionWins",target:10,reward:3000},
  {id:"milestone-revenue-100k",name:"Revenue Builder",description:"Earn 100,000 CR in company revenue over your career.",stat:"companyRevenue",target:100000,reward:5000},
  {id:"milestone-upgrades-25",name:"Renovation Expert",description:"Upgrade companies 25 times.",stat:"companyUpgrades",target:25,reward:5000},
  {id:"milestone-hires-5",name:"People Person",description:"Hire 5 employees over your career.",stat:"employeeHires",target:5,reward:4000},
  {id:"milestone-companies-6",name:"Business Collector",description:"Buy 6 companies over your career.",stat:"companiesBought",target:6,reward:6000},
  {id:"milestone-trades-250",name:"Trading Legend",description:"Complete 250 trades over your career.",stat:"trades",target:250,reward:10000},
  {id:"milestone-revenue-1m",name:"Million-Credit Enterprise",description:"Earn 1 million CR in company revenue over your career.",stat:"companyRevenue",target:1000000,reward:25000}
];

function templatesFor(period,cycle) {
  const templates=period==="daily"?DAILY_CONTRACTS:WEEKLY_CONTRACTS;
  const offset=(cycle*2)%templates.length;
  return [0,1,2].map(index=>({
    ...templates[(offset+index)%templates.length],
    period,
    cycle,
    goalId:`${period}-${cycle}-${templates[(offset+index)%templates.length].id}`
  }));
}

export function currentContracts(day) {
  const safeDay=Math.max(1,Number(day)||1);
  const week=Math.floor((safeDay-1)/7)+1;
  return [...templatesFor("daily",safeDay),...templatesFor("weekly",week)];
}

export function recordGoalActivity(game,activity) {
  const current=game.goalStats||{daily:{},weekly:{},allTime:{}};
  const stats={
    daily:{...(current.daily||{})},
    weekly:{...(current.weekly||{})},
    allTime:{...(current.allTime||{})}
  };
  for(const [key,value] of Object.entries(activity)){
    const amount=Number(value);
    if(!Number.isFinite(amount)||amount<=0)continue;
    for(const period of ["daily","weekly","allTime"]){
      stats[period][key]=(Number(stats[period][key])||0)+amount;
    }
  }
  const claimed=new Set(game.goalClaims||[]);
  const completed=currentContracts(game.day).filter(contract=>
    !claimed.has(contract.goalId)&&(Number(stats[contract.period][contract.stat])||0)>=contract.target
  );
  const reward=completed.reduce((total,contract)=>total+contract.reward,0);
  for(const contract of completed)claimed.add(contract.goalId);
  return {
    game:{
      ...game,
      credits:game.credits+reward,
      goalStats:stats,
      goalClaims:[...claimed]
    },
    completed,
    reward
  };
}

export function advanceGoalPeriods(game,nextDay) {
  const oldWeek=Math.floor((game.day-1)/7);
  const nextWeek=Math.floor((nextDay-1)/7);
  return {
    ...game,
    goalStats:{
      ...(game.goalStats||{}),
      daily:{},
      weekly:oldWeek===nextWeek?{...(game.goalStats?.weekly||{})}:{}
    }
  };
}

export function goalProgress(game,contract) {
  const value=Number(game.goalStats?.[contract.period]?.[contract.stat])||0;
  return Math.min(contract.target,value);
}

export function milestoneProgress(game,milestone) {
  return Math.min(milestone.target,Number(game.goalStats?.allTime?.[milestone.stat])||0);
}
