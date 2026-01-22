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

export default function Home() {
  const navigate = useNavigate();
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [showInlineChat, setShowInlineChat] = useState(false);

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

  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      setIsLoadingProperties(true);
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

  const stats = [
    { number: "250+", label: "Buildings Mapped" },
    { number: "10,000+", label: "Properties Tracked" },
    { number: "500+", label: "Trusted Brokers" },
    { number: "24/7", label: "AI Monitoring" },
  ];

  // ✅ Popular Mumbai localities for SEO linking
  const topLocalities = [
    { name: "Bandra West", slug: "bandra-west", emoji: "⭐" },
    { name: "Juhu", slug: "juhu", emoji: "🌊" },
    { name: "Andheri West", slug: "andheri-west", emoji: "🏢" },
    { name: "Worli", slug: "worli", emoji: "🌆" },
    { name: "BKC", slug: "bkc", emoji: "💼" },
    { name: "Lower Parel", slug: "lower-parel", emoji: "🏗️" },
    { name: "Powai", slug: "powai", emoji: "🌳" },
    { name: "Khar West", slug: "khar-west", emoji: "✨" }
  ];

  const webSiteJsonLd = generateWebSiteJsonLd();
  const organizationJsonLd = generateOrganizationJsonLd();
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", url: typeof window !== 'undefined' ? window.location.origin : 'https://propai.live' }
  ]);


  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" richColors closeButton />

      <SEO
        title="Rent & Buy Flats in Mumbai — 1,500+ Verified WhatsApp Listings | PropAI Live"
        description="Stop losing deals in WhatsApp chaos. AI turns messy broker chats into structured listings in seconds. Powered by Building-Level Intelligence."
        schema={Array.isArray(homeSchema) ? [...homeSchema, webSiteJsonLd] : [homeSchema, webSiteJsonLd]}
        organization={organizationJsonLd}
        breadcrumbs={breadcrumbJsonLd}
        canonical={typeof window !== 'undefined' ? window.location.origin : 'https://propai.live'}
      />

      {/* Hero Section - Professional */}
      <section className="relative bg-white overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge variant="outline" className="mb-6 border-slate-300 text-slate-700 px-3 py-1.5 text-xs font-medium">
                Real-time data • Zero fluff
              </Badge>
            </motion.div>

            {/* ✅ SEO: Proper H1 with longtail keywords */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-slate-900">
              WhatsApp → Deal-ready
              <br />
              <span className="text-slate-900">
                property listings
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed font-light">
              Paste a real broker WhatsApp message.
              <br className="hidden md:block" />
              <span className="text-slate-700 font-medium">PropAI converts it into a verified, searchable listing with price band, intent, and trust score — in seconds.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => navigate(createPageUrl("SmartFeed"))}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 px-8 rounded-lg shadow-sm text-base group touch-manipulation"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Browse Live Listings
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
              <motion.a
                href={base44.agents.getWhatsAppConnectURL('chariot_master')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium h-12 px-8 rounded-lg text-base transition-all touch-manipulation"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp AI
              </motion.a>
            </div>

            <p className="text-sm text-slate-500 mb-8 italic">
              WhatsApp access is limited to verified users to prevent spam and fake listings.
            </p>

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

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>1,500+ live WhatsApp listings</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Real-time updates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>BrokerTrust™ scoring</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>No fake inventory</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ✅ NEW: SEO Content Block - Popular Localities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white/50">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Find Properties in Mumbai's Top Localities</h2>
          <p className="text-slate-600">Browse verified listings from popular areas across Mumbai</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topLocalities.map((locality) => (
            <Link
              key={locality.slug}
              to={`${createPageUrl("SmartFeed")}?location_multi=${encodeURIComponent(locality.name)}`}
              className="bg-white rounded-lg p-6 border border-slate-200 hover:border-blue-600 hover:shadow-md transition-all group"
            >
              <div className="text-3xl mb-2">{locality.emoji}</div>
              <h3 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                {locality.name}
              </h3>
              <p className="text-xs text-slate-600">View properties →</p>
            </Link>
          ))}
        </div>

        {/* ✅ SEO: Category Links */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link
            to={`${createPageUrl("SmartFeed")}?listingType=Rent&propertyCategory=Residential`}
            className="bg-white rounded-lg p-6 border border-slate-200 hover:border-blue-600 hover:shadow-md transition-all text-center group"
          >
            <HomeIcon className="w-8 h-8 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-slate-900 mb-1">Rent Flats</h3>
            <p className="text-xs text-slate-600">Mumbai rentals</p>
          </Link>

          <Link
            to={`${createPageUrl("SmartFeed")}?listingType=Sale&propertyCategory=Residential`}
            className="bg-white rounded-lg p-6 border border-slate-200 hover:border-blue-600 hover:shadow-md transition-all text-center group"
          >
            <Building2 className="w-8 h-8 text-slate-700 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-slate-900 mb-1">Buy Flats</h3>
            <p className="text-xs text-slate-600">Residential sale</p>
          </Link>

          <Link
            to={`${createPageUrl("SmartFeed")}?propertyCategory=Commercial`}
            className="bg-white rounded-lg p-6 border border-slate-200 hover:border-blue-600 hover:shadow-md transition-all text-center group"
          >
            <Building2 className="w-8 h-8 text-slate-700 mx-auto mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-slate-900 mb-1">Commercial</h3>
            <p className="text-xs text-slate-600">Offices & retail</p>
          </Link>


        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Featured Properties</h2>
            <p className="text-slate-600">Handpicked listings • Verified availability</p>
          </div>
          <Button
            onClick={() => navigate(createPageUrl("SmartFeed"))}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
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

      {/* Why PropAI */}
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

      {/* How It Works */}
      <section className="py-20 bg-white border-t border-slate-200" id="how-it-works">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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

          <div className="mt-12 bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <p className="text-slate-700">
              <strong className="text-green-700">Result:</strong> Fresh data, zero spam, full transparency. No manual entry. No duplicate listings.
            </p>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-slate-900 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-white/80 text-xs font-light">
              (Aspirational AF. But give us a minute—we'll make the real numbers even better.) 💪✨
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-white/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 px-8 rounded-lg shadow-sm"
            >
              <Search className="w-5 h-5 mr-2" />
              Browse Properties
            </Button>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 px-8 rounded-lg shadow-sm touch-manipulation"
            >
              <Bot className="w-5 h-5 mr-2" />
              Chat with AI Assistant
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("SmartFeed"))}
              size="lg"
              className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium h-12 px-8 rounded-lg touch-manipulation"
            >
              <Search className="w-5 h-5 mr-2" />
              Explore Properties
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}