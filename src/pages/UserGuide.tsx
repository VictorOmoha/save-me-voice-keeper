import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, ChevronRight, Mic, FileText, Settings, Zap, Download, Brain, MessageSquare, Upload, Filter, Calendar, Tag, Bell, Shield, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const UserGuide = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openSections, setOpenSections] = useState<string[]>(["getting-started"]);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const sections: GuideSection[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: <Zap className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Welcome to Voice Keeper!</h3>
          <p className="text-muted-foreground">
            Voice Keeper is your intelligent data entry and management companion. You can add entries through traditional forms or use our powerful voice interface to capture information naturally.
          </p>
          
          <div className="space-y-3">
            <h4 className="font-medium">First Steps:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Complete your account setup and profile information</li>
              <li>Visit the Dashboard to see your data overview</li>
              <li>Try creating your first entry using the "Add Entry" button</li>
              <li>Test voice commands by clicking the microphone icon</li>
              <li>Explore categories to organize your data</li>
            </ol>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Quick Navigation:</h4>
            <ul className="text-sm space-y-1">
              <li><strong>Dashboard:</strong> Overview of your data and recent activity</li>
              <li><strong>All Entries:</strong> Browse and manage all your data</li>
              <li><strong>Categories:</strong> Organized views of your information</li>
              <li><strong>Brain Dump:</strong> Quick voice capture for ideas and notes</li>
              <li><strong>Settings:</strong> Customize your experience</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: "adding-entries",
      title: "Adding Entries",
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Creating Data Entries</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Method 1: Manual Form Entry</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click "Add Entry" from the dashboard or navigation</li>
                <li>Fill in the required fields (title, content, etc.)</li>
                <li>Select a category to organize your entry</li>
                <li>Add custom fields if needed</li>
                <li>Upload images or files if relevant</li>
                <li>Click "Save" to store your entry</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">Method 2: Voice Entry</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click the microphone icon anywhere in the app</li>
                <li>Say "Create a new entry" or similar command</li>
                <li>Speak naturally about what you want to record</li>
                <li>The AI will structure your speech into proper fields</li>
                <li>Review and confirm the generated entry</li>
              </ol>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Voice Entry Tips:</h4>
              <ul className="text-sm space-y-1">
                <li>• Speak clearly and at a normal pace</li>
                <li>• Include context: "This is a meeting note about..."</li>
                <li>• Mention categories: "Add this to my work projects"</li>
                <li>• Use natural language - the AI understands context</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "voice-commands",
      title: "Voice Commands",
      icon: <Mic className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Voice Interface Guide</h3>
          <p className="text-muted-foreground">
            Our advanced voice interface understands natural language and can perform various actions through speech.
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Basic Commands:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Badge variant="outline">"Create a new entry"</Badge>
                <Badge variant="outline">"Show my documents"</Badge>
                <Badge variant="outline">"Search for meetings"</Badge>
                <Badge variant="outline">"Delete old entries"</Badge>
                <Badge variant="outline">"Export my data"</Badge>
                <Badge variant="outline">"Go to settings"</Badge>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Advanced Usage:</h4>
              <ul className="text-sm space-y-2">
                <li><strong>Conversational:</strong> "I need to record information about my client meeting today"</li>
                <li><strong>Specific:</strong> "Create a shopping list with milk, bread, and eggs"</li>
                <li><strong>Context-aware:</strong> "Add this receipt to my business expenses category"</li>
                <li><strong>Multi-step:</strong> "Create a project entry and set a reminder for next week"</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Voice Best Practices:</h4>
              <ul className="text-sm space-y-1">
                <li>• Ensure your microphone has permissions</li>
                <li>• Speak in a quiet environment for better accuracy</li>
                <li>• Wait for the system to process before speaking again</li>
                <li>• Use the visual feedback to confirm commands</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "brain-dump",
      title: "Brain Dump Feature",
      icon: <Brain className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Brain Dump: Capture Ideas Instantly</h3>
          <p className="text-muted-foreground">
            The Brain Dump feature is perfect for quickly capturing thoughts, ideas, or information without worrying about structure.
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">How to Use Brain Dump:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Navigate to the Brain Dump page or use voice command "Start brain dump"</li>
                <li>Click "Start Recording" or use the voice activation</li>
                <li>Speak freely about your thoughts, ideas, or information</li>
                <li>The system will automatically segment and organize your content</li>
                <li>Review the captured segments and save what you need</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">Perfect for:</h4>
              <ul className="text-sm space-y-1">
                <li>• Brainstorming sessions</li>
                <li>• Meeting notes on-the-go</li>
                <li>• Quick idea capture</li>
                <li>• Stream-of-consciousness recording</li>
                <li>• Voice journaling</li>
              </ul>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Pro Tip:</strong> Brain Dump automatically identifies different topics and can suggest categories for your content, making it easy to organize later.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "organization",
      title: "Organization & Categories",
      icon: <Tag className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Organizing Your Data</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Categories:</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Categories help organize your entries into logical groups for easy retrieval.
              </p>
              <ul className="text-sm space-y-1">
                <li>• Categories are automatically suggested based on content</li>
                <li>• You can create custom categories for your specific needs</li>
                <li>• Entries can belong to multiple categories</li>
                <li>• Use the category view to see all entries in a specific group</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Search and Filtering:</h4>
              <ul className="text-sm space-y-1">
                <li>• Use the search bar to find entries by keywords</li>
                <li>• Filter by date, category, or entry type</li>
                <li>• Smart search understands context and related terms</li>
                <li>• Recent searches are saved for quick access</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Custom Fields:</h4>
              <p className="text-sm text-muted-foreground">
                Add custom fields to entries for structured data capture like contact information, project details, or any specific data points you need to track.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "documents",
      title: "Document Management",
      icon: <Upload className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Working with Documents</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Document Creation:</h4>
              <ul className="text-sm space-y-1">
                <li>• Create rich text documents with formatting</li>
                <li>• Generate documents from your data entries</li>
                <li>• Use templates for consistent formatting</li>
                <li>• Collaborate on documents with built-in editing tools</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">File Uploads:</h4>
              <ul className="text-sm space-y-1">
                <li>• Upload images, PDFs, and other documents</li>
                <li>• Attach files to entries for reference</li>
                <li>• Automatic text extraction from uploaded documents</li>
                <li>• Image recognition for better organization</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Export Options:</h4>
              <ul className="text-sm space-y-1">
                <li>• Export individual entries or entire datasets</li>
                <li>• Multiple format support: PDF, Word, CSV, JSON</li>
                <li>• Batch export for multiple entries</li>
                <li>• Scheduled exports for regular backups</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "search-filter",
      title: "Search & Filtering",
      icon: <Filter className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Finding Your Data</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Smart Search:</h4>
              <ul className="text-sm space-y-1">
                <li>• Search by keywords, phrases, or content</li>
                <li>• Natural language queries: "meetings from last week"</li>
                <li>• Search within specific categories or date ranges</li>
                <li>• Auto-complete suggestions based on your data</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Advanced Filtering:</h4>
              <ul className="text-sm space-y-1">
                <li>• Filter by creation date, modification date</li>
                <li>• Category-based filtering</li>
                <li>• Content type filters (text, images, documents)</li>
                <li>• Custom field value filtering</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Saved Searches:</h4>
              <ul className="text-sm space-y-1">
                <li>• Save frequently used search queries</li>
                <li>• Quick access to important data sets</li>
                <li>• Share saved searches with team members</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "settings",
      title: "Settings & Customization",
      icon: <Settings className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Personalizing Your Experience</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Profile Settings:</h4>
              <ul className="text-sm space-y-1">
                <li>• Update your personal information and preferences</li>
                <li>• Set your default categories and custom fields</li>
                <li>• Configure display name and avatar</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Voice Settings:</h4>
              <ul className="text-sm space-y-1">
                <li>• Adjust microphone sensitivity</li>
                <li>• Set preferred language and accent</li>
                <li>• Configure voice command triggers</li>
                <li>• Enable/disable text-to-speech feedback</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Appearance:</h4>
              <ul className="text-sm space-y-1">
                <li>• Choose between light and dark themes</li>
                <li>• Adjust font size and display preferences</li>
                <li>• Customize dashboard layout</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Data Management:</h4>
              <ul className="text-sm space-y-1">
                <li>• Export all your data for backup</li>
                <li>• Import data from other applications</li>
                <li>• Configure automatic backups</li>
                <li>• Data retention policies</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      icon: <MessageSquare className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Common Issues & Solutions</h3>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Voice Commands Not Working</h4>
                <ul className="text-sm space-y-1">
                  <li>• Check microphone permissions in your browser</li>
                  <li>• Ensure you're using a supported browser (Chrome, Edge, Safari)</li>
                  <li>• Try refreshing the page</li>
                  <li>• Check if other applications are using your microphone</li>
                </ul>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Data Not Syncing</h4>
                <ul className="text-sm space-y-1">
                  <li>• Check your internet connection</li>
                  <li>• Ensure you're logged in to your account</li>
                  <li>• Try logging out and back in</li>
                  <li>• Clear browser cache if issues persist</li>
                </ul>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Export Not Working</h4>
                <ul className="text-sm space-y-1">
                  <li>• Check if you have entries to export</li>
                  <li>• Try a different export format</li>
                  <li>• Ensure pop-ups are allowed for downloads</li>
                  <li>• Check available storage space</li>
                </ul>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Performance Issues</h4>
                <ul className="text-sm space-y-1">
                  <li>• Close unnecessary browser tabs</li>
                  <li>• Clear browser cache and cookies</li>
                  <li>• Update your browser to the latest version</li>
                  <li>• Check if extensions are causing conflicts</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Still Need Help?</h4>
              <p className="text-sm text-muted-foreground">
                If you're still experiencing issues, please contact our support team through the Settings → Help & Support section with detailed information about the problem.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "tips",
      title: "Tips & Best Practices",
      icon: <Zap className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Pro Tips for Power Users</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h4 className="font-medium mb-2">Voice Efficiency</h4>
                <ul className="text-sm space-y-1">
                  <li>• Use voice shortcuts for repetitive tasks</li>
                  <li>• Create voice templates for common entries</li>
                  <li>• Learn the conversational commands</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <h4 className="font-medium mb-2">Organization</h4>
                <ul className="text-sm space-y-1">
                  <li>• Use consistent naming for categories</li>
                  <li>• Tag entries with multiple categories</li>
                  <li>• Regular cleanup of old entries</li>
                </ul>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <h4 className="font-medium mb-2">Data Entry</h4>
                <ul className="text-sm space-y-1">
                  <li>• Include relevant keywords for better search</li>
                  <li>• Use custom fields for structured data</li>
                  <li>• Add images and files for context</li>
                </ul>
              </div>

              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <h4 className="font-medium mb-2">Workflow</h4>
                <ul className="text-sm space-y-1">
                  <li>• Set up regular export schedules</li>
                  <li>• Use Brain Dump for quick capture</li>
                  <li>• Leverage search analytics for insights</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-lg">
              <h4 className="font-medium mb-2">Advanced Workflow</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Combine voice commands, categories, and smart search to create an efficient data management workflow that adapts to your specific needs.
              </p>
              <Badge variant="secondary">Pro Tip: Use voice commands to navigate between features while keeping your hands free for other tasks</Badge>
            </div>
          </div>
        </div>
      )
    }
  ];

  const filteredSections = sections.filter(section =>
    searchTerm === "" || 
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.content.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">User Guide</h1>
                <p className="text-sm text-muted-foreground">Complete guide to using Voice Keeper</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search guide..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  {filteredSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => toggleSection(section.id)}
                      className={`w-full flex items-center gap-2 p-2 text-left rounded-lg hover:bg-muted transition-colors ${
                        openSections.includes(section.id) ? 'bg-muted' : ''
                      }`}
                    >
                      {section.icon}
                      <span className="text-sm font-medium">{section.title}</span>
                      <ChevronRight 
                        className={`w-4 h-4 ml-auto transition-transform ${
                          openSections.includes(section.id) ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {filteredSections.map((section) => (
                <Collapsible
                  key={section.id}
                  open={openSections.includes(section.id)}
                  onOpenChange={() => toggleSection(section.id)}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="flex items-center gap-3">
                          {section.icon}
                          {section.title}
                          <ChevronRight 
                            className={`w-5 h-5 ml-auto transition-transform ${
                              openSections.includes(section.id) ? 'rotate-90' : ''
                            }`}
                          />
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        {section.content}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;