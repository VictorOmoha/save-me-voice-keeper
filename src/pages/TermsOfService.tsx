import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1>Terms of Service</h1>
          <p className="text-muted-foreground">
            <strong>Effective Date:</strong> January 15, 2026<br />
            <strong>Last Updated:</strong> November 17, 2025
          </p>

          <h2>1. AGREEMENT TO TERMS</h2>
          <p>
            By accessing or using SaveMe Voice Keeper ("SaveMe," "the Service," "we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these Terms, you may not access the Service.
          </p>
          <p>
            <strong>SaveMe Voice Keeper</strong> is a voice-enabled data management platform operated by:
          </p>
          <p>
            <strong>Omoha Solutions</strong><br />
            1300 South Blvd STE 30101<br />
            Charlotte, NC 28203<br />
            Email: victor@omohasolutions.com
          </p>

          <h2>2. SERVICE DESCRIPTION</h2>
          <p>SaveMe provides a cloud-based data management platform with the following features:</p>
          <ul>
            <li><strong>Voice Input & Commands:</strong> Natural language voice interaction for data entry and navigation</li>
            <li><strong>Data Storage & Organization:</strong> Store and organize text, documents, notes, and files</li>
            <li><strong>Multi-Format Document Support:</strong> Handle PDF, DOCX, Excel, and other file formats</li>
            <li><strong>AI Processing:</strong> Voice-to-text conversion and natural language understanding</li>
            <li><strong>Category Management:</strong> Organize data into custom categories</li>
            <li><strong>Export Functionality:</strong> Download your data in various formats</li>
            <li><strong>Search & Analytics:</strong> Find and analyze your stored information</li>
          </ul>

          <h2>3. USER ACCOUNTS</h2>
          <h3>3.1 Account Creation</h3>
          <ul>
            <li>You must provide accurate, complete, and current information during registration</li>
            <li>You must be at least 18 years old or have parental consent to use SaveMe</li>
            <li>You are responsible for maintaining the security of your account credentials</li>
            <li>You are responsible for all activities that occur under your account</li>
          </ul>

          <h3>3.2 Account Security</h3>
          <ul>
            <li>Do not share your password with others</li>
            <li>Notify us immediately of any unauthorized access or security breach</li>
            <li>We are not liable for any loss or damage from your failure to maintain account security</li>
          </ul>

          <h2>4. VOICE DATA & AI PROCESSING</h2>
          <p>By using SaveMe's voice features, you understand and agree that:</p>
          <ul>
            <li><strong>Voice recordings are processed</strong> using third-party AI services (currently 11Labs)</li>
            <li><strong>Voice data is converted to text</strong> and stored in our database</li>
            <li><strong>Audio recordings are NOT permanently stored</strong> unless you explicitly save them</li>
            <li><strong>Temporary voice clips</strong> may be cached for processing but are deleted after conversion</li>
            <li><strong>Voice commands</strong> are processed to control the application and enter data</li>
          </ul>

          <h2>5. SUBSCRIPTION & PAYMENT TERMS</h2>
          <h3>5.1 Pricing Plans</h3>
          <p>Self-serve plans are monthly only. There is no annual SKU, Teams/Enterprise checkout, or paid trial.</p>

          <h4>Free — $0:</h4>
          <ul>
            <li>50 entries maximum</li>
            <li>500 MB storage</li>
            <li>Voice capture and portable export</li>
            <li>Web access</li>
            <li>No payment required</li>
          </ul>

          <h4>Basic — $9/month:</h4>
          <ul>
            <li>Unlimited entries</li>
            <li>5 GB storage</li>
            <li>Web + browser extension</li>
            <li>Advanced search</li>
          </ul>

          <h4>Premium — $19/month:</h4>
          <ul>
            <li>Unlimited entries</li>
            <li>50 GB storage</li>
            <li>Everything in Basic</li>
            <li>Agent API access</li>
          </ul>

          <h3>5.2 Billing Terms</h3>
          <ul>
            <li>Paid subscriptions are billed in advance monthly</li>
            <li>All fees are in U.S. Dollars (USD)</li>
            <li>Payments are processed through Stripe Checkout (cards)</li>
          </ul>

          <h3>5.3 Refund Policy</h3>
          <ul>
            <li><strong>Monthly subscriptions:</strong> No refunds for partial months except where legally required</li>
            <li>There is no annual plan and no paid trial</li>
          </ul>

          <h2>6. ACCEPTABLE USE POLICY</h2>
          <p>You agree NOT to:</p>
          <ul>
            <li>Use SaveMe for any illegal purpose</li>
            <li>Violate any laws, regulations, or third-party rights</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Reverse engineer, decompile, or attempt to extract source code</li>
            <li>Upload viruses, malware, or harmful code</li>
          </ul>

          <h2>7. DISCLAIMERS & WARRANTIES</h2>
          <p className="uppercase font-bold">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
          </p>
          <ul>
            <li>Voice recognition technology may produce errors - you must review all voice-transcribed content</li>
            <li>We are not liable for inaccuracies in voice-to-text conversion</li>
            <li>We recommend maintaining backup copies of important data</li>
          </ul>

          <h2>8. LIMITATION OF LIABILITY</h2>
          <p className="uppercase font-bold">
            OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS SHALL NOT EXCEED:
          </p>
          <ul>
            <li>For Free tier users: $100 USD</li>
            <li>For paid users: The amount you paid in the last 12 months</li>
          </ul>

          <h2>9. CONTACT INFORMATION</h2>
          <p>For questions regarding these Terms, contact us:</p>
          <p>
            <strong>Omoha Solutions</strong><br />
            1300 South Blvd STE 30101<br />
            Charlotte, NC 28203<br />
            United States
          </p>
          <p>
            <strong>Email:</strong> victor@omohasolutions.com<br />
            <strong>Website:</strong> www.saveme.space
          </p>

          <div className="mt-12 p-6 bg-muted rounded-lg">
            <p className="text-sm uppercase font-bold">
              BY USING SAVEME VOICE KEEPER, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.
            </p>
            <p className="text-sm mt-4">
              If you do not agree to these Terms, you must not use the Service.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              <strong>Document Version:</strong> 1.0<br />
              <strong>Effective Date:</strong> January 15, 2026<br />
              <strong>Last Reviewed:</strong> November 17, 2025
            </p>
            <p className="text-xs text-muted-foreground mt-2 italic">
              These Terms of Service should be reviewed by a licensed attorney before public deployment.
            </p>
          </div>

          <div className="mt-8 text-center">
            <Link to="/">
              <Button>Return to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
