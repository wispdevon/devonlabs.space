import Image from '../portfolio/responsive-image';
import SiteShell, { Arrow, pageMetadata } from '../portfolio/site-shell';
import { shopProducts, formatShopPrice } from '../../data/shop';
import ShopOffers from './shop-offers';

export const metadata = pageMetadata('shop', 'Phuket photography coverage from THB 2,000, shirts and digital photo files. Request coverage or an order by email.');

export default function ShopPage() {
  return <SiteShell page="shop">
    <section className="shop-heading" aria-labelledby="shop-title"><p className="mono shop-eyebrow">Devon Labs / Shop</p><h1 id="shop-title">Hardware &amp; curiosities</h1><p className="shop-lead">Photography for your moments. Shirts for everyday. Photo files to print your way.</p><p className="shop-notice">Photography coverage is priced in Thai baht; shirts and digital photo files are priced in US dollars. Shirt shipping is confirmed separately before payment. Merchandise images show design previews.</p><a className="text-link shop-order-link" href="#order-request">Request an order <Arrow /></a></section>
    <ShopOffers>
    <section aria-label="Shirts and prints" className="shop-products">
      {shopProducts.map(product => <article className="shop-product" key={product.id}>
        <div className={`product-art product-${product.id}`}>
          {product.id === 'shirt' ? <Image src={product.image} alt={product.alt} width={1536} height={1024} sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 850px) calc((100vw - 92px) / 2), 430px" /> : <div className="print-frame"><div className="print-photo"><Image src={product.image} alt={product.alt} width={1066} height={1600} sizes="(max-width: 600px) calc((100vw - 40px) * .64 - 36px), (max-width: 850px) calc((100vw - 92px) * .32 - 36px), (max-width: 1280px) calc((100vw - 328px - clamp(60px, 8vw, 140px)) * .32 - 36px), 236px" /></div></div>}
        </div>
        <div className="product-caption"><p className="mono">{product.category}</p></div>
        <h2>{product.name}</h2><p className="product-description">{product.description}</p><p className="product-price">{formatShopPrice(product.priceCents)} {product.id === 'shirt' ? '· shipping extra' : '· digital file'}</p>
      </article>)}
    </section>
    </ShopOffers>
  </SiteShell>;
}
