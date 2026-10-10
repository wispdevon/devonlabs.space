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
  {
    id: 'negative',
    name: 'A lost negative',
    position: [-2.2, 8],
    description:
      'A tiny frame of a much bigger day. The lightbox in the photo studio is missing its negative.',
  },
  {
    id: 'satellite',
    name: 'A quiet satellite',
    position: [24, -28],
    description:
      'An explorer with nowhere to phone home. Its journey is written in scratches, not words.',
  },
  {
    id: 'archive',
    name: 'An old archive',
    position: [-25, 21],
    description:
      'Early ideas, abandoned branches, unfinished things. Not every experiment needs an ending.',
  },
  {
    id: 'signal',
    name: 'A good signal',
    position: [6, 3],
    description:
      'A little transmitter, still blinking. The antenna on the hardware bench could use this.',
  },
  {
    id: 'lens',
    name: 'A spare lens',
    position: [-6, 5],
    description: 'Round glass, a purple reflection. The cinema projector has an empty lens mount.',
  },
  {
    id: 'starlight',
    name: 'A little starlight',
    position: [4, -29],
    description:
      'The workshop is small. The sky is not. Some things are worth keeping just because.',
  },
];
export const puzzles = [
  {
    id: 'lightbox',
    name: 'The lightbox',
    item: 'negative',
    position: [-18, 1],
    hint: 'An empty lightbox. Somewhere in the workshop, a negative is waiting to be found.',
    solved: 'The negative catches the light. A small moment becomes a photograph.',
    color: '#e77d9f',
  },
  {
    id: 'projector',
    name: 'The projector',
    item: 'lens',
    position: [-12, 19],
    hint: 'The projector hums, but its lens mount is empty.',
    solved: 'The lens clicks into place. The cinema comes alive.',
    color: '#a79acc',
  },
  {
    id: 'antenna',
    name: 'The antenna',
    item: 'signal',
    position: [14, 20],
    hint: 'A little antenna listens to silence. It needs a transmitter.',
    solved: 'A pulse travels up the mast. Someone out there is listening.',
    color: '#54aa96',
  },
];
export function canRepair(id: string, item: string, collected: string[], repaired: string[]) {
  return (
    collected.includes(item) &&
    !repaired.includes(id) &&
    puzzles.some((p) => p.id === id && p.item === item)
  );
}
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
  repaired: string[];
};
export const emptyProgress = (): Progress => ({
  version: 1,
  visited: [],
  discoveries: [],
  jumped: false,
  best: null,
  repaired: [],
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
      repaired: Array.isArray(data.repaired)
        ? [
            ...new Set<string>(
              data.repaired.filter((id: string) =>
                puzzles.some(
                  (p) =>
                    p.id === id &&
                    Array.isArray(data.discoveries) &&
                    data.discoveries.includes(p.item)
                )
              )
            ),
          ]
        : [],
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
