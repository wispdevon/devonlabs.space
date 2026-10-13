'use client';

import { useRef, useState, type ReactNode } from 'react';
import { photographyPackages, photographyGuarantee, photographyDelivery, formatShopPrice, shopProducts, type PhotographyPackage } from '../../data/shop';
import OrderRequest from './order-request';

function CoverageItem({ item, onRequest }: { item: PhotographyPackage; onRequest: (id: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const requesting = useRef(false);
  const titleId = `${item.id}-title`;

  return <article className="shop-product coverage-product" id={item.id}>
    <p className="mono coverage-category">Photography / Phuket</p>
    <h3>{item.name}</h3>
    <p className="coverage-price">{formatShopPrice(item.priceCents, item.currency)}</p>
    <p>{item.duration} · {item.minimumPhotos} edited photos minimum</p>
    <p className="product-description">{item.description}</p>
    <p className="coverage-delivery">{photographyDelivery}</p>
    <button ref={trigger} type="button" className="text-link" aria-haspopup="dialog" aria-controls={`${item.id}-dialog`} aria-label={`View ${item.name} details`} onClick={() => { requesting.current = false; dialog.current?.showModal(); }}>View package details →</button>
    <dialog ref={dialog} id={`${item.id}-dialog`} className="photo-dialog coverage-dialog" aria-labelledby={titleId} closedby="any" onClick={event => {
      if ('closedBy' in HTMLDialogElement.prototype || event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
    }} onClose={() => { if (requesting.current) onRequest(item.id); else trigger.current?.focus(); }}>
      <div className="dialog-heading"><h2 id={titleId}>{item.name}</h2><form method="dialog"><button className="dialog-close" type="submit">Close <span aria-hidden="true">×</span></button></form></div>
      <p className="coverage-price">{formatShopPrice(item.priceCents, item.currency)} <span>· {item.duration}</span></p>
      <p>{item.description}</p>
      <ul className="coverage-inclusions"><li>{item.minimumPhotos} edited photos minimum</li><li>{photographyGuarantee}</li><li>{photographyDelivery}</li><li>Photography only</li></ul>
      <p className="order-hint">Send your preferred date, location, and what you’d like covered. I’ll confirm availability and booking details by email.</p>
      <button className="shop-cta" type="button" onClick={() => { requesting.current = true; dialog.current?.close(); }}>Request coverage</button>
    </dialog>
  </article>;
}

export default function ShopOffers({ children }: { children: ReactNode }) {
  const [productId, setProductId] = useState<string>(shopProducts[0].id);
  const [requestId, setRequestId] = useState(0);
  function request(id: string) {
    setProductId(id);
    setRequestId(value => value + 1);
    requestAnimationFrame(() => {
      const name = document.getElementById('order-name');
      document.getElementById('order-request')?.scrollIntoView({ block: 'start' });
      name?.focus({ preventScroll: true });
    });
  }
  return <>
    <section className="coverage-shop" aria-labelledby="coverage-shop-heading">
      <h2 id="coverage-shop-heading">Photography coverage</h2>
      <p>{photographyGuarantee}</p>
      <div className="shop-products coverage-products">{photographyPackages.map(item => <CoverageItem key={item.id} item={item} onRequest={request} />)}</div>
    </section>
    {children}
    <OrderRequest key={requestId} productId={productId} onProductChange={setProductId} />
  </>;
}
