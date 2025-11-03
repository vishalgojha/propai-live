
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, Search, Settings, Zap, BookOpen, Building2, MapPin, Phone, Mail, Instagram, Linkedin, Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    // Set global meta tags
    const setMetaTag = (name, content) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (tag) {
        tag.setAttribute('content', content);
      } else {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        tag.setAttribute('content', content);
        document.head.appendChild(tag);
      }
    };

    // Default meta tags
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    setMetaTag('theme-color', '#FFD300');
    setMetaTag('author', 'Chariot Realty');
    setMetaTag('robots', 'index, follow');
    
    // Open Graph defaults
    const setOGTag = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (tag) {
        tag.setAttribute('content', content);
      } else {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        tag.setAttribute('content', content);
        document.head.appendChild(tag);
      }
    };

    setOGTag('og:site_name', 'Chariot Realty');
    setOGTag('og:locale', 'en_IN');
  }, []);

  useEffect(() => {
    // Check if user is logged in and get user data
    const loadUser = async () => {
      try {
        setIsLoadingUser(true);
        const currentUser = await base44.auth.me(); 
        setUser(currentUser);
      } catch (error) {
        console.error("Failed to load user:", error);
        setUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };
    loadUser();
  }, [location.pathname]);

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.pathname);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const navItems = [
    { name: "Home", icon: Home, path: createPageUrl("Home") },
    { name: "Browse Properties", icon: Search, path: createPageUrl("SmartFeed") },
    { name: "Buildings", icon: Building2, path: createPageUrl("Buildings") },
    { name: "Insights", icon: BookOpen, path: createPageUrl("Blogs") },
  ];

  // Only show admin link if user is admin
  if (user?.role === 'admin') {
    navItems.push(
      { name: "Admin", icon: Settings, path: createPageUrl("Admin") }
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/98 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-[#d4af37] to-[#f4d03f] rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <Zap className="w-6 h-6 text-[#1a1816] fill-[#1a1816]" />
              </div>
              <span className="text-xl font-bold text-[#111111] tracking-tight">Chariot Realty</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all font-semibold ${
                      isActive
                        ? "bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#1a1816] shadow-sm"
                        : "text-[#3B3B3B] hover:bg-[#F7F7F7]"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}

              {/* User Menu / Login Button */}
              {!isLoadingUser && (
                <>
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="ml-2 gap-2 rounded-2xl">
                          <User className="w-4 h-4" />
                          <span className="text-sm font-semibold">{user.full_name || user.email}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <div className="px-2 py-2">
                          <p className="text-sm font-semibold">{user.full_name || 'User'}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          {user.role === 'admin' && (
                            <p className="text-xs text-[#FFD300] font-bold mt-1">Admin</p>
                          )}
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button
                      onClick={handleLogin}
                      className="ml-2 bg-[#FFD300] hover:bg-[#FFC700] text-black font-semibold rounded-2xl"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  )}
                </>
              )}
            </nav>

            {/* Mobile Hamburger Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-[#111111]" />
              ) : (
                <Menu className="w-6 h-6 text-[#111111]" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-semibold ${
                      isActive
                        ? "bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-[#1a1816]"
                        : "text-[#3B3B3B] hover:bg-[#F7F7F7]"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile User Menu */}
              {!isLoadingUser && (
                <div className="pt-4 border-t border-gray-200">
                  {user ? (
                    <>
                      <div className="px-4 py-2 mb-2">
                        <p className="text-sm font-semibold">{user.full_name || 'User'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {user.role === 'admin' && (
                          <p className="text-xs text-[#FFD300] font-bold mt-1">Admin</p>
                        )}
                      </div>
                      <Button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        variant="outline"
                        className="w-full justify-start gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => {
                        handleLogin();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-[#FFD300] hover:bg-[#FFC700] text-black font-semibold rounded-2xl"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  )}
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content - No extra bottom padding needed now */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-[#2a2826] text-white py-16 border-t border-stone-700/50">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
            
            {/* Brand Section - Spans 4 columns */}
            <div className="md:col-span-4">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#f4d03f] rounded-2xl flex items-center justify-center shadow-sm">
                  <Zap className="w-7 h-7 text-[#1a1816] fill-[#1a1816]" />
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">Chariot Realty</span>
              </div>
              <p className="text-stone-300 text-base font-light leading-relaxed mb-4">
                Real guidance. Real homes. No noise.
              </p>
              <p className="text-stone-500 text-sm font-light italic">
                Built in Mumbai. Powered by AI. Driven by people.
              </p>
            </div>

            {/* Quick Links - Explore */}
            <div className="md:col-span-2">
              <h4 className="font-bold mb-4 text-white text-sm uppercase tracking-wider">Explore</h4>
              <ul className="space-y-3 text-sm text-stone-400 font-light">
                <li>
                  <Link 
                    to={createPageUrl("SmartFeed") + "?propertyCategory=Residential"} 
                    className="hover:text-[#d4af37] transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-[#d4af37] rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Residential
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("SmartFeed") + "?propertyCategory=Commercial"} 
                    className="hover:text-[#d4af37] transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-[#d4af37] rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Commercial
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("SmartFeed") + "?listingType=Rent"} 
                    className="hover:text-[#d4af37] transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-[#d4af37] rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Rent
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("SmartFeed") + "?listingType=Sale"} 
                    className="hover:text-[#d4af37] transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-[#d4af37] rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Buy
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("Blogs")} 
                    className="hover:text-[#d4af37] transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-[#d4af37] rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Blog & Guides
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div className="md:col-span-3">
              <h4 className="font-bold mb-4 text-white text-sm uppercase tracking-wider">Resources</h4>
              <ul className="space-y-3 text-sm text-stone-400 font-light">
                <li>
                  <Link 
                    to={createPageUrl("Home") + "#how-it-works"} 
                    className="hover:text-[#d4af37] transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-[#d4af37] rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("Buildings")} 
                    className="hover:text-[#d4af37] transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-[#d4af37] rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Building Directory
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("SmartFeed")} 
                    className="hover:text-[#d4af37] transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-[#d4af37] rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    SmartFeed Explained
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("Blogs") + "?category=Expat%20Series"} 
                    className="hover:text-[#d4af37] transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-[#d4af37] rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    <span>Expat Corner</span>
                    <span className="ml-1 text-xs">🌍</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact & Social */}
            <div className="md:col-span-3">
              <h4 className="font-bold mb-4 text-white text-sm uppercase tracking-wider">Contact</h4>
              <ul className="space-y-3 text-sm text-stone-400 font-light mb-6">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#d4af37] mt-0.5 flex-shrink-0" />
                  <span>Bandra West, Mumbai<br />Maharashtra, India</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                  <a href="tel:+919819471310" className="hover:text-[#d4af37] transition-colors">
                    +91 98194 71310
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                  <a href="tel:+919773757759" className="hover:text-[#d4af37] transition-colors">
                    +91 97737 57759
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                  <a href="mailto:hello@chariotrealty.com" className="hover:text-[#d4af37] transition-colors">
                    hello@chariotrealty.com
                  </a>
                </li>
              </ul>

              {/* Social Icons */}
              <div className="flex items-center gap-3">
                <a 
                  href="https://instagram.com/chariotrealty.in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/5 hover:bg-[#d4af37] rounded-xl flex items-center justify-center transition-all group"
                >
                  <Instagram className="w-5 h-5 text-stone-400 group-hover:text-[#1a1816] transition-colors" />
                </a>
                <a 
                  href="https://linkedin.com/company/chariot-realty" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/5 hover:bg-[#d4af37] rounded-xl flex items-center justify-center transition-all group"
                >
                  <Linkedin className="w-5 h-5 text-stone-400 group-hover:text-[#1a1816] transition-colors" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Strip */}
          <div className="border-t border-stone-700 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-stone-500">
              <div>
                <p>© 2025 Chariot Realty. All rights reserved</p>
                <p className="text-xs mt-1">AI-assisted real estate, verified the Mumbai way.</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-600">⚡ Powered by</span>
                <a 
                  href="https://base44.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#d4af37] hover:text-[#f4d03f] transition-colors font-semibold"
                >
                  Base44 AI
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
