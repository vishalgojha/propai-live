import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import SEO from "../components/SEO";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-sky-50">
      <SEO
        title="Privacy Policy | PropAI Live"
        description="Learn how PropAI Live collects, uses, and protects your personal information. Our commitment to data privacy and security."
        canonical="https://propai.live/privacy-policy"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Button
          onClick={() => navigate(createPageUrl("Home"))}
          variant="ghost"
          className="mb-8 hover:bg-white/80"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-xl border border-sky-200 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">Privacy Policy</h1>
              <p className="text-slate-600 mt-1">Last updated: January 2025</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-xl border border-sky-200 prose prose-slate max-w-none">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Introduction</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            PropAI Live ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered real estate intelligence platform.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Information We Collect</h2>
          
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Personal Information</h3>
          <p className="text-slate-700 leading-relaxed mb-4">
            We may collect personal information that you voluntarily provide to us, including:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-6">
            <li>Name, email address, and phone number</li>
            <li>Property preferences and search criteria</li>
            <li>Communication preferences</li>
            <li>WhatsApp messages when you interact with our AI agents</li>
          </ul>

          <h3 className="text-xl font-semibold text-slate-900 mb-3">Automatically Collected Information</h3>
          <p className="text-slate-700 leading-relaxed mb-4">
            When you access our platform, we automatically collect certain information, including:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-6">
            <li>Device information (browser type, operating system)</li>
            <li>IP address and location data</li>
            <li>Pages viewed and time spent on pages</li>
            <li>Property listings viewed and interactions</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">How We Use Your Information</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-6">
            <li>Provide and maintain our AI-powered property matching service</li>
            <li>Process your property search queries and requirements</li>
            <li>Send you property recommendations and updates</li>
            <li>Improve our AI algorithms and platform features</li>
            <li>Communicate with you about properties and services</li>
            <li>Analyze usage patterns to enhance user experience</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">AI and Data Processing</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            PropAI Live uses artificial intelligence to analyze property data, broker information, and user preferences. Your interactions with our platform help train and improve our AI models. We use this data to provide:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-6">
            <li>Building-level intelligence and pricing insights</li>
            <li>Broker trust scoring and verification</li>
            <li>Smart property matching and recommendations</li>
            <li>AI-generated property descriptions and summaries</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Information Sharing</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            We may share your information with:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-6">
            <li><strong>Property brokers:</strong> When you express interest in a property, we share your contact information with the relevant broker</li>
            <li><strong>Service providers:</strong> Third-party vendors who assist in operating our platform (hosting, analytics, AI services)</li>
            <li><strong>Legal compliance:</strong> When required by law or to protect our rights</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mb-6">
            We do not sell your personal information to third parties.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">WhatsApp Integration</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            When you interact with our AI agents via WhatsApp, your messages are processed to understand your property requirements and provide relevant recommendations. We store conversation history to improve service quality and provide context for future interactions.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Data Security</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Your Rights</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-6">
            <li>Access and receive a copy of your personal information</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Request deletion of your personal information</li>
            <li>Opt-out of marketing communications</li>
            <li>Withdraw consent for data processing</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Cookies and Tracking</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            We use cookies and similar tracking technologies to enhance your experience, analyze usage, and deliver personalized content. You can control cookies through your browser settings.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Children's Privacy</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            Our platform is not intended for users under the age of 18. We do not knowingly collect personal information from children.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Changes to This Policy</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Contact Us</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            If you have questions about this Privacy Policy or our privacy practices, please contact us:
          </p>
          <div className="bg-sky-50 rounded-2xl p-6 border border-sky-200">
            <p className="text-slate-900 font-semibold mb-2">PropAI Live</p>
            <p className="text-slate-700">Email: <a href="mailto:hello@propai.live" className="text-sky-600 hover:text-sky-700">hello@propai.live</a></p>
            <p className="text-slate-700">Location: Mumbai, Maharashtra, India</p>
          </div>
        </div>
      </div>
    </div>
  );
}