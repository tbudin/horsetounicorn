/**
 * Inline JSON-LD structured data. Pass a single object or an array of
 * objects — they'll each be emitted as a separate <script> tag.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          // JSON.stringify already escapes </ — but we replace it as a defense in depth
          // against XSS via stringified content with literal "</script>".
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, '\\u003c'),
          }}
        />
      ))}
    </>
  );
}
