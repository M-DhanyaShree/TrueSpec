import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Laptop, Sparkles, Scale, Search, ShieldCheck, Cpu } from 'lucide-react';

interface NavbarProps {
  compareCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ compareCount }) => {
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/', icon: Laptop },
    { name: 'Guided Advisor', path: '/recommend', icon: Sparkles, badge: 'AI/ML' },
    { name: 'Browse All Laptops', path: '/laptops', icon: Search },
    {
      name: 'Compare',
      path: '/compare',
      icon: Scale,
      badge: compareCount > 0 ? `${compareCount}` : undefined,
      badgeColor: 'bg-truespec-600 text-white'
    },
    { name: 'ML Methodology', path: '/methodology', icon: ShieldCheck }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-truespec-600 to-sky-400 flex items-center justify-center text-white shadow-sm shadow-truespec-500/20 group-hover:scale-105 transition-transform duration-200">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                TrueSpec
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-truespec-50 text-truespec-700 border border-truespec-200">
                  ML Powered
                </span>
              </span>
              <p className="text-[11px] text-slate-500 font-medium -mt-0.5 hidden sm:block">
                Intelligent Laptop Advisor
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                    isActive
                      ? 'bg-truespec-50 text-truespec-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-truespec-600' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                  {link.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        link.badgeColor || 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Action CTA */}
          <div className="flex items-center gap-3">
            <Link
              to="/recommend"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-truespec-600 text-white hover:bg-truespec-700 shadow-sm shadow-truespec-600/20 active:scale-98 transition-all"
            >
              <Sparkles className="w-4 h-4 text-sky-200" />
              <span>Get Advice</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};
