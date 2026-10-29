import media from '../../data/coffee-media.json';
import ResponsiveImage from '../portfolio/responsive-image';
import PhotoViewer, { type ViewerPhoto } from '../portfolio/photo-viewer';

export default function MediaJournal() {
  const photos: ViewerPhoto[] = media.photos.map((item, index) => ({
    image: item.image,
    alt: item.alt,
    width: item.width,
    height: item.height,
    thumbnail: <ResponsiveImage
      src={item.image}
      alt={item.alt}
      width={item.width}
      height={item.height}
      sizes={index === 0
        ? '(max-width: 600px) calc(100vw - 40px), (max-width: 850px) calc(100vw - 64px), (max-width: 1280px) calc(100vw - 300px - clamp(60px, 8vw, 140px)), 878px'
        : '(max-width: 600px) calc(100vw - 40px), (max-width: 850px) calc((100vw - 100px) / 3), (max-width: 1280px) calc((100vw - 336px - clamp(60px, 8vw, 140px)) / 3), 281px'}
    />,
  }));

  return <>
    <div className="coffee-media coffee-videos">{media.videos.map(item => <figure key={item.src}><video {...{ loading: 'lazy' }} controls playsInline preload="none" poster={item.poster} width={item.width} height={item.height} aria-label={item.title}><source src={item.src} type={item.codec === 'av1' ? 'video/mp4; codecs="av01.0.12M.08, opus"' : 'video/mp4'} />Your browser cannot play this video. <a href={item.src}>Open the original video</a></video><figcaption><span>{item.title}</span><a href={item.src}>Watch original · {item.width} × {item.height} ↗</a></figcaption></figure>)}</div>
    <PhotoViewer photos={photos} title="Home Coffee" titleId="coffee-photo-title" thumbnailLabel="Open coffee photograph" className="coffee-media coffee-photos" />
    <a className="text-link" href={media.source}>View the Home Coffee album ↗</a>
  </>;
}
