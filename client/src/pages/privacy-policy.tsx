export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-display font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <section className="space-y-8 text-sm leading-relaxed text-foreground/80">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Overview</h2>
            <p>
              ParlayPost ("we", "us", or "our") is a personal sports betting tracker that allows users to log
              bets via SMS text message and view their performance on a dashboard. This Privacy Policy explains
              what data we collect, how we use it, and your rights regarding that data.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account information:</strong> Your name and email address when you register.</li>
              <li><strong>Bet data:</strong> Bet amounts, teams, lines, odds, and results that you submit.</li>
              <li><strong>Phone number:</strong> If you use SMS to log bets, your phone number is received via Twilio's webhook and used solely to identify your account.</li>
              <li><strong>Usage data:</strong> Basic server logs (request paths, timestamps) for debugging purposes.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide the bet tracking service and display your dashboard.</li>
              <li>To parse SMS messages and log bets to your account.</li>
              <li>To calculate and display profit/loss statistics and group leaderboards.</li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> sell, share, rent, or transfer your personal information to any
              third parties. We do <strong>not</strong> use your data for marketing or advertising purposes.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">SMS Messaging</h2>
            <p>
              If you opt in to SMS bet logging, you consent to sending text messages to ParlayPost's phone
              number. Message and data rates may apply. We use Twilio to process inbound SMS messages.
              Your phone number is stored only to associate messages with your account and to send
              confirmation replies. You can opt out at any time by texting <strong>STOP</strong>.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Data Storage & Security</h2>
            <p>
              Your data is stored in a secure PostgreSQL database. We take reasonable precautions to protect
              your information, but no method of transmission over the internet is 100% secure.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Data Retention & Deletion</h2>
            <p>
              Your data is retained as long as your account is active. To request deletion of your account
              and all associated data, contact us at the email below.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Third-Party Services</h2>
            <p>
              ParlayPost uses the following third-party services:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Twilio</strong> — for SMS processing (<a href="https://www.twilio.com/en-us/legal/privacy" className="text-primary underline" target="_blank" rel="noreferrer">Twilio Privacy Policy</a>)</li>
              <li><strong>The Odds API</strong> — for live sports odds data (read-only, no personal data shared)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Contact</h2>
            <p>
              If you have questions about this policy or wish to request data deletion, please contact us at{" "}
              <a href="mailto:hello@parlaypost.com" className="text-primary hover:underline">hello@parlaypost.com</a>.
            </p>
          </div>
        </section>
        <div className="mt-12 pt-8 border-t border-border/50 flex gap-6 text-xs text-muted-foreground">
          <a href="/terms" className="hover:text-foreground transition-colors">Terms &amp; Conditions</a>
          <a href="/" className="hover:text-foreground transition-colors">Back to ParlayPost</a>
        </div>
      </div>
    </div>
  );
}
