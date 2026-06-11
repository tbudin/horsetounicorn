import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components';

export interface ConfirmSubscribeEmailProps {
  /** Absolute URL the user clicks to confirm the subscription. */
  confirmUrl: string;
  /** Site origin used in the footer copy. */
  siteUrl: string;
}

export function ConfirmSubscribeEmail({ confirmUrl, siteUrl }: ConfirmSubscribeEmailProps) {
  const host = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return (
    <Html>
      <Head />
      <Preview>One click to confirm your Horse to Unicorn subscription.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={heading}>Horse to Unicorn</Text>
          <Hr style={hr} />
          <Text style={paragraph}>Hi,</Text>
          <Text style={paragraph}>
            Tap the button below to confirm you want to receive Horse to Unicorn —
            one email a week on marketing and systems thinking for technical
            founders and operators.
          </Text>
          <Button href={confirmUrl} style={button}>
            Confirm my subscription
          </Button>
          <Text style={paragraph}>
            Or copy this link into your browser:
            <br />
            <Link href={confirmUrl} style={link}>
              {confirmUrl}
            </Link>
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            You're getting this because someone — hopefully you — entered this
            email address at {host}. If that wasn't you, just ignore this email
            and you won't be subscribed.
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

const heading = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: '28px',
  letterSpacing: '0.005em',
  margin: '0 0 8px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '12px 0',
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
  margin: '8px 0 16px',
};

const link = {
  color: '#9E0A71',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
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
