import { mulberry32 } from "./random";
import { COMPANIES, ITEMS, companyValue } from "./economy";

const INVESTORS = ["Maya Chen", "Jordan Rivera", "Avery Brooks", "Sam Patel", "Riley Morgan"];
const COLLECTORS = ["The Collector", "M. Vale", "J. Park", "A. Stone"];

export function createInvestorCall(companies, day, seed, brokerHired = false) {
  const rng = mulberry32(seed + day * 104729);
  if (rng() >= 0.16) return null;

  const owned = COMPANIES.filter(company => companies?.[company.id]?.owned);
  if (!owned.length) return null;

  const company = owned[Math.floor(rng() * owned.length)];
  const holding = companies[company.id];
  const type = rng() < 0.45 ? "buy" : "invest";
  const value = companyValue({[company.id]:holding});
  const baseAmount = Math.max(1000, Math.round((type === "buy"
    ? value * (1.15 + rng() * 0.6)
    : company.price * (0.25 + rng() * 0.45)) / 100) * 100);
  const amount = brokerHired ? Math.round(baseAmount * 1.1 / 100) * 100 : baseAmount;
  const contact = INVESTORS[Math.floor(rng() * INVESTORS.length)];
  const proposal = type === "buy"
    ? `I'd like to buy ${company.name} for ${amount.toLocaleString()} CR.`
    : `I'd like to invest ${amount.toLocaleString()} CR into ${company.name} to help it grow.`;

  return {
    id: `${day}-${company.id}-${Math.floor(rng() * 1000000)}`,
    companyId:company.id,
    companyName:company.name,
    contact,
    type,
    amount,
    day,
    status:"pending",
    messages:[{from:"them",text:`Hi! I'm ${contact}. ${proposal}`}]
  };
}

export function advanceAuctions(auctions, seed, day, auctionBoost = false, auctionSpecialist = false) {
  const rng = mulberry32(seed + day * 65537);
  const next = [];
  const awards = [];
  let refund = 0;

  for (const auction of auctions || []) {
    if (auction.done) {
      next.push(auction);
      continue;
    }

    const updated = {...auction, time:Number(auction.time) || 0, playerBid:Number(auction.playerBid) || 0};
    if (rng() < (auctionBoost ? 0.65 : auctionSpecialist ? 0.25 : 0.4)) {
      const increase = Math.max(10, Math.round(updated.current * (0.08 + rng() * 0.15) / 10) * 10);
      updated.current = Math.min(updated.buyout, updated.current + increase);
      updated.bidder = COLLECTORS[Math.floor(rng() * COLLECTORS.length)];
      if (updated.playerBid) {
        refund += updated.playerBid;
        updated.playerBid = 0;
      }
      if (updated.current >= updated.buyout) {
        updated.done = true;
        updated.winner = updated.bidder;
      }
    }

    if (!updated.done) {
      updated.time -= 1;
      if (updated.time <= 0) {
        updated.time = 0;
        updated.done = true;
        updated.winner = updated.bidder;
        if (updated.winner === "You") awards.push(updated.itemId || resolveItemId(updated.name));
      }
    }
    next.push(updated);
  }

  return {auctions:next,awards,refund};
}

export function resolveItemId(name) {
  return ITEMS.find(item => name?.includes(item.name))?.id || ITEMS[0].id;
}
