import { pageMetadata } from '../portfolio/page-metadata';
import FilmPlayer from './film-player';
import { films } from '../../data/films';
import ResponsiveImage from '../portfolio/responsive-image';

export const metadata = pageMetadata('film', 'The One Camp ’26 and Home Coffee — camp stories and a coffee brewing film.');

export default function FilmPage() {
  return <><div className="page-heading"><h1>Film</h1><p>Stories and everyday rituals.</p></div>{films.map((film, index) => {
    const priority = index === 0;
    const poster = <ResponsiveImage
      src={film.poster}
      alt={film.posterAlt}
      width={film.width}
      height={film.height}
      sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 850px) calc(100vw - 64px), (max-width: 1280px) calc(100vw - 300px - clamp(60px, 8vw, 140px)), 878px"
      priority={priority}
    />;

    return <section className="film-story" key={film.title} aria-label={film.title}><FilmPlayer film={film} poster={poster} /></section>;
  })}</>;
}
