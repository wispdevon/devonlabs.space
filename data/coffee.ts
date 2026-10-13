export type CoffeeOrigin = { status: 'tried' | 'not-tried'; note?: string; favorite?: boolean };
// ISO numeric country IDs. Add only origins confirmed by Wisp.
export const coffeeOrigins: Record<string, CoffeeOrigin> = {
  '340': { status: 'tried' }, // Honduras
  '404': { status: 'tried' }, // Kenya
  '591': { status: 'tried' }, // Panama
  '646': { status: 'tried' }, // Rwanda
  '604': { status: 'tried' }, // Peru
  '764': { status: 'tried', favorite: true }, // Thailand
  '704': { status: 'tried' }, // Vietnam
  '598': { status: 'tried', favorite: true }, // Papua New Guinea
  '188': { status: 'tried', favorite: true }, // Costa Rica
  '231': { status: 'tried', favorite: true }, // Ethiopia
  '320': { status: 'tried' }, // Guatemala
  '558': { status: 'tried' }, // Nicaragua
  '156': { status: 'tried' }, // China
  '076': { status: 'tried' }, // Brazil
  '108': { status: 'not-tried' }, // Burundi — next
  '887': { status: 'not-tried' }, // Yemen — next
  '356': { status: 'not-tried' }, // India — next
};

// Equipment confirmed by Wisp; no unconfirmed model sizes or modifications.
export const coffeeGear = [
  { name: 'Hario V60', kind: 'Pour-over brewer' },
  { name: 'Flair Neo', kind: 'Manual espresso' },
  { name: 'ROKpresso Classic', kind: 'Manual espresso' },
  { name: 'Mischief M40', kind: 'Hand grinder' },
  { name: 'Hario Switch', kind: 'Immersion / pour-over brewer' },
];
export const coffeeMethods = [
  { name: 'James Hoffmann’s V60 recipes', note: '15 g coffee / 250 ml water and 30 g / 500 ml. My usual adaptation is 20 g / 250 ml, for a stronger cup.' },
  { name: 'Tetsu Kasuya’s 4:6 pour-over', note: 'Hario V60. Divide the water into 40% and 60%: the first part balances sweetness and acidity, and the remaining pours adjust strength.' },
  { name: 'Immersion & hybrid', note: 'Hario Switch.' },
  { name: 'Manual espresso', note: 'Flair Neo and ROKpresso Classic.' },
];
// A read-only starter exploration list, not a claim about Wisp's past consumption.
export const coffeeChecklist = ['076', '170', '218', '604', '068', '320', '340', '188', '591', '484', '222', '558', '231', '404', '646', '108', '800', '834', '887', '356', '360', '704', '764', '156', '598'];
