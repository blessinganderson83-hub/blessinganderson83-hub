import { generateSuggestions, findBestFaq, missingInfoTopics } from './src/lib/replyEngine';
import type { Faq, Product } from './src/lib/types';

const faqs: Faq[] = [
  {
    id: 'f1',
    question: 'How much is delivery to Abuja?',
    answer: 'Delivery to Abuja costs 3,500 naira and takes 2-3 working days.',
    category: 'Delivery',
    is_demo: true,
    created_at: '',
  },
  {
    id: 'f2',
    question: 'What payment methods do you accept?',
    answer: 'We accept bank transfer and card payments only.',
    category: 'Payment',
    is_demo: true,
    created_at: '',
  },
];

const products: Product[] = [
  {
    id: 'p1',
    name: 'Ankara Fabric',
    price: 6500,
    description: null,
    stock: 'In stock',
    image_url: null,
    is_demo: true,
    created_at: '',
  },
];

const settings = { businessName: 'Ada Fabrics', greeting: '', closing: '', deliveryNote: '' };

const show = (title: string, msgs: { label: string; text: string }[]) => {
  console.log('--- ' + title + ' ---');
  for (const m of msgs) console.log('[' + m.label + ']\n' + m.text + '\n');
};

// 1. Delivery question with saved FAQ -> must use the saved answer verbatim
const d = generateSuggestions('Do you deliver to Abuja and how much is delivery?', { products, faqs, settings });
show('Delivery (FAQ on file)', d);
console.log('uses saved answer:', d.some((s) => s.text.includes('3,500 naira')));

// 2. Payment question with saved FAQ
const p = generateSuggestions('How can I pay?', { products, faqs, settings });
show('Payment (FAQ on file)', p);
console.log('uses saved answer:', p.some((s) => s.text.includes('bank transfer and card payments only')));

// 3. No FAQ on file -> must not invent, must flag missing info
const noFaqs: Faq[] = [];
const m = generateSuggestions('Do you deliver to Abuja?', { products, faqs: noFaqs, settings });
show('Delivery (no FAQ on file)', m);
console.log('no invented fee:', !m.some((s) => /1-2 working days|3-5 working days|pay on delivery/i.test(s.text)));
console.log('asks owner:', missingInfoTopics('Do you deliver to Abuja?', noFaqs, settings));

// 4. Bulk discount with no FAQ -> no invented percentages
const b = generateSuggestions('Any discount for bulk orders?', { products, faqs: noFaqs, settings });
console.log('no invented bulk %:', !b.some((s) => /10%|15%/.test(s.text)));

// 5. Best FAQ pick: message about both delivery and payment
console.log('best faq (delivery):', findBestFaq('do you deliver to abuja and what is the delivery fee', faqs)?.id);
console.log('best faq (payment):', findBestFaq('can i pay with my card', faqs)?.id);

// 6. Existing behaviour preserved: price enquiry quotes catalogue price
const pr = generateSuggestions('How much is the Ankara Fabric?', { products, faqs, settings });
console.log('catalogue price quoted:', pr.some((s) => s.text.includes('₦6,500')));
console.log('max 4 suggestions:', generateSuggestions('price, delivery, payment and bulk discount for the Ankara Fabric?', { products, faqs, settings }).length <= 4);
