import coffee from './coffee-media.json';

export const films = [
  {
    title: 'The One Camp ’26',
    description: 'A camp film made with photographers, videographers, and creatives, ready to screen on the third day.',
    metadata: '2026 / Collaborative film',
    poster: '/workshop/camp-poster.jpg',
    posterAlt: 'A filmmaker carrying equipment at The One Camp',
    width: 1920,
    height: 1080,
    src: 'https://photo.devonlabs.space/content/media/2026/08/Highlights-1.mp4',
    sourceUrl: 'https://photo.devonlabs.space/the-one-camp-26/',
  },
  {
    title: 'Home Coffee',
    description: 'A film about brewing coffee at home.',
    metadata: '2026 / Coffee film',
    poster: coffee.videos[0].poster,
    posterAlt: 'Coffee brewing at the home coffee station',
    width: coffee.videos[0].width,
    height: coffee.videos[0].height,
    src: coffee.videos[0].src,
    sourceUrl: coffee.source,
  },
];
