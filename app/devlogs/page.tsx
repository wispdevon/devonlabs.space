import Link from 'next/link';
import { pageMetadata } from '../portfolio/page-metadata';
import { minigamesDevlog as post } from '../../data/devlogs';
import styles from './devlogs.module.css';

export const metadata = pageMetadata('devlogs', 'Development notes from Devon Labs: decisions, experiments, and lessons from building software.');

export default function DevlogsPage() {
  return <>
    <div className="page-heading"><h1>Devlogs</h1><div className="heading-summary"><div><h2>Notes from the build.</h2><p>What I’m making, why it works this way, and what still needs testing.</p></div></div></div>
    <article className={styles.entry}>
      <p className="mono"><time dateTime={post.date}>{post.dateLabel}</time> · Minecraft</p>
      <h2><Link href={post.href}>{post.title}</Link></h2>
      <p>{post.description}</p>
      <Link className="text-link" href={post.href}>Read the devlog <span aria-hidden="true">→</span></Link>
    </article>
  </>;
}
