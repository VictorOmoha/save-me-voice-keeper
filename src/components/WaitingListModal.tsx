import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import { logVoice, logError } from "@/utils/logger";

interface WaitingListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WaitingListModal({ open, onOpenChange }: WaitingListModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Add voice command close event listener
  useEffect(() => {
    const handleVoiceClose = () => {
      if (open) {
        logVoice('Voice command: closing waiting list modal');
        onOpenChange(false);
      }
    };

    window.addEventListener('close-modal', handleVoiceClose);
    window.addEventListener('close-waitlist', handleVoiceClose);
    
    return () => {
      window.removeEventListener('close-modal', handleVoiceClose);
      window.removeEventListener('close-waitlist', handleVoiceClose);
    };
  }, [open, onOpenChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const normalizedEmail = email.toLowerCase().trim();

      // Check if email already exists
      const waitingListRef = collection(db, 'waiting_list');
      const q = query(waitingListRef, where('email', '==', normalizedEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.error("This email is already on our waiting list!");
        return;
      }

      // Add to waiting list
      await addDoc(waitingListRef, {
        email: normalizedEmail,
        name: name.trim() || null,
        created_at: serverTimestamp()
      });

      toast.success("Thanks for joining! We'll notify you when Save Me launches.");
      setEmail("");
      setName("");
      onOpenChange(false);
    } catch (error) {
      logError('Error joining waiting list:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Join the Waiting List
          </DialogTitle>
          <DialogDescription>
            Be the first to know when Save Me launches. We'll send you early access and exclusive updates.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Name (Optional)</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Waiting List"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}