import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, Moon, Sun, Stethoscope, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/health');
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'ok' && data.database === 'connected') {
            setHealthStatus('connected');
            return;
          }
        }
        setHealthStatus('disconnected');
      } catch (err) {
        setHealthStatus('disconnected');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const navigation = [
    { name: 'Roster Dashboard', href: '/', icon: Calendar },
    { name: 'Doctor Management', href: '/doctors', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 flex flex-col transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/75 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/75 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <Stethoscope className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Param Health
              </span>
              <span className="text-xs block text-slate-500 font-medium tracking-wide uppercase dark:text-slate-400 -mt-1">
                Medical Duty Roster
              </span>
            </div>
            
            {/* Health Status Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] font-bold border border-slate-100 dark:border-slate-700/60 shadow-sm ml-4">
              <span className={`h-2 w-2 rounded-full ${
                healthStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                healthStatus === 'disconnected' ? 'bg-red-500' : 'bg-amber-400'
              }`} />
              <span className={
                healthStatus === 'connected' ? 'text-emerald-600 dark:text-emerald-400' :
                healthStatus === 'disconnected' ? 'text-red-600 dark:text-red-400' : 'text-slate-500'
              }>
                {healthStatus === 'connected' ? 'System Online' :
                 healthStatus === 'disconnected' ? 'Database Offline' : 'Checking connection...'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-all duration-150"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </nav>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-all duration-150"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="fixed top-16 right-0 left-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shadow-xl flex flex-col gap-2 transition-transform duration-200 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>© 2026 Param Health Care. All rights reserved. Shift Planning & Duty Optimization Engine.</p>
      </footer>
    </div>
  );
};
