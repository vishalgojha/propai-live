import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Sparkles } from "lucide-react";

/**
 * SocialListing - Login-gated landing page for shared property links
 * 
 * This page is accessed when users click on shared social media images.
 * It requires login before showing property details, acting as lead capture.
 */
export default function SocialListing() {
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [propertyId, setPropertyId] = useState(null);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // Get property ID from URL
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      
      if (!id) {
        // No property ID - redirect to home
        navigate(createPageUrl("Home"));
        return;
      }

      setPropertyId(id);

      try {
        // Check if user is authenticated
        const isAuthenticated = await base44.auth.isAuthenticated();
        
        if (!isAuthenticated) {
          // Not logged in - redirect to login with return URL
          const currentUrl = window.location.pathname + window.location.search;
          base44.auth.redirectToLogin(currentUrl);
          return;
        }

        // User is logged in - redirect to full property details
        navigate(createPageUrl("PropertyDetails") + `?id=${id}`);
        
      } catch (error) {
        console.error('Auth check failed:', error);
        // On error, redirect to login to be safe
        base44.auth.redirectToLogin(window.location.href);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthAndRedirect();
  }, [navigate]);

  // Show loading state while checking auth
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-purple-200">
          <div className="text-center">
            {/* Animated Logo */}
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Sparkles className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Verifying Access...
            </h2>
            
            <p className="text-slate-600 mb-6">
              Please wait while we authenticate your session
            </p>

            {/* Loading Skeletons */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-5/6 mx-auto" />
            </div>

            {/* Trust Badge */}
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Secured by PropAI Live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}