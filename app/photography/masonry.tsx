'use client';

import { Children, useEffect, useRef, type ReactNode } from 'react';

export default function Masonry({ children, className }: { children: ReactNode; className: string }) {
  const grid = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = grid.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const contents = [...element.querySelectorAll<HTMLElement>(':scope > .masonry-item > .masonry-content')];
    let frame = 0;
    function pack() {
      const styles = getComputedStyle(element!);
      const gap = Number.parseFloat(styles.getPropertyValue('--masonry-gap')) || 16;
      const columns = Number.parseInt(styles.getPropertyValue('--masonry-columns'), 10) || 3;
      // Clear old columns before measuring at a new breakpoint: an old third
      // column would otherwise create an implicit track in the two-column grid.
      contents.forEach(content => { content.parentElement!.style.gridColumn = '1'; });
      const heights = contents.map(content => Math.ceil(content.getBoundingClientRect().height + gap));
      const bottoms = Array<number>(columns).fill(0);
      contents.forEach((content, index) => {
        const column = bottoms.indexOf(Math.min(...bottoms));
        const height = Math.max(1, heights[index]);
        content.parentElement!.style.gridColumn = `${column + 1}`;
        content.parentElement!.style.gridRow = `${bottoms[column] + 1} / span ${height}`;
        bottoms[column] += height;
      });
      element!.dataset.packed = 'true';
    }
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(pack);
    });
    contents.forEach(content => observer.observe(content));
    pack();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [children]);

  return <div ref={grid} className={`${className} dynamic-masonry`}>
    {Children.toArray(children).map((child, index) => <div key={index} className="masonry-item"><div className="masonry-content">{child}</div></div>)}
  </div>;
}
