import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { HelpCircle, Send, ExternalLink, MessageSquare, Bug, Lightbulb, Mail } from "lucide-react";
import { useState } from "react";
import { logError } from "@/utils/logger";

export const EnhancedHelpSupportSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [supportForm, setSupportForm] = useState({
    subject: '',
    message: '',
    category: 'question'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to submit a support ticket.",
        variant: "destructive",
      });
      return;
    }

    if (!supportForm.subject.trim() || !supportForm.message.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in both subject and message fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Save to Firebase Firestore
      const ticketsRef = collection(db, 'support_tickets');
      await addDoc(ticketsRef, {
        user_id: user.uid,
        user_email: user.email,
        subject: supportForm.subject.trim(),
        message: supportForm.message.trim(),
        category: supportForm.category,
        status: 'open',
        created_at: serverTimestamp(),
      });

      toast({
        title: "Support ticket submitted",
        description: "We'll get back to you as soon as possible.",
      });

      setSupportForm({ subject: '', message: '', category: 'question' });
    } catch (error) {
      logError('Error submitting support ticket:', error);
      toast({
        title: "Error",
        description: "Failed to submit support ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const helpResources = [
    {
      title: "User Guide",
      description: "Complete guide to using all features",
      icon: <HelpCircle className="w-5 h-5" />,
      action: () => window.open("/user-guide", "_blank")
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video instructions",
      icon: <ExternalLink className="w-5 h-5" />,
      action: () => window.open("https://www.youtube.com/watch?v=9KHLTZaJcR8&list=PLbVHz4urQBZkJiAWdG8HWoJTdgEysigIO", "_blank")
    },
    {
      title: "Community",
      description: "Join our Discord community",
      icon: <MessageSquare className="w-5 h-5" />,
      action: () => window.open("https://discord.com/channels/1119885301872070706/1280461670979993613", "_blank")
    },
    {
      title: "Contact Support",
      description: "Get direct help from our team",
      icon: <Mail className="w-5 h-5" />,
      action: () => window.open("mailto:victor@omohasolutions.com", "_blank")
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Help & Support
          </CardTitle>
          <p className="text-sm text-muted-foreground">Get help and submit feedback</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Help Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Quick Help</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {helpResources.map((resource, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={resource.action}
                >
                  <div className="text-primary">{resource.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-medium">{resource.title}</h4>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>

          {/* Support Ticket Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Submit Support Request</h3>
            <form onSubmit={handleSupportSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={supportForm.category}
                  onValueChange={(value) => setSupportForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="question">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4" />
                        Question
                      </div>
                    </SelectItem>
                    <SelectItem value="bug">
                      <div className="flex items-center gap-2">
                        <Bug className="w-4 h-4" />
                        Bug Report
                      </div>
                    </SelectItem>
                    <SelectItem value="feature">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Feature Request
                      </div>
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={supportForm.subject}
                  onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief description of your issue..."
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={supportForm.message}
                  onChange={(e) => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Please provide detailed information about your issue or request..."
                  rows={5}
                  disabled={isSubmitting}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? "Submitting..." : "Submit Support Request"}
              </Button>
            </form>
          </div>

          {/* Troubleshooting Tips */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Common Issues</h3>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-sm">Voice commands not working?</h4>
                <p className="text-xs text-muted-foreground">Check your microphone permissions and try refreshing the page.</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-sm">Data not syncing?</h4>
                <p className="text-xs text-muted-foreground">Ensure you're logged in and have a stable internet connection.</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium text-sm">Export not working?</h4>
                <p className="text-xs text-muted-foreground">Check if you have entries to export and try a different format.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};