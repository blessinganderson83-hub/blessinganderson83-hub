import { Link } from 'react-router-dom';
import { MessageCircle, Sparkles, Package, HelpCircle, Users, ShieldCheck, Smartphone, ArrowRight, Copy } from 'lucide-react';

export default function Landing() {
  const features = [
    {
      icon: Sparkles,
      title: 'Smart Reply Generator',
      text: 'Paste a customer enquiry and get ready-to-send replies built from your prices, stock and FAQs.',
    },
    {
      icon: Package,
      title: 'Product Catalogue',
      text: 'Keep every product, price and availability note in one place so replies are always accurate.',
    },
    {
      icon: HelpCircle,
      title: 'FAQ Manager',
      text: 'Save answers to the questions customers ask every day and reuse them in one tap.',
    },
    {
      icon: Users,
      title: 'Customer Leads',
      text: 'Track every enquiry from first message to won sale with a simple status board.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#128C7E]">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-neutral-900">
              ChatSales <span className="text-[#128C7E]">AI</span>
            </span>
          </div>
          <Link to="/dashboard" className="btn-primary px-4 py-2 text-sm">
            Open Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#128C7E]/10 px-3 py-1 text-xs font-semibold text-[#128C7E]">
              <Sparkles className="h-3.5 w-3.5" />
              Built for Nigerian small businesses
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.15] tracking-tight text-neutral-900 sm:text-5xl">
              Answer every customer enquiry.
              <span className="text-[#128C7E]"> Win every sale.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-neutral-600">
              ChatSales AI turns your WhatsApp customer chats into ready-to-send sales replies —
              with your prices, your stock and your FAQs baked in. No bots, no automation, just
              faster replies from you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/dashboard" className="btn-primary px-6 py-3 text-base">
                Try the dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#128C7E]" /> No API keys needed
              </span>
              <span className="flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-[#128C7E]" /> Works on any phone
              </span>
              <span className="flex items-center gap-1.5">
                <Copy className="h-4 w-4 text-[#128C7E]" /> One-tap copy to WhatsApp
              </span>
            </div>
          </div>

          <div className="card mx-auto w-full max-w-md p-5 shadow-lg">
            <div className="flex items-center gap-2 rounded-lg bg-[#075E54] px-4 py-3 text-white">
              <MessageCircle className="h-4 w-4" />
              <p className="text-sm font-medium">Customer message</p>
            </div>
            <div className="mt-4 space-y-3">
              <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-[#DCF8C6] px-4 py-2.5 text-sm text-neutral-800">
                Hello, how much is the Ankara fabric? Do you deliver to Abuja?
              </div>
              <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-neutral-100 px-4 py-2.5 text-sm text-neutral-800">
                Hello! Thank you for contacting us. Ankara Fabric (6 Yards) is ₦15,000 (In stock).
                We deliver nationwide — Abuja takes 3-5 working days. Anything else we can help
                with?
              </div>
            </div>
            <p className="mt-4 border-t border-neutral-100 pt-3 text-xs text-neutral-400">
              Example of a reply generated from catalogue and delivery settings.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-100 bg-neutral-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-neutral-900">
            Everything you need to sell faster
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-neutral-600">
            ChatSales AI keeps your sales knowledge organised, then helps you use it in every chat.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="card p-6 transition hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#128C7E]/10">
                  <f.icon className="h-5 w-5 text-[#128C7E]" />
                </div>
                <h3 className="mt-4 font-semibold text-neutral-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-neutral-900">Ready to reply in seconds?</h2>
          <p className="mt-3 text-neutral-600">
            Open the dashboard and explore with clearly-labelled demo data — no sign-up, no card,
            no API key.
          </p>
          <Link to="/dashboard" className="btn-primary mt-8 px-6 py-3 text-base">
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-neutral-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-sm text-neutral-500 sm:px-6">
          <span className="font-semibold text-neutral-900">
            ChatSales <span className="text-[#128C7E]">AI</span>
          </span>
          <p>Replies are suggestions you copy and send yourself. Not affiliated with WhatsApp.</p>
        </div>
      </footer>
    </div>
  );
}
