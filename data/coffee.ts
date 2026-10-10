export type CoffeeOrigin = { status: 'tried' | 'not-tried'; note: string };
// ISO numeric country IDs. Add only origins confirmed by Wisp.
export const coffeeOrigins: Record<string, CoffeeOrigin> = {};

// Replace empty details with the owner's actual equipment and methods.
export const coffeeGear = ['Brewers', 'Grinders', 'Scales & kettles'];
export const coffeeMethods = ['Recipes & ratios', 'Grind & extraction', 'Tasting & adjustments'];
