import Image from 'next/image';
import SiteShell, { pageMetadata } from '../portfolio/site-shell';

export const metadata = pageMetadata('shop', 'The Devon Labs shop: a preview collection of mugs and wall art.');

function Mug({ alternate = false }: { alternate?: boolean }) {
  return <svg viewBox="0 0 600 600" role="img" aria-label={alternate ? 'Apricot sample mug with a burgundy sun design' : 'Lime sample mug with Devon Labs lettering'}>
    <ellipse cx="300" cy="467" rx="154" ry="19" fill="currentColor" opacity=".12" />
    <path d="M395 230h34c90 0 90 137 0 137h-34" fill="none" stroke="var(--mug-body)" strokeWidth="34" />
    <path d="M177 205h240v197q0 56-120 56t-120-56Z" fill="var(--mug-body)" />
    <ellipse cx="297" cy="205" rx="120" ry="27" fill="var(--mug-body)" />
    <ellipse cx="297" cy="205" rx="102" ry="17" fill="var(--mug-ink)" opacity=".28" />
    <path d="M195 240v148q0 34 30 42" fill="none" stroke="white" strokeWidth="12" opacity=".22" />
    {alternate ? <g fill="var(--mug-ink)"><circle cx="297" cy="322" r="42" /><path d="M297 261v-19m0 160v-19m61-61h19m-160 0h19m104-43 14-14m-114 114 14-14m86 0 14 14m-114-114 14 14" stroke="var(--mug-ink)" strokeWidth="8" /></g> : <g fill="var(--mug-ink)" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="39" letterSpacing="-2"><text x="220" y="317">DEVON</text><text x="220" y="360">LABS.</text></g>}
  </svg>;
}

const products = [
  { name: 'Everyday mug', category: 'Objects / 01', description: 'A lime ceramic mug for the desk. Sample design.', type: 'mug' },
  { name: 'Sunrise mug', category: 'Objects / 02', description: 'An apricot mug with a little sun. Sample design.', type: 'sun' },
  { name: 'Geometric light', category: 'Wall art / 03', description: 'Geometric architecture in lime. Sample framed print.', type: 'architecture', photo: '/workshop/photos/01.webp' },
  { name: 'In flight', category: 'Wall art / 04', description: 'A fleeting moment, in forest and lime. Sample framed print.', type: 'flight', photo: '/workshop/photos/06.webp' },
];

export default function ShopPage() {
  return <SiteShell page="shop">
    <section className="shop-heading" aria-labelledby="shop-title"><p className="mono shop-eyebrow">Devon Labs / Shop</p><h1 id="shop-title">Hardware &amp; curiosities</h1><p className="shop-lead">Small objects. A little color. Something for your walls.</p></section>
    <section aria-label="Preview collection" className="shop-products">
      {products.map(product => <article className="shop-product" key={product.type}>
        <div className={`product-art product-${product.type}`}>
          {product.photo ? <div className="print-frame"><div className="duotone"><Image src={product.photo} alt={product.name === 'Geometric light' ? 'Geometric architectural details shown as a sample framed print' : 'Birds in flight shown as a sample framed print'} width={1066} height={1600} sizes="(max-width: 600px) 75vw, 350px" /></div></div> : <Mug alternate={product.type === 'sun'} />}
        </div>
        <div className="product-caption"><p className="mono">{product.category}</p></div>
        <h2>{product.name}</h2><p className="product-description">{product.description}</p>
      </article>)}
    </section>
  </SiteShell>;
}
