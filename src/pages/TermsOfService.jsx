import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import SEO from "../components/SEO";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-sky-50">
      <SEO
        title="Terms of Service | PropAI Live"
        description="Terms and conditions for using PropAI Live's AI-powered real estate platform. User agreements and service guidelines."
        canonical="https://propai.live/terms-of-service"
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
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">Terms of Service</h1>
              <p className="text-slate-600 mt-1">Last updated: January 2025</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-xl border border-sky-200 prose prose-slate max-w-none">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Acceptance of Terms</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            By accessing or using PropAI Live's platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Description of Service</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            PropAI Live is an AI-powered real estate intelligence platform that provides property listings, building intelligence, broker information, and smart matching services for Mumbai real estate. Our platform uses artificial intelligence to analyze property data and provide insights.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">User Accounts</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            To access certain features, you may need to create an account. You agree to:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-6">
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized use</li>
            <li>Be responsible for all activities under your account</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Acceptable Use</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            You agree not to:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-6">
            <li>Use the platform for any illegal or unauthorized purpose</li>
            <li>Scrape, copy, or download property data for commercial use without permission</li>
            <li>Interfere with or disrupt the platform's operation</li>
            <li>Impersonate others or provide false information</li>
            <li>Upload malicious code or engage in harmful activities</li>
            <li>Spam brokers or users with unsolicited communications</li>
            <li>Manipulate or attempt to manipulate AI algorithms</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Property Listings</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            Property listings on PropAI Live are provided by external brokers and property owners. While we use AI to verify and score listings, we do not guarantee the accuracy, completeness, or availability of any property. Users should independently verify all property details before making decisions.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Broker Trust Score</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            Our Broker Trust Score is an AI-calculated metric based on various factors including duplicate rates, response times, and listing quality. This score is for informational purposes only and does not constitute a guarantee of broker reliability or property authenticity.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">AI-Generated Content</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            PropAI Live uses artificial intelligence to generate property descriptions, building summaries, and market insights. While we strive for accuracy, AI-generated content may contain errors. Users should verify important information independently.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Third-Party Services</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            Our platform integrates with third-party services including WhatsApp for communication. Your use of these services is subject to their respective terms and conditions. We are not responsible for third-party services or content.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Intellectual Property</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            All content, features, and functionality on PropAI Live (including but not limited to AI algorithms, building intelligence data, user interface, and design) are owned by PropAI Live and protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our permission.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Disclaimers</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            <strong>NO WARRANTY:</strong> The platform is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or implied.
          </p>
          <p className="text-slate-700 leading-relaxed mb-6">
            We do not warrant that the platform will be uninterrupted, error-free, secure, or that AI predictions will be accurate. Real estate transactions involve risk, and users should conduct their own due diligence.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Limitation of Liability</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            To the maximum extent permitted by law, PropAI Live shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the platform, including but not limited to financial losses from property transactions.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Indemnification</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            You agree to indemnify and hold PropAI Live harmless from any claims, damages, losses, or expenses (including legal fees) arising from your violation of these Terms or your use of the platform.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Termination</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            We reserve the right to suspend or terminate your access to the platform at any time, with or without cause or notice, for violation of these Terms or any other reason.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Modifications to Terms</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            We may modify these Terms at any time. Material changes will be notified through the platform or via email. Continued use of the platform after changes constitutes acceptance of the new Terms.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Governing Law</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Contact Information</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            For questions about these Terms of Service, please contact us:
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