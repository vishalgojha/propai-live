import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Sparkles, TrendingUp, Shield, Building2,
  CheckCircle2, ArrowRight, MessageCircle, Eye, Brain,
  Zap, BookOpen, Globe, Bot, Home as HomeIcon, MapPin, Terminal, Copy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import SEO from "../components/SEO";
import InlineChatWidget from "../components/InlineChatWidget";
import { Toaster, toast } from "sonner";
import {
  generateWebSiteJsonLd,
  generateOrganizationJsonLd,
  generateBreadcrumbJsonLd
} from "../components/utils/jsonLdHelpers";

export default function Home() {
  const navigate = useNavigate();
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showInlineChat, setShowInlineChat] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

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
              <span className="text-slate-700 font-medium">PropAI converts it into a verified, searchable listing with search intent tracking, broker trust scores, and smart matching — in seconds.</span>
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
                href={base44.agents.getWhatsAppConnectURL('propai_live')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold h-12 px-8 rounded-lg text-base shadow-sm transition-all touch-manipulation"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp AI
              </motion.a>
            </div>

            {/* Install Command */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 mt-6"
            >
              <div className="w-full max-w-md">
                <div className="bg-slate-900 rounded-lg p-4 relative">
                  <code className="text-green-400 text-sm font-mono">
                    npm install -g propai
                  </code>
                  <button
                    onClick={() => copyToClipboard('npm install -g propai')}
                    className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors touch-manipulation"
                  >
                    <Copy className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>
            </motion.div>

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

      {/* ✅ AI-READABLE: What PropAI Does */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-white">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">What PropAI Live Does</h2>
          <div className="max-w-3xl mx-auto text-left space-y-4 text-slate-700">
            <p>
              PropAI Live is a real-time property intelligence platform. We track active residential and commercial properties 
              with verified availability, broker trust scores, and demand analytics.
            </p>
            <p>
              Our AI parses WhatsApp broker messages to create structured listings with price bands, location details, BHK configurations, 
              furnishing status, and amenities. Every property is ranked by BrokerTrust™—a score based on broker reliability, response time, and data accuracy.
            </p>
            <p>
              <strong>Key features:</strong> Real-time WhatsApp parsing, BrokerTrust™ scoring (0-100), search intent tracking from user behavior, 
              smart property-requirement matching, developer tier classification, and broker collaboration tools. All data updates automatically as brokers send new listings.
            </p>
          </div>
        </div>
      </section>





      {/* Why PropAI */}
      <section className="py-20 bg-white border-t border-slate-200">
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
              className="bg-white rounded-xl p-8 border border-slate-200 hover:shadow-xl transition-all text-center"
            >
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Smart Intent Tracking</h3>
              <p className="text-slate-700 leading-relaxed">
                AI learns what you search for and auto-matches new properties. Your feed gets smarter with every search and inquiry.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-8 border border-slate-200 hover:shadow-xl transition-all text-center"
            >
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-6">
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
              className="bg-white rounded-xl p-8 border border-slate-200 hover:shadow-xl transition-all text-center"
            >
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-6">
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
              className="bg-white rounded-lg p-6 border border-slate-200"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
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
              className="bg-white rounded-lg p-6 border border-slate-200"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
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
              className="bg-white rounded-lg p-6 border border-slate-200"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
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
      <section className="py-20 bg-white border-t border-slate-200">
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