import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components';

export interface WelcomeEmailProps {
  siteUrl: string;
}

export function WelcomeEmail({ siteUrl }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Horse to Unicorn.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={heading}>Horse to Unicorn</Text>
          <Hr style={hr} />
          <Text style={paragraph}>Hi,</Text>
          <Text style={paragraph}>
            Thanks for subscribing. You'll get one email a week — marketing and systems
            thinking for technical founders and operators. No fluff, no spam.
          </Text>
          <Text style={paragraph}>
            While you wait for the next post, the archive lives at{' '}
            <Link href={siteUrl} style={link}>
              {siteUrl.replace(/^https?:\/\//, '')}
            </Link>
            .
          </Text>
          <Text style={paragraph}>— Tom</Text>
          <Hr style={hr} />
          <Text style={footer}>
            You're getting this because you subscribed at {siteUrl.replace(/^https?:\/\//, '')}.
            Unsubscribe links are in every newsletter.
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

const link = {
  color: '#9E0A71',
  textDecoration: 'underline',
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
