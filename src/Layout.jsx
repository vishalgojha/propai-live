
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Search, Settings } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const navItems = [
    { name: "Home", icon: Home, path: createPageUrl("Home") },
    { name: "Properties", icon: Search, path: createPageUrl("SmartFeed") },
    { name: "Admin", icon: Settings, path: createPageUrl("Admin") }
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header - White with yellow accents */}
      <header className="sticky top-0 z-50 bg-white/98 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-3 group">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6907460ed52e46ec7bbc94b2/4847e85b5_1001601618-removebg-preview.png"
                alt="Chariot Realty"
                className="h-10 w-auto group-hover:scale-105 transition-transform"
              />
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all font-semibold ${
                      isActive
                        ? "bg-[#FFD300] text-black shadow-md"
                        : "text-[#3B3B3B] hover:bg-[#F7F7F7]"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Footer - Dark Gray instead of Pure Black */}
      <footer className="bg-[#1a1a1a] text-white py-16 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="mb-6">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6907460ed52e46ec7bbc94b2/4847e85b5_1001601618-removebg-preview.png"
                  alt="Chariot Realty"
                  className="h-16 w-auto brightness-0 invert"
                />
              </div>
              <p className="text-gray-400 text-sm font-light leading-relaxed">
                Mumbai's trusted partner for luxury and premium properties
              </p>
              <p className="text-gray-500 text-sm mt-6">
                Mumbai, Maharashtra<br />
                India
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-white">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400 font-light">
                <li><Link to={createPageUrl("Home")} className="hover:text-[#FFD300] transition-colors">Home</Link></li>
                <li><Link to={createPageUrl("SmartFeed")} className="hover:text-[#FFD300] transition-colors">Search Properties</Link></li>
                <li><a href="#" className="hover:text-[#FFD300] transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-[#FFD300] transition-colors">Contact Us</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4 text-white">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400 font-light">
                <li className="hover:text-[#FFD300] transition-colors">Vishal: +91 98194 71310</li>
                <li className="hover:text-[#FFD300] transition-colors">Kapil: +91 97737 57759</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-sm text-gray-500">
            <p>© 2025 Chariot Realty. All rights reserved • Made with ❤️ in Mumbai</p>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation - Yellow accent on active */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-xl border-t border-gray-200 z-50 shadow-2xl">
        <div className="flex items-center justify-around px-4 py-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${
                  isActive ? "bg-[#FFD300] text-black" : "text-[#3B3B3B]"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-bold">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
