import React, { useState, useEffect } from "react";
import { Link, useLocation, Routes, Route, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, Search, Settings, Zap, BookOpen, Building2, MapPin, Phone, Mail, Instagram, Linkedin, Menu, X, User, LogOut, Users, BarChart3, Sparkles, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import ServiceWorkerSetup from "@/components/notifications/ServiceWorkerSetup";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // ✅ FIXED: Close mobile menu when navigating
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    // ✅ CRITICAL: Set meta tags ONCE on mount, pages can override via SEO component
    const setMetaTag = (name, content, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement('meta');
        if (isProperty) {
          tag.setAttribute('property', name);
        } else {
          tag.setAttribute('name', name);
        }
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // Basic meta tags
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    setMetaTag('theme-color', '#1e293b');
    setMetaTag('author', 'PropAI Live');
    setMetaTag('robots', 'index, follow');
    
    // Default SEO (pages can override via SEO component)
    const defaultTitle = 'PropAI Live | WhatsApp → Organized Properties. Instantly.';
    const defaultDescription = 'Stop losing deals in WhatsApp chaos. AI turns messy broker chats into structured listings in seconds. Powered by Building-Level Intelligence.';
    const defaultImage = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/690cfb8070b3f94428fee21c/propai-social-share.png';
    
    // Only set if not already set by page
    if (!document.querySelector('meta[property="og:title"]')) {
      setMetaTag('description', defaultDescription);
      setMetaTag('og:title', defaultTitle, true);
      setMetaTag('og:description', defaultDescription, true);
      setMetaTag('og:image', defaultImage, true);
      setMetaTag('og:image:width', '1200', true);
      setMetaTag('og:image:height', '630', true);
      setMetaTag('og:image:alt', 'PropAI Live - AI-powered Mumbai real estate intelligence platform', true);
      setMetaTag('twitter:card', 'summary_large_image');
      setMetaTag('twitter:title', defaultTitle);
      setMetaTag('twitter:description', defaultDescription);
      setMetaTag('twitter:image', defaultImage);
    }
    
    // Always set these
    setMetaTag('og:site_name', 'PropAI Live', true);
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:locale', 'en_IN', true);
    setMetaTag('og:url', window.location.href, true);
    
    // Additional SEO tags
    setMetaTag('keywords', 'Mumbai real estate, property Mumbai, Bandra properties, AI property search, Mumbai flats, Mumbai commercial real estate, property intelligence');
    setMetaTag('geo.region', 'IN-MH');
    setMetaTag('geo.placename', 'Mumbai');
    setMetaTag('geo.position', '19.0760;72.8777');
    setMetaTag('ICBM', '19.0760, 72.8777');
    
    // Preconnect hints
    const addPreconnect = (href, crossorigin = false) => {
      if (!document.querySelector(`link[rel="preconnect"][href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = href;
        if (crossorigin) link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }
    };

    addPreconnect('https://qtrypzzcjebvfcihiynt.supabase.co', true);
    addPreconnect('https://api.base44.com', true);

    const addDnsPrefetch = (href) => {
      if (!document.querySelector(`link[rel="dns-prefetch"][href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = href;
        document.head.appendChild(link);
      }
    };
    
    addDnsPrefetch('https://qtrypzzcjebvfcihiynt.supabase.co');
    addDnsPrefetch('https://api.base44.com');
    
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
    { name: "SmartFeed", icon: Search, path: createPageUrl("SmartFeed") },
    { name: "Map Search", icon: MapPin, path: createPageUrl("MapSearch") },
  ];

  // Add features for logged-in users
  if (user) {
    if (user.broker_id) {
        navItems.push(
          { name: "AI Assistant", icon: Sparkles, path: createPageUrl("BrokerAssistant") },
          { name: "Inbox", icon: MessageCircle, path: createPageUrl("BrokerInbox") }
        );
      }
      navItems.push(
        { name: "Network", icon: Users, path: createPageUrl("BrokerNetwork") }
      );
    }

    // Market Insights for everyone
    navItems.push(
      { name: "Market Insights", icon: BarChart3, path: createPageUrl("MarketInsights") }
    );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ✅ Service Worker Setup */}
      <ServiceWorkerSetup />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Trust-first Design */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-2 group touch-manipulation">
              <motion.div 
                className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Zap className="w-6 h-6 text-white" />
              </motion.div>
              <motion.span 
                className="text-xl font-bold text-slate-900 tracking-tight"
                whileHover={{ scale: 1.02 }}
              >
                PropAI Live
              </motion.span>
            </Link>

            {/* Desktop Navigation - Professional */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.div key={item.name} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium touch-manipulation ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  </motion.div>
                );
              })}

              {/* User Menu / Login Button */}
              {!isLoadingUser && (
                <>
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="ml-2 gap-2 rounded-lg hover:bg-slate-100 touch-manipulation">
                          <User className="w-4 h-4" />
                          <span className="text-sm font-semibold">{user.full_name || user.email}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <div className="px-2 py-2">
                          <p className="text-sm font-semibold">{user.full_name || 'User'}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          {user.role === 'admin' && (
                           <p className="text-xs text-blue-600 font-bold mt-1">Admin</p>
                          )}
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate(createPageUrl("MyProfile"))} className="cursor-pointer">
                          <User className="w-4 h-4 mr-2" />
                          My Profile
                        </DropdownMenuItem>
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
                      className="ml-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm touch-manipulation"
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
              className="md:hidden touch-manipulation min-h-[44px] min-w-[44px]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-900" />
              ) : (
                <Menu className="w-6 h-6 text-slate-900" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown - Animated */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="md:hidden border-t border-purple-100 bg-white/95 backdrop-blur-xl overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <nav className="px-4 py-4 space-y-2">
              {navItems.map((item, idx) => {
                const isActive = location.pathname === item.path;
                return (
                  <motion.div
                    key={item.name}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium touch-manipulation min-h-[44px] ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-700 active:bg-slate-100"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  </motion.div>
                );
              })}

              {/* Mobile User Menu */}
              {!isLoadingUser && (
                <div className="pt-4 border-t border-purple-100">
                  {user ? (
                    <>
                      <div className="px-4 py-2 mb-2">
                        <p className="text-sm font-semibold">{user.full_name || 'User'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                         {user.role === 'admin' && (
                           <p className="text-xs text-blue-600 font-bold mt-1">Admin</p>
                         )}
                      </div>
                      <Button
                        onClick={() => {
                          navigate(createPageUrl("MyProfile"));
                          setMobileMenuOpen(false);
                        }}
                        variant="outline"
                        className="w-full justify-start gap-2 touch-manipulation min-h-[44px]"
                      >
                        <User className="w-4 h-4" />
                        My Profile
                      </Button>
                      <Button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        variant="outline"
                        className="w-full justify-start gap-2 mt-2 touch-manipulation min-h-[44px]"
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
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg touch-manipulation min-h-[44px]"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  )}
                </div>
              )}
              </nav>
              </motion.div>
              )}
              </AnimatePresence>
      </header>

      {/* Main Content - Page Transitions */}
      <main className="min-h-[calc(100vh-4rem)]">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>

      {/* Light Modern Footer */}
      <footer className="bg-white border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
            
            {/* Brand Section */}
            <div className="md:col-span-4">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-md">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">PropAI Live</span>
              </div>
              <p className="text-slate-700 text-base font-light leading-relaxed mb-4">
                AI-powered property intelligence platform for Mumbai real estate.
              </p>
              <p className="text-slate-500 text-sm font-light italic">
                Real-time data. Smart matching. Zero noise.
              </p>
            </div>

            {/* Quick Links - Explore */}
            <div className="md:col-span-2">
              <h4 className="font-bold mb-4 text-slate-900 text-sm uppercase tracking-wider">Explore</h4>
              <ul className="space-y-3 text-sm text-slate-600 font-light">
                <li>
                  <Link 
                    to={createPageUrl("SmartFeed")} 
                    className="hover:text-blue-600 transition-colors flex items-center group touch-manipulation"
                  >
                    <span className="w-1 h-1 bg-blue-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    SmartFeed
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("SmartFeed") + "?propertyCategory=Residential"} 
                    className="hover:text-blue-600 transition-colors flex items-center group touch-manipulation"
                  >
                    <span className="w-1 h-1 bg-blue-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Residential
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("SmartFeed") + "?propertyCategory=Commercial"} 
                    className="hover:text-blue-600 transition-colors flex items-center group touch-manipulation"
                  >
                    <span className="w-1 h-1 bg-blue-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Commercial
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("SmartFeed") + "?listingType=Rent"} 
                    className="hover:text-blue-600 transition-colors flex items-center group touch-manipulation"
                  >
                    <span className="w-1 h-1 bg-blue-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Rent
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("SmartFeed") + "?listingType=Sale"} 
                    className="hover:text-blue-600 transition-colors flex items-center group touch-manipulation"
                  >
                    <span className="w-1 h-1 bg-blue-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Buy
                  </Link>
                </li>

                <li>
                  <Link 
                    to={createPageUrl("DeveloperDirectory")} 
                    className="hover:text-blue-600 transition-colors flex items-center group touch-manipulation"
                  >
                    <span className="w-1 h-1 bg-blue-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Developers
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("Blogs")} 
                    className="hover:text-blue-600 transition-colors flex items-center group touch-manipulation"
                  >
                    <span className="w-1 h-1 bg-blue-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Blog & Guides
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("BrokerNetwork")} 
                    className="hover:text-blue-600 transition-colors flex items-center group touch-manipulation"
                  >
                    <span className="w-1 h-1 bg-blue-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Broker Network
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div className="md:col-span-2">
              <h4 className="font-bold mb-4 text-slate-900 text-sm uppercase tracking-wider">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-600 font-light">
                <li>
                  <Link 
                    to={createPageUrl("Home") + "#how-it-works"} 
                    className="hover:text-blue-600 transition-colors flex items-center group touch-manipulation"
                  >
                    <span className="w-1 h-1 bg-blue-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    How It Works
                  </Link>
                </li>

                <li>
                  <Link 
                    to={createPageUrl("AdminDashboard")} 
                    className="hover:text-blue-600 transition-colors flex items-center group touch-manipulation"
                  >
                    <span className="w-1 h-1 bg-blue-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Analytics
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("AboutUs")} 
                    className="hover:text-blue-600 transition-colors flex items-center group touch-manipulation"
                  >
                    <span className="w-1 h-1 bg-blue-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    About Us
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("FAQ")} 
                    className="hover:text-blue-600 transition-colors flex items-center group touch-manipulation"
                  >
                    <span className="w-1 h-1 bg-blue-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("Blogs") + "?category=Expat%20Series"} 
                    className="hover:text-blue-600 transition-colors flex items-center group touch-manipulation"
                  >
                    <span className="w-1 h-1 bg-blue-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    <span>Expat Corner</span>
                    <span className="ml-1 text-xs">🌍</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("Sitemap")} 
                    className="hover:text-blue-600 transition-colors flex items-center group touch-manipulation"
                  >
                    <span className="w-1 h-1 bg-blue-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Sitemap
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="md:col-span-2">
              <h4 className="font-bold mb-4 text-slate-900 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-600 font-light">
                <li>
                  <Link 
                    to={createPageUrl("PrivacyPolicy")} 
                    className="hover:text-blue-600 transition-colors flex items-center group touch-manipulation"
                  >
                    <span className="w-1 h-1 bg-blue-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("TermsOfService")} 
                    className="hover:text-blue-600 transition-colors flex items-center group touch-manipulation"
                  >
                    <span className="w-1 h-1 bg-blue-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("Disclaimer")} 
                    className="hover:text-blue-600 transition-colors flex items-center group touch-manipulation"
                  >
                    <span className="w-1 h-1 bg-blue-600 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Disclaimer
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact & Social */}
            <div className="md:col-span-2">
              <h4 className="font-bold mb-4 text-slate-900 text-sm uppercase tracking-wider">Contact</h4>
              <ul className="space-y-3 text-sm text-slate-600 font-light mb-6">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Mumbai, Maharashtra<br />India</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    <a href="tel:+918850163450" className="hover:text-blue-700 transition-colors touch-manipulation">
                      +91 88501 63450
                    </a>
                    <a href="tel:+919820056180" className="hover:text-blue-700 transition-colors touch-manipulation">
                      +91 98200 56180
                    </a>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <a href="mailto:hello@propai.live" className="hover:text-blue-700 transition-colors touch-manipulation">
                    hello@propai.live
                  </a>
                </li>
              </ul>

              {/* Social Icons */}
              <div className="flex items-center gap-3">
                <a 
                  href="https://instagram.com/propailive" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-all group touch-manipulation"
                >
                  <Instagram className="w-5 h-5 text-slate-700 group-hover:text-slate-900 transition-colors" />
                </a>
                <a 
                  href="https://linkedin.com/company/propai-live" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-all group touch-manipulation"
                >
                  <Linkedin className="w-5 h-5 text-slate-700 group-hover:text-slate-900 transition-colors" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Strip */}
          <div className="border-t border-slate-200 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-600">
              <div>
                <p>© 2025 PropAI Live. All rights reserved</p>
                <p className="text-xs mt-1 text-slate-500">Powered by artificial intelligence and real market data.</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-600">Made with</span>
                <span className="text-red-500 text-lg">❤️</span>
                <span className="text-slate-600">in Mumbai</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        /* ✅ Base font size reduction */
        html {
          font-size: 14px;
        }

        /* ✅ FIXED: Better touch handling */
        .touch-manipulation {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
          cursor: pointer;
        }

        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}