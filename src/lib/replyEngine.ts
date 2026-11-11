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

const DEFAULT_DELIVERY =
  'We deliver nationwide. Delivery within Lagos takes 1-2 working days, and 3-5 working days for other states. Delivery fees depend on your location and the courier you choose.';

/** Words in a product name that appear in the customer's message. */
function matchProducts(text: string, products: Product[]): Product[] {
  return products
    .filter((p) => {
      const words = p.name.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
      return words.some((w) => w.length > 2 && text.includes(w));
    })
    .slice(0, 2);
}

/** FAQs whose question words appear in the customer's message. */
function matchFaqs(text: string, faqs: Faq[]): Faq[] {
  return faqs.filter((f) => {
    const words = f.question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3);
    return words.some((w) => text.includes(w));
  });
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

  if (/\b(deliver|delivery|ship|shipping|dispatch|pickup|pick ?up|transport)\b/.test(text)) {
    out.push(deliverySuggestions(text, ctx, wrapped)[0]);
  }

  if (/\b(pay|payment|transfer|card|pos|on delivery|deposit)\b/.test(text)) {
    out.push(paymentSuggestions(text, ctx, wrapped)[0]);
  }

  if (/\b(bulk|wholesale|discount|cheap|reduce|negotiate|quantity|dozen)\b/.test(text)) {
    out.push(
      wrapped(
        'Yes, we offer discounts on bulk orders! For 5+ pieces you get 10% off, and for 20+ pieces you get 15% off. How many pieces would you need?',
        'Price enquiry'
      )
    );
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
    out.push(
      wrapped(
        `Thank you for your interest! Here are the details of what you asked about:\n\n${list}\n\n${
          ctx.settings.deliveryNote || DEFAULT_DELIVERY
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
  _text: string,
  ctx: RuleContext,
  wrapped: Build,
  matchedProducts: Product[]
): Suggestion[] {
  const out: Suggestion[] = [];
  if (matchedProducts.length > 0) {
    const list = matchedProducts
      .map((p) => `• ${p.name} — ${naira(p.price)}${p.stock ? ` (${p.stock})` : ''}`)
      .join('\n');
    out.push(
      wrapped(
        `Here are our current prices:\n\n${list}\n\n${ctx.settings.deliveryNote || DEFAULT_DELIVERY}`,
        'Price enquiry'
      )
    );
    out.push(
      wrapped(
        `Our price for ${matchedProducts[0].name} is ${naira(matchedProducts[0].price)}. We also give discounts for bulk purchases — 10% off from 5 pieces and 15% off from 20 pieces. How many would you like?`,
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

function deliverySuggestions(_text: string, ctx: RuleContext, wrapped: Build): Suggestion[] {
  const note = ctx.settings.deliveryNote || DEFAULT_DELIVERY;
  return [
    wrapped(note, 'Delivery enquiry'),
    wrapped(
      `${note}\n\nOnce your order is confirmed, we will send you your tracking details so you can follow your parcel until it arrives.`,
      'Delivery enquiry'
    ),
  ];
}

function paymentSuggestions(_text: string, ctx: RuleContext, wrapped: Build): Suggestion[] {
  return [
    wrapped(
      'We accept bank transfer, card payments and pay on delivery (within Lagos). Once you confirm your order, I will send the payment details. Thank you!',
      'Payment enquiry'
    ),
    wrapped(
      'Payment is easy! You can pay by bank transfer or with your ATM card. For orders within Lagos below ' +
        naira(50000) +
        ', pay on delivery is also available. Which option works best for you?',
      'Payment enquiry'
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
