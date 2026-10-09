import github from './github.json';

export type Project = { repo: string; name: string; description: string; category: string; stack: string[]; image?: string; imageAlt?: string; contribution?: boolean };
export const projects: Project[] = [
  { repo: 'GibbonPfp', name: 'HeadshotFlow', description: 'Consistent portraits, entirely on your device. Face-aware crops, RAW development, background removal, and batch export.', category: 'Photography', stack: ['C++', 'Qt', 'OpenCV'], image: '/developer/headshotflow.webp', imageAlt: 'HeadshotFlow desktop workspace with portrait preview and framing controls' },
  { repo: 'Immichinko', name: 'Immichinko', description: 'Rediscover your photo library, ten photographs at a time. Review, favorite, and come back tomorrow.', category: 'Photography', stack: ['SvelteKit', 'TypeScript', 'SQLite'], image: '/developer/immichinko.webp', imageAlt: 'Immichinko daily photo review with Favorite, Pass, and Later controls' },
  { repo: 'immich-contact', name: 'Immich Contact Sheet', description: 'Turn an Immich album into a contact sheet. Full-frame grids, film strips, and a preview before you export.', category: 'Photography', stack: ['TypeScript', 'Express', 'Sharp'], image: '/developer/contact-sheet.webp', imageAlt: 'Generated filmic contact sheet with photographs and film perforations' },
  { repo: 'strider', name: 'Strider', description: 'A collaborative home for your projects. Kanban boards, passkeys, assignments, subtasks, and a Hall of Fame for finished work.', category: 'Web apps', stack: ['Next.js', 'React', 'SQLite'] },
  { repo: 'quester', name: 'Quester', description: 'A private photography quest workspace. Compose without cropping, connect Immich, and save your work with passkey-backed authentication.', category: 'Photography', stack: ['React', 'TypeScript', 'WebCrypto'] },
  { repo: 'sharplysearch', name: 'Sharply Search', description: 'Photography gear, one Wayland shortcut away. Find cameras and lenses, inspect live specifications, and copy what you need.', category: 'Desktop tools', stack: ['Bash', 'Wofi', 'Sharply API'] },
  { repo: 'NoMarky', name: 'NoMarky', description: 'A small browser extension that filters YouTube recommendations by creator, with an optional jump to the next unblocked video.', category: 'Web apps', stack: ['JavaScript', 'WebExtensions'] },
  { repo: 'wifiqr', name: 'WifiQR', description: 'Share your current Wi-Fi connection as a QR code, straight from the macOS terminal.', category: 'Desktop tools', stack: ['Shell', 'libqrcode'] },
  { repo: 'sharply', name: 'Sharply', description: 'A community database for photography gear, specifications, reviews, and editorial content. My fork of the Sharply project.', category: 'Contributions', stack: ['Photography', 'Web application'], contribution: true },
];
export const categories = ['All', 'Photography', 'Web apps', 'Desktop tools', 'Contributions'];
export const githubSnapshot = github;
