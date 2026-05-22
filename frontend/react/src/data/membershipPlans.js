/**
 * Published membership durations and prices (keep in sync with backend planInterest enum).
 */

/** @typedef {{ id: string; title: string; price: number; priceLabel: string; blurb: string; featured?: boolean }} MembershipPlanOption */

/** @type {MembershipPlanOption[]} */
export const MEMBERSHIP_PLANS = [
  {
    id: "1month",
    title: "1 month",
    price: 14999,
    priceLabel: "₹14,999",
    blurb: "Full access — try the full Evolve experience.",
  },
  {
    id: "3months",
    title: "3 months",
    price: 21999,
    priceLabel: "₹21,999",
    blurb: "Stay consistent with a quarter of focused training.",
  },
  {
    id: "6months",
    title: "6 months",
    price: 31999,
    priceLabel: "₹31,999",
    blurb: "Our most popular commitment — results that compound.",
    featured: true,
  },
  {
    id: "1year",
    title: "1 year",
    price: 49999,
    priceLabel: "₹49,999",
    blurb: "Best long-term value for dedicated members.",
  },
];

/** Gym access hours (display copy). */
export const GYM_HOURS_LINE = "5:30 AM – 11:00 PM daily";
