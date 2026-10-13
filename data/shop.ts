export const shopEmail = 'wisp@devonlabs.space';
export const photographyGuarantee = 'Minimum 50 edited photos per hour guaranteed.';
export const photographyDelivery = 'Guaranteed delivery within 1–3 calendar days after the shoot.';
export const photographyPackages = [
  { id: 'coverage-short', kind: 'service', currency: 'THB', priceCents: 200000, name: 'Short Coverage', duration: '90 minutes', durationMinutes: 90, minimumPhotos: 75, description: 'Photography for a small event, a gathering, or a short personal session in Phuket.' },
  { id: 'coverage-extended', kind: 'service', currency: 'THB', priceCents: 400000, name: 'Extended Coverage', duration: '3 hours', durationMinutes: 180, minimumPhotos: 150, description: 'More time to capture the people, atmosphere, and moments of your event in Phuket.' },
] as const;
export const shopProducts = [
  { id: 'shirt', kind: 'physical', currency: 'USD', priceCents: 2499, name: 'After Hours shirt', category: 'Wear / 01', description: 'A washed-charcoal shirt with a faded Phuket night photograph, Space Grotesk lettering and a small DL chest mark. Design mockup; fabric, fit and measurements will be confirmed before ordering.', image: '/shop/after-hours-shirt.webp', alt: 'Front and back of the After Hours shirt with a Phuket night photograph', options: ['S', 'M', 'L', 'XL', 'XXL', 'Other / discuss sizing'] },
  { id: 'architecture', kind: 'digital', currency: 'USD', priceCents: 1499, name: 'Geometric light', category: 'Prints / 02', description: 'Architectural color and natural light. Digital photo file delivered by email after payment; physical printing and framing are not included.', image: '/workshop/photos/01.webp', alt: 'Geometric architectural details shown in a sample frame', options: [] },
  { id: 'flight', kind: 'digital', currency: 'USD', priceCents: 1499, name: 'In flight', category: 'Prints / 03', description: 'A fleeting moment of birds in flight. Digital photo file delivered by email after payment; physical printing and framing are not included.', image: '/workshop/photos/06.webp', alt: 'Birds in flight shown in a sample frame', options: [] },
] as const;

export const orderProducts = [...shopProducts, ...photographyPackages];
export type ShopProduct = (typeof orderProducts)[number];
export type PhotographyPackage = (typeof photographyPackages)[number];

export function formatShopPrice(cents: number, currency: 'USD' | 'THB' = 'USD') {
  return currency === 'THB' ? `THB ${(cents / 100).toLocaleString('en-US')}` : `US$${(cents / 100).toFixed(2)}`;
}
