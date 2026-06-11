import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from '@react-email/components';

export interface DonationThanksEmailProps {
  /** Donor's first name when Stripe captures it; falls back to "friend". */
  firstName?: string;
  /** Formatted amount, e.g. "$5.00". */
  amount: string;
  /** Site origin used in copy + the header banner URL. */
  siteUrl: string;
  /**
   * When the donor isn't already on the subscriber list, the webhook
   * generates a one-click confirmation URL. Clicking it subscribes them
   * directly — the donation already proved they own the email address.
   */
  subscribeUrl?: string;
}

export function DonationThanksEmail({
  firstName,
  amount,
  siteUrl,
  subscribeUrl,
}: DonationThanksEmailProps) {
  const host = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const greeting = firstName ? firstName : 'friend';
  return (
    <Html>
      <Head />
      <Preview>Thanks for the coffee — it really does help.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Img
            src={`${siteUrl}/brand/htu-email-header.png`}
            alt="Horse to Unicorn"
            width="560"
            height="112"
            style={headerImg}
          />
          <Hr style={hr} />
          <Text style={paragraph}>Hi {greeting},</Text>
          <Text style={paragraph}>
            Thanks for the coffee — you just put <strong>{amount}</strong>{' '}
            toward keeping Horse to Unicorn ad-free, sponsor-free, and weird.
            That genuinely means a lot.
          </Text>
          <Text style={paragraph}>
            If you liked what you read, the best thing you can do (beyond a
            tip) is share it with someone who'd find it useful. The next
            article ships on schedule. Until then,{' '}
            <Link href={siteUrl} style={link}>
              {host}
            </Link>{' '}
            has the archive.
          </Text>

          {subscribeUrl ? (
            <>
              <Hr style={hr} />
              <Text style={paragraph}>
                One more thing — you're not on the newsletter yet. If you'd
                like the next post in your inbox too, you can subscribe with
                one click:
              </Text>
              <Button href={subscribeUrl} style={button}>
                Subscribe to the newsletter
              </Button>
              <Text style={paragraphSmall}>
                One email a week. Unsubscribe with one click in every
                newsletter.
              </Text>
            </>
          ) : null}

          <Text style={paragraph}>— Tom</Text>
          <Hr style={hr} />
          <Text style={footer}>
            Stripe handled the payment — your receipt comes from them
            separately. You're receiving this email because the donation
            checkout completed; no other use of your address. Reply to this
            email if you have any questions.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color: '#1A1A1A',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '560px',
};

const headerImg = {
  width: '100%',
  height: 'auto',
  display: 'block',
  margin: '0 0 8px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '12px 0',
};

const link = {
  color: '#9E0A71',
  textDecoration: 'underline',
};

const button = {
  background: '#9E0A71',
  color: '#ffffff',
  padding: '12px 20px',
  borderRadius: '6px',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: 500,
  textDecoration: 'none',
  margin: '8px 0 12px',
};

const paragraphSmall = {
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '4px 0 16px',
  color: '#666',
};

const hr = {
  borderColor: '#E8E8E8',
  margin: '24px 0',
};

const footer = {
  color: '#666',
  fontSize: '12px',
  lineHeight: '1.5',
};
