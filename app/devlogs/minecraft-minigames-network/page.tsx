import type { Metadata } from 'next';
import Link from 'next/link';
import Image from '../../portfolio/responsive-image';
import { minigamesDevlog as post } from '../../../data/devlogs';
import styles from '../devlogs.module.css';

export const metadata: Metadata = {
  title: `${post.title} — Devon Labs`,
  description: post.description,
  alternates: { canonical: post.href },
  openGraph: { title: post.title, description: post.description, url: post.href, type: 'article', publishedTime: `${post.date}T00:00:00+07:00`, authors: ['Wisp'], images: [{ url: '/devlogs/minigames-hub-overview.webp', width: 2560, height: 1440, alt: 'The Devon Labs hub and live instance board, captured in Minecraft.' }] },
  twitter: { card: 'summary_large_image', title: post.title, description: post.description, images: ['/devlogs/minigames-hub-overview.webp'] },
};

const contents = [
  ['intent', 'A library of games'],
  ['constraints', 'The rules that shape it'],
  ['architecture', 'How a game wakes up'],
  ['tradeoffs', 'What I reused and what I built'],
  ['versions', 'Compatibility is part of the map'],
  ['resets', 'Starting over without losing the past'],
  ['hub', 'A hub you can walk through'],
  ['status', 'What is live and what is next'],
  ['verification', 'What counts as verified'],
  ['lessons', 'What I would carry forward'],
];

function Screenshot({ name, alt, caption, priority = false }: { name: string; alt: string; caption: string; priority?: boolean }) {
  const src = `/devlogs/minigames-${name}.webp`;
  return <figure className={styles.screenshot}>
    <Image src={src} alt={alt} width={2560} height={1440} sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 850px) calc(100vw - 64px), 865px" priority={priority} />
    <figcaption>{caption} Screenshot by Wisp, 18 November 2026. <a href={src}>Open full size</a>.</figcaption>
  </figure>;
}

