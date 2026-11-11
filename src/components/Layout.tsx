import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, HelpCircle, LogOut, Menu, MessageCircle, Package, Settings, Sparkles, Users, X } from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { to: '/reply', label: 'Smart Reply', icon: Sparkles },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/faqs', label: 'FAQs', icon: HelpCircle },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
];

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const navLinks = (onClick?: () => void) =>
    NAV_ITEMS.map((item) => (
      <Link
        key={item.to}
        to={item.to}
        onClick={onClick}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          isActive(item.to)
            ? 'bg-[#128C7E] text-white shadow-sm'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
        }`}
      >
        <item.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
        {item.label}
      </Link>
    ));

  const logo = (
      <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#128C7E]">
        <MessageCircle className="h-5 w-5 text-white" />
      </div>
      <span className="text-lg font-bold text-neutral-900">
        ChatSales <span className="text-[#128C7E]">AI</span>
      </span>
    </Link>
  );

  const logout = (
    <button
      onClick={() => navigate('/')}
      className="hidden items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 sm:flex"
    >
      <LogOut className="h-4 w-4" />
      Exit dashboard
    </button>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          {logo}
          <div className="hidden items-center gap-1 md:flex">{navLinks()}</div>
          <div className="flex items-center gap-2">
            {logout}
            <button
              className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 md:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-neutral-100 p-3 md:hidden">
            {navLinks(() => setMenuOpen(false))}
            <button
              onClick={() => { setMenuOpen(false); navigate('/'); }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              <LogOut className="h-[18px] w-[18px]" />
              Exit dashboard
            </button>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
