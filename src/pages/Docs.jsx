import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Download, 
  Terminal, 
  Layout, 
  FileText, 
  AlertCircle, 
  GitBranch, 
  HelpCircle,
  BookOpen,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { toast, Toaster } from "sonner";

export default function Docs() {
  const [activeSection, setActiveSection] = useState("install");

  const navItems = [
    { id: "install", label: "Install", icon: Download },
    { id: "setup", label: "Setup Wizard", icon: Terminal },
    { id: "cli", label: "CLI Commands", icon: Terminal },
    { id: "dashboard", label: "Local Dashboard", icon: Layout },
    { id: "api-keys", label: "API Keys", icon: FileText },
    { id: "safety", label: "Safety Rules", icon: AlertCircle },
    { id: "data", label: "Where Data Lives", icon: GitBranch },
    { id: "troubleshooting", label: "Troubleshooting", icon: HelpCircle },
  ];

  const scrollToSection = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" richColors closeButton />

      <SEO
        title="PropAI Live Documentation - Setup & Usage Guide"
        description="Complete documentation for PropAI Live. Learn how to set up, use, and optimize the AI-powered property intelligence platform."
        canonical={typeof window !== 'undefined' ? `${window.location.origin}/docs` : 'https://propai.live/docs'}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 bg-blue-50 rounded-2xl px-6 py-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-bold text-blue-900">PropAI Docs — Quick Guide</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Everything you need to know
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            PropAI Live is a simple CLI for brokers. Set up AI workflows without touching code or folders.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3">
            <div className="sticky top-32">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Contents</h3>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeSection === item.id
                            ? "bg-blue-50 text-blue-600 font-semibold"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-12">

            {/* Install */}
            <section id="install" className="scroll-mt-8">
              <div className="bg-white rounded-2xl p-8 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">1) Install</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Option A: One-click (Windows)</h3>
                      <a
                        href="https://github.com/vishalgojha/propai-tech/releases/latest/download/PropAI-Setup.exe"
                        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                        download
                      >
                        <Download className="w-4 h-4" />
                        Download PropAI Setup
                      </a>
                      <p className="text-xs text-slate-500 mt-2">
                        https://github.com/vishalgojha/propai-tech/releases/latest/download/PropAI-Setup.exe
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Option B: CLI (All platforms)</h3>
                      <div className="bg-slate-900 rounded-lg p-4 relative">
                        <code className="text-green-400 font-mono">npm install -g propai@latest</code>
                        <button
                          onClick={() => copyToClipboard('npm install -g propai@latest')}
                          className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Setup Wizard */}
            <section id="setup" className="scroll-mt-8">
              <div className="bg-white rounded-2xl p-8 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                    <Terminal className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">2) Setup Wizard</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 mb-4">Run this once after installing:</p>
                  
                  <div className="bg-slate-900 rounded-lg p-4 mb-4 relative">
                    <code className="text-green-400 font-mono">propai setup</code>
                    <button
                      onClick={() => copyToClipboard('propai setup')}
                      className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <p className="text-slate-700">The wizard will:</p>
                  <ul className="mt-2 space-y-1">
                    <li>Save your API key safely</li>
                    <li>Verify your system is ready</li>
                    <li>Create necessary config files</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* CLI Commands */}
            <section id="cli" className="scroll-mt-8">
              <div className="bg-white rounded-2xl p-8 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                    <Terminal className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">3) CLI Commands</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-900">propai setup</h3>
                      <div className="bg-slate-900 rounded-lg p-4 relative">
                        <code className="text-green-400 font-mono">propai setup</code>
                        <button
                          onClick={() => copyToClipboard('propai setup')}
                          className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 mt-2">Guided onboarding wizard</p>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">propai doctor</h3>
                      <div className="bg-slate-900 rounded-lg p-4 relative">
                        <code className="text-green-400 font-mono">propai doctor</code>
                        <button
                          onClick={() => copyToClipboard('propai doctor')}
                          className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 mt-2">Checks your system and tells you exactly how to fix issues</p>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">propai where-am-i</h3>
                      <div className="bg-slate-900 rounded-lg p-4 relative">
                        <code className="text-green-400 font-mono">propai where-am-i</code>
                        <button
                          onClick={() => copyToClipboard('propai where-am-i')}
                          className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 mt-2">Verifies you're in a safe folder (not source code)</p>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">propai gateway start --foreground</h3>
                      <div className="bg-slate-900 rounded-lg p-4 relative">
                        <code className="text-green-400 font-mono">propai gateway start --foreground</code>
                        <button
                          onClick={() => copyToClipboard('propai gateway start --foreground')}
                          className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <Copy className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 mt-2">Starts PropAI on this device</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Local Dashboard */}
            <section id="dashboard" className="scroll-mt-8">
              <div className="bg-white rounded-2xl p-8 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Layout className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">4) Local Dashboard</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 mb-4">Once running, open:</p>

                  <div className="bg-slate-900 rounded-lg p-4 mb-4 relative">
                    <code className="text-green-400 font-mono">http://127.0.0.1:18789</code>
                    <button
                      onClick={() => copyToClipboard('http://127.0.0.1:18789')}
                      className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <p className="text-slate-700">You'll see:</p>
                  <ul className="mt-2 space-y-1">
                    <li>Messages processed</li>
                    <li>Properties extracted</li>
                    <li>Live activity feed</li>
                    <li>System health status</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* API Keys */}
            <section id="api-keys" className="scroll-mt-8">
              <div className="bg-white rounded-2xl p-8 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">5) API Keys</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 mb-4">You'll need one API key:</p>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-900">OpenRouter (Recommended)</h3>
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        https://openrouter.ai/keys
                      </a>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">xAI (Alternative)</h3>
                      <a
                        href="https://console.x.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        https://console.x.ai
                      </a>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">Anthropic (Alternative)</h3>
                      <a
                        href="https://console.anthropic.com/settings/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        https://console.anthropic.com/settings/keys
                      </a>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-900">
                      <strong>💰 Cost:</strong> Typical usage costs $0.01-$0.05 per property extraction.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Safety Rules */}
            <section id="safety" className="scroll-mt-8">
              <div className="bg-white rounded-2xl p-8 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">6) Safety Rules</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <p className="text-sm text-red-900">
                      <strong>⚠️ Important:</strong> PropAI should not be run inside source code folders.
                    </p>
                  </div>

                  <p className="text-slate-700 mb-4">If you see this warning:</p>

                  <div className="bg-slate-900 rounded-lg p-4 mb-4">
                    <code className="text-red-400 font-mono">You're inside source code. PropAI should not be run here.</code>
                  </div>

                  <p className="text-slate-700 mb-2"><strong>Fix it:</strong></p>
                  <div className="bg-slate-900 rounded-lg p-4 relative">
                    <code className="text-green-400 font-mono">cd ~</code>
                    <button
                      onClick={() => copyToClipboard('cd ~')}
                      className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <p className="text-sm text-slate-600 mt-4">
                    This prevents PropAI from accidentally interfering with your development environment.
                  </p>
                </div>
              </div>
            </section>

            {/* Where Data Lives */}
            <section id="data" className="scroll-mt-8">
              <div className="bg-white rounded-2xl p-8 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-cyan-600 rounded-xl flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">7) Where Your Data Lives</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 mb-4">All runtime data is stored safely in:</p>

                  <div className="bg-slate-900 rounded-lg p-4 mb-4 relative">
                    <code className="text-green-400 font-mono">~/.propai/</code>
                    <button
                      onClick={() => copyToClipboard('~/.propai/')}
                      className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <p className="text-slate-700">This includes:</p>
                  <ul className="mt-2 space-y-1">
                    <li>Configuration files</li>
                    <li>API keys (encrypted)</li>
                    <li>Local database</li>
                    <li>Activity logs</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Troubleshooting */}
            <section id="troubleshooting" className="scroll-mt-8">
              <div className="bg-white rounded-2xl p-8 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">8) Troubleshooting</h2>
                </div>
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 mb-4"><strong>Run this first:</strong></p>

                  <div className="bg-slate-900 rounded-lg p-4 mb-4 relative">
                    <code className="text-green-400 font-mono">propai doctor</code>
                    <button
                      onClick={() => copyToClipboard('propai doctor')}
                      className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <p className="text-slate-700 mb-2">It will show:</p>
                  <ul className="space-y-1">
                    <li>✅ What works</li>
                    <li>❌ What's broken</li>
                    <li>🛠 How to fix it</li>
                  </ul>

                  <div className="mt-6 space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">Common Issues</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Gateway won't start</p>
                          <p className="text-sm text-slate-600">Run <code className="bg-slate-100 px-2 py-1 rounded">propai doctor</code> for diagnostics</p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900">API key errors</p>
                          <p className="text-sm text-slate-600">Re-run <code className="bg-slate-100 px-2 py-1 rounded">propai setup</code> to update</p>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900">Properties not appearing</p>
                          <p className="text-sm text-slate-600">Check logs with <code className="bg-slate-100 px-2 py-1 rounded">propai logs</code></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}