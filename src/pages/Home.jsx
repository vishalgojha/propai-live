
import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Shield,
  TrendingUp,
  MessageCircle,
  Search,
  Building2,
  CheckCircle,
  Check, // Kept for CTA section
} from "lucide-react";
import { motion } from "framer-motion";
import SEO from "../components/SEO";

export default function Home() {
  // No authentication required for public home page

  const homeSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": "Chariot Realty",
    "description": "AI-powered real estate platform for Mumbai. Transparent property listings in Bandra, Juhu, Andheri and more.",
    "url": "https://chariotrealtors.in",
    "telephone": "+919819471310",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Bandra West, Mumbai",
      "addressRegion": "Maharashtra",
      "addressCountry": "IN"
    }
  };

  const handleWhatsAppStatic = () => {
    // Using a static number as base44 and its specific WhatsApp AI integration is removed.
    // This connects to Kapil's number mentioned in the CTA text.
    const phone = "919773757759";
    const message = `Hi, I found your contact on Chariot Realty website and would like to inquire about properties.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const features = [
    {
      icon: Shield,
      title: "Real Listings Only",
      description: "Every property is verified by our team. No fake photos, no bait-and-switch"
    },
    {
      icon: MessageCircle,
      title: "WhatsApp Convenience",
      description: "No app downloads or endless scrolling. Just simple messaging"
    },
    {
      icon: Sparkles,
      title: "AI That Helps, Not Hypes",
      description: "Smart tech quietly supports our human advisors behind the scenes"
    },
    {
      icon: TrendingUp,
      title: "Personal Advisors",
      description: "A single point of contact who actually remembers you and your needs"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <SEO
        title="Chariot Realty | AI-Powered Real Estate in Mumbai | No Bait-and-Switch"
        description="Find verified properties in Bandra, Juhu, Andheri & more. SmartFeed delivers real listings with transparent pricing. No games, no bait-and-switch."
        schema={homeSchema}
        canonical="https://chariotrealtors.in"
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2a2826] via-[#3a3633] to-[#2a2826] text-white">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-6 bg-[#FFD300]/20 text-[#FFD300] border-[#FFD300] text-sm px-4 py-2 rounded-full">
              <Sparkles className="w-4 h-4 inline mr-2" />
              AI-Powered Real Estate
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Real Guidance.<br />
              <span className="bg-gradient-to-r from-[#FFD300] to-[#FFA500] bg-clip-text text-transparent">
                Real Homes.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-stone-300 mb-10 font-light leading-relaxed">
              Mumbai's property market is broken. We're fixing it with AI-powered transparency.
              <br />No bait-and-switch. No fake listings. Just real properties.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to={createPageUrl("SmartFeed")}>
                <Button size="lg" className="bg-gradient-to-r from-[#FFD300] to-[#FFA500] hover:from-[#FFC700] hover:to-[#FF9500] text-black font-bold text-lg px-8 py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all">
                  <Search className="mr-2 w-5 h-5" />
                  Browse SmartFeed
                </Button>
              </Link>
              <Link to={createPageUrl("Buildings")}>
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-black font-semibold text-lg px-8 py-6 rounded-2xl transition-all">
                  <Building2 className="mr-2 w-5 h-5" />
                  Explore Buildings
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-stone-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#FFD300]" />
                <span>Verified Listings</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#FFD300]" />
                <span>AI-Powered Matching</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#FFD300]" />
                <span>Transparent Pricing</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Properties (This section has been removed as per the outline's implied changes) */}

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-[#111111] mb-5 tracking-tight">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 font-light max-w-2xl mx-auto">
              Simple. Personal. Stress-free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {[
              {
                step: "1",
                title: "Tell Us What You're Looking For",
                description: "Just message us on WhatsApp — your budget, area, and what kind of vibe you want. That's all. No apps, no forms."
              },
              {
                step: "2",
                title: "We Curate & Verify Options",
                description: "Our team personally reviews listings that actually exist — filtered by your taste, not algorithms gone wild."
              },
              {
                step: "3",
                title: "You Get Your SmartFeed",
                description: "A private link with the best matching homes. No clutter. No fake listings. Just real choices."
              },
              {
                step: "4",
                title: "Visit, Decide, Move In",
                description: "We handle calls, visits, and coordination. You just focus on finding \"the one.\""
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#FFD300] to-[#FFC700] rounded-3xl flex items-center justify-center text-2xl font-bold text-black mx-auto mb-6 shadow-sm">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-[#111111] mb-4">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed font-light text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Chariot */}
      <section className="py-24 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-[#111111] mb-8 tracking-tight">
              Why Choose Chariot
            </h2>
            <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto">
              Because you deserve a home search that feels human.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-[#FFD300] hover:shadow-lg transition-all"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-[#FFD300] to-[#FFC700] rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                  <feature.icon className="w-7 h-7 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-[#111111]">{feature.title}</h3>
                <p className="text-[#3B3B3B] text-sm leading-relaxed font-light">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-16">
            <div className="inline-block bg-[#FFD300] text-black px-8 py-4 rounded-3xl">
              <p className="text-lg font-bold">
                Chariot Realty — Where AI ends, and actual care begins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Chariot */}
      <section className="py-24 bg-[#F7F7F7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-10 text-[#111111] tracking-tight">
              About Chariot Realty
            </h2>

            <div className="space-y-8 text-lg text-gray-600 leading-relaxed font-light">
              <p className="text-2xl text-[#111111] font-normal">
                Finding your space in Mumbai shouldn't feel like a job.
              </p>

              <p>
                Chariot Realty serves residential and commercial real estate with a focus on you.
                <br />
                No spam calls, no endless scrolling, no fake listings.
                <br />
                Just honest guidance, curated options, and a team that listens before showing.
              </p>

              <p>
                Behind the scenes, our smart tech quietly filters the city's chaos —
                <br />
                but in front, <span className="font-semibold text-[#111111]">you'll only feel calm, clarity, and care.</span>
              </p>

              <div className="pt-8">
                <p className="text-xl text-[#111111] font-medium italic">
                  "We're not here to sell you a property.
                  <br />
                  We're here to help you find your space in the city."
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[#FFD300] to-[#FFC700]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-black" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-black tracking-tight">
                Ready to Start?
              </h2>
            </div>
            <p className="text-black/70 text-xl mb-10 leading-relaxed font-medium">
              Connect with our AI assistant on WhatsApp.
              <br />
              Get personalized property matches within minutes.
            </p>

            <div className="space-y-5 max-w-md mx-auto mb-10">
              {['Instant AI responses', 'Only verified properties', 'No spam calls'].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-black">
                  <Check className="w-5 h-5 flex-shrink-0 font-bold" />
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={handleWhatsAppStatic} // Replaced handleWhatsAppAI with static handler
              size="lg"
              className="w-full max-w-lg mx-auto bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold h-16 px-8 rounded-2xl shadow-lg border-0 flex items-center justify-center gap-4"
            >
              <MessageCircle className="w-6 h-6" />
              <div className="text-left">
                <p className="text-lg font-bold">Chariot Realty AI</p>
                <p className="text-xs text-white/80">WhatsApp AI Assistant</p>
              </div>
            </Button>

            <div className="mt-8">
              <p className="text-sm text-black/60">
                Need human help? Call Vishal (+91 98194 71310) or Kapil (+91 97737 57759)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PropertyDetailsModal (This component has been removed as per the outline's implied changes) */}
    </div>
  );
}
