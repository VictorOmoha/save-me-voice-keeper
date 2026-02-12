import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Share2,
  Mail,
  Linkedin,
  Download,
  Check,
  Copy,
} from "lucide-react";
import {
  generateEmailContent,
  generateLinkedInPost,
  exportToClipboard,
  openEmailClient,
  downloadAsText,
  ShareData,
} from "@/utils/shareUtils";

interface ShareButtonsProps {
  data: ShareData;
  disabled?: boolean;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({ data, disabled }) => {
  const [copied, setCopied] = useState(false);

  const handleEmailExport = () => {
    try {
      openEmailClient(data);
      toast.success("Email client opened with your notes");
    } catch {
      // Fallback: copy email content to clipboard
      const content = generateEmailContent(data);
      exportToClipboard(content);
      toast.success("Email content copied to clipboard");
    }
  };

  const handleLinkedInExport = () => {
    const content = generateLinkedInPost(data);
    exportToClipboard(content);
    setCopied(true);
    toast.success("LinkedIn post copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
    
    // Open LinkedIn in new tab
    setTimeout(() => {
      window.open('https://www.linkedin.com/feed/?shareActive=true', '_blank');
    }, 500);
  };

  const handleCopyToClipboard = () => {
    const content = generateEmailContent(data, 'plain');
    exportToClipboard(content);
    setCopied(true);
    toast.success("Notes copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadAsText(data);
    toast.success("Notes downloaded");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleEmailExport} className="gap-2 cursor-pointer">
          <Mail className="h-4 w-4 text-blue-500" />
          Send via Email
          <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+E</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleLinkedInExport} className="gap-2 cursor-pointer">
          <Linkedin className="h-4 w-4 text-sky-600" />
          Share to LinkedIn
          <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+L</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleCopyToClipboard} className="gap-2 cursor-pointer">
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy to Clipboard
            </>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleDownload} className="gap-2 cursor-pointer">
          <Download className="h-4 w-4" />
          Download as Text
          <span className="ml-auto text-xs text-muted-foreground">Ctrl+Shift+D</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
