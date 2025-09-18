
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle, FileText, MessageSquare, Lightbulb, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

export const HelpSupportSettings = () => {
  const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false);
  const [supportForm, setSupportForm] = useState({
    subject: "",
    message: "",
    priority: "medium"
  });
  const [featureForm, setFeatureForm] = useState({
    title: "",
    description: "",
    useCase: ""
  });

  const handleSupportSubmit = () => {
    if (!supportForm.subject || !supportForm.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    toast.success("Support request submitted successfully");
    setSupportForm({ subject: "", message: "", priority: "medium" });
    setIsSupportDialogOpen(false);
  };

  const handleFeatureSubmit = () => {
    if (!featureForm.title || !featureForm.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    toast.success("Feature request submitted successfully");
    setFeatureForm({ title: "", description: "", useCase: "" });
    setIsFeatureDialogOpen(false);
  };

  const openUserGuide = () => {
    window.open("/user-guide", "_blank");
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          Help & Support
        </CardTitle>
        <p className="text-sm text-muted-foreground">Get help and contact support</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Button variant="outline" className="justify-start" onClick={openUserGuide}>
            <FileText className="w-4 h-4 mr-2" />
            User Guide
          </Button>
          
          <Dialog open={isSupportDialogOpen} onOpenChange={setIsSupportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Contact Support</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Subject *</label>
                  <Input
                    value={supportForm.subject}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Brief description of your issue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={supportForm.priority}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Message *</label>
                  <Textarea
                    value={supportForm.message}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Describe your issue in detail..."
                    rows={4}
                  />
                </div>
                <Button onClick={handleSupportSubmit} className="w-full">
                  Submit Support Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isFeatureDialogOpen} onOpenChange={setIsFeatureDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="justify-start">
                <Lightbulb className="w-4 h-4 mr-2" />
                Feature Requests
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request a Feature</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Feature Title *</label>
                  <Input
                    value={featureForm.title}
                    onChange={(e) => setFeatureForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Name of the feature"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <Textarea
                    value={featureForm.description}
                    onChange={(e) => setFeatureForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the feature you'd like to see..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Use Case</label>
                  <Textarea
                    value={featureForm.useCase}
                    onChange={(e) => setFeatureForm(prev => ({ ...prev, useCase: e.target.value }))}
                    placeholder="How would this feature help you?"
                    rows={2}
                  />
                </div>
                <Button onClick={handleFeatureSubmit} className="w-full">
                  Submit Feature Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm mb-2">Quick Contact</h4>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3" />
              support@yourapp.com
            </div>
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              +1 (555) 123-4567
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
