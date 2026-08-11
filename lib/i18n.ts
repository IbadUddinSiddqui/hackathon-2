// lib/i18n.ts
// P3-20 — lightweight i18n: a typed dictionary with en/ur locales, a cookie
// for persistence, and an RTL flag for Urdu. No external deps — keeps the
// storefront dependency-light. The language switcher reads/writes the cookie.

export type Locale = "en" | "ur";

export const LOCALES: { code: Locale; label: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "ur", label: "اردو", dir: "rtl" },
];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "anks-locale";

export function isLocale(v: unknown): v is Locale {
  return v === "en" || v === "ur";
}

export function localeDir(locale: Locale): "ltr" | "rtl" {
  return locale === "ur" ? "rtl" : "ltr";
}

/** Parse a cookie header for the locale. */
export function localeFromCookie(cookieHeader?: string | null): Locale {
  if (!cookieHeader) return DEFAULT_LOCALE;
  const match = cookieHeader
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${LOCALE_COOKIE}=`));
  if (!match) return DEFAULT_LOCALE;
  const value = match.split("=")[1];
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

type Dict = Record<string, string>;

const en: Dict = {
  "nav.home": "Home",
  "nav.shop": "Shop",
  "nav.categories": "Categories",
  "nav.cart": "Cart",
  "nav.wishlist": "Wishlist",
  "nav.search": "Search",
  "nav.checkout": "Checkout",
  "header.banner": "🎉 Sign Up and get 20% off on your first order.",
  "header.claim": "Claim Offer",
  "header.dashboard": "Dashboard",
  "header.login": "Login",
  "hero.title1": "Elevate Your",
  "hero.title2": "Everyday Style",
  "hero.subtitle": "Discover premium quality apparel crafted for comfort and designed for confidence.",
  "hero.shopNew": "Shop New Arrivals",
  "hero.explore": "Explore Collections",
  "hero.sale": "FLASH SALE",
  "hero.freeReturns": "Free Returns",
  "hero.eco": "Eco-Friendly",
  "hero.quality": "Premium Quality",
  "hero.support": "24/7 Support",
  "hero.womens": "Womens Clothing",
  "hero.mens": "Mens Clothing",
  "hero.wearables": "Wearables",
  "hero.children": "Children",
  "cart.title": "Your Cart",
  "cart.empty": "Your cart is empty",
  "cart.orderSummary": "Order Summary",
  "cart.proceed": "Proceed to Checkout",
  "cart.subtotal": "Subtotal",
  "cart.delivery": "Delivery Fee",
  "cart.discount": "Discount",
  "cart.total": "Total",
  "cart.price": "Price:",
  "cart.stock": "Stock:",
  "cart.available": "available",
  "cart.enterCode": "Enter discount code",
  "cart.apply": "Apply",
  "cart.remove": "Remove",
  "cart.appliedSave": "applied — save",
  "checkout.title": "Checkout",
  "checkout.email": "Email for order confirmation",
  "checkout.giftCard": "Gift card code",
  "checkout.credit": "Store credit (Rs)",
  "checkout.codNote": "Pay cash on delivery. Our courier will collect the total when your order arrives.",
  "checkout.placing": "Placing order...",
  "checkout.placeCod": "Place Order — Cash on Delivery",
  "checkout.validEmail": "Enter a valid email so we can confirm your order.",
  "checkout.paymentMethod": "Payment method",
  "checkout.cardSafepay": "Card (Safepay)",
  "checkout.cardSub": "Pay with local cards (PK)",
  "checkout.cod": "Cash on Delivery",
  "checkout.codSub": "Pay when it arrives",
  "footer.newsletterHead": "STAY UP TO DATE ABOUT OUR LATEST OFFERS",
  "footer.emailPlaceholder": "Enter your email address",
  "footer.subscribe": "Subscribe To Newsletter",
  "footer.tagline": "We have clothes that suit your style and which you're proud to wear. From women to men.",
  "footer.company": "COMPANY",
  "footer.help": "HELP",
  "footer.faq": "FAQ",
  "footer.resources": "Resources",
  "footer.about": "About",
  "footer.features": "Features",
  "footer.works": "Works",
  "footer.career": "Career",
  "footer.customerSupport": "Customer Support",
  "footer.deliveryDetails": "Delivery Details",
  "footer.contact": "Contact",
  "footer.terms": "Terms & Conditions",
  "footer.privacy": "Privacy Policy",
  "footer.returns": "Returns & Exchanges",
  "footer.account": "Account",
  "footer.manageDeliveries": "Manage Deliveries",
  "footer.orders": "Orders",
  "footer.payments": "Payments",
  "footer.rights": "All rights reserved.",
  "product.inStock": "In Stock",
  "product.outOfStock": "Out of Stock",
  "product.left": "left",
  "product.addToCart": "Add to Cart",
  "product.addToWishlist": "Add to Wishlist",
  "product.inWishlist": "In Wishlist",
  "product.youMayAlsoLike": "You May Also Like",
  "product.reviews": "Reviews",
  "product.writeReview": "Write a review",
  "common.loading": "Loading…",
  "common.searchPlaceholder": "Search products…",
};

const ur: Dict = {
  "nav.home": "ہوم",
  "nav.shop": "شاپ",
  "nav.categories": "کیٹیگریز",
  "nav.cart": "کارٹ",
  "nav.wishlist": "خواہش کی فہرست",
  "nav.search": "تلاش",
  "nav.checkout": "چیک آؤٹ",
  "header.banner": "🎉 سائن اپ کریں اور پہلے آرڈر پر 20% چھوٹ حاصل کریں۔",
  "header.claim": "آفر حاصل کریں",
  "header.dashboard": "ڈیش بورڈ",
  "header.login": "لاگ ان",
  "hero.title1": "اپنے روزمرہ کے انداز کو",
  "hero.title2": "بلند کریں",
  "hero.subtitle": "آرام اور اعتماد کے لیے ڈیزائن کردہ اعلیٰ معیار کے کپڑے دریافت کریں۔",
  "hero.shopNew": "نئی آمد خریدیں",
  "hero.explore": "کلیکشن دیکھیں",
  "hero.sale": "فلیش سیل",
  "hero.freeReturns": "مفت واپسی",
  "hero.eco": "ماحول دوست",
  "hero.quality": "اعلیٰ معیار",
  "hero.support": "24/7 سپورٹ",
  "hero.womens": "خواتین کے کپڑے",
  "hero.mens": "مردوں کے کپڑے",
  "hero.wearables": "پہننے کے قابل",
  "hero.children": "بچوں کے کپڑے",
  "cart.title": "آپ کی کارٹ",
  "cart.empty": "آپ کی کارٹ خالی ہے",
  "cart.orderSummary": "آرڈر کا خلاصہ",
  "cart.proceed": "چیک آؤٹ پر جائیں",
  "cart.subtotal": "سب ٹوٹل",
  "cart.delivery": "ڈیلیوری فیس",
  "cart.discount": "ڈسکاؤنٹ",
  "cart.total": "کل",
  "cart.price": "قیمت:",
  "cart.stock": "اسٹاک:",
  "cart.available": "دستیاب",
  "cart.enterCode": "ڈسکاؤنٹ کوڈ درج کریں",
  "cart.apply": "لگائیں",
  "cart.remove": "ہٹائیں",
  "cart.appliedSave": "لاگو — بچت",
  "checkout.title": "چیک آؤٹ",
  "checkout.email": "آرڈر کی تصدیق کے لیے ای میل",
  "checkout.giftCard": "گفٹ کارڈ کوڈ",
  "checkout.credit": "اسٹور کریڈٹ (روپے)",
  "checkout.codNote": "ڈیلیوری پر نقد ادائیگی کریں۔ ہمارا کورئیر آرڈر پہنچنے پر رقم وصول کرے گا۔",
  "checkout.placing": "آرڈر ہو رہا ہے...",
  "checkout.placeCod": "آرڈر کریں — ڈیلیوری پر نقد",
  "checkout.validEmail": "آرڈر کی تصدیق کے لیے درست ای میل درج کریں۔",
  "checkout.paymentMethod": "ادائیگی کا طریقہ",
  "checkout.cardSafepay": "کارڈ (سیف پے)",
  "checkout.cardSub": "مقامی کارڈز سے ادائیگی (پاکستان)",
  "checkout.cod": "ڈیلیوری پر نقد",
  "checkout.codSub": "پہنچنے پر ادائیگی کریں",
  "footer.newsletterHead": "ہماری تازہ ترین آفرز سے باخبر رہیں",
  "footer.emailPlaceholder": "اپنا ای میل پتہ درج کریں",
  "footer.subscribe": "نیوز لیٹر سبسکرائب کریں",
  "footer.tagline": "ہمارے پاس ایسے کپڑے ہیں جو آپ کے انداز کے مطابق ہوں اور جنہیں پہن کر آپ کو فخر ہو۔ خواتین سے مردوں تک۔",
  "footer.company": "کمپنی",
  "footer.help": "مدد",
  "footer.faq": "سوالات",
  "footer.resources": "وسائل",
  "footer.about": "ہمارے بارے میں",
  "footer.features": "خصوصیات",
  "footer.works": "کام",
  "footer.career": "کیریئر",
  "footer.customerSupport": "کسٹمر سپورٹ",
  "footer.deliveryDetails": "ڈیلیوری کی تفصیلات",
  "footer.contact": "رابطہ",
  "footer.terms": "شرائط و ضوابط",
  "footer.privacy": "رازداری کی پالیسی",
  "footer.returns": "واپسی اور تبادلہ",
  "footer.account": "اکاؤنٹ",
  "footer.manageDeliveries": "ڈیلیوری کا انتظام",
  "footer.orders": "آرڈرز",
  "footer.payments": "ادائیگیاں",
  "footer.rights": "جملہ حقوق محفوظ ہیں۔",
  "product.inStock": "اسٹاک میں ہے",
  "product.outOfStock": "اسٹاک ختم",
  "product.left": "باقی",
  "product.addToCart": "کارٹ میں ڈالیں",
  "product.addToWishlist": "خواہش کی فہرست میں شامل کریں",
  "product.inWishlist": "فہرست میں شامل ہے",
  "product.youMayAlsoLike": "آپ کو یہ بھی پسند آ سکتے ہیں",
  "product.reviews": "جائزے",
  "product.writeReview": "جائزہ لکھیں",
  "common.loading": "لوڈ ہو رہا ہے…",
  "common.searchPlaceholder": "پروڈکٹس تلاش کریں…",
};

const dicts: Record<Locale, Dict> = { en, ur };

export function t(locale: Locale, key: string): string {
  return dicts[locale][key] ?? dicts.en[key] ?? key;
}

/** All keys (for tests). */
export function dictKeys(): string[] {
  return Object.keys(en);
}

/** Ensure every locale has identical keys (for tests). */
export function dictsComplete(): boolean {
  const enKeys = new Set(Object.keys(en));
  for (const locale of ["ur"] as Locale[]) {
    const keys = new Set(Object.keys(dicts[locale]));
    for (const k of enKeys) if (!keys.has(k)) return false;
  }
  return true;
}
