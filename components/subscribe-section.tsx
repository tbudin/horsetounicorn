import { SubscribeForm } from './subscribe-form';

export function SubscribeSection() {
  return (
    <section
      id="subscribe"
      className="panel-inner-glow my-16 rounded-lg bg-burgundy text-white p-8 md:p-12"
    >
      <div className="max-w-2xl mx-auto text-center flex flex-col items-center">
        <p className="text-[11px] uppercase tracking-wider text-white mb-2 data-num">
          If someone forwarded this to you
        </p>
        <h2 className="font-serif text-2xl md:text-3xl tracking-heading text-white mb-3">
          It's time to subscribe.
        </h2>
        <p className="text-sm text-white mb-6 leading-relaxed">
          One email a week — marketing and systems thinking for technical founders and
          operators. No fluff, no spam, unsubscribe in one click.
        </p>
        <SubscribeForm inverted />
      </div>
    </section>
  );
}
