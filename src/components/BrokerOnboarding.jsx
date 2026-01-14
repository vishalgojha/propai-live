import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Phone, User, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function BrokerOnboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    agency_name: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { number: 1, title: "Your Name", icon: User },
    { number: 2, title: "WhatsApp Number", icon: Phone },
    { number: 3, title: "Agency Name", icon: Building2 }
  ];

  const handleNext = () => {
    if (step === 1 && !formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (step === 2 && !formData.phone.trim()) {
      toast.error("Please enter your WhatsApp number");
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.agency_name.trim()) {
      toast.error("Please enter your agency name");
      return;
    }
    
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error("Phone number must be 10 digits");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onComplete(formData);
    } catch (error) {
      toast.error(error.message);
      setIsSubmitting(false);
    }
  };

  const currentStep = steps[step - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Progress */}
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {steps.map((s) => (
              <div
                key={s.number}
                className={`flex-1 h-2 rounded-full transition-all ${
                  step >= s.number
                    ? "bg-gradient-to-r from-purple-600 to-blue-600"
                    : "bg-slate-200"
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-semibold text-slate-600">
            Step {step} of 3
          </p>
        </div>

        {/* Card */}
        <Card className="p-8 bg-white border-2 border-purple-200 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <currentStep.icon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {currentStep.title}
            </h2>
          </div>

          <div className="space-y-4">
            {step === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  What's your name?
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Ramesh Kumar"
                  className="text-lg h-12 border-2 border-purple-300"
                  autoFocus
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Your WhatsApp number
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="9820056789"
                  className="text-lg h-12 font-mono border-2 border-purple-300"
                  autoFocus
                />
                <p className="text-xs text-purple-600 mt-2 font-semibold">
                  ⚠️ Required for WhatsApp integration
                </p>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Your agency name
                </label>
                <Input
                  type="text"
                  value={formData.agency_name}
                  onChange={(e) =>
                    setFormData({ ...formData, agency_name: e.target.value })
                  }
                  placeholder="e.g., Bandra Homes"
                  className="text-lg h-12 border-2 border-purple-300"
                  autoFocus
                />
              </motion.div>
            )}
          </div>

          {/* Summary (Step 3 only) */}
          {step === 3 && (
            <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <p className="text-xs font-semibold text-slate-700 mb-3">
                Summary:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>{formData.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="font-mono">{formData.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>{formData.agency_name}</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Buttons */}
        <div className="flex gap-3">
          {step > 1 && (
            <Button
              onClick={() => setStep(step - 1)}
              variant="outline"
              className="flex-1 h-12 border-purple-300 text-purple-700"
            >
              Back
            </Button>
          )}
          <Button
            onClick={step === 3 ? handleSubmit : handleNext}
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white h-12 font-bold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : step === 3 ? (
              "Complete Setup"
            ) : (
              <>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-500 text-center mt-4">
          You can edit these details anytime in your profile
        </p>
      </motion.div>
    </div>
  );
}