import type { Faq, Product } from './types';

export interface Suggestion {
  label: string;
  text: string;
}

export const CATEGORIES = [
  'Auto-detect',
  'Product enquiry',
  'Price enquiry',
  'Delivery enquiry',
  'Payment enquiry',
  'Customer complaint',
  'General enquiry',
] as const;

export type Category = (typeof CATEGORIES)[number];

interface RuleContext {
  products: Product[];
  faqs: Faq[];
  settings: {
    businessName: string;
    greeting: string;
    closing: string;
    deliveryNote: string;
  };
}

const naira = (n: number) =>
  '₦' + Number(n).toLocaleString('en-NG', { maximumFractionDigits: 2 });

const DELIVERY_INTENT = /\b(deliver|delivery|ship|shipping|dispatch|pickup|pick ?up|transport)\b/;
const PAYMENT_INTENT = /\b(pay|payment|transfer|card|pos|deposit|instal ?ment)\b/;
const BULK_INTENT = /\b(bulk|wholesale|discount|dozen|carton|quantity)\b/;

/** Words in a product name that appear in the customer's message. */
function matchProducts(text: string, products: Product[]): Product[] {
  return products
    .filter((p) => {
      const words = p.name.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
      return words.some((w) => w.length > 2 && text.includes(w));
    })
    .slice(0, 2);
}

/** FAQs whose question words appear in the customer's message, most relevant first. */
function matchFaqs(text: string, faqs: Faq[]): Faq[] {
  return faqs
    .map((f) => {
      const words = f.question
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3);
      return { f, score: words.filter((w) => text.includes(w)).length };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.f);
}

