// Shared commerce constants used by server routes AND the client UI.
// Keep the client and server in sync so displayed totals match what is charged.
//
// Bazaar Nest is a Pakistan-only store: prices and the delivery fee are in
// Pakistani Rupees (PKR). Safepay charges PKR; Stripe cannot process PKR.
export const CURRENCY = 'PKR';
export const CURRENCY_SYMBOL = 'Rs';
export const DELIVERY_FEE = 200; // rupees
