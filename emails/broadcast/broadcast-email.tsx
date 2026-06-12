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
  Section,
  Text,
} from '@react-email/components';

export type BroadcastVariant = 'standard' | 'minimal';

export interface BroadcastImageBlock {
  type: 'image';
  src: string;
  alt?: string;
  caption?: string | null;
}

export interface BroadcastAuthor {
  name: string;
  /** Absolute URL to a square avatar. */
  avatarUrl?: string;
}

export interface BroadcastEmailProps {
  variant?: BroadcastVariant;
  /** Used for the email preview text + <title>. */
  subject: string;
  /** Opening paragraph(s). Blank lines split into separate paragraphs. */
  intro?: string;
  /** Short highlight lines rendered as a list. */
  highlights?: string[];
  /** Ordered image blocks (article photos + chart PNGs). */
  blocks?: BroadcastImageBlock[];
  /** Canonical article URL for the "Read on the web" button. */
  articleUrl: string;
  author: BroadcastAuthor;
  /** Optional Stripe tip link — coffee CTA hidden when omitted. */
  tipUrl?: string;
  siteUrl: string;
}

/**
 * Reusable broadcast email. Composed from structured fields in the admin
 * publish flow and rendered to HTML for Resend. Two variants:
 *   standard — branded header image
 *   minimal  — text wordmark, lighter chrome
 *
 * The signature (author avatar + name) and the buy-me-a-coffee line are always
 * appended; the unsubscribe footer uses Resend's {{{RESEND_UNSUBSCRIBE_URL}}}
 * placeholder, substituted on send.
 */
export function BroadcastEmail({
  variant = 'standard',
  subject,
  intro,
  highlights = [],
  blocks = [],
  articleUrl,
  author,
  tipUrl,
  siteUrl,
}: BroadcastEmailProps) {
  const introParas = (intro ?? '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={body}>
        <Container style={container}>
          {variant === 'standard' ? (
            <Img
              src={`${siteUrl}/brand/htu-email-header.png`}
              alt="Horse to Unicorn"
              width="560"
              height="112"
              style={headerImg}
            />
          ) : (
            <Text style={wordmark}>Horse to Unicorn</Text>
          )}
          <Hr style={hr} />

          <Text style={heading}>{subject}</Text>

          {introParas.map((p, i) => (
            <Text key={i} style={paragraph}>
              {p}
            </Text>
          ))}

          {highlights.length > 0 ? (
            <Section style={highlightBox}>
              {highlights.map((h, i) => (
                <Text key={i} style={highlightItem}>
                  <span style={bullet}>—</span> {h}
                </Text>
              ))}
            </Section>
          ) : null}

          {blocks.map((b, i) => (
            <Section key={i} style={{ margin: '20px 0' }}>
              <Img src={b.src} alt={b.alt ?? ''} width="520" style={blockImg} />
              {b.caption ? <Text style={caption}>{b.caption}</Text> : null}
            </Section>
          ))}

          <Button href={articleUrl} style={button}>
            Read on the web →
          </Button>

          <Hr style={hr} />

          {/* Signature */}
          <Section style={sigRow}>
            {author.avatarUrl ? (
              <Img
                src={author.avatarUrl}
                alt={author.name}
                width="44"
                height="44"
                style={sigAvatar}
              />
            ) : null}
            <Text style={sigName}>{author.name}</Text>
          </Section>

          {tipUrl ? (
            <Text style={tipLine}>
              If you liked this,{' '}
              <Link href={tipUrl} style={tipLink}>
                ☕ buy me a coffee
              </Link>
              .
            </Text>
          ) : null}

          <Hr style={hr} />
          <Text style={footer}>
            You&apos;re getting this because you subscribed at{' '}
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

export default BroadcastEmail;

// -- styles --------------------------------------------------------------

const body = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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

const wordmark = {
  fontSize: '13px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: '#9E0A71',
  fontWeight: 600,
  margin: '4px 0',
};

const heading = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: '30px',
  letterSpacing: '0.005em',
  lineHeight: '1.2',
  margin: '8px 0 16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '12px 0',
};

const highlightBox = {
  borderLeft: '3px solid #9E0A71',
  backgroundColor: '#FBF1F8',
  padding: '12px 16px',
  margin: '20px 0',
};

const highlightItem = {
  fontSize: '15px',
  lineHeight: '1.55',
  margin: '6px 0',
  color: '#303030',
};

const bullet = {
  color: '#9E0A71',
  fontWeight: 700,
};

const blockImg = {
  width: '100%',
  height: 'auto',
  display: 'block',
  borderRadius: '6px',
};

const caption = {
  fontSize: '12px',
  lineHeight: '1.5',
  color: '#808080',
  textAlign: 'center' as const,
  margin: '6px 0 0',
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

const sigRow = {
  margin: '4px 0',
};

const sigAvatar = {
  borderRadius: '9999px',
  display: 'inline-block',
  verticalAlign: 'middle',
  marginRight: '10px',
  border: '1px solid #EEE6EC',
};

const sigName = {
  display: 'inline-block',
  verticalAlign: 'middle',
  fontSize: '15px',
  fontWeight: 600,
  color: '#1A1A1A',
  margin: 0,
};

const link = {
  color: '#9E0A71',
  textDecoration: 'underline',
};

const tipLine = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#666',
  margin: '16px 0 0',
};

const tipLink = {
  color: '#9E0A71',
  textDecoration: 'underline',
  fontWeight: 500,
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