/** The single most relevant saved FAQ for a message, optionally narrowed to an intent. */
export function findBestFaq(text: string, faqs: Faq[], intent?: RegExp): Faq | null {
  const scored = faqs
    .map((f) => {
      const q = f.question.toLowerCase().replace(/[^\w\s]/g, '');
      const words = q.split(/\s+/).filter((w) => w.length > 3);
      let score = words.filter((w) => text.includes(w)).length;
      if (intent && intent.test(q)) score += 1;
      return { f, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.f ?? null;
}

/**
 * Topics the message asks about that have no saved answer anywhere — shown to the
 * business owner so they can add the missing information themselves.
 */
export function missingInfoTopics(
  message: string,
  faqs: Faq[],
  settings: RuleContext['settings']
): string[] {
  const text = message.toLowerCase();
  const out: string[] = [];
  if (DELIVERY_INTENT.test(text) && !findBestFaq(text, faqs, DELIVERY_INTENT) && !settings.deliveryNote) {
    out.push(
      'delivery fees and timelines — save a delivery FAQ in the FAQ Manager, or add a delivery note in Settings'
    );
  }
  if (PAYMENT_INTENT.test(text) && !findBestFaq(text, faqs, PAYMENT_INTENT)) {
    out.push('accepted payment methods — save a payment FAQ in the FAQ Manager');
  }
  if (BULK_INTENT.test(text) && !findBestFaq(text, faqs, BULK_INTENT)) {
    out.push('bulk or wholesale discounts — save a discount FAQ in the FAQ Manager');
  }
  return out;
}

/** Saved delivery information for a message, or '' when nothing is on file. */
function deliveryInfoFor(text: string, ctx: RuleContext): string {
  return findBestFaq(text, ctx.faqs, DELIVERY_INTENT)?.answer || ctx.settings.deliveryNote || '';
}

/**
 * Local rule-based reply engine. Composes replies from the product catalogue,
 * FAQ library and saved settings. No external AI API involved.
 *
 * With an explicit category it produces 2-3 template variations for that
 * category. With 'auto' it detects the intent from the message itself.
 */
export function generateSuggestions(
  message: string,
  ctx: RuleContext,
  category: Category = 'Auto-detect'
): Suggestion[] {
  const text = message.toLowerCase();
  const wrapped = (body: string, label: string): Suggestion => ({
    label,
    text: wrap(body, ctx),
  });

  if (category !== 'Auto-detect') {
    return buildForCategory(category, text, ctx, wrapped).slice(0, 4);
  }

  const { products, faqs } = ctx;
  const matchedProducts = matchProducts(text, products);
  const matchedFaqs = matchFaqs(text, faqs);
  const out: Suggestion[] = [];

  // Complaint detected first — it should win over other intents
  if (/\b(complain|complaint|wrong|broken|damaged|late|delay|refund|return|angry|disappointed|scam|bad|faulty|not working|never (arrived|came|delivered))\b/.test(text)) {
    out.push(complaintSuggestions(text, ctx, wrapped)[0]);
  }

  if (/\b(price|how much|cost|charge|fee)\b/.test(text) || text.includes('how much')) {
    out.push(priceSuggestions(text, ctx, wrapped, matchedProducts)[0]);
  }

  if (/\b(available|availability|in stock|stock|have|ready)\b/.test(text)) {
    if (matchedProducts.length > 0) {
      const list = matchedProducts
        .map((p) => `• ${p.name} — ${p.stock || 'In stock'}`)
        .join('\n');
      out.push(wrapped(`Yes! Here's the current availability:\n\n${list}`, 'Product enquiry'));
    } else {
      out.push(
        wrapped(
          'Let me check our current stock for you and confirm right away. Which item would you like?',
          'Product enquiry'
        )
      );
    }
  }

  if (DELIVERY_INTENT.test(text)) {
    out.push(deliverySuggestions(text, ctx, wrapped)[0]);
  }

  if (PAYMENT_INTENT.test(text)) {
    out.push(paymentSuggestions(text, ctx, wrapped)[0]);
  }

  if (/\b(bulk|wholesale|discount|cheap|reduce|negotiate|quantity|dozen)\b/.test(text)) {
    const bulkFaq = findBestFaq(text, ctx.faqs, BULK_INTENT);
    if (bulkFaq) {
      out.push(wrapped(bulkFaq.answer, 'Price enquiry — from your saved FAQ'));
    } else {
      out.push(
        wrapped(
          'Thank you! Let me confirm the best price we can offer for the quantity you need and get right back to you.',
          'Price enquiry — needs your input'
        )
      );
    }
  }

  for (const f of matchedFaqs.slice(0, 2)) {
    out.push(wrapped(f.answer, 'FAQ: ' + (f.category || 'General')));
  }

  if (out.length === 0) {
    if (/^(hi|hello|hey|good (morning|afternoon|evening))/i.test(text.trim())) {
      out.push(...generalSuggestions(text, ctx, wrapped).slice(0, 1));
    } else {
      out.push(...generalSuggestions(text, ctx, wrapped).slice(0, 2));
    }
  }

  return out.slice(0, 4);
}

function wrap(body: string, ctx: RuleContext): string {
  const { settings } = ctx;
  return `${settings.greeting || 'Hello! Thank you for contacting ' + (settings.businessName || 'us')}.\n\n${body}\n\n${
    settings.closing || 'Is there anything else we can help you with?'
  }`;
}

type Build = (body: string, label: string) => Suggestion;

function buildForCategory(
  category: Category,
  text: string,
  ctx: RuleContext,
  wrapped: Build
): Suggestion[] {
  const matchedProducts = matchProducts(text, ctx.products);
  switch (category) {
    case 'Product enquiry':
      return productEnquirySuggestions(text, ctx, wrapped, matchedProducts);
    case 'Price enquiry':
      return priceSuggestions(text, ctx, wrapped, matchedProducts);
    case 'Delivery enquiry':
      return deliverySuggestions(text, ctx, wrapped);
    case 'Payment enquiry':
      return paymentSuggestions(text, ctx, wrapped);
    case 'Customer complaint':
      return complaintSuggestions(text, ctx, wrapped);
    case 'General enquiry':
      return generalSuggestions(text, ctx, wrapped);
    default:
      return [];
  }
}

function productEnquirySuggestions(
  text: string,
  ctx: RuleContext,
  wrapped: Build,
  matchedProducts: Product[]
): Suggestion[] {
  const out: Suggestion[] = [];
  if (matchedProducts.length > 0) {
    const list = matchedProducts
      .map((p) => `• ${p.name} — ${naira(p.price)}${p.stock ? ` (${p.stock})` : ''}`)
      .join('\n');
    const delivery = deliveryInfoFor(text, ctx);
    out.push(
      wrapped(
        `Thank you for your interest! Here are the details of what you asked about:\n\n${list}${
          delivery ? `\n\n${delivery}` : ''
        }`,
        'Product enquiry'
      )
    );
    out.push(
      wrapped(
        `Great choice! ${matchedProducts[0].name} is one of our most popular items. It goes for ${naira(
          matchedProducts[0].price
        )} and it is ${matchedProducts[0].stock?.toLowerCase() || 'in stock'} right now. Would you like me to reserve one for you?`,
        'Product enquiry'
      )
    );
  } else {
    out.push(
      wrapped(
        'Thank you for reaching out! Could you tell me which item you are interested in? I will send you the full details — price, sizes/variants and availability — right away.',
        'Product enquiry'
      )
    );
    out.push(
      wrapped(
        'You are welcome! We have a wide range of quality products. Kindly share what you need (or a picture of it), and I will confirm availability and price for you immediately.',
        'Product enquiry'
      )
    );
  }
  return out;
}

function priceSuggestions(
  text: string,
  ctx: RuleContext,
  wrapped: Build,
  matchedProducts: Product[]
): Suggestion[] {
  const out: Suggestion[] = [];
  if (matchedProducts.length > 0) {
    const list = matchedProducts
      .map((p) => `• ${p.name} — ${naira(p.price)}${p.stock ? ` (${p.stock})` : ''}`)
      .join('\n');
    const delivery = deliveryInfoFor(text, ctx);
    out.push(
      wrapped(
        `Here are our current prices:\n\n${list}${delivery ? `\n\n${delivery}` : ''}`,
        'Price enquiry'
      )
    );
    out.push(
      wrapped(
        `Our price for ${matchedProducts[0].name} is ${naira(matchedProducts[0].price)}. Let me know how many pieces you need and I will confirm the total, including any discount that applies.`,
        'Price enquiry'
      )
    );
  } else {
    out.push(
      wrapped(
        'Thank you for asking! Could you let me know exactly which item you are interested in? I will send you the price in Naira right away.',
        'Price enquiry'
      )
    );
    out.push(
      wrapped(
        'Our prices are very competitive! Kindly tell me the item (or send a picture) and I will share the exact price with you immediately.',
        'Price enquiry'
      )
    );
  }
  return out;
}

function deliverySuggestions(text: string, ctx: RuleContext, wrapped: Build): Suggestion[] {
  const faq = findBestFaq(text, ctx.faqs, DELIVERY_INTENT);
  if (faq) return [wrapped(faq.answer, 'Delivery enquiry — from your saved FAQ')];
  if (ctx.settings.deliveryNote) {
    return [wrapped(ctx.settings.deliveryNote, 'Delivery enquiry')];
  }
  return [
    wrapped(
      'Thank you for asking! Let me confirm the delivery options and cost for your location, and I will get back to you shortly.',
      'Delivery enquiry — needs your input'
    ),
  ];
}

function paymentSuggestions(text: string, ctx: RuleContext, wrapped: Build): Suggestion[] {
  const faq = findBestFaq(text, ctx.faqs, PAYMENT_INTENT);
  if (faq) return [wrapped(faq.answer, 'Payment enquiry — from your saved FAQ')];
  return [
    wrapped(
      'Thank you for asking! Let me confirm our payment options and send you the details right away.',
      'Payment enquiry — needs your input'
    ),
  ];
}

function complaintSuggestions(_text: string, _ctx: RuleContext, wrapped: Build): Suggestion[] {
  return [
    wrapped(
      'We are truly sorry about this experience — that is not the standard we hold ourselves to. Please accept our sincere apologies. Kindly send us your order details and a picture (if applicable), and we will make this right for you immediately.',
      'Customer complaint'
    ),
    wrapped(
      'Thank you for letting us know, and we are so sorry for the inconvenience. Our team is treating this as urgent. We will resolve it today — either a replacement or a full refund, whichever you prefer. We will also check your details and follow up shortly.',
      'Customer complaint'
    ),
    wrapped(
      'We sincerely apologise. Your satisfaction matters to us, and we would like to fix this right away. May we call you on your line to sort it out? Alternatively, kindly share your order number so we can trace and resolve it without delay.',
      'Customer complaint'
    ),
  ];
}

function generalSuggestions(_text: string, ctx: RuleContext, wrapped: Build): Suggestion[] {
  const { businessName } = ctx.settings;
  return [
    wrapped(
      `Thank you for reaching out to ${businessName || 'us'}! We are happy to help. Kindly share more details about what you need, and we will respond right away.`,
      'General enquiry'
    ),
    wrapped(
      'You are welcome! How can we help you today — a product enquiry, price list, delivery or payment information? We are always ready to assist.',
      'General enquiry'
    ),
  ];
}