export default function MinecraftMinigamesDevlog() {
  return <article className={styles.article}>
    <header>
      <Link href="/devlogs/">← Devlogs</Link>
      <p className={styles.meta}><time dateTime={post.date}>{post.dateLabel}</time> · By Wisp · Design &amp; progress</p>
      <h1>{post.title}</h1>
      <p className={styles.lead}>Pick a game in the hub, let its server wake up, and play. Come back later and your world is still there. Behind that simple loop is a small network built around old adventure maps, limited resources, and a refusal to treat saved progress as disposable.</p>
      <Screenshot name="hub-overview" alt="A stone courtyard framed by teal-roofed towers, with the Devon Labs live instance board in front of the central gate." caption="The always-on hub, with the instance board showing no game backends running at the moment of capture." priority />
      <dl className={styles.facts}>
        <div><dt>23 games</dt><dd>Registered in the network</dd></div>
        <div><dt>3 active</dt><dd>Game backends at a time</dd></div>
        <div><dt>30 seconds</dt><dd>Empty before save and shutdown</dd></div>
      </dl>
      <p className={styles.meta}>A snapshot of the project on 18 November 2026. “Registered” describes network enrollment; it does not mean every map has passed a complete multiplayer playthrough. This is a personal network, with paid hosting still on hold.</p>
    </header>

    <nav className={styles.contents} aria-label="Article contents">
      <h2>In this devlog</h2>
      <ol>{contents.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}</ol>
    </nav>

    <section id="intent" tabIndex={-1} aria-labelledby="intent-title">
      <h2 id="intent-title">1. A library of games</h2>
      <p>Minecraft maps are often small games in their own right. A puzzle map, a party game, and a long co-op adventure can have very different needs, even though they all arrive as a world download. I wanted to put that variety behind one familiar entrance.</p>
      <p>The player-facing loop is deliberately short: join the hub, choose a labelled display or open <code>/games</code>, and travel to the selected game when it is ready. <code>/hub</code> brings you back. The proxy and hub stay online; individual game servers run when people use them.</p>
      <p>The catalog includes the Diversity trilogy, party and competitive maps, adventure worlds, three Golf courses, and newer additions such as Roguefire, Apiary, and Sorcerer’s Book 2. The aim is a collection worth returning to, with each map’s rules and progress intact.</p>
      <Screenshot name="spawn-plaza" alt="The hub’s central spawn plaza, welcome text, teal-lit buildings, and a purple portal beside the live instance board." caption="One entrance to the collection: the central plaza and welcome display inside Vulcan Lobby." />
    </section>

    <section id="constraints" tabIndex={-1} aria-labelledby="constraints-title">
      <h2 id="constraints-title">2. The rules that shape it</h2>
      <ul>
        <li><strong>Keep idle games asleep.</strong> A controller admits at most three game backends. The hub and proxy are separate from that limit. This is an admission policy, not a claim that every combination has been load-tested.</li>
        <li><strong>Preserve what people played.</strong> Returning to the hub leaves progress intact; the backend saves the current world before automatic shutdown. A reset is a separate, confirmed operator action.</li>
        <li><strong>Respect the map’s runtime.</strong> Preserve the author’s archive, inspect its instructions and packs, and start with the exact supported engine and version before adapting a copy.</li>
        <li><strong>Keep existing worlds independent.</strong> The personal servers and their progress remain separate from fresh minigame copies.</li>
        <li><strong>Keep authority narrow.</strong> A display can request a known game. It does not receive the credentials needed to administer the host.</li>
      </ul>
      <p>Independent group copies of the same map are outside the current system. Three active games means three different configured backends, with the existing world for each map.</p>
    </section>

    <section id="architecture" tabIndex={-1} aria-labelledby="architecture-title">
      <h2 id="architecture-title">3. How a game wakes up</h2>
      <p>Velocity is the front door. The hub provides the selection interface; a separate host controller owns admission, starts, readiness, and idle shutdown. Pelican and Wings manage the actual server processes.</p>
      <figure className={styles.diagram}>
        <div className={styles.flow}>
          <div className={styles.node}><strong>Player → Velocity → Hub</strong><span>The entrance stays online.</span></div>
          <div className={styles.arrow} aria-hidden="true">↓</div>
          <div className={styles.node}><strong>Display or game menu → Controller → Wings</strong><span>A registered request reserves capacity and starts the selected backend.</span></div>
          <div className={styles.arrow} aria-hidden="true">↓</div>
          <div className={styles.branch}>
            <div className={styles.node}><strong>Ready → Join the game</strong><span>The proxy routes the player to the checked run.</span></div>
            <div className={styles.node}><strong>Empty → Save → Stop</strong><span>After 30 seconds, with a final player-count check.</span></div>
          </div>
        </div>
        <figcaption>Request flow, rather than a physical network diagram. Reset and restore operations use a separate guarded path.</figcaption>
      </figure>
      <p>A fourth different game cannot start until a slot is free; players can still join an already running game. Starting, stopping, and uncertain power requests continue to reserve capacity until their state is reconciled. Otherwise, a slow response could accidentally become permission to start another server.</p>
      <p>The live instance board shows running games, readiness, and connected players. Its join action refers to an exact run and is checked again before transfer. Stale board data pauses joins, so an old display cannot quietly send someone into a replacement world after a reset.</p>
    </section>

    <section id="tradeoffs" tabIndex={-1} aria-labelledby="tradeoffs-title">
      <h2 id="tradeoffs-title">4. What I reused and what I built</h2>
      <p>The foundation is existing software: Pelican/Wings for process management, Velocity for routing, Paper or Vanilla for maps, and version-translation plugins where needed. The hub itself uses <a href="https://www.planetminecraft.com/project/vulcan-lobby-hub/">Vulcan Lobby by getawxy</a>. The map creators supply the games.</p>
      <p>Keeping every game online would simplify startup, at the cost of running many idle JVMs. Managing each game manually through the panel would work too, but would keep an operator in the player’s path. The chosen approach retains the panel and adds a small orchestration layer for this collection’s admission, routing, and persistence rules.</p>
      <p>That custom layer has a maintenance cost: the controller, proxy integration, reset helper, and station plugin must agree on stable identities and recovery behavior. It earns its place by handling the boundaries between existing tools, rather than replacing their server engines or administration interfaces.</p>
      <p>The reusable Pelican minigame template follows the same principle. It builds on maintained runtime images and official downloads, adding exact-version selection, checksum verification, and map metadata. Importing that template alone does not enroll a game in the proxy, controller, menus, or reset registry.</p>
    </section>

    <section id="versions" tabIndex={-1} aria-labelledby="versions-title">
      <h2 id="versions-title">5. Compatibility is part of the map</h2>
      <p>“Runs Minecraft” is not a sufficient compatibility target. Diversity 1 uses Vanilla 1.7.4, Diversity 2 uses 1.8.8, and Diversity 3 uses 1.14.4. Other maps need Paper, newer command formats, or a particular resource pack. Forcing them all onto one current server version would lose the reason to preserve them.</p>
      <p>Version translation helps clients reach those backends, but a successful connection says little about a custom HUD, shader, puzzle, or command sequence. Dormant routes also need an exact backend protocol pin: there may be no running server for the proxy to probe when a player first chooses it.</p>
      <p>Compatibility repairs belong in derived copies. Original downloads and checksums remain intact, alongside separate pristine reset templates and played worlds. Elemental Trial’s 26.2 conversion illustrates the tradeoff: the English HUD and replacement seating were checked in a native client, while some newer visual effects are omitted and full dungeon playtesting remains pending.</p>
    </section>

    <section id="resets" tabIndex={-1} aria-labelledby="resets-title">
      <h2 id="resets-title">6. Starting over without losing the past</h2>
      <p>A reset should let a group begin again while keeping a route back to its previous run. The operator selects the map and confirms the operation. Players return to the hub, the target stops, and only then can the helper back up the configured world bundle and stage a pristine replacement.</p>
      <p>Restoring a snapshot follows the same pattern and archives the current world before replacement. Snapshot codes are permanent, readable handles; the underlying archive identity, target server, and generation stay bound together. Server binaries, plugins, and unrelated configuration are outside the world-replacement scope.</p>
      <p>An interrupted or uncertain operation leaves the map locked and offline for reconciliation. A timeout cannot be treated as evidence that the world is safe to start. The journal, controller history, and archives are part of recovery, alongside the actual world folders.</p>
      <p>Run history records observed joins and leaves, rather than counting a start request as play. It can have gaps after outages, so it is useful operational history with explicit limits. Backup integrity and a successful restore are also separate checks; one does not establish the other.</p>
    </section>

    <section id="hub" tabIndex={-1} aria-labelledby="hub-title">
      <h2 id="hub-title">7. A hub you can walk through</h2>
      <p>The hub turns a server list into a place. Labelled stations and clickable photo boards give games a visible presence, and the instance board shows where people are playing.</p>
      <p>Operators can place, move, hide, and change a station’s photo in game. The display entities and the physical build have separate lifecycles: moving a station does not move its stone podium, lights, or surrounding blocks. New games default to hidden displays, ready for manual placement after the operator builds their setting.</p>
      <p>Photo changes retain registered map IDs, while saved position and visibility stay bound to the hub world. Those files and world data belong together in backups. Rebuilding a display should not mean losing its identity or silently overwriting someone’s decoration.</p>
      <p>The approved next step connects the hub’s activities: walking guides, public cosmetics, twelve collectible spirits, rooftop parkour, and informational XP. Cosmetics are intended to be available to everyone; levels will not gate them. This larger progression experience is still work in progress.</p>
      <Screenshot name="adventure-stations" alt="The Art of Defense and Aghanim’s Labyrinth 2 game previews set into a dark-stone arcade with teal lighting." caption="Adventure-game displays use the hub’s existing architecture, with a preview and a right-click prompt for each game." />
      <Screenshot name="diversity-apiary" alt="Three teal Diversity stations and a glowing red Apiary CTM station beneath the Complete the Monument heading." caption="The Diversity trilogy and a manually placed Apiary CTM display share a themed corner of the hub." />
      <Screenshot name="party-stations" alt="A wooden Mineparty photo station with a cake icon beside a red Mario Party station overlooking the plaza." caption="Mineparty and Mario Party have distinct physical builds around the same game-selection interaction." />
    </section>

    <section id="status" tabIndex={-1} aria-labelledby="status-title">
      <h2 id="status-title">8. What is live and what is next</h2>
      <table className={styles.status}>
        <caption>Recorded project state as of 18 November 2026; these are distinct verification stages.</caption>
        <thead><tr><th scope="col">Area</th><th scope="col">State and next step</th></tr></thead>
        <tbody>
          <tr><th scope="row">Network core</th><td>Installed: 23 registered games, on-demand starts, three-game admission, 30-second empty shutdown, hub menus, and reset/snapshot support. Complete multiplayer and capacity testing remain open.</td></tr>
          <tr><th scope="row">Latest map additions</th><td>Roguefire, Apiary, and Sorcerer’s Book 2 are activated. Their station definitions and previews are installed. New displays start hidden for manual placement; the Apiary display shown above has since been placed by hand. Complete playthroughs remain unverified.</td></tr>
          <tr><th scope="row">Cosmetics</th><td>The starter slice is live. The broader public selection has isolated-server checks and partial native-client checks; its live activation and remaining selection/transfer checks are pending.</td></tr>
          <tr><th scope="row">Hub progression</th><td>Approved design: walking guides, spirits, parkour, informational XP, and rankings. Full plugin-stack compatibility, implementation, and acceptance remain in progress.</td></tr>
          <tr><th scope="row">Honey Clicker</th><td>Queued separately from the 23-game baseline. Vanilla 1.20.4 intake and smoke checks are partial; the proposed initial cap is one player. Gameplay, meaningful save/restart acceptance, and network activation remain incomplete.</td></tr>
          <tr><th scope="row">Enrollment workflow</th><td>Read-only egg metadata extraction and validation are verified. Full guarded enrollment is still being completed; a metadata candidate is not an activated game.</td></tr>
        </tbody>
      </table>
    </section>

    <section id="verification" tabIndex={-1} aria-labelledby="verification-title">
      <h2 id="verification-title">9. What counts as verified</h2>
      <p>Each layer needs evidence suited to its claim. Archive checks and upstream hashes establish which files were inspected. An isolated startup shows that a runtime boots. A protocol response shows that it answers. Native-client checks can establish specific interactions and visuals. A multiplayer playthrough is needed to evaluate the game itself.</p>
      <p>The same distinction applies to operations. Disposable reset/restore exercises test recovery behavior; they do not mean a live player world was reset. A check through the public hostname from inside the LAN does not establish independent external reachability. An admission limit does not establish sustained performance.</p>
      <p>Live changes go through the existing maintenance lock, admission controls, complete roster checks, controller/reset-helper idleness checks, stopped-volume backups, integrity verification, and health checks afterward. Those safeguards matter because even a hub-only change can interrupt the entrance to every game.</p>
    </section>

    <section id="lessons" tabIndex={-1} aria-labelledby="lessons-title">
      <h2 id="lessons-title">10. What I would carry forward</h2>
      <p>The hardest parts sit between components: a world version and a client pack, an old menu row and a new run, a timed-out request and an operation that may already have committed. Stable identities and explicit states make those boundaries easier to reason about.</p>
      <p>Preservation also changes how features are designed. Original archives, reset baselines, current worlds, and historical snapshots serve different purposes. Keeping them separate makes compatibility experiments and fresh starts possible without making progress disposable.</p>
      <p>Next comes completing the public cosmetics checks and rollout, validating the premade activity stack, and building progression in verified slices. Honey Clicker keeps its own acceptance checklist. The standard is that choosing a game feels simple because the complexity underneath has somewhere safe to live.</p>
      <p className={styles.note}>Credits: Minecraft and its maps belong to their respective creators. This post describes the network integration; it does not redistribute map downloads, resource packs, private operational records, or player history.</p>
    </section>
    <Link className={styles.back} href="/devlogs/">← All devlogs</Link>
  </article>;
}
