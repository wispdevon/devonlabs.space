import { githubSnapshot, projects } from './developer-projects';
import media from './workshop-media.json';

export type WorkKind = 'Software' | 'Photography' | 'Video' | 'Hardware';
export type Work = {
  id: string;
  name: string;
  kind: WorkKind;
  description: string;
  position: [number, number];
  color: string;
  href: string;
  image?: string;
  video?: string;
  stack?: string[];
  contribution?: boolean;
  preview?: 'portrait' | 'review' | 'sheet';
};
const positions: [number, number][] = [
  [-17, -11],
  [-9, -17],
  [-18, -20],
  [12, -15],
  [-6, -24],
  [22, -14],
  [20, -4],
  [11, -5],
  [24, -24],
];
export const works: Work[] = [
  ...projects.map(
    (project, i): Work => ({
      id: project.repo,
      name: project.name,
      kind: 'Software',
      description: project.description,
      position: positions[i],
      color: i < 3 || i === 4 ? '#e26793' : '#427ec5',
      href: `https://github.com/wispdevon/${project.repo}`,
      image: project.image,
      stack: project.stack,
      contribution: project.contribution,
      preview: i === 0 ? 'portrait' : i === 1 ? 'review' : i === 2 ? 'sheet' : undefined,
    })
  ),
  {
    id: 'the-best',
    name: 'The Best',
    kind: 'Photography',
    description:
      'A selection from my public photograph collection. People, places, and the moments in between.',
    position: [-23, -2],
    color: '#e26793',
    href: media.source,
    image: media.photos[0].image,
  },
  {
    id: 'camp-film',
    name: "The One Camp '26",
    kind: 'Video',
    description:
      'A camp film made in collaboration with photographers, videographers, and creatives, ready to screen on the third day of camp.',
    position: [-17, 17],
    color: '#8b78ca',
    href: 'https://photo.devonlabs.space/the-one-camp-26/',
    image: '/workshop/camp-poster.jpg',
    video: 'https://photo.devonlabs.space/content/media/2026/08/Highlights-1.mp4',
  },
  {
    id: 'hardware',
    name: '1337 Sheets',
    kind: 'Hardware',
    description:
      'My hardware shop. Visit the shop for the current products, specifications, and availability.',
    position: [17, 17],
    color: '#479d86',
    href: 'https://shop.1337sheets.com/',
  },
];
export const photographs = media.photos;
export { githubSnapshot };
export const discoveries = [
  { id: 'negative', name: 'A lost negative', position: [-28, -14] },
  { id: 'satellite', name: 'A quiet satellite', position: [28, -28] },
  { id: 'archive', name: 'An old archive', position: [-27, 27] },
  { id: 'signal', name: 'A good signal', position: [27, 25] },
  { id: 'lens', name: 'A spare lens', position: [-7, -31] },
  { id: 'starlight', name: 'A little starlight', position: [5, 29] },
];
export const circuit: [number, number][] = [
  [-28, 20],
  [-28, -25],
  [28, -25],
  [28, 20],
  [-28, 20],
];

export type Progress = {
  version: 1;
  visited: string[];
  discoveries: string[];
  jumped: boolean;
  best: number | null;
};
export const emptyProgress = (): Progress => ({
  version: 1,
  visited: [],
  discoveries: [],
  jumped: false,
  best: null,
});
export function readProgress(value: string | null): Progress {
  try {
    const data = JSON.parse(value || 'null');
    if (!data || data.version !== 1) return emptyProgress();
    return {
      version: 1,
      visited: Array.isArray(data.visited)
        ? [...new Set<string>(data.visited.filter((id: string) => works.some((w) => w.id === id)))]
        : [],
      discoveries: Array.isArray(data.discoveries)
        ? [
            ...new Set<string>(
              data.discoveries.filter((id: string) => discoveries.some((d) => d.id === id))
            ),
          ]
        : [],
      jumped: data.jumped === true,
      best:
        typeof data.best === 'number' &&
        Number.isFinite(data.best) &&
        data.best > 0 &&
        data.best < 86400
          ? data.best
          : null,
    };
  } catch {
    return emptyProgress();
  }
}
