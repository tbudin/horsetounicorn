// Author registry. Articles reference an author by name (the `author` field
// on ArticleMetadata); the profile data — photo, bio, signature, social
// links — lives here so we don't duplicate it on every article file.
//
// To add an author: drop an entry below, drop their photo + signature into
// /public/authors/, and set the `author` field on the article's metadata.

export interface AuthorLink {
  label: string;
  href: string;
}

export interface AuthorProfile {
  /** Display name. Must match the `author` field on ArticleMetadata. */
  name: string;
  /** Short role / tagline shown next to the name. */
  role?: string;
  /** One- or two-sentence bio shown in the article footer. */
  bio: string;
  /**
   * Path under /public to a square avatar (e.g. /authors/thomas.jpg).
   * When missing, the footer renders the author's initials in a circle.
   */
  avatar?: string;
  /**
   * Path under /public to a PNG signature with a transparent background.
   * When missing, the footer renders `signatureText` in a serif italic.
   */
  signature?: string;
  /** Plain-text fallback when no signature image is available. */
  signatureText?: string;
  /** External links (Twitter/X, LinkedIn, personal site, etc.). */
  links?: AuthorLink[];
}

export const DEFAULT_AUTHOR = 'Thomas Budin';

const AUTHORS: Record<string, AuthorProfile> = {
  'Thomas Budin': {
    name: 'Thomas Budin',
    role: 'Founder & writer, Horse to Unicorn',
    bio: 'Weekly marketing and systems thinking for technical founders and operators. The thesis: ship a 1.5× product with a 10× story.',
    // Drop /public/authors/thomas.jpg and /public/authors/thomas-signature.png
    // then uncomment these to enable. Until then the footer falls back to
    // initials + the signatureText below.
    // avatar: '/authors/thomas.jpg',
    // signature: '/authors/thomas-signature.png',
    signatureText: '— Thomas',
    links: [{ label: 'About', href: '/about' }],
  },
};

export function getAuthor(name?: string): AuthorProfile {
  const key = name ?? DEFAULT_AUTHOR;
  return AUTHORS[key] ?? AUTHORS[DEFAULT_AUTHOR];
}

export function listAuthors(): AuthorProfile[] {
  return Object.values(AUTHORS);
}
