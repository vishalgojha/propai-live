import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Book, 
  Zap, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  MessageSquare,
  Users,
  Settings,
  Activity,
  FileText,
  HelpCircle,
  Mail,
  Phone,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SEO from "@/components/SEO";

export default function Docs() {
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", label: "Overview", icon: Book },
    { id: "setup", label: "10-Minute Setup", icon: Zap },
    { id: "whatsapp", label: "WhatsApp Setup", icon: MessageSquare },
    { id: "ui", label: "Role-Based UI", icon: Users },
    { id: "dataflow", label: "Data Flow", icon: Activity },
    { id: "extraction", label: "Extraction Rules", icon: FileText },
    { id: "troubleshooting", label: "Troubleshooting", icon: AlertCircle },
    { id: "faq", label: "FAQ", icon: HelpCircle },
    { id: "contact", label: "Contact & Support", icon: Mail },
  ];

  const scrollToSection = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <SEO 
        title="Documentation - PropAI Live"
        description="Complete guide to setting up and using PropAI Live - WhatsApp to deal-ready property intelligence"
      />

      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Book className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">PropAI Live Documentation</h1>
              <p className="text-sm text-slate-600">WhatsApp → Deal-ready property intelligence</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3">
            <div className="sticky top-32">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Contents</h3>
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeSection === section.id
                            ? "bg-blue-50 text-blue-600 font-semibold"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{section.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-12">

            {/* Overview */}
            <section id="overview" className="scroll-mt-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-slate-200 p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <Book className="w-6 h-6 text-blue-600" />
                  What PropAI Live Does
                </h2>
                
                <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                  PropAI Live turns messy WhatsApp broker traffic into clean, structured real-estate data in real time — without replying in groups.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Core Outcomes
                    </h3>
                    <ul className="space-y-2 text-slate-700">
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-1 text-green-600 flex-shrink-0" />
                        <span>Listings + requirements captured automatically</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 mt-1 text-green-600 flex-shrink-0" />
                        <span>Operators see live, clean inventory</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      What It Is NOT
                    </h3>
                    <ul className="space-y-2 text-slate-700">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">×</span>
                        <span>A lead owner — ownership stays with original broker</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">×</span>
                        <span>A replacement CRM (it feeds CRMs)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <Separator className="my-6" />

                <h3 className="font-bold text-slate-900 mb-4">Key Modules</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Settings className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Gateway</h4>
                      <p className="text-sm text-slate-600">Control plane + UI + webhooks</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Extractor</h4>
                      <p className="text-sm text-slate-600">Converts raw text → structured data</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* Setup */}
            <section id="setup" className="scroll-mt-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl border border-slate-200 p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-blue-600" />
                  10-Minute Setup
                </h2>

                <div className="space-y-6">
                  {[
                    { step: 1, title: "Install", cmd: "npm install -g propai" },
                    { step: 2, title: "Onboarding", cmd: "propai onboard --install-daemon" },
                    { step: 3, title: "Open Dashboard", cmd: "http://127.0.0.1:18789/propai" },
                    { step: 4, title: "Connect WhatsApp", cmd: "propai channels login whatsapp", note: "Scan QR inside dashboard" },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                        <div className="bg-slate-900 rounded-lg p-4">
                          <code className="text-green-400 text-sm font-mono">{item.cmd}</code>
                        </div>
                        {item.note && (
                          <p className="text-sm text-slate-600 mt-2">{item.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-blue-600" />
                    Health Checks
                  </h3>
                  <div className="bg-slate-900 rounded-lg p-4">
                    <code className="text-green-400 text-sm font-mono">propai logs --follow</code>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* WhatsApp Setup */}
            <section id="whatsapp" className="scroll-mt-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl border border-slate-200 p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                  WhatsApp Setup (Detailed)
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-3">1) Linking WhatsApp</h3>
                    <div className="bg-slate-900 rounded-lg p-4 mb-3">
                      <code className="text-green-400 text-sm font-mono">propai channels login whatsapp</code>
                    </div>
                    <p className="text-slate-700 mb-3">Then open dashboard and scan QR.</p>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <p className="font-semibold text-slate-900 mb-2">Expected:</p>
                      <ul className="space-y-1 text-slate-700 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          WhatsApp says "Linked"
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          Dashboard shows "Linked"
                        </li>
                      </ul>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-bold text-slate-900 mb-3">2) Common WhatsApp Issues</h3>
                    
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 mb-4">
                      <h4 className="font-semibold text-slate-900 mb-2">Issue: Login fails (code 401/515)</h4>
                      <p className="text-slate-700 text-sm mb-3">WhatsApp sometimes forces reconnect. Just re-run:</p>
                      <div className="bg-slate-900 rounded-lg p-3">
                        <code className="text-green-400 text-sm font-mono">propai channels login whatsapp</code>
                      </div>
                    </div>

                    <p className="text-slate-600 text-sm">
                      If it keeps failing, look for QR errors and try re-login.
                    </p>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* Role-Based UI */}
            <section id="ui" className="scroll-mt-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl border border-slate-200 p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  Role-Based UI
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-3">Owner Dashboard</h3>
                    <div className="bg-slate-900 rounded-lg p-4 mb-4">
                      <code className="text-green-400 text-sm font-mono">http://127.0.0.1:18789/propai?role=owner</code>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-900 mb-2">Features:</h4>
                        <ul className="space-y-1 text-slate-700 text-sm">
                          <li>• Listings & Requirements</li>
                          <li>• Team Ops</li>
                          <li>• Agent Settings</li>
                          <li>• Logs & Errors</li>
                        </ul>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-900 mb-2">System Status:</h4>
                        <p className="text-slate-700 text-sm">Last extraction, live capture counts</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-bold text-slate-900 mb-3">Team UI</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-blue-600 mt-1" />
                        <div>
                          <h4 className="font-semibold text-slate-900">Listings & Requirements</h4>
                          <p className="text-sm text-slate-600">Clean data view. Filter by location, budget, rent/sale.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Activity className="w-5 h-5 text-purple-600 mt-1" />
                        <div>
                          <h4 className="font-semibold text-slate-900">Live Feed</h4>
                          <p className="text-sm text-slate-600">Real-time stream of new listings/requirements.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Settings className="w-5 h-5 text-green-600 mt-1" />
                        <div>
                          <h4 className="font-semibold text-slate-900">Agent Settings</h4>
                          <p className="text-sm text-slate-600">Control areas, listening rules, group allowlist.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* Data Flow */}
            <section id="dataflow" className="scroll-mt-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl border border-slate-200 p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <Activity className="w-6 h-6 text-blue-600" />
                  Data Flow (How It Works)
                </h2>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-200">
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-white rounded-lg px-6 py-4 shadow-sm border border-slate-200">
                      <p className="font-bold text-slate-900">WhatsApp Groups</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-blue-600 rotate-90" />
                    <div className="bg-white rounded-lg px-6 py-4 shadow-sm border border-slate-200">
                      <p className="font-bold text-slate-900">Silent Listener</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-blue-600 rotate-90" />
                    <div className="bg-white rounded-lg px-6 py-4 shadow-sm border border-slate-200">
                      <p className="font-bold text-slate-900">Extractor</p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-blue-600 rotate-90" />
                    <div className="bg-white rounded-lg px-6 py-4 shadow-sm border border-slate-200">
                      <p className="font-bold text-slate-900">Dashboard + Webhook</p>
                    </div>
                  </div>

                  <div className="mt-6 bg-white rounded-lg p-4">
                    <p className="text-sm font-bold text-slate-900 mb-2">Key Rule:</p>
                    <p className="text-sm text-slate-700 italic">Silent listening only — no group replies</p>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* Extraction Rules */}
            <section id="extraction" className="scroll-mt-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl border border-slate-200 p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Extraction Rules (Broker Slang)
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-3">What It Extracts:</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {['transaction_type → rent | sale', 'location', 'price / rent', 'confidence score'].map((item) => (
                        <div key={item} className="flex items-center gap-2 bg-slate-50 rounded-lg px-4 py-3">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-slate-700 font-mono">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 mb-3">Handles Common Slang:</h3>
                    <div className="space-y-2">
                      <div className="bg-slate-50 rounded-lg px-4 py-3">
                        <span className="text-slate-700">"nego" → </span>
                        <span className="font-mono text-blue-600">negotiable</span>
                      </div>
                      <div className="bg-slate-50 rounded-lg px-4 py-3">
                        <span className="text-slate-700">"1L" → </span>
                        <span className="font-mono text-blue-600">100,000</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-bold text-slate-900 mb-3">Example Output:</h3>
                    <div className="bg-slate-900 rounded-lg p-6 overflow-x-auto">
                      <pre className="text-green-400 text-sm font-mono">
{`{
  "group": "Mumbai Brokers West",
  "timestamp": "2026-02-08T18:40:12Z",
  "raw_text": "2bhk near Carter Rd budget 5cr",
  "extracted": {
    "transaction_type": "sale",
    "property_type": "2bhk",
    "price": 50000000,
    "confidence": 0.82
  }
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* Troubleshooting */}
            <section id="troubleshooting" className="scroll-mt-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-xl border border-slate-200 p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-blue-600" />
                  Troubleshooting
                </h2>

                <div className="space-y-6">
                  <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                    <h3 className="font-bold text-slate-900 mb-3">Problem: No data appears</h3>
                    <ul className="space-y-2 text-slate-700">
                      <li className="flex items-start gap-2">
                        <span className="font-bold">1.</span>
                        <span>Confirm WhatsApp linked</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">2.</span>
                        <div className="flex-1">
                          <span>Check logs:</span>
                          <div className="bg-slate-900 rounded-lg p-3 mt-2">
                            <code className="text-green-400 text-sm font-mono">propai logs --follow</code>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
                    <h3 className="font-bold text-slate-900 mb-3">Problem: Gateway not loading</h3>
                    <div className="space-y-3">
                      <div className="bg-slate-900 rounded-lg p-3">
                        <code className="text-green-400 text-sm font-mono">propai status</code>
                      </div>
                      <div className="bg-slate-900 rounded-lg p-3">
                        <code className="text-green-400 text-sm font-mono">systemctl --user restart propai-gateway.service</code>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* FAQ */}
            <section id="faq" className="scroll-mt-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white rounded-xl border border-slate-200 p-8"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <HelpCircle className="w-6 h-6 text-blue-600" />
                  FAQ (Broker-Friendly)
                </h2>

                <div className="space-y-6">
                  {[
                    { q: "Does it reply in groups?", a: "No. It listens silently." },
                    { q: "Does it steal leads?", a: "No. Listing stays with broker." },
                    { q: "Can it work for multiple team members?", a: "Yes. Assign internally via Team Ops." },
                    { q: "Do I need a CRM?", a: "No. But webhooks let you connect to one." },
                  ].map((faq, idx) => (
                    <div key={idx} className="border-l-4 border-blue-600 bg-blue-50 rounded-r-lg p-4">
                      <h3 className="font-bold text-slate-900 mb-2">Q: {faq.q}</h3>
                      <p className="text-slate-700"><strong>A:</strong> {faq.a}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* Contact */}
            <section id="contact" className="scroll-mt-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl border border-blue-700 p-8 text-white"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Mail className="w-6 h-6" />
                  Contact & Support
                </h2>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                    <Globe className="w-8 h-8 mb-3" />
                    <h3 className="font-bold mb-2">Website</h3>
                    <a href="https://propai.live" target="_blank" rel="noopener noreferrer" className="text-blue-200 hover:text-white transition-colors">
                      propai.live
                    </a>
                  </div>

                  <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                    <Mail className="w-8 h-8 mb-3" />
                    <h3 className="font-bold mb-2">Support Email</h3>
                    <a href="mailto:hello@propai.live" className="text-blue-200 hover:text-white transition-colors">
                      hello@propai.live
                    </a>
                  </div>

                  <div className="bg-white/10 backdrop-blur rounded-lg p-6">
                    <Phone className="w-8 h-8 mb-3" />
                    <h3 className="font-bold mb-2">Contact</h3>
                    <p className="text-sm">Vishal Ojha</p>
                    <a href="tel:+919820056180" className="text-blue-200 hover:text-white transition-colors">
                      +91 98200 56180
                    </a>
                  </div>
                </div>
              </motion.div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}