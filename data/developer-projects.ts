import github from './github.json';

export type Project = { repo: string; name: string; description: string; category: string; stack: string[]; topics?: string[]; image?: string; imageAlt?: string; contribution?: boolean; website?: string };
export const projects: Project[] = [
  { repo: 'GibbonPfp', name: 'HeadshotFlow', description: 'Consistent portraits, entirely on your device. Face-aware crops, RAW development, background removal, and batch export.', category: 'Photography', stack: ['C++', 'Qt', 'OpenCV'], image: '/developer/headshotflow.webp', imageAlt: 'HeadshotFlow desktop workspace with portrait preview and framing controls' },
  { repo: 'Immichinko', name: 'Immichinko', description: 'Rediscover your photo library, ten photographs at a time. Review, favorite, and come back tomorrow.', category: 'Photography', stack: ['SvelteKit', 'TypeScript', 'SQLite'], image: '/developer/immichinko.webp', imageAlt: 'Immichinko daily photo review with Favorite, Pass, and Later controls' },
  { repo: 'immich-contact', name: 'Immich Contact Sheet', description: 'Turn an Immich album into a contact sheet. Full-frame grids, film strips, and a preview before you export.', category: 'Photography', stack: ['TypeScript', 'Express', 'Sharp'], image: '/developer/contact-sheet.webp', imageAlt: 'Generated filmic contact sheet with photographs and film perforations' },
  { repo: 'strider', website: 'https://boards.devonlabs.space', image: '/developer/strider.webp', imageAlt: 'Strider Flow public project workspace directory', name: 'Strider', description: 'A collaborative home for your projects. Kanban boards, passkeys, assignments, subtasks, and a Hall of Fame for finished work.', category: 'Web apps', stack: ['Next.js', 'React', 'SQLite'] },
  { repo: 'quester', website: 'https://quest.devonlabs.space', image: '/developer/quester.webp', imageAlt: 'Quester photo quest homepage and previous quests', name: 'Quester', description: 'A private photography quest workspace. Compose without cropping, connect Immich, and save your work with passkey-backed authentication.', category: 'Photography', stack: ['React', 'TypeScript', 'WebCrypto'] },
  { repo: 'sharplysearch', name: 'Sharply Search', description: 'Photography gear, one Wayland shortcut away. Find cameras and lenses, inspect live specifications, and copy what you need.', category: 'Desktop tools', stack: ['Bash', 'Wofi', 'Sharply API'], topics: ['Photography'] },
  { repo: 'NoMarky', name: 'NoMarky', description: 'A small browser extension that filters YouTube recommendations by creator, with an optional jump to the next unblocked video.', category: 'Web apps', stack: ['JavaScript', 'WebExtensions'] },
  { repo: 'wifiqr', name: 'WifiQR', description: 'Share your current Wi-Fi connection as a QR code, straight from the macOS terminal.', category: 'Desktop tools', stack: ['Shell', 'libqrcode'] },
  { repo: 'sharply', website: 'https://www.sharplyphoto.com', image: '/developer/sharply.webp', imageAlt: 'Sharply photography gear search and community database homepage', name: 'Sharply', description: 'A community database for photography gear, specifications, reviews, and editorial content. My fork of the Sharply project.', category: 'Contributions', stack: ['Photography', 'Web application'], topics: ['Photography'], contribution: true },
];
export const categories = ['All', 'Photography', 'Web apps', 'Desktop tools', 'Contributions'];
export const githubSnapshot = github;

export const categoryColors: Record<string, string> = { Photography: '#bad69b', 'Web apps': '#91bfe0', 'Desktop tools': '#e3be84', Contributions: '#d4a4cb' };

export function areProjectsConnected(a: Project, b: Project) {
  const aTopics = [a.category, ...(a.topics || [])];
  const bTopics = [b.category, ...(b.topics || [])];
  return aTopics.some(topic => bTopics.includes(topic)) || a.stack.some(tool => b.stack.includes(tool));
}
