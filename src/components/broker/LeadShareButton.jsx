import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Share2, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LeadShareButton({ property, currentBrokerId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBrokers, setSelectedBrokers] = useState([]);
  const [shareMessage, setShareMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: allBrokers = [] } = useQuery({
    queryKey: ['all-brokers'],
    queryFn: () => base44.entities.Broker.list(),
    initialData: []
  });

  const shareLeadMutation = useMutation({
    mutationFn: async ({ brokerIds, message }) => {
      const currentBroker = allBrokers.find(b => b.id === currentBrokerId);
      
      for (const brokerId of brokerIds) {
        const recipient = allBrokers.find(b => b.id === brokerId);
        
        await base44.entities.BrokerMessage.create({
          sender_broker_id: currentBrokerId,
          sender_name: currentBroker?.name || "Broker",
          recipient_broker_id: brokerId,
          recipient_name: recipient?.name || "Broker",
          property_id: property.id,
          subject: `Lead Share: ${property.bhk} in ${property.location}`,
          message: message || `I'm sharing this property with you: ${property.ai_title || property.bhk}. Price: ₹${property.price}${property.price_unit === 'crores' ? ' Cr' : 'L'}`,
          message_type: "lead_share"
        });
      }

      const updatedSharedWith = [...(property.lead_shared_with || []), ...brokerIds];
      await base44.entities.Property.update(property.id, {
        lead_shared_with: updatedSharedWith
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['properties']);
      setIsOpen(false);
      setSelectedBrokers([]);
      setShareMessage("");
      toast.success('Lead shared successfully!');
    },
    onError: (error) => {
      toast.error('Failed to share lead', { description: error.message });
    }
  });

  const toggleBroker = (brokerId) => {
    if (selectedBrokers.includes(brokerId)) {
      setSelectedBrokers(selectedBrokers.filter(id => id !== brokerId));
    } else {
      setSelectedBrokers([...selectedBrokers, brokerId]);
    }
  };

  const availableBrokers = allBrokers.filter(b => 
    b.id !== currentBrokerId && 
    !(property.lead_shared_with || []).includes(b.id)
  );

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="border-green-300 text-green-700 hover:bg-green-50"
      >
        <Share2 className="w-3 h-3 mr-1" />
        Share Lead
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Property Lead</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-semibold text-slate-900 text-sm">{property.ai_title || property.bhk}</p>
              <p className="text-xs text-slate-600 mt-1">{property.location} • ₹{property.price}{property.price_unit === 'crores' ? ' Cr' : 'L'}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Select Brokers:</p>
              <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-2">
                {availableBrokers.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No available brokers to share with</p>
                ) : (
                  availableBrokers.map((broker) => (
                    <button
                      key={broker.id}
                      onClick={() => toggleBroker(broker.id)}
                      className={`w-full text-left p-2 rounded-lg transition-all ${
                        selectedBrokers.includes(broker.id)
                          ? 'bg-blue-100 border border-blue-300'
                          : 'bg-white hover:bg-slate-50 border border-slate-200'
                      }`}
                    >
                      <p className="font-semibold text-slate-900 text-sm">{broker.name}</p>
                      <p className="text-xs text-slate-600">{broker.agency_name}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Message (optional):</label>
              <Textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                placeholder="Add a personal note..."
                className="min-h-[80px]"
              />
            </div>

            <Button
              onClick={() => shareLeadMutation.mutate({ brokerIds: selectedBrokers, message: shareMessage })}
              disabled={shareLeadMutation.isLoading || selectedBrokers.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full"
            >
              {shareLeadMutation.isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sharing...</>
              ) : (
                `Share with ${selectedBrokers.length} ${selectedBrokers.length === 1 ? 'broker' : 'brokers'}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}