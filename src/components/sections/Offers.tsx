'use client';

import { useEffect, useRef, useState } from 'react';
import Reveal from '@/components/animations/Reveal';
import { useI18n } from '@/i18n/I18nProvider';

const QUANTITIES = [1, 2, 3];

type PriceInfo = {
  quantity: number;
  product_id: string;
  pieces: number;
  available: boolean;
  currency: string;
  sub_total: number;
  total: number;
  tax: number;
  discount: number;
  original_total: number;
  per_piece: number;
};

type Status = 'idle' | 'processing' | 'error' | 'price-updated';

const TITLES = {
  ar: ['قطعة واحدة', 'قطعتان', 'ثلاث قطع'],
  en: ['One piece', 'Two pieces', 'Three pieces'],
};
const STORE_LABEL = { ar: 'ر.س', en: 'SAR' };

export default function Offers() {
  const { locale } = useI18n();
  const ar = locale === 'ar';
  const [selected, setSelected] = useState(2);
  const [prices, setPrices] = useState<PriceInfo[] | null>(null);
  const [priceError, setPriceError] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/pricing')
      .then(async (r) => {
        if (!r.ok) throw new Error('pricing failed');
        const data = await r.json();
        if (!active) return;
        setPrices(data.prices as PriceInfo[]);
        setPriceError(false);
      })
      .catch(() => {
        if (!active) return;
        setPrices(null);
        setPriceError(true);
      });
    return () => { active = false; };
  }, []);

  const viewedRef = useRef(false);
  useEffect(() => {
    if (!prices || viewedRef.current) return;
    viewedRef.current = true;
    const info = priceFor(selected) ?? prices[0];
    if (info) ttqApi()?.track?.('ViewContent', buildProductPayload(info.product_id, info.pieces, info.total));
  }, [prices, selected]);

  const priceFor = (q: number) => prices?.find((p) => p.quantity === q);

  const ttqApi = () =>
    (window as unknown as {
      ttq?: { track?: (e: string, p: object, opts?: object) => void };
    }).ttq;

  const buildProductPayload = (
    productId: string,
    pieces: number,
    total: number
  ) => {
    const id = String(productId || '675834151');
    return {
      content_type: 'product',
      content_ids: [id],
      contents: [
        {
          content_id: id,
          content_name: 'Mini Orange',
          quantity: pieces,
          price: Number((total / pieces).toFixed(2)),
        },
      ],
      quantity: pieces,
      value: total,
      currency: 'SAR',
    };
  };


  const gtagApi = () =>
    (window as unknown as {
      gtag?: (...args: unknown[]) => void;
    }).gtag;
  const checkoutLock = useRef(false);

  const buy = async () => {
    if (checkoutLock.current) return;
    if (status === 'processing') return;
    if (priceError || !prices) return;
    const q = selected;
    const expected = priceFor(q);
    if (!expected) return;

    // Synchronous lock: prevents duplicate submissions from double-clicks
    // or re-entrant calls before any async work begins.
    checkoutLock.current = true;
    setStatus('processing');
    setNotice(null);

    const requestId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: q, requestId, locale }),
      });
      const data = await res.json().catch(() => ({}) as {
        checkout_url?: string;
        total?: number;
        product_id?: string;
        pieces?: number;
      });
      if (!res.ok || !data.checkout_url) {
        throw new Error(data?.message || 'checkout_failed');
      }

      const sallaTotal = typeof data.total === 'number' ? data.total : expected.total;
      const sallaProductId = data.product_id || expected.product_id;
      const sallaPieces = typeof data.pieces === 'number' ? data.pieces : expected.pieces;


      const gtag = gtagApi();
      if (gtag) {
        gtag('event', 'begin_checkout', {
          currency: 'SAR',
          value: sallaTotal,
          items: [{
            item_id: sallaProductId,
            item_name: 'Mini Orange',
            quantity: sallaPieces,
            price: Number((sallaTotal / sallaPieces).toFixed(2)),
          }],
        });
      }
      // Fire InitiateCheckout exactly once, only after a valid Salla URL.
      const ttq = ttqApi();
      if (ttq && typeof ttq.track === 'function') {
        ttq.track(
          'InitiateCheckout',
          buildProductPayload(sallaProductId, sallaPieces, sallaTotal),
          { event_id: requestId }
        );
      }

      // Do not release the lock before redirecting.
      window.location.assign(data.checkout_url);
    } catch {
      checkoutLock.current = false;
      setStatus('error');
    }
  };

  const label = STORE_LABEL[ar ? 'ar' : 'en'];

  const renderOption = (q: number, index: number) => {
    const p = priceFor(q);
    const best = index === 1;
    const loading = !priceError && !p;
    const unavailable = !!p && p.available === false;
    const discounted = !!p && p.available && p.discount > 0;

    return (
      <button
        key={q}
        type="button"
        className={selected === q ? 'selected' : ''}
        onClick={() => setSelected(q)}
        aria-pressed={selected === q}
        disabled={priceError || unavailable}
      >
        <span className="offer-radio" />
        <span>
          <b>{TITLES[ar ? 'ar' : 'en'][index]}</b>
          {loading ? (
            <small className="offer-skeleton" />
          ) : p ? (
            <small>
              {unavailable
                ? (ar ? 'غير متوفر' : 'Unavailable')
                : discounted
                ? ar
                  ? `وفر ${p.discount} ${label}`
                  : `Save ${p.discount} ${label}`
                : ar
                ? `سعر القطعة ${p.per_piece} ${label}`
                : `${label} ${p.per_piece} each`}
            </small>
          ) : null}
        </span>
        <span className="offer-price">
          {loading ? (
            <b className="offer-skeleton" />
          ) : p ? (
            <>
              {discounted && <s>{p.original_total} {label}</s>}
              <b>{unavailable ? '—' : `${p.total} ${label}`}</b>
            </>
          ) : null}
        </span>
        {best && <em>{ar ? 'الأكثر طلبًا' : 'Most popular'}</em>}
      </button>
    );
  };

  const current = priceFor(selected);
  const loading = !priceError && !prices;
  const selectedAvailable = !!current && current.available !== false;
  const canCheckout = !priceError && !!prices && selectedAvailable && status !== 'processing';

  return (
    <section id="offers" className="offers">
      <div className="container">
        <Reveal className="offers-head"><span className="overline">{ar ? 'العرض والكمية' : 'OFFERS & QUANTITY'}</span><h2 className="sec-title">{ar ? 'خذ أكثر. وادفع أقل.' : 'Take more. Pay less.'}</h2><p>{ar ? 'اختر الكمية المناسبة، ثم أكمل الطلب بأمان داخل متجر سلة.' : 'Choose your quantity, then complete checkout securely in Salla.'}</p></Reveal>
        <div className="offer-layout">
          <Reveal className="offer-image" direction="right"><img src="/assets/mini-orange-cutout.png" alt="Mini Orange" /></Reveal>
          <Reveal className="offer-panel" direction="left">
            {priceError ? (
              <p className="offer-price-error" role="alert">{ar ? 'تعذر تحميل السعر' : 'Could not load pricing'}</p>
            ) : (
              <div className="offer-options">
                {QUANTITIES.map((q, i) => renderOption(q, i))}
              </div>
            )}
            <div className="offer-total">
              <span>{ar ? 'الإجمالي' : 'Total'}</span>
              <strong>
                {loading || !current
                  ? '—'
                  : `${current.total} ${label}`}
              </strong>
            </div>
            <button
              className="offer-buy"
              type="button"
              onClick={buy}
              disabled={!canCheckout}
              aria-busy={status === 'processing'}
            >
            {status === 'processing'
              ? (ar ? 'جاري تحويلك للدفع...' : 'Redirecting to checkout...')
              : (current && !current.available
                  ? (ar ? 'غير متوفر' : 'Unavailable')
                  : current
                  ? (ar ? `اطلب ${TITLES.ar[QUANTITIES.indexOf(selected)]} الآن` : `Order ${TITLES.en[QUANTITIES.indexOf(selected)]}`)
                  : (ar ? 'اختر الكمية' : 'Choose a quantity'))}
            </button>
            {status === 'error' && (
              <p className="offer-buy-error" role="alert">
                {ar ? 'تعذر إتمام الطلب، حاول مرة أخرى.' : 'Could not complete your order.'}
                <button type="button" className="offer-buy-retry" onClick={buy}>{ar ? 'إعادة المحاولة' : 'Retry'}</button>
              </p>
            )}
            {notice && <p className="offer-notice" role="status">{notice}</p>}
            <p className="offer-trust">{ar ? 'دفع آمن عبر سلة · توصيل مجاني · ضمان سنتين' : 'Secure Salla checkout · Free delivery · Two-year warranty'}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
