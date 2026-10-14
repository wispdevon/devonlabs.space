import { pageMetadata } from '../portfolio/page-metadata';
import FilmPlayer from './film-player';
import { films } from '../../data/films';

export const metadata = pageMetadata('film', 'The One Camp ’26 and Home Coffee — camp stories and a coffee brewing film.');

export default function FilmPage() {
  return <><div className="page-heading"><h1>Film</h1><p>Stories and everyday rituals.</p></div>{films.map((film, index) => <section className="film-story" key={film.title} aria-label={film.title}><FilmPlayer film={film} priority={index === 0} /></section>)}</>;
}
