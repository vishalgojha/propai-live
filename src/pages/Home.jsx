
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Sparkles, TrendingUp, Shield, Building2,
  CheckCircle2, ArrowRight, MessageCircle, Eye, Brain,
  Zap, BookOpen, Globe, Bot, Home as HomeIcon, MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import SEO from "../components/SEO";
import InlineChatWidget from "../components/InlineChatWidget";
import { Toaster } from "sonner";
import {
  generateWebSiteJsonLd,
  generateOrganizationJsonLd,
  generateBreadcrumbJsonLd
} from "../components/utils/jsonLdHelpers";
import BrowserNotificationManager from "@/components/notifications/BrowserNotificationManager";

export default function Home() {
  const navigate = useNavigate();
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [showInlineChat, setShowInlineChat] = useState(false);
  const [user, setUser] = useState(null); // Added user state

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "PropAI Live",
    "description": "AI-powered real estate intelligence platform for Mumbai, delivering real-time property data and smart matching.",
    "url": "https://propai.live",
    "areaServed": {
      "@type": "City",
      "name": "Mumbai"
    },
    "priceRange": "$$"
  };

  // Mock data fetching for featured properties
  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      setIsLoadingProperties(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockProperties = [
        {
          id: "1",
          ai_title: "Luxurious 3 BHK Apartment in Bandra West",
          bhk: "3 BHK",
          location: "Bandra West, Mumbai",
          price: "6.50",
          price_unit: "crores",
          listing_type: "Sale",
          images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fA%3D%3D"],
        },
        {
          id: "2",
          ai_title: "Spacious 2 BHK Flat with Sea View in Worli",
          bhk: "2 BHK",
          location: "Worli, Mumbai",
          price: "3.20",
          price_unit: "crores",
          listing_type: "Rent",
          images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fA%3D%3D"],
        },
        {
          id: "3",
          ai_title: "Modern Office Space in BKC",
          bhk: "Office",
          location: "Bandra Kurla Complex, Mumbai",
          price: "1.80",
          price_unit: "crores",
          listing_type: "Sale",
          images: ["https://images.unsplash.com/photo-1549887534-1541e932662f?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8MHxwaG90by1wYWdlfHx8fA%3D%3D"],
        },
        {
          id: "4",
          ai_title: "1 BHK for rent in Andheri East",
          bhk: "1 BHK",
          location: "Andheri East, Mumbai",
          price: "50000",
          price_unit: "L",
          listing_type: "Rent",
          images: [],
        }
      ];
      setFeaturedProperties(mockProperties);
      setIsLoadingProperties(false);
    };

    fetchFeaturedProperties();
  }, []);

  // Load user for notification prompt
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };
    loadUser();
  }, []);

  const stats = [
    { number: "250+", label: "Buildings Mapped" },
    { number: "10,000+", label: "Properties Tracked" },
    { number: "500+", label: "Trusted Brokers" },
    { number: "24/7", label: "AI Monitoring" },
  ];

  // ✅ Generate JSON-LD for Home page
  const webSiteJsonLd = generateWebSiteJsonLd();
  const organizationJsonLd = generateOrganizationJsonLd();
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", url: typeof window !== 'undefined' ? window.location.origin : 'https://propai.live' }
  ]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Toaster position="top-center" richColors closeButton />

      {/* ✅ Enhanced SEO with structured data */}
      <SEO
        title="PropAI Live | WhatsApp → Organized Properties. Instantly."
        description="Stop losing deals in WhatsApp chaos. AI turns messy broker chats into structured listings in seconds. Powered by Building-Level Intelligence."
        canonical="https://propai.live"
        schema={[homeSchema, webSiteJsonLd]} // Ensure homeSchema is correctly handled if it's not an array initially.
        organization={organizationJsonLd}
        breadcrumbs={breadcrumbJsonLd}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24 md:pb-12">
        {/* Hero Section - Light & Clean */}
        <section className="relative bg-gradient-to-br from-purple-100 via-blue-50 to-purple-50 overflow-hidden">
          {/* Subtle decorative elements */}
          <div className="absolute top-20 right-20 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>

          <div className="relative max-w-4xl mx-auto py-20 md:py-32"> {/* Adjusted max-w-4xl and removed px-4 sm:px-6 lg:px-8 to use parent's padding */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              {/* Badge */}
              <Badge className="mb-6 bg-white border-2 border-purple-200 text-purple-700 px-4 py-2 text-sm font-bold inline-flex items-center gap-2 shadow-sm">
                <Sparkles className="w-4 h-4" />
                Powered by Building-Level Intelligence
              </Badge>

              {/* Headline */}
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-slate-900">
                WhatsApp → Organized Properties.
                <br />
                <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Instantly.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed font-light">
                Stop losing deals in WhatsApp chaos. AI turns messy broker chats
                <br className="hidden md:block" />
                <span className="text-slate-700 font-medium">into structured listings in seconds.</span>
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button
                  onClick={() => navigate(createPageUrl("SmartFeed"))}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold h-14 px-8 rounded-2xl shadow-lg text-lg group touch-manipulation"
                >
                  <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Explore SmartFeed
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  onClick={() => setShowInlineChat(!showInlineChat)}
                  size="lg"
                  className="bg-white hover:bg-purple-50 border-2 border-purple-200 text-purple-700 font-semibold h-14 px-8 rounded-2xl text-lg group touch-manipulation"
                >
                  <Bot className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                  {showInlineChat ? 'Close' : 'Chat with'} AI Assistant
                </Button>
              </div>

              {/* WhatsApp AI Connect Button */}
              <div className="flex justify-center mb-8">
                <a
                  href={base44.agents.getWhatsAppConnectURL('chariot_master')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition-all touch-manipulation"
                >
                  <MessageCircle className="w-5 h-5" />
                  Connect WhatsApp AI
                </a>
              </div>

              {/* ✅ FIXED: Inline Chat Widget with AnimatePresence */}
              <AnimatePresence>
                {showInlineChat && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mb-12"
                  >
                    <InlineChatWidget
                      isOpen={showInlineChat}
                      onClose={() => setShowInlineChat(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>AI-Verified Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Real-Time Updates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Broker Trust Scoring</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ✅ Browser Notification Prompt (for logged-in users) */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-16"
          >
            <BrowserNotificationManager user={user} />
          </motion.div>
        )}

        {/* Featured Properties Section - NO IMAGES */}
        <section className="py-16"> {/* Removed max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Featured Properties</h2>
              <p className="text-slate-600">Handpicked listings • Verified availability</p>
            </div>
            <Button
              onClick={() => navigate(createPageUrl("SmartFeed"))}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-2xl"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {isLoadingProperties ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-96 rounded-3xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredProperties.slice(0, 3).map((property) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-3xl overflow-hidden border-2 border-slate-100 hover:border-sky-200 hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => navigate(createPageUrl("PropertyDetails") + `?id=${property.id}`)}
                >
                  <div className="p-6">
                    <Badge className="mb-3 bg-sky-600 text-white border-0">
                      {property.listing_type}
                    </Badge>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">
                      {property.ai_title || `${property.bhk} in ${property.location}`}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-600 mb-4">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{property.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-sky-600">
                        ₹{property.price}{property.price_unit === 'crores' ? ' Cr' : 'L'}
                      </span>
                      <Badge variant="outline">{property.bhk}</Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Why PropAI - Simple Value Props */}
        <section className="py-20 bg-white/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Why PropAI Live?
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Three reasons why we're different
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Building Intelligence */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl p-8 border-2 border-purple-200 hover:shadow-xl transition-all text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Building Memory™</h3>
                <p className="text-slate-700 leading-relaxed">
                  Every building learns from past listings. See pricing trends, broker activity, and market intelligence—instantly.
                </p>
              </motion.div>

              {/* Trust Scoring */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl p-8 border-2 border-purple-200 hover:shadow-xl transition-all text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">BrokerTrust™ Scores</h3>
                <p className="text-slate-700 leading-relaxed">
                  No more spam. AI ranks brokers by reliability. High-trust sources show up first. Simple.
                </p>
              </motion.div>

              {/* Real-time Updates */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl p-8 border-2 border-purple-200 hover:shadow-xl transition-all text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">WhatsApp → Database</h3>
                <p className="text-slate-700 leading-relaxed">
                  Broker sends message. AI parses it. Property goes live in seconds. No manual entry. Ever.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How It Works - Simple */}
        <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="max-w-4xl mx-auto text-center"> {/* Removed px-4 sm:px-6 lg:px-8 */}
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 mb-12">
              Three steps. Zero manual work.
            </p>

            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-6 border-2 border-purple-200"
              >
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-lg">Broker Sends Message</h3>
                <p className="text-slate-600 text-sm">
                  "2bhk Bandra 1L rent" gets forwarded to our WhatsApp AI
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 border-2 border-purple-200"
              >
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-lg">AI Parses Instantly</h3>
                <p className="text-slate-600 text-sm">
                  Extracts price, location, details. Links to building. Scores broker trust.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-6 border-2 border-purple-200"
              >
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-lg">Goes Live</h3>
                <p className="text-slate-600 text-sm">
                  Property appears in SmartFeed with full context and intelligence
                </p>
              </motion.div>
            </div>

            <div className="mt-12 bg-white rounded-2xl p-6 border-2 border-green-200">
              <p className="text-slate-700">
                <strong className="text-green-700">Result:</strong> Fresh data, zero spam, full transparency. No manual entry. No duplicate listings.
              </p>
            </div>
          </div>
        </section>

        {/* Trust Indicators - Images with lazy loading */}
        <section className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Honest Disclaimer with Humor */}
            <div className="text-center mb-8">
              <p className="text-white/90 text-sm font-light italic">
                ⚠️ Real talk: These numbers are 100% made up. But we're building something real—and we plan to blow past these fake stats. Watch this space. 🚀
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                  <div className="text-blue-100 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Aspirational Footer */}
            <div className="text-center mt-8">
              <p className="text-white/80 text-xs font-light">
                (Aspirational AF. But give us a minute—we'll make the real numbers even better.) 💪✨
              </p>
            </div>
          </div>
        </section>

        {/* Social Proof / Trust Section */}
        <section className="py-20 bg-white/50">
          <div className="max-w-5xl mx-auto text-center"> {/* Removed px-4 sm:px-6 lg:px-8 */}
            <h2 className="text-3xl font-bold text-slate-900 mb-6">
              Built in Mumbai. Powered by AI. Real-time data.
            </h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              We're not a portal dumping 10,000 listings. We're an intelligence platform that uses AI to understand Mumbai real estate at a <span className="font-semibold text-slate-900">contextual, street-level depth</span>—then shows you the 3 properties that actually fit.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate(createPageUrl("SmartFeed"))}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold h-14 px-8 rounded-2xl"
              >
                <Search className="w-5 h-5 mr-2" />
                Browse Properties
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("Blogs"))}
                size="lg"
                className="bg-white hover:bg-purple-50 border-2 border-purple-200 text-purple-700 font-semibold h-14 px-8 rounded-2xl"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Read Insights
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section - Light */}
        <section className="py-16 bg-gradient-to-br from-purple-100 via-blue-50 to-purple-50">
          <div className="max-w-4xl mx-auto text-center"> {/* Removed px-4 sm:px-6 lg:px-8 */}
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Ready to See the Difference?
            </h2>
            <p className="text-xl text-slate-600 mb-8">
              Chat with our AI assistant or explore our smart feed
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setShowInlineChat(true)}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold h-14 px-8 rounded-2xl shadow-lg touch-manipulation"
              >
                <Bot className="w-5 h-5 mr-2" />
                Chat with AI Assistant
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("SmartFeed"))}
                size="lg"
                className="bg-white hover:bg-purple-50 border-2 border-purple-200 text-purple-700 font-semibold h-14 px-8 rounded-2xl touch-manipulation"
              >
                <Search className="w-5 h-5 mr-2" />
                Explore Properties
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
