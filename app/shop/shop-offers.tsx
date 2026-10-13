import {
  photographyDelivery,
  photographyGuarantee,
  photographyPackages,
  formatShopPrice,
  shopEmail,
} from '../../data/shop';

type ShopContactLinkProps = {
  subject: string;
  body: string;
  label?: string;
  ariaLabel: string;
  className?: string;
  wrapperClassName?: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!);
}

export function ShopContactLink({
  subject,
  body,
  label = 'Contact me',
  ariaLabel,
  className,
  wrapperClassName,
}: ShopContactLinkProps) {
  const href = `mailto:${shopEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const link = `<a${className ? ` class="${escapeHtml(className)}"` : ''} href="${escapeHtml(href)}" aria-label="${escapeHtml(ariaLabel)}">${escapeHtml(label)}</a>`;
  return <span className={wrapperClassName} dangerouslySetInnerHTML={{ __html: `<!--email_off-->${link}<!--/email_off-->` }} />;
}

export default function ShopOffers() {
  return <section className="coverage-shop" aria-labelledby="coverage-shop-heading">
    <h2 id="coverage-shop-heading">Photography coverage</h2>
    <p>{photographyGuarantee} {photographyDelivery}</p>
    <div className="shop-products coverage-products">
      {photographyPackages.map(item => {
        const price = formatShopPrice(item.priceCents, item.currency);
        const body = [
          'Hello Wisp, I’d like to enquire about photography coverage.',
          '',
          `Package: ${item.name}`,
          `Price: ${price}`,
          `Duration: ${item.duration}`,
          `Minimum edited photos: ${item.minimumPhotos}`,
          photographyGuarantee,
          photographyDelivery,
          '',
          'Preferred shoot date:',
          'Shoot location:',
        ].join('\n');

        return <article className="shop-product coverage-product" id={item.id} key={item.id}>
          <p className="mono coverage-category">Photography / Phuket</p>
          <h3>{item.name}</h3>
          <p className="coverage-price">{price}</p>
          <p>{item.duration} · {item.minimumPhotos} edited photos minimum</p>
          <p className="coverage-delivery">{photographyGuarantee}</p>
          <p className="coverage-delivery">{photographyDelivery}</p>
          <ShopContactLink
            subject={`Devon Labs enquiry — ${item.name}`}
            body={body}
            ariaLabel={`Contact me about ${item.name}`}
            className="shop-cta"
            wrapperClassName="text-link"
          />
        </article>;
      })}
    </div>
  </section>;
}
