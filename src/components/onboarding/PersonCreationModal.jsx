import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";

/**
 * Minimal Person creation modal
 * Triggered when User exists but no Person is associated
 * Non-blocking, progressive
 */
export default function PersonCreationModal({ open, onComplete, onCancel }) {
  const [name, setName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Call the backend function to create Person
      // This will compute canonical_person_id and link to User
      const { data } = await base44.functions.invoke('createPersonProfile', {
        name: name.trim(),
        agency_name: agencyName.trim() || null
      });

      if (data.success) {
        onComplete(data.person);
      } else {
        setError(data.error || "Failed to create profile");
        setIsCreating(false);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            To add properties or requirements, we need a few quick details. This helps us organize listings and build trust.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              Your Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Amit Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCreating}
              className="mt-1.5"
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="agency" className="text-sm font-medium text-slate-600">
              Agency/Company <span className="text-slate-400">(Optional)</span>
            </Label>
            <Input
              id="agency"
              type="text"
              placeholder="e.g., ABC Real Estate"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              disabled={isCreating}
              className="mt-1.5"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Continue"
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isCreating}
              >
                Cancel
              </Button>
            )}
          </div>

          <p className="text-xs text-slate-500 text-center">
            You can add contact details later in your profile settings.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}