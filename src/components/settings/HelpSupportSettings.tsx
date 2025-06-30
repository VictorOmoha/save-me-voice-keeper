
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, FileText, MessageSquare, Lightbulb } from "lucide-react";

export const HelpSupportSettings = () => {
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="justify-start">
            <FileText className="w-4 h-4 mr-2" />
            Documentation
          </Button>
          <Button variant="outline" className="justify-start">
            <MessageSquare className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
          <Button variant="outline" className="justify-start">
            <Lightbulb className="w-4 h-4 mr-2" />
            Feature Requests
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
