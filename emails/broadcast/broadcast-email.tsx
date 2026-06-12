import {
  Body,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';

export type BroadcastVariant = 'standard' | 'minimal';

export type EmailBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; src: string; alt?: string; caption?: string | null }
  | { type: 'highlights'; items: string[] };

export interface BroadcastEmailProps {
  variant?: BroadcastVariant;
  /** Email preview text + <title>. */
  subject: string;
  /** Ordered body blocks — prose, images/charts, highlight lists, interleaved. */
  blocks?: EmailBlock[];
  /** Absolute cover URL for the read-on-web card. */
  coverUrl?: string;
  articleTitle: string;
  articleUrl: string;
  /** First-name sign-off, rendered as "— {signoff}". */
  signoff?: string;
  /** Optional Stripe tip link — coffee CTA hidden when omitted. */
  tipUrl?: string;
  siteUrl: string;
}

/**
 * Reusable broadcast email. The body is an ordered list of blocks composed in
 * the admin, so images and chart snapshots sit inline rather than dumped at the
 * end. Closes with a "— {signoff}" line, a cover-image read-on-web card, and a
 * prominent buy-me-a-coffee CTA. No formal author block — it's just from Tom.
 */
export function BroadcastEmail({
  variant = 'standard',
  subject,
  blocks = [],
  coverUrl,
  articleTitle,
  articleUrl,
  signoff = 'Tom',
  tipUrl,
  siteUrl,
}: BroadcastEmailProps) {
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

          {blocks.map((block, i) => (
            <BodyBlock key={i} block={block} />
          ))}

          <Text style={signoffStyle}>— {signoff}</Text>

          {/* Read-on-web card: cover left, title + CTA right. */}
          <Link href={articleUrl} style={cardLink}>
            <Section style={card}>
              <Row>
                {coverUrl ? (
                  <Column style={cardCoverCell}>
                    <Img src={coverUrl} alt={articleTitle} width="150" style={cardCover} />
                  </Column>
                ) : null}
                <Column style={cardBodyCell}>
                  <Text style={cardKicker}>Read on the web</Text>
                  <Text style={cardTitle}>{articleTitle}</Text>
                  <Text style={cardCta}>Read the full article →</Text>
                </Column>
              </Row>
            </Section>
          </Link>

          {tipUrl ? (
            <Section style={tipBox}>
              <Text style={tipText}>
                If this was worth your time,{' '}
                <Link href={tipUrl} style={tipLink}>
                  ☕ buy me a coffee
                </Link>
                .
              </Text>
            </Section>
          ) : null}

          <Hr style={hr} />
          <Text style={footer}>
            You&apos;re getting this because you subscribed at{' '}
            <Link href={siteUrl} style={footerLink}>
              {siteUrl.replace(/^https?:\/\//, '')}
            </Link>
            .{' '}
            <Link href="{{{RESEND_UNSUBSCRIBE_URL}}}" style={footerLink}>
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

function BodyBlock({ block }: { block: EmailBlock }) {
  if (block.type === 'image') {
    return (
      <Section style={{ margin: '20px 0' }}>
        <Img src={block.src} alt={block.alt ?? ''} width="520" style={blockImg} />
        {block.caption ? <Text style={caption}>{block.caption}</Text> : null}
      </Section>
    );
  }
  if (block.type === 'highlights') {
    return (
      <Section style={highlightBox}>
        {block.items.map((h, i) => (
          <Text key={i} style={highlightItem}>
            <span style={bullet}>—</span> {h}
          </Text>
        ))}
      </Section>
    );
  }
  // text — split blank-line-separated paragraphs
  const paras = block.text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <>
      {paras.map((p, i) => (
        <Text key={i} style={paragraph}>
          {p}
        </Text>
      ))}
    </>
  );
}

// -- styles --------------------------------------------------------------

const body = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color: '#1A1A1A',
};

const container = { margin: '0 auto', padding: '40px 20px', maxWidth: '560px' };

const headerImg = { width: '100%', height: 'auto', display: 'block', margin: '0 0 8px' };

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

const paragraph = { fontSize: '16px', lineHeight: '1.6', margin: '12px 0' };

const signoffStyle = { fontSize: '16px', lineHeight: '1.6', margin: '20px 0 8px' };

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

const bullet = { color: '#9E0A71', fontWeight: 700 };

const blockImg = { width: '100%', height: 'auto', display: 'block', borderRadius: '6px' };

const caption = {
  fontSize: '12px',
  lineHeight: '1.5',
  color: '#808080',
  textAlign: 'center' as const,
  margin: '6px 0 0',
};

// read-on-web card
const cardLink = { textDecoration: 'none', color: 'inherit' };

const card = {
  border: '1px solid #EEE6EC',
  borderRadius: '10px',
  backgroundColor: '#FAF7F9',
  padding: '12px',
  margin: '24px 0',
};

const cardCoverCell = { width: '150px', verticalAlign: 'middle' as const, paddingRight: '14px' };

const cardCover = { width: '150px', height: 'auto', display: 'block', borderRadius: '6px' };

const cardBodyCell = { verticalAlign: 'middle' as const };

const cardKicker = {
  fontSize: '11px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: '#9E0A71',
  fontWeight: 600,
  margin: '0 0 4px',
};

const cardTitle = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: '18px',
  lineHeight: '1.25',
  color: '#0A0A0A',
  margin: '0 0 8px',
};

const cardCta = { fontSize: '14px', fontWeight: 600, color: '#9E0A71', margin: 0 };

// coffee
const tipBox = {
  textAlign: 'center' as const,
  margin: '24px 0 8px',
};

const tipText = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#303030',
  margin: 0,
};

const tipLink = { color: '#9E0A71', textDecoration: 'underline', fontWeight: 600 };

const hr = { borderColor: '#E8E8E8', margin: '24px 0' };

const footer = { color: '#808080', fontSize: '12px', lineHeight: '1.5' };

const footerLink = { color: '#9E0A71', textDecoration: 'underline' };
