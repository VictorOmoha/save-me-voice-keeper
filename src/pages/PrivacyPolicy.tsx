import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="workspace-shell min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
            <Button asChild variant="ghost" className="gap-2"><Link to="/">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link></Button>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="legal-document max-w-none">
          <h1>Privacy Policy</h1>
          <p className="text-muted-foreground">
            <strong>Effective Date:</strong> January 15, 2026<br />
            <strong>Last Updated:</strong> November 17, 2025
          </p>

          <h2>1. INTRODUCTION</h2>
          <p>
            Welcome to SaveMe Voice Keeper ("SaveMe," "we," "us," or "our"). We respect your privacy and are committed to protecting your personal data.
          </p>
          <p>
            <strong>Operator Information:</strong>
          </p>
          <p>
            <strong>Omoha Solutions</strong><br />
            1300 South Blvd STE 30101<br />
            Charlotte, NC 28203<br />
            United States<br />
            Email: victor@omohasolutions.com
          </p>

          <h2>2. INFORMATION WE COLLECT</h2>

          <h3>2.1 Information You Provide Directly</h3>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, password (encrypted), phone number (optional)</li>
            <li><strong>Payment Information:</strong> Credit card details (processed by Stripe, not stored by us), billing address</li>
            <li><strong>User Content:</strong> Text entries, uploaded documents, categories, search queries, voice transcriptions</li>
          </ul>

          <h3>2.2 Voice Data Collection</h3>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg my-4">
            <p className="font-bold">IMPORTANT: How We Handle Voice Data</p>
            <p>When you use SaveMe's voice features:</p>
          </div>

          <p><strong>What We Collect:</strong></p>
          <ul>
            <li><strong>Voice audio clips</strong> (temporarily, during processing only)</li>
            <li><strong>Voice-to-text transcriptions</strong> (may be stored with your conversation or saved entries)</li>
            <li><strong>Voice command metadata</strong> (timestamp, command type, success/failure)</li>
          </ul>

          <p><strong>How Voice Processing Works:</strong></p>
          <ol>
            <li>You choose when to enable the microphone. Ending the session stops audio capture.</li>
            <li>Voice Capture, Brain Dump, and the Nova panel share a realtime conversation that streams audio directly to OpenAI for speech-to-speech responses and captions.</li>
            <li>Conversation context, relevant memory summaries, and requested tool results are also sent to OpenAI.</li>
            <li>SaveMe authenticates actions on its server and can store conversation captions, session metadata, and memories you request.</li>
            <li>Entry categorization, memory enrichment, and legacy audio transcription use Google Gemini. Optional speech playback can use other configured voice providers, including ElevenLabs.</li>
          </ol>
          <p>SaveMe does not intentionally persist raw realtime audio. Processing and retention by each provider are governed by its applicable service terms; this is not a promise of immediate deletion by those providers.</p>

          <h3>2.3 Information We Collect Automatically</h3>
          <ul>
            <li><strong>Usage Data:</strong> Pages visited, features used, time spent</li>
            <li><strong>Technical Data:</strong> Browser type, operating system, device type, IP address</li>
            <li><strong>Performance Data:</strong> Error logs, page load times, feature usage frequency</li>
          </ul>

          <h2>3. HOW WE USE YOUR INFORMATION</h2>
          <p>We use your information to:</p>
          <ul>
            <li><strong>Provide the Service:</strong> Create and manage your account, store your data, process voice commands</li>
            <li><strong>Improve the Service:</strong> Analyze usage patterns, fix bugs, develop new features</li>
            <li><strong>Communicate with You:</strong> Send service announcements, respond to support requests</li>
            <li><strong>Security:</strong> Detect and prevent unauthorized access, identify abuse</li>
          </ul>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg my-4">
            <p className="font-bold">We will NEVER:</p>
            <ul className="mt-2">
              <li>❌ Sell your personal data to third parties</li>
              <li>❌ Use your content for advertising</li>
              <li>❌ Share your data with competitors</li>
              <li>❌ Train AI models on your private data without consent</li>
            </ul>
          </div>

          <h2>4. HOW WE SHARE YOUR INFORMATION</h2>
          <p>We do NOT sell your personal data. We may share data only in these limited circumstances:</p>

          <h3>4.1 Service Providers (Third-Party Processors)</h3>
          <ul>
            <li><strong>Firebase / Google Cloud:</strong> Stores your user data and content, provides authentication, and runs backend processing</li>
            <li><strong>OpenAI:</strong> Processes realtime speech, captions, conversation context, and relevant memory/tool data</li>
            <li><strong>Google Gemini:</strong> Processes legacy audio transcription, entry categorization, and memory enrichment</li>
            <li><strong>ElevenLabs:</strong> Optional speech playback when configured</li>
            <li><strong>Stripe:</strong> Processes subscription payments (we do NOT see your full credit card details)</li>
          </ul>

          <h3>4.2 Legal Requirements</h3>
          <p>We may disclose your information if required by law to comply with court orders, subpoenas, or legal processes.</p>

          <h2>5. DATA SECURITY</h2>
          <p><strong>How We Protect Your Data:</strong></p>
          <ul>
            <li><strong>Encryption:</strong> All data encrypted in transit (HTTPS/TLS) and at rest</li>
            <li><strong>Access Controls:</strong> Role-based access, multi-factor authentication available</li>
            <li><strong>Infrastructure:</strong> Hosted on secure cloud providers including Firebase / Google Cloud</li>
          </ul>

          <p className="text-sm italic">
            While we implement industry-standard security measures, no system is 100% secure. We cannot guarantee absolute security against all threats.
          </p>

          <h2>6. DATA RETENTION</h2>
          <ul>
            <li><strong>Active accounts:</strong> Data retained as long as account is active</li>
            <li><strong>Subscription cancellation:</strong> Cancels paid access without deleting your account or memories.</li>
            <li><strong>Account deletion:</strong> Request permanent deletion in Settings → Data Management after confirming your identity. Access stops when the request is recorded. Server cleanup usually completes within 15 minutes and retries if interrupted. A minimal deletion receipt is retained for 30 days; billing and security records retained by providers remain subject to their legal obligations and retention policies.</li>
            <li><strong>Export archives:</strong> Download links expire after 15 minutes. Server copies are removed within 24 hours plus the next scheduled cleanup run.</li>
            <li><strong>Voice data:</strong>
              <ul>
                <li>Raw realtime audio: not intentionally persisted by SaveMe; provider processing is subject to provider terms</li>
                <li>Transcriptions: Retained as user content (until you delete)</li>
                <li>Voice metadata and conversation captions: retained in your account; the realtime session timeout does not delete stored conversation records</li>
              </ul>
            </li>
            <li><strong>Backups:</strong> May persist in backups for up to 90 days</li>
          </ul>

          <h2>7. YOUR PRIVACY RIGHTS</h2>
          <p>All users have the right to:</p>
          <ul>
            <li><strong>Access:</strong> View and download your personal data</li>
            <li><strong>Correction:</strong> Update inaccurate information</li>
            <li><strong>Deletion:</strong> Request deletion of your account and data</li>
            <li><strong>Export:</strong> Settings → Data Management prepares a compressed JSON account archive including stored memories, conversations, reminders, preferences, derived account data, connected-agent metadata, and original uploaded files encoded as base64. Credentials, provider logs, legally retained billing records, and unsynced data on other devices are excluded. Individual document downloads retain their original format.</li>
            <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails</li>
          </ul>

          <h3>GDPR Rights (EEA/UK Users)</h3>
          <p>If you are in the European Economic Area or UK, you also have:</p>
          <ul>
            <li>Right to Erasure ("Right to be Forgotten")</li>
            <li>Right to Restriction of Processing</li>
            <li>Right to Data Portability</li>
            <li>Right to Object to Processing</li>
            <li>Right to Lodge a Complaint with your data protection authority</li>
          </ul>

          <h3>CCPA Rights (California Users)</h3>
          <p>If you are a California resident:</p>
          <ul>
            <li>Right to Know what personal information we collect</li>
            <li>Right to Delete your personal information</li>
            <li>Right to Opt-Out of Sale (Note: We do NOT sell personal information)</li>
            <li>Right to Non-Discrimination for exercising your rights</li>
          </ul>

          <h2>8. CHILDREN'S PRIVACY</h2>
          <p>
            SaveMe is not intended for users under 18 years old. We do not knowingly collect data from children under 18.
            If we discover we have collected data from a child, we will delete it immediately.
          </p>

          <h2>9. CONTACT US</h2>
          <p>For privacy questions, concerns, or requests:</p>
          <p>
            <strong>Privacy Contact:</strong><br />
            Email: victor@omohasolutions.com<br />
            Subject Line: "Privacy Inquiry - SaveMe"
          </p>
          <p>
            <strong>Mailing Address:</strong><br />
            Omoha Solutions<br />
            1300 South Blvd STE 30101<br />
            Charlotte, NC 28203<br />
            United States
          </p>
          <p><strong>Response Time:</strong> Within 30 days</p>

          <div className="mt-12 p-6 bg-muted rounded-lg">
            <h3 className="text-lg font-bold">SUMMARY: KEY PRIVACY POINTS</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><strong>Voice Data:</strong> Raw realtime audio is not intentionally stored by SaveMe; conversation captions and session metadata can be stored</li>
              <li><strong>Data Sharing:</strong> Only with service providers (Firebase / Google Cloud, Google Gemini, OpenAI, ElevenLabs, Stripe) - we NEVER sell data</li>
              <li><strong>Your Rights:</strong> Access, correct, delete, export your data anytime</li>
              <li><strong>Security:</strong> Encrypted in transit and at rest, industry-standard protection</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-4">
              <strong>Document Version:</strong> 1.0<br />
              <strong>Effective Date:</strong> January 15, 2026<br />
              <strong>Last Reviewed:</strong> November 17, 2025
            </p>
            <p className="text-xs text-muted-foreground mt-2 italic">
              This Privacy Policy should be reviewed by a licensed attorney specializing in privacy law before public deployment.
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

export default PrivacyPolicy;
