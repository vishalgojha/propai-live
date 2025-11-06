import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import SEO from "../components/SEO";

export default function Disclaimer() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-sky-50">
      <SEO
        title="Disclaimer | PropAI Live"
        description="Important disclaimers about PropAI Live's AI-powered real estate platform. Information about data accuracy and user responsibility."
        canonical="https://propai.live/disclaimer"
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
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Disclaimer</h1>
              <p className="text-slate-600 mt-1">Last updated: January 2025</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-xl border border-sky-200 prose prose-slate max-w-none">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">General Information</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            PropAI Live is an AI-powered property intelligence platform that aggregates real estate data from various sources. The information provided on this platform is for general informational purposes only and should not be construed as professional advice.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">No Professional Advice</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            The content on PropAI Live, including property listings, building intelligence, pricing insights, and AI-generated recommendations, does not constitute professional real estate, financial, legal, or investment advice. Users should consult with qualified professionals before making any real estate decisions.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">AI-Generated Content Limitations</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            PropAI Live uses artificial intelligence to:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-6">
            <li>Generate property descriptions and summaries</li>
            <li>Calculate building intelligence metrics</li>
            <li>Score broker trustworthiness</li>
            <li>Provide market insights and pricing trends</li>
            <li>Match properties with user requirements</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mb-6">
            While we strive for accuracy, AI-generated content may contain errors, inaccuracies, or outdated information. All AI predictions and recommendations are probabilistic and should be independently verified.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Third-Party Property Listings</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            Property listings displayed on PropAI Live are sourced from external brokers and property owners. We do not own, manage, or have direct control over these properties. PropAI Live:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-6">
            <li>Does not verify the legal ownership or status of listed properties</li>
            <li>Does not guarantee property availability, pricing, or condition</li>
            <li>Does not endorse any specific property, broker, or builder</li>
            <li>Is not responsible for transactions between users and brokers</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Broker Trust Score Disclaimer</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            The Broker Trust Score is an AI-calculated metric based on factors such as listing duplicate rates, response times, photo sharing, and historical activity. This score is provided for informational purposes only and does not:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-6">
            <li>Guarantee broker reliability or honesty</li>
            <li>Verify broker credentials or licensing</li>
            <li>Constitute a recommendation or endorsement</li>
            <li>Replace the need for independent verification</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Building Intelligence Data</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            Building-level intelligence, including average prices, market activity, amenities, and vibes, is derived from:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-6">
            <li>Aggregated property listings from brokers</li>
            <li>Publicly available information from the web</li>
            <li>AI analysis of patterns and trends</li>
            <li>User-submitted data and feedback</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mb-6">
            This data may be incomplete, outdated, or inaccurate. Market conditions change rapidly, and historical data does not guarantee future performance.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">No Warranty on Data Accuracy</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            While we implement quality controls and AI verification, PropAI Live does not warrant the accuracy, completeness, timeliness, or reliability of any information on the platform. Property data may contain:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-6">
            <li>Typographical errors from broker messages</li>
            <li>Outdated pricing or availability information</li>
            <li>Duplicate listings despite our detection systems</li>
            <li>Incorrect location or building details</li>
            <li>Misrepresented amenities or features</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">User Responsibility</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            Users are responsible for:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-6">
            <li>Independently verifying all property information</li>
            <li>Conducting physical inspections of properties</li>
            <li>Verifying broker credentials and licensing</li>
            <li>Reviewing legal documents with a qualified attorney</li>
            <li>Performing financial due diligence</li>
            <li>Understanding market conditions and risks</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Market Volatility</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            Mumbai real estate market is subject to rapid changes due to economic conditions, regulatory changes, and market dynamics. Pricing trends, demand patterns, and property values can fluctuate significantly. Historical data and AI predictions should not be relied upon as indicators of future performance.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">External Links</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            PropAI Live may contain links to external websites or connect you with third-party services (brokers, WhatsApp, social media). We are not responsible for the content, accuracy, privacy practices, or availability of these external resources.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">No Transaction Involvement</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            PropAI Live is a technology platform that facilitates property discovery and broker connections. We are not:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-6">
            <li>A real estate broker or agent</li>
            <li>A property owner or manager</li>
            <li>A party to any real estate transaction</li>
            <li>Responsible for negotiating terms or closing deals</li>
            <li>Liable for disputes between buyers, sellers, or brokers</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Changes to Content</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            Property listings, building intelligence, and other content on PropAI Live may be updated, modified, or removed at any time without notice. We do not guarantee the continued availability of any specific information.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Limitation of Liability</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            PropAI Live and its operators shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from:
          </p>
          <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-6">
            <li>Reliance on information provided on the platform</li>
            <li>Errors or inaccuracies in AI-generated content</li>
            <li>Property transaction disputes or losses</li>
            <li>Broker misconduct or fraud</li>
            <li>Platform downtime or technical issues</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Acknowledgment</h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            By using PropAI Live, you acknowledge that you have read, understood, and agreed to this Disclaimer. You accept full responsibility for your use of the platform and any decisions made based on information obtained through our services.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-8">Contact Information</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            If you have questions about this Disclaimer, please contact us:
          </p>
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
            <p className="text-slate-900 font-semibold mb-2">PropAI Live</p>
            <p className="text-slate-700">Email: <a href="mailto:hello@propai.live" className="text-amber-600 hover:text-amber-700">hello@propai.live</a></p>
            <p className="text-slate-700">Location: Mumbai, Maharashtra, India</p>
          </div>
        </div>
      </div>
    </div>
  );
}