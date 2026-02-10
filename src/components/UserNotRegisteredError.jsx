import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function UserNotRegisteredError({ onRetry }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Error</h2>
        <p className="text-slate-600 mb-6">
          There was an issue loading your profile. Please try again.
        </p>
        <Button onClick={onRetry} className="bg-blue-600 hover:bg-blue-700 text-white">
          Retry
        </Button>
      </div>
    </div>
  );
}