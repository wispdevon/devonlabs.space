import type { ReactNode } from 'react';
import media from '../../data/workshop-media.json';
import ResponsiveImage from '../portfolio/responsive-image';
import GalleryViewer from './gallery-viewer';

export default function Gallery() {
  const thumbnails: ReactNode[] = media.photos.map(photo => <ResponsiveImage
    key={photo.id}
    src={photo.image}
    alt={photo.alt}
    width={photo.ratio > 1 ? 1600 : 1066}
    height={photo.ratio > 1 ? 1066 : 1600}
    sizes="(max-width: 600px) calc((100vw - 52px) / 2), (max-width: 850px) calc((100vw - 100px) / 3), 280px"
  />);

  return <GalleryViewer thumbnails={thumbnails} />;
}
