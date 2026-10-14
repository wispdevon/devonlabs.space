export type PortfolioPage = 'about' | 'work' | 'software' | 'film' | 'photography' | 'coffee' | 'shop';
export const pages: { id: PortfolioPage; label: string; href: string }[] = [
  { id: 'about', label: 'About', href: '/' },
  { id: 'work', label: 'Work', href: '/work/' },
  { id: 'software', label: 'Software', href: '/software/' },
  { id: 'film', label: 'Film', href: '/film/' },
  { id: 'photography', label: 'Photography', href: '/photography/' },
  { id: 'coffee', label: 'Coffee', href: '/coffee/' },
  { id: 'shop', label: 'Shop', href: '/shop/' },
];

export const colors: Record<PortfolioPage, [string, string, string]> = {
  about: ['0.204 0.847', '0.133 1', '0.310 0.306'],
  software: ['0.129 0.941', '0.204 0.698', '0.647 0.616'],
  photography: ['0.071 0.929', '0.247 0.612', '0.271 0.529'],
  film: ['0.404 0.965', '0.114 0.741', '0.224 0.522'],
  shop: ['0.094 0.847', '0.302 1', '0.220 0.306'],
  work: ['0.133 0.945', '0.192 0.647', '0.455 0.537'],
  coffee: ['0.302 0.937', '0.173 0.784', '0.133 0.588'],
};

