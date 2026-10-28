import type { ReactNode } from 'react';
import media from '../../data/coffee-media.json';
import ResponsiveImage from '../portfolio/responsive-image';
import MediaJournalViewer from './media-journal-viewer';

export default function MediaJournal() {
  const thumbnails: ReactNode[] = media.photos.map((item, index) => <ResponsiveImage
    key={item.image}
    src={item.image}
    alt={item.alt}
    width={item.width}
    height={item.height}
    sizes={index === 0
      ? '(max-width: 600px) calc(100vw - 40px), (max-width: 850px) calc(100vw - 64px), (max-width: 1280px) calc(100vw - 300px - clamp(60px, 8vw, 140px)), 878px'
      : '(max-width: 600px) calc(100vw - 40px), (max-width: 850px) calc((100vw - 100px) / 3), (max-width: 1280px) calc((100vw - 336px - clamp(60px, 8vw, 140px)) / 3), 281px'}
  />);

  return <MediaJournalViewer thumbnails={thumbnails} />;
}
