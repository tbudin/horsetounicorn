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

export interface PostBroadcastEmailProps {
  title: string;
  description: string;
  postUrl: string;
  siteUrl: string;
}

export function PostBroadcastEmail({
  title,
  description,
  postUrl,
  siteUrl,
}: PostBroadcastEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{description}</Preview>
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
          <Text style={heading}>{title}</Text>
          <Text style={paragraph}>{description}</Text>
          <Button href={postUrl} style={button}>
            Read on the web →
          </Button>
          <Text style={paragraphSmall}>
            (Charts are interactive on the site — they're not rendered in this email.)
          </Text>
          <Text style={paragraph}>— Tom</Text>
          <Hr style={hr} />
          <Text style={footer}>
            You're getting this because you subscribed at{' '}
            <Link href={siteUrl} style={link}>
              {siteUrl.replace(/^https?:\/\//, '')}
            </Link>
            .{' '}
            <Link href="{{{RESEND_UNSUBSCRIBE_URL}}}" style={link}>
              Unsubscribe
            </Link>
            .
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

const heading = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: '32px',
  letterSpacing: '0.005em',
  lineHeight: '1.2',
  margin: '8px 0 16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '12px 0',
};

const paragraphSmall = {
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '12px 0',
  color: '#666',
};

const button = {
  backgroundColor: '#9E0A71',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '500',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '16px 0',
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
