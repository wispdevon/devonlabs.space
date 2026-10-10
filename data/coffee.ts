export type CoffeeOrigin = { status: 'tried' | 'not-tried'; note: string };
// ISO numeric country IDs. Add only origins confirmed by Wisp.
export const coffeeOrigins: Record<string, CoffeeOrigin> = {};

// Equipment confirmed by Wisp; no unconfirmed model sizes or modifications.
export const coffeeGear = [
  { name: 'Hario V60', kind: 'Pour-over brewer' },
  { name: 'Flair Neo', kind: 'Manual espresso' },
  { name: 'ROKpresso Classic', kind: 'Manual espresso' },
  { name: 'Mischief M40', kind: 'Hand grinder' },
  { name: 'Hario Switch', kind: 'Immersion / pour-over brewer' },
];
export const coffeeMethods = [
  { name: 'Pour-over', note: 'Hario V60. Recipes, pouring patterns, and brew notes to come.' },
  { name: 'Immersion & hybrid', note: 'Hario Switch. Steep times, drawdown, and experiments to come.' },
  { name: 'Manual espresso', note: 'Flair Neo and ROKpresso Classic. Dial-in notes to come.' },
];
// A starter tasting checklist, not a claim about Wisp's past consumption.
export const coffeeChecklist = ['076', '170', '218', '604', '068', '320', '340', '188', '591', '484', '222', '558', '231', '404', '646', '108', '800', '834', '887', '356', '360', '704', '764', '156', '598'];
