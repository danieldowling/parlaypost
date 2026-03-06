export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-display font-bold mb-2">Terms &amp; Conditions</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <section className="space-y-8 text-sm leading-relaxed text-foreground/80">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Program Name &amp; Description</h2>
            <p>
              <strong>ParlayPost</strong> is a personal sports betting tracker. By texting a bet to the ParlayPost
              SMS number, you consent to receive automated text message confirmations acknowledging your logged bet.
              These messages are sent solely to confirm that your bet has been recorded in ParlayPost. No
              promotional or marketing messages will be sent.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">How to Use SMS Bet Logging</h2>
            <p>
              Text a bet in natural language to the ParlayPost number — for example:
              <em>"$50 Knicks -4.5"</em> or <em>"Lakers ML for $100"</em>. You will receive a single
              confirmation reply per message. Standard message and data rates apply.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Message &amp; Data Rates</h2>
            <p>
              Message and data rates may apply. ParlayPost does not charge for the service itself, but your
              mobile carrier may charge for SMS messages sent and received. Contact your carrier for details
              on your plan's messaging rates.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Message Frequency</h2>
            <p>
              You will receive one (1) reply message per SMS bet you send. Message frequency depends entirely
              on how often you text in a bet. ParlayPost does not send unsolicited messages.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Opt-Out Instructions</h2>
            <p>
              To stop receiving SMS messages from ParlayPost at any time, reply <strong>STOP</strong> to any
              message. You will receive one final confirmation that you have been unsubscribed and will receive
              no further messages.
            </p>
            <p className="mt-2">
              To re-enable SMS, simply text a bet to the ParlayPost number again.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Help &amp; Support</h2>
            <p>
              For help, reply <strong>HELP</strong> to any message or contact the app administrator directly
              through the ParlayPost dashboard. We will respond as soon as possible.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Acceptable Use</h2>
            <p>
              ParlayPost is intended for personal bet tracking only. It is not a gambling service and does not
              accept wagers or process payments. Users are responsible for complying with all applicable laws
              in their jurisdiction regarding sports betting.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Changes to These Terms</h2>
            <p>
              We may update these Terms &amp; Conditions from time to time. Continued use of the SMS service
              after any changes constitutes acceptance of the updated terms.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Contact</h2>
            <p>
              If you have questions about these terms, please contact the app administrator through the
              ParlayPost dashboard.
            </p>
          </div>
        </section>

        <div className="mt-12 pt-8 border-t border-border/50 flex gap-6 text-xs text-muted-foreground">
          <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="/" className="hover:text-foreground transition-colors">Back to ParlayPost</a>
        </div>
      </div>
    </div>
  );
}
