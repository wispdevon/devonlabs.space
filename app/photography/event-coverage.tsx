import coverage from '../../data/event-coverage.json';
import ResponsiveImage from '../portfolio/responsive-image';
import { Arrow } from '../portfolio/site-shell';
import { photographyPackages, photographyGuarantee, photographyDelivery, formatShopPrice } from '../../data/shop';
import Masonry from './masonry';

type EventPhoto = (typeof coverage.events)[number]['photos'][number];

function Photograph({ photo, priority = false }: { photo: EventPhoto; priority?: boolean }) {
  return <figure>
    <ResponsiveImage src={photo.image} alt={photo.alt} width={photo.width} height={photo.height} priority={priority} sizes="(max-width: 600px) calc((100vw - 52px) / 2), (max-width: 850px) calc((100vw - 100px) / 3), 280px" />
    <figcaption>{photo.caption}</figcaption>
  </figure>;
}

export default function EventCoverage() {
  return <section className="event-coverage" aria-labelledby="event-coverage-heading">
    <div className="event-coverage-intro">
      <div>
        <h2 id="event-coverage-heading">Event coverage</h2>
        <p>On stage, in the crowd, and between the big moments.</p>
        <p>Event stories, from the atmosphere of the room to the people who make it.</p>
      </div>
      <a className="text-link" href="mailto:wisp@devonlabs.space?subject=Event%20photography%20enquiry">Let’s talk about your event <Arrow /></a>
    </div>
    <nav className="event-story-navigation" aria-label="Event galleries">
      {coverage.events.map(event => <a href={`#event-${event.id}`} key={event.id}>{event.title}</a>)}
    </nav>
    {coverage.events.map((event, eventIndex) => <article className="event-story" key={event.id} aria-labelledby={`event-${event.id}`}>
      <div className="event-story-heading">
        <h3 id={`event-${event.id}`}>{event.title}</h3>
        <span className="mono"><time dateTime={event.date}>{new Date(`${event.date}T12:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })}</time> · {event.photos.length} photographs</span>
      </div>
      <p className="event-story-description">{event.description}</p>
      <Masonry className="event-coverage-photos">
        {event.photos.map((photo, index) => <Photograph key={photo.id} photo={photo} priority={eventIndex === 0 && index === 0} />)}
      </Masonry>
      {event.source ? <a className="text-link event-story-source" href={event.source}>View the event collection <Arrow /></a> : null}
    </article>)}
    <div className="event-coverage-enquiry">
      <p>Planning an event? Send me the date, location, and what you’d like covered.</p>
      <a className="text-link" href="mailto:wisp@devonlabs.space?subject=Event%20photography%20enquiry">Enquire about coverage <Arrow /></a>
    </div>
    <section className="photography-packages" aria-labelledby="photography-packages-heading">
      <h3 id="photography-packages-heading">Photography packages</h3>
      <p>{photographyGuarantee} {photographyDelivery}</p>
      <ul>{photographyPackages.map(item => <li key={item.id}><a href={`/shop/#${item.id}`}><strong>{item.name}</strong> · {formatShopPrice(item.priceCents, item.currency)} · {item.duration} · {item.minimumPhotos} edited photos minimum <Arrow /></a></li>)}</ul>
    </section>
  </section>;
}
