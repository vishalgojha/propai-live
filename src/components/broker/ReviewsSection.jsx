import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Star, ThumbsUp, MessageCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ReviewsSection({ brokerId, brokerName, currentUserBrokerId }) {
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [selectedStrengths, setSelectedStrengths] = useState([]);
  const queryClient = useQueryClient();

  const strengthOptions = [
    "Quick Responder",
    "Reliable Data",
    "Professional",
    "Great Communication",
    "Trustworthy",
    "Market Expert"
  ];

  const { data: reviews = [] } = useQuery({
    queryKey: ['broker-reviews', brokerId],
    queryFn: async () => {
      const allReviews = await base44.entities.BrokerReview.list('-created_date');
      return allReviews.filter(r => r.reviewed_broker_id === brokerId && r.status === 'approved');
    },
    initialData: []
  });

  const createReviewMutation = useMutation({
    mutationFn: (reviewData) => base44.entities.BrokerReview.create(reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries(['broker-reviews']);
      setIsWritingReview(false);
      setRating(0);
      setReviewText("");
      setSelectedStrengths([]);
      toast.success('Review submitted!');
    }
  });

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    const reviewData = {
      reviewer_broker_id: currentUserBrokerId,
      reviewer_name: "Current User",
      reviewed_broker_id: brokerId,
      rating,
      review_text: reviewText.trim() || null,
      strengths: selectedStrengths,
      collaboration_type: "general",
      verified_deal: false,
      status: "approved"
    };

    createReviewMutation.mutate(reviewData);
  };

  const toggleStrength = (strength) => {
    if (selectedStrengths.includes(strength)) {
      setSelectedStrengths(selectedStrengths.filter(s => s !== strength));
    } else {
      setSelectedStrengths([...selectedStrengths, strength]);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const alreadyReviewed = reviews.some(r => r.reviewer_broker_id === currentUserBrokerId);

  return (
    <Card className="p-6 bg-white border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" fill="currentColor" />
            Broker Reviews
          </h3>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'text-amber-500' : 'text-slate-300'}`}
                    fill={star <= Math.round(avgRating) ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <span className="text-sm text-slate-600">{avgRating} ({reviews.length} reviews)</span>
            </div>
          )}
        </div>

        {currentUserBrokerId && currentUserBrokerId !== brokerId && !alreadyReviewed && (
          <Button
            onClick={() => setIsWritingReview(!isWritingReview)}
            variant="outline"
            size="sm"
            className="border-blue-300 text-blue-700"
          >
            {isWritingReview ? 'Cancel' : 'Write Review'}
          </Button>
        )}
      </div>

      {isWritingReview && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200"
        >
          <h4 className="font-bold text-slate-900 mb-3">Rate {brokerName}</h4>

          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${star <= rating ? 'text-amber-500' : 'text-slate-300'}`}
                  fill={star <= rating ? 'currentColor' : 'none'}
                />
              </button>
            ))}
          </div>

          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-700 mb-2">Strengths (optional):</p>
            <div className="flex flex-wrap gap-2">
              {strengthOptions.map((strength) => (
                <Button
                  key={strength}
                  onClick={() => toggleStrength(strength)}
                  variant={selectedStrengths.includes(strength) ? "default" : "outline"}
                  size="sm"
                  className={selectedStrengths.includes(strength) 
                    ? "bg-blue-600 text-white" 
                    : "border-slate-200"}
                >
                  {selectedStrengths.includes(strength) && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {strength}
                </Button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Review (optional):</label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience working with this broker..."
              className="min-h-[100px]"
            />
          </div>

          <Button
            onClick={handleSubmitReview}
            disabled={createReviewMutation.isLoading || rating === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
          >
            Submit Review
          </Button>
        </motion.div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{review.reviewer_name}</p>
                  <div className="flex mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${star <= review.rating ? 'text-amber-500' : 'text-slate-300'}`}
                        fill={star <= review.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-500">{format(new Date(review.created_date), 'MMM d, yyyy')}</p>
              </div>

              {review.strengths?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {review.strengths.map((strength, idx) => (
                    <Badge key={idx} className="bg-blue-100 text-blue-700 text-xs">
                      {strength}
                    </Badge>
                  ))}
                </div>
              )}

              {review.review_text && (
                <p className="text-sm text-slate-700 leading-relaxed">{review.review_text}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}