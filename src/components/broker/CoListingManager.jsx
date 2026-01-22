import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, X, Loader2, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function CoListingManager({ property, currentBrokerId, onUpdate }) {
  const [addingCoBroker, setAddingCoBroker] = useState(false);
  const [coBrokerPhone, setCoBrokerPhone] = useState("");
  const [sharePercentage, setSharePercentage] = useState(50);
  const queryClient = useQueryClient();

  const addCoBrokerMutation = useMutation({
    mutationFn: async ({ phone, percentage }) => {
      const normalizedPhone = phone.trim().replace(/\D/g, '').slice(-10);
      const brokers = await base44.entities.Broker.list();
      const coBroker = brokers.find(b => b.phone?.replace(/\D/g, '').slice(-10) === normalizedPhone);

      if (!coBroker) {
        throw new Error('Broker not found with this phone number');
      }

      if (coBroker.id === currentBrokerId) {
        throw new Error('Cannot add yourself as co-broker');
      }

      const existingCoBrokers = property.co_brokers || [];
      if (existingCoBrokers.some(cb => cb.broker_id === coBroker.id)) {
        throw new Error('Broker already added as co-lister');
      }

      const newCoBroker = {
        broker_id: coBroker.id,
        broker_name: coBroker.name,
        broker_phone: coBroker.phone,
        share_percentage: percentage,
        role: "co_lister"
      };

      await base44.entities.Property.update(property.id, {
        co_brokers: [...existingCoBrokers, newCoBroker]
      });

      return coBroker;
    },
    onSuccess: (coBroker) => {
      queryClient.invalidateQueries(['properties']);
      setCoBrokerPhone("");
      setSharePercentage(50);
      setAddingCoBroker(false);
      toast.success(`${coBroker.name} added as co-lister!`);
      if (onUpdate) onUpdate();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const removeCoBrokerMutation = useMutation({
    mutationFn: async (brokerId) => {
      const updatedCoBrokers = (property.co_brokers || []).filter(cb => cb.broker_id !== brokerId);
      await base44.entities.Property.update(property.id, {
        co_brokers: updatedCoBrokers
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['properties']);
      toast.success('Co-broker removed');
      if (onUpdate) onUpdate();
    }
  });

  const coBrokers = property.co_brokers || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          Co-Listing Brokers ({coBrokers.length})
        </h4>
        {property.broker_id === currentBrokerId && (
          <Button
            onClick={() => setAddingCoBroker(!addingCoBroker)}
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700"
          >
            {addingCoBroker ? 'Cancel' : <><UserPlus className="w-3 h-3 mr-1" /> Add Co-Broker</>}
          </Button>
        )}
      </div>

      {addingCoBroker && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-4 bg-blue-50 rounded-lg border border-blue-200"
        >
          <p className="text-sm font-semibold text-slate-900 mb-3">Add Co-Listing Broker</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Phone Number:</label>
              <Input
                type="tel"
                value={coBrokerPhone}
                onChange={(e) => setCoBrokerPhone(e.target.value)}
                placeholder="9820056789"
                className="font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Share % (optional):</label>
              <Input
                type="number"
                value={sharePercentage}
                onChange={(e) => setSharePercentage(Number(e.target.value))}
                min="0"
                max="100"
                className="text-sm"
              />
            </div>
            <Button
              onClick={() => addCoBrokerMutation.mutate({ phone: coBrokerPhone, percentage: sharePercentage })}
              disabled={addCoBrokerMutation.isLoading || !coBrokerPhone.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full"
            >
              {addCoBrokerMutation.isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
              ) : (
                'Add Co-Broker'
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {coBrokers.length > 0 ? (
        <div className="space-y-2">
          {coBrokers.map((coBroker, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-1">
                <p className="font-semibold text-slate-900 text-sm">{coBroker.broker_name}</p>
                <p className="text-xs text-slate-600 font-mono">{coBroker.broker_phone}</p>
                <Badge className="bg-blue-100 text-blue-700 text-xs mt-1">
                  {coBroker.share_percentage}% share
                </Badge>
              </div>
              {property.broker_id === currentBrokerId && (
                <Button
                  onClick={() => removeCoBrokerMutation.mutate(coBroker.broker_id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-600">No co-brokers on this listing</p>
          {property.broker_id === currentBrokerId && (
            <p className="text-xs text-slate-500 mt-1">Add brokers to share this property</p>
          )}
        </div>
      )}
    </div>
  );
}