import { Link } from 'react-router-dom';
import { useProducts, useLeads, useFaqs } from '@/lib/data';
import { ArrowRight, HelpCircle, MessageSquare, Package, Sparkles, Users } from 'lucide-react';

export default function Home() {
  const { items: products } = useProducts();
  const { items: faqs } = useFaqs();
  const { items: leads } = useLeads();

  const newLeads = leads.filter((l) => l.status === 'new').length;

  const stats = [
    { label: 'Products', value: products.length, icon: Package, to: '/products' },
    { label: 'FAQs', value: faqs.length, icon: HelpCircle, to: '/faqs' },
    { label: 'Leads', value: leads.length, icon: Users, to: '/leads' },
    { label: 'New enquiries', value: newLeads, icon: MessageSquare, to: '/leads' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Welcome back</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Your sales workspace at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="card group flex items-center gap-4 p-5 transition hover:shadow-md"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#128C7E]/10">
              <s.icon className="h-5 w-5 text-[#128C7E]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{s.value}</p>
              <p className="text-sm text-neutral-500">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="card flex flex-col justify-between p-6">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#128C7E]/10">
              <Sparkles className="h-5 w-5 text-[#128C7E]" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-neutral-900">Generate a smart reply</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Paste a customer enquiry and get ready-to-send replies quoting your prices, stock and
              FAQs.
            </p>
          </div>
          <Link to="/reply" className="btn-primary mt-5 self-start">
            Open Smart Reply <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="card flex flex-col justify-between p-6">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#128C7E]/10">
              <Users className="h-5 w-5 text-[#128C7E]" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-neutral-900">
              {newLeads > 0 ? `${newLeads} new ${newLeads === 1 ? 'enquiry' : 'enquiries'}` : 'No new enquiries'}
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              {newLeads > 0
                ? 'Customers are waiting. Reply to them in the Leads page.'
                : 'Add customer enquiries on the Leads page to track them.'}
            </p>
          </div>
          <Link to="/leads" className="btn-secondary mt-5 self-start">
            View leads <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
