
import React, { useState, useEffect } from "react";
import { Link, useLocation, Routes, Route, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, Search, Settings, Zap, BookOpen, Building2, MapPin, Phone, Mail, Instagram, Linkedin, Menu, X, User, LogOut, Users, BarChart3 } from "lucide-react";
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
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    // Set global meta tags - CRITICAL FOR SOCIAL SHARING
    const setMetaTag = (name, content, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let tag = document.querySelector(selector);
      if (tag) {
        tag.setAttribute('content', content);
      } else {
        tag = document.createElement('meta');
        if (isProperty) {
          tag.setAttribute('property', name);
        } else {
          tag.setAttribute('name', name);
        }
        tag.setAttribute('content', content);
        document.head.appendChild(tag);
      }
    };

    // Default meta tags - FALLBACK for all pages
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    setMetaTag('theme-color', '#8B5CF6');
    setMetaTag('author', 'PropAI Live');
    setMetaTag('robots', 'index, follow');
    
    // Default description (will be overridden by SEO component on specific pages)
    if (!document.querySelector('meta[name="description"]')) {
      setMetaTag('description', 'AI-powered Mumbai real estate intelligence platform. Real-time property data, building intelligence, and broker trust scoring. Find verified properties with transparent pricing.');
    }
    
    // Open Graph defaults - CRITICAL for social sharing
    setMetaTag('og:site_name', 'PropAI Live', true);
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:locale', 'en_IN', true);
    
    // Set OG URL to current page
    setMetaTag('og:url', window.location.href, true);
    
    // Default OG title (will be overridden by SEO component)
    if (!document.querySelector('meta[property="og:title"]')) {
      setMetaTag('og:title', 'PropAI Live | AI-Powered Mumbai Real Estate Intelligence', true);
    }
    
    // Default OG description (will be overridden by SEO component)
    if (!document.querySelector('meta[property="og:description"]')) {
      setMetaTag('og:description', 'Real-time property data for Mumbai. AI-powered matching, building intelligence, and broker trust scoring.', true);
    }
    
    // Default OG image - UPDATE THIS WITH YOUR ACTUAL IMAGE URL
    if (!document.querySelector('meta[property="og:image"]')) {
      setMetaTag('og:image', 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=1200&auto=format&fit=crop', true);
    }
    
    // Twitter Card defaults
    setMetaTag('twitter:card', 'summary_large_image');
    if (!document.querySelector('meta[name="twitter:title"]')) {
      setMetaTag('twitter:title', 'PropAI Live | AI-Powered Mumbai Real Estate Intelligence');
    }
    if (!document.querySelector('meta[name="twitter:description"]')) {
      setMetaTag('twitter:description', 'Real-time property data for Mumbai. AI-powered matching, building intelligence, and broker trust scoring.');
    }
    if (!document.querySelector('meta[name="twitter:image"]')) {
      setMetaTag('twitter:image', 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?q=80&w=1200&auto=format&fit=crop');
    }
    
    // Additional SEO tags
    setMetaTag('keywords', 'Mumbai real estate, property Mumbai, Bandra properties, AI property search, Mumbai flats, Mumbai commercial real estate, property intelligence');
    setMetaTag('geo.region', 'IN-MH');
    setMetaTag('geo.placename', 'Mumbai');
    setMetaTag('geo.position', '19.0760;72.8777');
    setMetaTag('ICBM', '19.0760, 72.8777');
    
    // Add RSS Feed auto-discovery
    let rssLink = document.querySelector('link[type="application/rss+xml"]');
    if (!rssLink) {
      rssLink = document.createElement('link');
      rssLink.setAttribute('rel', 'alternate');
      rssLink.setAttribute('type', 'application/rss+xml');
      rssLink.setAttribute('title', 'PropAI Live Insights RSS Feed');
      rssLink.setAttribute('href', `${window.location.origin}/api/rssFeed`);
      document.head.appendChild(rssLink);
    }
    
    // Add sitemap reference
    let sitemapLink = document.querySelector('link[rel="sitemap"]');
    if (!sitemapLink) {
      sitemapLink = document.createElement('link');
      sitemapLink.setAttribute('rel', 'sitemap');
      sitemapLink.setAttribute('type', 'application/xml');
      sitemapLink.setAttribute('title', 'Sitemap');
      sitemapLink.setAttribute('href', `${window.location.origin}/api/sitemap.xml`);
      document.head.appendChild(sitemapLink);
    }
  }, [location.pathname]); // Re-run when path changes

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
    { name: "Buildings", icon: Building2, path: createPageUrl("Buildings") },
    { name: "Insights", icon: BookOpen, path: createPageUrl("Blogs") },
  ];

  // Add Network for ALL logged-in users
  if (user) {
    navItems.push(
      { name: "Network", icon: Users, path: createPageUrl("BrokerNetwork") }
    );
  }

  // Only show admin link if user is admin
  if (user?.role === 'admin') {
    navItems.push(
      { name: "Admin", icon: Settings, path: createPageUrl("Admin") },
      { name: "Dashboard", icon: BarChart3, path: createPageUrl("AdminDashboard") }
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-purple-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-md">
                <Zap className="w-6 h-6 text-white fill-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent tracking-tight">PropAI Live</span>
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
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                        : "text-slate-700 hover:bg-purple-50"
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
                        <Button variant="ghost" className="ml-2 gap-2 rounded-2xl hover:bg-purple-50">
                          <User className="w-4 h-4" />
                          <span className="text-sm font-semibold">{user.full_name || user.email}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <div className="px-2 py-2">
                          <p className="text-sm font-semibold">{user.full_name || 'User'}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          {user.role === 'admin' && (
                            <p className="text-xs text-purple-600 font-bold mt-1">Admin</p>
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
                      className="ml-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-md"
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
                <X className="w-6 h-6 text-slate-900" />
              ) : (
                <Menu className="w-6 h-6 text-slate-900" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-purple-100 bg-white/95 backdrop-blur-xl">
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
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                        : "text-slate-700 hover:bg-purple-50"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
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
                          <p className="text-xs text-purple-600 font-bold mt-1">Admin</p>
                        )}
                      </div>
                      <Button
                        onClick={() => {
                          navigate(createPageUrl("MyProfile"));
                          setMobileMenuOpen(false);
                        }}
                        variant="outline"
                        className="w-full justify-start gap-2"
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
                        className="w-full justify-start gap-2 mt-2"
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
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-2xl"
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

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Light Modern Footer */}
      <footer className="bg-white border-t border-purple-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
            
            {/* Brand Section */}
            <div className="md:col-span-4">
              <div className="mb-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Zap className="w-7 h-7 text-white fill-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent tracking-tight">PropAI Live</span>
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
                    className="hover:text-purple-600 transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-purple-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    SmartFeed
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("SmartFeed") + "?propertyCategory=Residential"} 
                    className="hover:text-purple-600 transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-purple-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Residential
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("SmartFeed") + "?propertyCategory=Commercial"} 
                    className="hover:text-purple-600 transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-purple-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Commercial
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("SmartFeed") + "?listingType=Rent"} 
                    className="hover:text-purple-600 transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-purple-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Rent
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("SmartFeed") + "?listingType=Sale"} 
                    className="hover:text-purple-600 transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-purple-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Buy
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("Blogs")} 
                    className="hover:text-purple-600 transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-purple-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Blog & Guides
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("BrokerNetwork")} 
                    className="hover:text-purple-600 transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-purple-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
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
                    className="hover:text-purple-600 transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-purple-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("Buildings")} 
                    className="hover:text-purple-600 transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-purple-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Building Directory
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("AdminDashboard")} 
                    className="hover:text-purple-600 transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-purple-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Analytics
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("SmartFeed")} 
                    className="hover:text-purple-600 transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-purple-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    SmartFeed Explained
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("Blogs") + "?category=Expat%20Series"} 
                    className="hover:text-purple-600 transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-purple-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    <span>Expat Corner</span>
                    <span className="ml-1 text-xs">🌍</span>
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
                    className="hover:text-purple-600 transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-purple-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("TermsOfService")} 
                    className="hover:text-purple-600 transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-purple-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link 
                    to={createPageUrl("Disclaimer")} 
                    className="hover:text-purple-600 transition-colors flex items-center group"
                  >
                    <span className="w-1 h-1 bg-purple-500 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
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
                  <MapPin className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>Mumbai, Maharashtra<br />India</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <a href="tel:+919819471310" className="hover:text-purple-600 transition-colors">
                    +91 98194 71310
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <a href="mailto:hello@propai.live" className="hover:text-purple-600 transition-colors">
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
                  className="w-10 h-10 bg-purple-50 hover:bg-purple-100 rounded-xl flex items-center justify-center transition-all group"
                >
                  <Instagram className="w-5 h-5 text-purple-600 group-hover:text-purple-700 transition-colors" />
                </a>
                <a 
                  href="https://linkedin.com/company/propai-live" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-purple-50 hover:bg-purple-100 rounded-xl flex items-center justify-center transition-all group"
                >
                  <Linkedin className="w-5 h-5 text-purple-600 group-hover:text-purple-700 transition-colors" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Strip */}
          <div className="border-t border-purple-100 pt-8">
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
    </div>
  );
}
