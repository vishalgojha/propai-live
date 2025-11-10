import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown, ChevronUp, HelpCircle, Search, Shield,
  Zap, Building2, MessageCircle, TrendingUp, Eye, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SEO from "../components/SEO";

export default function FAQ() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqCategories = [
    {
      category: "About PropAI",
      icon: Zap,
      questions: [
        {
          q: "What is PropAI Live?",
          a: "PropAI Live is an AI-powered real estate intelligence platform for Mumbai. We turn messy WhatsApp broker messages into structured, searchable property listings in real-time. Think of us as Google for Mumbai real estate—but with Building-Level Intelligence that understands context, pricing, and market patterns."
        },
        {
          q: "How is PropAI different from MagicBricks or Housing.com?",
          a: "Traditional portals are static databases with 10,000 stale listings. PropAI is a living intelligence system. We have Building Memory™ (contextual data for every building), BrokerTrust™ scoring (quality-ranked listings), and AI Deals Radar (spots underpriced properties automatically). Plus, our data updates in seconds, not weeks."
        },
        {
          q: "Is PropAI free to use?",
          a: "Yes! SmartFeed, property browsing, and our AI assistant are 100% free for users. We're building the future of real estate search, and we want everyone to experience it."
        }
      ]
    },
    {
      category: "Properties & Listings",
      icon: Building2,
      questions: [
        {
          q: "Why don't PropAI listings show photos?",
          a: "PropAI intentionally avoids photos because our listings come directly from brokers' WhatsApp messages in real-time—often within seconds of being posted. We prioritize fresh, accurate data over static images. This ensures you see live inventory, not recycled listings with misleading photos. Photos are added automatically when brokers share them, but speed and authenticity come first."
        },
        {
          q: "Does PropAI plan to add images later?",
          a: "Photos will appear automatically when brokers share them via WhatsApp. However, our core philosophy is data-first: we'd rather show you a property that's actually available (without photos) than a beautiful listing that was rented 3 months ago. Real-time accuracy beats pretty pictures."
        },
        {
          q: "How fresh is the property data?",
          a: "Listings update in real-time as brokers send WhatsApp messages—typically within 10-30 seconds. SmartFeed auto-refreshes every 10 seconds, so you're always seeing the latest inventory. Compare that to portals where listings sit for weeks or months."
        },
        {
          q: "What does 'BrokerTrust™' mean?",
          a: "BrokerTrust™ is our AI quality score for brokers (0-100). It's calculated from duplicate rates, response times, data accuracy, and availability confirmations. Properties from high-trust brokers (85+) are ranked higher in SmartFeed, so you see reliable listings first. It's not a judgment—it's a filter for data quality."
        },
        {
          q: "Can I contact brokers directly?",
          a: "Yes! Every listing has a WhatsApp button that connects you directly to the broker (or our PropAI team if broker contact isn't available). Messages are pre-filled with property details for instant follow-up."
        }
      ]
    },
    {
      category: "Building Intelligence",
      icon: Building2,
      questions: [
        {
          q: "What is Building Memory™?",
          a: "Building Memory™ turns every building into a knowledge object. As brokers list properties, we automatically learn: average pricing by BHK, broker activity patterns, tenant profiles, amenities, vibes, and market trends. You see this context when browsing—like \"Oberoi Sky Heights: 47 listings, ₹2.34L avg for 2BHK, High Activity.\""
        },
        {
          q: "How accurate is building data?",
          a: "Building intelligence is auto-learned from parsed WhatsApp messages and enriched via web research. Accuracy improves with every listing. Think of it as a self-learning Wikipedia for Mumbai buildings—constantly updated, never static."
        },
        {
          q: "Can I view all properties in a specific building?",
          a: "Yes! Click any building name on a property card to see its full profile: all active listings, historical pricing, developer info, amenities, and Building Memory™ insights."
        }
      ]
    },
    {
      category: "AI & Technology",
      icon: Zap,
      questions: [
        {
          q: "How does the AI property parser work?",
          a: "Brokers send raw WhatsApp messages like \"2bhk sf mod kit 2cp Pali Hill 80L\". Our AI extracts: BHK, furnishing, parking, location, price, and links it to the correct building. Then it auto-generates human-readable titles and descriptions. This happens in under 5 seconds."
        },
        {
          q: "What is AI Deals Radar?",
          a: "Deals Radar automatically flags underpriced properties (15%+ below building average), price drops, and properties that match active requirements. It's like having a 24/7 analyst watching the market for you."
        },
        {
          q: "Can I chat with the AI assistant?",
          a: "Yes! Our AI assistant understands natural language queries like \"3 BHK near Bandra Gymkhana under ₹3 Cr\" and returns contextual results. It learns from your searches to improve recommendations. Available on the homepage and SmartFeed."
        },
        {
          q: "What is 'Semantic Search'?",
          a: "Unlike keyword matching (\"Bandra\" + \"2 BHK\"), semantic search understands context. \"Modern flat near Pali Hill with balcony\" interprets intent, location vibes, and preferences—like Google's search intelligence applied to real estate."
        }
      ]
    },
    {
      category: "For Brokers",
      icon: MessageCircle,
      questions: [
        {
          q: "How do brokers list properties on PropAI?",
          a: "Brokers send WhatsApp messages to our AI agent (WhatsApp → PropAI parser). The system automatically extracts property details, links to buildings, calculates BrokerTrust scores, and publishes to SmartFeed. No manual data entry required."
        },
        {
          q: "What is BrokerTrust™ scoring?",
          a: "BrokerTrust™ (0-100) measures reliability based on: duplicate rate, response time, data accuracy, and availability confirmations. High-trust brokers get better SmartFeed ranking. Starting score: 50. It improves with consistent quality."
        },
        {
          q: "Can brokers see their performance metrics?",
          a: "Yes! Brokers with accounts can view their BrokerTrust score, listing count, team members, and performance insights on their profile page."
        },
        {
          q: "How do I connect my WhatsApp to PropAI?",
          a: "Click 'Connect WhatsApp AI' on the homepage, authenticate with your PropAI account, and start sending property messages to our AI agent. Properties go live in seconds."
        }
      ]
    },
    {
      category: "Features & Tools",
      icon: TrendingUp,
      questions: [
        {
          q: "What is Expat Mode™?",
          a: "Expat Mode filters for: fully furnished properties + expat-friendly buildings + good amenities. One toggle gives international movers a curated feed designed for their needs—no manual filtering required."
        },
        {
          q: "Can I save properties or create watchlists?",
          a: "Not yet! We're prioritizing real-time data infrastructure first. Saved properties and watchlists are coming soon—along with email alerts for price drops and new matches."
        },
        {
          q: "What is SmartFeed ranking?",
          a: "SmartFeed ranks properties by: BrokerTrust score (default), recency, price, or user preferences. High-trust listings appear first to ensure you see quality data. You can switch to 'Latest' or 'Price' sorting anytime."
        },
        {
          q: "Can I search by specific buildings?",
          a: "Yes! Use the search bar in SmartFeed or visit the Buildings page to browse our directory of 250+ mapped buildings with full intelligence profiles."
        }
      ]
    },
    {
      category: "Privacy & Security",
      icon: Shield,
      questions: [
        {
          q: "Is my data safe on PropAI?",
          a: "Yes. We use industry-standard encryption for all user data. Browsing is anonymous unless you log in. WhatsApp connections are authenticated via secure OAuth. We never share user data with third parties."
        },
        {
          q: "Do you sell user data to brokers?",
          a: "Never. PropAI is a platform, not a lead marketplace. Brokers only see inquiries you explicitly initiate via WhatsApp contact buttons."
        },
        {
          q: "Can I browse properties without logging in?",
          a: "Yes! SmartFeed, property details, and building profiles are 100% public. Login is only required for AI assistant chat history and saving preferences."
        }
      ]
    }
  ];

  // Generate FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqCategories.flatMap(cat => 
      cat.questions.map(qa => ({
        "@type": "Question",
        "name": qa.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": qa.a
        }
      }))
    )
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": window.location.origin
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "FAQ",
        "item": window.location.href
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <SEO
        title="FAQ - Frequently Asked Questions | PropAI Live"
        description="Common questions about PropAI Live: How does Building Memory™ work? Why no photos? What is BrokerTrust™? Learn about our AI-powered Mumbai real estate platform."
        schema={[faqSchema]}
        breadcrumbs={breadcrumbSchema}
        canonical={window.location.href}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate(createPageUrl("Home"))}
            variant="ghost"
            className="mb-6 text-slate-600 hover:text-slate-900"
          >
            ← Back to Home
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-md">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h1>
              <p className="text-sm text-slate-600">Everything you need to know about PropAI Live</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-8 p-4 bg-white/80 backdrop-blur-xl rounded-2xl border border-purple-200">
          <p className="text-sm font-semibold text-slate-700 mb-3">Quick Jump:</p>
          <div className="flex flex-wrap gap-2">
            {faqCategories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <Button
                  key={idx}
                  onClick={() => {
                    const element = document.getElementById(`category-${idx}`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  variant="outline"
                  size="sm"
                  className="border-purple-200 hover:bg-purple-50 text-slate-700 text-xs"
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {cat.category}
                </Button>
              );
            })}
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {faqCategories.map((category, catIdx) => {
            const Icon = category.icon;
            return (
              <div key={catIdx} id={`category-${catIdx}`} className="scroll-mt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{category.category}</h2>
                </div>

                <div className="space-y-3">
                  {category.questions.map((qa, qIdx) => {
                    const globalIndex = catIdx * 100 + qIdx;
                    const isOpen = openIndex === globalIndex;

                    return (
                      <motion.div
                        key={qIdx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: qIdx * 0.05 }}
                        className="bg-white/80 backdrop-blur-xl rounded-2xl border border-purple-200 overflow-hidden hover:shadow-md transition-all"
                      >
                        <button
                          onClick={() => toggleQuestion(globalIndex)}
                          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-purple-50/50 transition-colors"
                        >
                          <span className="font-semibold text-slate-900 pr-4">{qa.q}</span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-purple-600 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                          )}
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className="px-6 pb-4 text-slate-700 leading-relaxed">
                                {qa.a}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Still Have Questions CTA */}
        <div className="mt-12 p-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl text-white text-center">
          <h3 className="text-2xl font-bold mb-3">Still Have Questions?</h3>
          <p className="text-purple-100 mb-6">
            Chat with our AI assistant or reach out directly—we're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate(createPageUrl("Home"))}
              className="bg-white text-purple-700 hover:bg-purple-50 font-semibold"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat with AI Assistant
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("SmartFeed"))}
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              <Search className="w-4 h-4 mr-2" />
              Browse Properties
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}