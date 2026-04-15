/**
 * Published membership durations and prices (keep in sync with backend planInterest enum).
 */

/** @typedef {{ id: string; title: string; price: number; priceLabel: string; blurb: string; featured?: boolean }} MembershipPlanOption */

/** @type {MembershipPlanOption[]} */
export const MEMBERSHIP_PLANS = [
  {
    id: "1month",
    title: "1 month",
    price: 7999,
    priceLabel: "₹7,999",
    blurb: "Full access — try the full Evolve experience.",
  },
  {
    id: "3months",
    title: "3 months",
    price: 17999,
    priceLabel: "₹17,999",
    blurb: "Stay consistent with a quarter of premium training.",
  },
  {
    id: "6months",
    title: "6 months",
    price: 23999,
    priceLabel: "₹23,999",
    blurb: "Our most popular commitment — results that compound.",
    featured: true,
  },
  {
    id: "1year",
    title: "1 year",
    price: 34999,
    priceLabel: "₹34,999",
    blurb: "Best long-term value for dedicated members.",
  },
];

/** Gym access hours (display copy). */
export const GYM_HOURS_LINE = "5:30 AM – 11:00 PM daily";
