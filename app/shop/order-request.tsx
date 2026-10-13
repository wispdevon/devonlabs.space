'use client';

import { useRef, useState, type FormEvent } from 'react';
import { shopEmail, orderProducts, formatShopPrice, photographyGuarantee, photographyDelivery } from '../../data/shop';

export default function OrderRequest({ productId, onProductChange }: { productId: string; onProductChange: (id: string) => void }) {
  const [draft, setDraft] = useState<{ body: string; href: string } | null>(null);
  const [copyStatus, setCopyStatus] = useState('');
  const preview = useRef<HTMLDivElement>(null);
  const product = orderProducts.find(item => item.id === productId)!;
  const service = product.kind === 'service';
  const price = formatShopPrice(product.priceCents, product.currency);

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    for (const name of product.id === 'shirt' ? ['name', 'province', 'country'] : service ? ['name', 'date', 'location'] : ['name']) {
      const input = event.currentTarget.elements.namedItem(name) as HTMLInputElement;
      input.setCustomValidity(input.value.trim() ? '' : 'Please fill in this field.');
    }
    if (!event.currentTarget.reportValidity()) return;
    const fields = new FormData(event.currentTarget);
    const value = (key: string) => String(fields.get(key) ?? '').trim();
    const body = [
      service ? 'Hello Wisp, I’d like to enquire about photography coverage:' : 'Hello Wisp, I’d like to order:', '',
      `Product: ${product.name}`, ...(product.id === 'shirt' ? [`Requested size: ${value('size')}`, `Quantity: ${value('quantity')}`] : product.kind === 'service' ? [`Coverage: ${product.duration}`, `Minimum edited photos: ${product.minimumPhotos}`, photographyGuarantee, photographyDelivery, `Preferred shoot date: ${value('date')}`, `Shoot location: ${value('location')}`] : ['Delivery: Digital file by email']),
      `Unit price: ${price}`, `Subtotal: ${formatShopPrice(product.priceCents * (product.id === 'shirt' ? Number(value('quantity')) : 1), product.currency)}`,
      '', `Name: ${value('name')}`, `Reply email: ${value('email')}`,
      ...(product.id === 'shirt' ? [`Delivery province / city: ${value('province')}`, `Country: ${value('country')}`] : []),
      '', `Notes: ${value('notes') || 'None'}`, '',
      product.id === 'shirt' ? 'Please confirm shirt availability, sizing, shipping cost and delivery time before arranging payment. The subtotal excludes shipping.' : service ? 'Please confirm availability and booking details for photography-only coverage before arranging payment.' : 'Please confirm payment instructions and email delivery of the digital photo file. No physical print or frame is included.',
    ].join('\n');
    setDraft({ body, href: `mailto:${shopEmail}?subject=${encodeURIComponent(`Devon Labs order request — ${product.name}`)}&body=${encodeURIComponent(body)}` });
    setCopyStatus('');
    requestAnimationFrame(() => preview.current?.focus());
  }

  async function copy() {
    try { await navigator.clipboard.writeText(draft!.body); setCopyStatus('Request copied. Paste it into an email to wisp@devonlabs.space.'); }
    catch { setCopyStatus('Copy is unavailable. Select and copy the request below.'); }
  }

  return <section className="shop-order" id="order-request" aria-labelledby="order-title">
    <h2 id="order-title">Request an order</h2>
    <p>Choose photography coverage, a shirt, or a digital photo file. I’ll confirm availability, payment, and delivery by email. Shirt shipping is quoted separately.</p>
    <form onSubmit={prepare} onInput={event => { if (event.target instanceof HTMLInputElement) event.target.setCustomValidity(''); }} onChange={() => { setDraft(null); setCopyStatus(''); }} action={`mailto:${shopEmail}`} method="post" encType="text/plain">
      <fieldset><legend>Product</legend><div className="order-products">{orderProducts.map(item => <label key={item.id}><input type="radio" name="product" value={item.id} checked={productId === item.id} onChange={() => onProductChange(item.id)} />{item.name}</label>)}</div></fieldset>
      {product.id === 'shirt' && <><label htmlFor="order-size">Requested shirt size (required)</label><select key={product.id} id="order-size" name="size" required defaultValue=""><option value="" disabled>Choose a size</option>{product.options.map(option => <option key={option}>{option}</option>)}</select>
      <label htmlFor="order-quantity">Quantity (required)</label><input id="order-quantity" name="quantity" type="number" inputMode="numeric" min="1" max="20" step="1" defaultValue="1" required /></>}
      <p className="order-hint">{price} {product.id === 'shirt' ? 'per shirt, plus shipping' : service ? 'for photography coverage' : 'for the digital file; no shipping'}</p>
      {product.kind === 'service' && <><p className="order-hint">{product.duration} · {product.minimumPhotos} edited photos minimum. {photographyDelivery}</p>
      <label htmlFor="order-date">Preferred shoot date (required)</label><input id="order-date" name="date" type="date" required />
      <label htmlFor="order-location">Shoot location (required)</label><input id="order-location" name="location" maxLength={200} required /></>}
      <label htmlFor="order-name">Your name (required)</label><input id="order-name" name="name" autoComplete="name" maxLength={100} required />
      <label htmlFor="order-email">Reply email (required)</label><input id="order-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254} required />
      {product.id === 'shirt' && <><label htmlFor="order-province">Delivery province / city (required)</label><input id="order-province" name="province" autoComplete="address-level1" maxLength={100} required />
      <label htmlFor="order-country">Country (required)</label><input id="order-country" name="country" autoComplete="country-name" defaultValue="Thailand" maxLength={80} required /></>}
      <label htmlFor="order-notes">Notes (optional)</label><textarea id="order-notes" name="notes" rows={3} maxLength={500} aria-describedby="order-notes-help" /><p className="order-hint" id="order-notes-help">{service ? 'For example, your event type, preferred start time, and moments you’d like covered.' : 'For example, a sizing question or more than one photo file.'}</p>
      <button className="shop-cta" type="submit">Prepare order email</button>
      <p className="order-hint">You’ll review the request, then send it from your email app. This form doesn’t submit an order automatically.</p>
    </form>
    {draft && <div className="order-preview" ref={preview} tabIndex={-1} aria-labelledby="order-preview-title"><h3 id="order-preview-title">Your request is ready to send</h3><p>Open the email draft and send it to {shopEmail}. Your order is confirmed only after we agree on payment and delivery details.</p><div className="order-actions"><a className="shop-cta" href={draft.href}>Open email draft</a><button type="button" onClick={copy}>Copy request</button></div><label htmlFor="order-message">Request text</label><textarea id="order-message" value={draft.body} readOnly rows={12} /><p role="status">{copyStatus}</p></div>}
    {/* Trusted static markup keeps Cloudflare from rewriting this public contact link before hydration. */}
    <p className="shop-closing">Prefer to write directly? <span dangerouslySetInnerHTML={{ __html: '<!--email_off--><a href="mailto:wisp@devonlabs.space?subject=Devon%20Labs%20order%20request">wisp@devonlabs.space</a><!--/email_off-->' }} /></p>
    <noscript><p>To request an order, use the email link above and include the product and your reply email; for shirts, include size, quantity and delivery province. For photography, include the package, preferred date, and location.</p></noscript>
  </section>;
}
