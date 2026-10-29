import media from '../../data/workshop-media.json';
import ResponsiveImage from '../portfolio/responsive-image';
import PhotoViewer, { type ViewerPhoto } from '../portfolio/photo-viewer';

export default function Gallery() {
  const photos: ViewerPhoto[] = media.photos.map(photo => ({
    image: photo.image,
    alt: photo.alt,
    width: photo.ratio > 1 ? 1600 : 1066,
    height: photo.ratio > 1 ? 1066 : 1600,
    thumbnail: <ResponsiveImage
      src={photo.image}
      alt={photo.alt}
      width={photo.ratio > 1 ? 1600 : 1066}
      height={photo.ratio > 1 ? 1066 : 1600}
      sizes="(max-width: 600px) calc((100vw - 52px) / 2), (max-width: 850px) calc((100vw - 100px) / 3), 280px"
    />,
  }));

  return <>
    <PhotoViewer photos={photos} title="The Best" titleId="photo-dialog-title" thumbnailLabel="Open photograph" className="photo-gallery original-color" masonry />
    <p className="gallery-caption">A selection from my public photograph collection.</p>
  </>;
}
