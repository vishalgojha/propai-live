import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap, Brain, Shield, TrendingUp, MessageCircle, Building2,
  Users, Target, Sparkles, ArrowRight, CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import SEO from "../components/SEO";

export default function AboutUs() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About PropAI Live",
    "description": "PropAI Live is Mumbai's AI-powered real estate intelligence platform, transforming WhatsApp chaos into structured property insights.",
    "mainEntity": {
      "@type": "Organization",
      "name": "PropAI Live",
      "description": "AI-powered real estate intelligence platform for Mumbai",
      "foundingDate": "2024",
      "founders": [
        {
          "@type": "Person",
          "name": "Vishal"
        },
        {
          "@type": "Person",
          "name": "Kapil"
        }
      ]
    }
  };

  const values = [
    {
      icon: Brain,
      title: "Intelligence Over Volume",
      description: "We don't dump 10,000 listings at you. We show you the 3 properties that actually fit—backed by building-level intelligence and broker trust scoring."
    },
    {
      icon: Shield,
      title: "Radical Transparency",
      description: "No hidden fees. No bait-and-switch. No fake listings. BrokerTrust™ scores every source, so you see the clean data first."
    },
    {
      icon: Sparkles,
      title: "AI That Works For You",
      description: "Our AI doesn't just parse text—it learns Mumbai's street smarts, broker lingo, and micro-market patterns. Pali Hill ≠ Hill Road. We get it."
    },
    {
      icon: Users,
      title: "Built By Locals, For Everyone",
      description: "Born in Mumbai, powered by AI, designed for anyone navigating the city's real estate maze—whether you're a local or landing from London."
    }
  ];

  const timeline = [
    {
      year: "The Problem",
      title: "WhatsApp Chaos",
      description: "Vishal and Kapil were drowning in WhatsApp broker spam. 'Pali Hill 2bhk sf mod kit 2cp 80L' × 1000 messages. No structure. No trust layer. Just noise."
    },
    {
      year: "The Insight",
      title: "Buildings Are Knowledge Nodes",
      description: "Generic portals treat every listing as isolated. We realized: if you aggregate data at the building level, patterns emerge. Pricing intelligence. Broker behavior. Tenant profiles. Living context."
    },
    {
      year: "The Build",
      title: "AI + Real Estate DNA",
      description: "We built an AI that doesn't just parse messages—it understands Mumbai geography, broker abbreviations, and cultural nuances. Then we wrapped it in BrokerTrust™ and Building Memory™."
    },
    {
      year: "Today",
      title: "Living Intelligence",
      description: "Every parsed message makes the system smarter. Every building profile gets richer. Every broker interaction refines the trust score. PropAI Live isn't static—it compounds."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <SEO
        title="About PropAI Live | Our Mission to Fix Mumbai Real Estate"
        description="PropAI Live transforms WhatsApp chaos into structured property intelligence. Built by Vishal & Kapil to bring transparency, AI-powered insights, and trust to Mumbai's real estate market."
        schema={aboutSchema}
        canonical="https://propai.live/about"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24 md:pb-12">

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <Badge className="mb-6 bg-white border-2 border-purple-200 text-purple-700 px-4 py-2 text-sm font-bold inline-flex items-center gap-2 shadow-sm">
            <Zap className="w-4 h-4" />
            About PropAI Live
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            We're fixing Mumbai's
            <br />
            <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              real estate chaos.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed font-light">
            Stop losing deals in WhatsApp spam. PropAI Live turns messy broker messages into 
            <span className="text-slate-900 font-semibold"> structured intelligence</span>—powered by AI that actually understands Mumbai.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => window.location.href = createPageUrl("SmartFeed")}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold h-14 px-8 rounded-2xl shadow-lg"
            >
              Explore SmartFeed
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </motion.div>

        {/* The Origin Story */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              The Origin Story
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Every great product solves a problem its founders lived through. This is ours.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {timeline.map((phase, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-3xl p-8 border-2 border-purple-200 hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-xs text-purple-600 font-bold uppercase tracking-wide">{phase.year}</p>
                    <h3 className="text-xl font-bold text-slate-900">{phase.title}</h3>
                  </div>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {phase.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* What Makes Us Different */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              What Makes Us Different
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Features MagicBricks and Housing will never build.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {values.map((value, idx) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border-2 border-purple-200 hover:shadow-xl transition-all"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{value.title}</h3>
                  <p className="text-slate-700 leading-relaxed">{value.description}</p>
                </motion.div>
              );
            })}
          </div>

          {/* The Unfair Advantages */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl p-10 text-white">
            <h3 className="text-3xl font-bold mb-6 text-center">Your Unfair Advantages</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-6 h-6" />
                  <h4 className="font-bold text-lg">Building Memory™</h4>
                </div>
                <p className="text-white/90 text-sm leading-relaxed">
                  Every building becomes a living knowledge object. Historical pricing, broker activity, tenant profiles—auto-learned from parsed data.
                </p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-6 h-6" />
                  <h4 className="font-bold text-lg">BrokerTrust™</h4>
                </div>
                <p className="text-white/90 text-sm leading-relaxed">
                  Invisible quality filter. Properties from high-trust brokers rise to the top—you see clean data first. No spam, no duplicates.
                </p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-6 h-6" />
                  <h4 className="font-bold text-lg">AI Deals Radar</h4>
                </div>
                <p className="text-white/90 text-sm leading-relaxed">
                  Spot underpriced listings, price drops, hidden matches—before they hit portals. Your advantage scales with every parse.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Team */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Meet The Team
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Built by people who've lived the Mumbai property search nightmare.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 border-2 border-purple-200 text-center hover:shadow-xl transition-all"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                V
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Vishal</h3>
              <p className="text-purple-700 font-semibold mb-4">Co-Founder</p>
              <p className="text-slate-700 leading-relaxed">
                Real estate operator turned builder. Spent years navigating WhatsApp broker chaos—decided to fix it with AI.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-8 border-2 border-purple-200 text-center hover:shadow-xl transition-all"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                K
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Kapil</h3>
              <p className="text-blue-700 font-semibold mb-4">Co-Founder</p>
              <p className="text-slate-700 leading-relaxed">
                Tech architect obsessed with structured data. Believed Mumbai real estate deserved better than MagicBricks.
              </p>
            </motion.div>
          </div>
        </section>

        {/* The Mission */}
        <section className="mb-20">
          <div className="bg-gradient-to-br from-purple-100 via-blue-50 to-purple-50 rounded-3xl p-12 border-2 border-purple-200">
            <div className="max-w-3xl mx-auto text-center">
              <Target className="w-16 h-16 text-purple-600 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Our Mission
              </h2>
              <p className="text-xl text-slate-700 leading-relaxed mb-6">
                <strong className="text-purple-700">Build the world's most intelligent real estate platform</strong>—one that doesn't just list properties, but understands buildings, learns from broker behavior, and delivers contextual insights you can't find anywhere else.
              </p>
              <p className="text-lg text-slate-600 leading-relaxed">
                We're not competing with portals. We're building a category: <span className="font-bold text-slate-900">Real Estate Intelligence.</span>
              </p>
            </div>
          </div>
        </section>

        {/* How We're Different */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why PropAI Live Exists
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Because the old way is broken. Here's what we're fixing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* The Old Way */}
            <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-red-900 mb-6 flex items-center gap-2">
                <span className="text-3xl">❌</span>
                The Old Way
              </h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>10,000 listings dumped at you with no context</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>Same property posted 50 times by different brokers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>No way to know if the broker is reliable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>Prices outdated by weeks, sometimes months</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>Building info? "Luxury society with amenities" (useless)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>WhatsApp broker messages buried in 200+ group chats</span>
                </li>
              </ul>
            </div>

            {/* The PropAI Way */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-3xl p-8">
              <h3 className="text-2xl font-bold text-green-900 mb-6 flex items-center gap-2">
                <span className="text-3xl">✅</span>
                The PropAI Way
              </h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>AI-curated feed</strong> ranked by BrokerTrust™ scores</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Auto-detected duplicates</strong> hidden from view</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Broker reliability scoring</strong> based on behavior patterns</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Real-time updates</strong> from WhatsApp → Database in seconds</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>Building Memory™:</strong> "Oberoi Sky Heights: 47 listings, avg ₹2.34L for 2BHK"</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span><strong>WhatsApp AI agent</strong> parses messages while you sleep</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Technology Stack - The Intelligence Layer */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              The Intelligence Layer
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              You see properties. We see patterns, relationships, and context that generic portals miss.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-8 text-white shadow-xl mb-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-bold mb-1">WhatsApp → Structured Data</h4>
                  <p className="text-sm text-blue-100">Broker forwards: "2bhk sf mod kit 2cp Pali Hill 80L". AI parses, links to building, extracts intelligence—all in real-time.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-bold mb-1">Building Becomes Knowledge Node</h4>
                  <p className="text-sm text-blue-100">"Raheja Classique" accumulates context: pricing history, broker trust, tenant profiles, amenities—self-learning with every parse.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-bold mb-1">SmartFeed Ranks by Trust</h4>
                  <p className="text-sm text-blue-100">High-trust brokers rise. Duplicates hidden. Price alerts automated. You see the clean, curated feed—decades ahead of MagicBricks.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-600">4</span>
                </div>
                <div>
                  <h4 className="font-bold mb-1">Intelligence Compounds</h4>
                  <p className="text-sm text-blue-100">Every parse enriches the system. Building Memory™ grows. Deals Radar gets smarter. Your advantage scales automatically.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border-2 border-purple-200">
            <h4 className="font-bold text-slate-900 mb-4 text-center text-xl">The Moat</h4>
            <p className="text-slate-700 text-center leading-relaxed max-w-2xl mx-auto">
              MagicBricks has listings. You have <span className="font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">living intelligence</span>. 
              That's not a feature gap—it's a decade gap. And it compounds with every WhatsApp message we parse.
            </p>
          </div>
        </section>

        {/* Who We Serve */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Who We Serve
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-8 border-2 border-purple-200 text-center hover:shadow-xl transition-all">
              <div className="text-5xl mb-4">🌍</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Expats & Relocators</h3>
              <p className="text-slate-700 text-sm leading-relaxed">
                Landing in Mumbai? Expat Mode™ filters for fully furnished, expat-friendly buildings with good management. No local knowledge required.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border-2 border-purple-200 text-center hover:shadow-xl transition-all">
              <div className="text-5xl mb-4">🏠</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Property Seekers</h3>
              <p className="text-slate-700 text-sm leading-relaxed">
                Tired of portal spam? SmartFeed shows you 50 curated listings, not 5,000 duplicates. Building Memory™ gives you pricing context upfront.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border-2 border-purple-200 text-center hover:shadow-xl transition-all">
              <div className="text-5xl mb-4">🤝</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Brokers & Agents</h3>
              <p className="text-slate-700 text-sm leading-relaxed">
                WhatsApp AI agent parses your messages instantly. Build your BrokerTrust™ score, get matched with serious buyers, skip the noise.
              </p>
            </div>
          </div>
        </section>

        {/* The Vision */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-3xl p-12 border-2 border-purple-300 text-center">
            <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Where We're Going
            </h2>
            <p className="text-xl text-slate-700 leading-relaxed max-w-3xl mx-auto mb-8">
              We're not stopping at listings. We're building the <span className="font-bold text-purple-700">intelligent layer</span> for Mumbai real estate:
            </p>
            <div className="grid md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto">
              <div className="bg-white/80 rounded-2xl p-6 border border-purple-200">
                <h4 className="font-bold text-slate-900 mb-2">🎯 Predictive Matching</h4>
                <p className="text-sm text-slate-700">AI learns your preferences, alerts you before properties hit the market.</p>
              </div>
              <div className="bg-white/80 rounded-2xl p-6 border border-purple-200">
                <h4 className="font-bold text-slate-900 mb-2">📊 Price Intelligence</h4>
                <p className="text-sm text-slate-700">Street-level pricing trends, hidden deals, market sentiment—auto-calculated daily.</p>
              </div>
              <div className="bg-white/80 rounded-2xl p-6 border border-purple-200">
                <h4 className="font-bold text-slate-900 mb-2">🏗️ Developer Insights</h4>
                <p className="text-sm text-slate-700">Track delivery timelines, reputation scores, project histories—know who you're buying from.</p>
              </div>
              <div className="bg-white/80 rounded-2xl p-6 border border-purple-200">
                <h4 className="font-bold text-slate-900 mb-2">🌐 Global Expansion</h4>
                <p className="text-sm text-slate-700">Mumbai first. Then Delhi, Bangalore, and beyond. Same intelligence layer, different cities.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl p-12 text-white shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Experience the Difference?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands discovering Mumbai real estate the intelligent way.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => window.location.href = createPageUrl("SmartFeed")}
                size="lg"
                className="bg-white hover:bg-purple-50 text-purple-700 font-bold h-14 px-8 rounded-2xl shadow-lg"
              >
                Browse Properties
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => window.open(base44.agents.getWhatsAppConnectURL('chariot_master'), '_blank')}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white font-bold h-14 px-8 rounded-2xl shadow-lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Connect WhatsApp AI
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}