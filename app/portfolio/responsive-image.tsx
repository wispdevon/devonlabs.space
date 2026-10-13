/* eslint-disable @next/next/no-img-element */
import type { ComponentProps } from 'react';
import manifest from '../../data/image-manifest.json';

type Props = Omit<ComponentProps<'img'>, 'src' | 'width' | 'height'> & {
  src: string; width: number; height: number; priority?: boolean;
};

export default function ResponsiveImage({ src, width, height, priority, alt, ...props }: Props) {
  const image = manifest[src as keyof typeof manifest];
  if (!image) throw new Error(`Missing responsive image: ${src}`);
  const fallback = image.variants.find(item => item.width >= 640) ?? image.variants.at(-1)!;
  return <img {...props} src={fallback.src} srcSet={image.variants.map(item => `${item.src} ${item.width}w`).join(', ')} alt={alt} width={image.width || width} height={image.height || height} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" />;
}
