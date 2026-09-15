import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Fixed landing-page prices. Update the matching products in Salla separately:
// hosted checkout charges Salla's prices, not the values configured here.
// Remote product lookups must not override these display prices.
const OFFERS: Record<number, { productId: string; pieces: number; price: number }> = {
  1: { productId: '675834151', pieces: 1, price: 119 },
  2: { productId: '1723041231', pieces: 2, price: 188 },
  3: { productId: '1627582468', pieces: 3, price: 259 },
};

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

function offerPrice(q: number): PriceInfo {
  const offer = OFFERS[q];
  const total = offer.price;
  return {
    quantity: q,
    product_id: offer.productId,
    pieces: offer.pieces,
    available: true,
    currency: 'SAR',
    sub_total: total,
    total,
    tax: 0,
    discount: 0,
    original_total: total,
    per_piece: Number((total / offer.pieces).toFixed(2)),
  };
}

export async function GET() {
  const prices = [1, 2, 3].map(offerPrice);
  return NextResponse.json({ prices }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
