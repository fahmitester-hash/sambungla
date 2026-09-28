import Link from "next/link";
import MarketingNav from "@/components/marketing-nav";
import ToneDemo from "@/components/tone-demo";

const HERO_FEATURES = [
  {
    title: "Learns your voice over time",
    description:
      "Every post you publish teaches it something — sentence rhythm, favorite phrases, how you sign off. By your fourth or fifth post, drafts stop needing much editing at all.",
    graphic: "voice" as const,
  },
  {
    title: "Set a time, then forget about it",
    description:
      "Pick a slot and walk away. Your draft publishes itself straight to LinkedIn — no reminder notification to act on, no copying and pasting at 9am.",
    graphic: "clock" as const,
  },
  {
    title: "Your account stays yours",
    description:
      "Publishing runs through LinkedIn's official API, with your explicit permission. No scraping, no bot behavior, nothing that puts your profile at risk.",
    graphic: "shield" as const,
  },
];

const MORE_FEATURES = [
  {
    title: "Three tones, one idea",
    description: "Corporate English, humble local, or full Manglish — pick per post, not per account.",
  },
  {
    title: "Sounds like Klang Valley, not Silicon Valley",
    description: "Tuned for how Malaysian professionals actually write, not translated hustle-speak.",
  },
  {
    title: "Fast, wherever you're posting from",
    description: "Runs close to Malaysia on Cloudflare's network, not routed through a distant server.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Drop in a raw idea",
    description: "A half-formed thought, a work update, a lesson learned — however rough.",
  },
  {
    number: "02",
    title: "Pick your tone",
    description: "Corporate English, humble local, or Manglish. Generated in seconds.",
  },
  {
    number: "03",
    title: "Schedule and forget",
    description: "Set a time. It publishes itself, straight to LinkedIn.",
  },
];

const FAQS = [
  {
    question: "Is this safe for my LinkedIn account?",
    answer:
      "Yes. Publishing goes through LinkedIn's official API with your explicit permission — the same sanctioned method LinkedIn itself provides for scheduling tools. No scraping, no fake browser sessions, no automation that mimics human clicking.",
  },
  {
    question: "Will my posts actually sound like Manglish, or just token slang?",
    answer:
      "The Manglish tone is tuned for natural code-switching used by real Malaysian founders and professionals — discourse particles used sparingly, real local business context, not a caricature stacked with slang on every line.",
  },
  {
    question: "Where is my data stored?",
    answer:
      "On Cloudflare D1, running on Cloudflare's edge network. Your content isn't routed through a distant central server before reaching you.",
  },
  {
    question: "Can I review a post before it goes out?",
    answer:
      "Yes. Every generated post sits as a draft you can edit freely until 15 minutes before its scheduled time, which locks it so nothing changes mid-publish.",
  },
];

function FeatureGraphic({ kind }: { kind: "voice" | "clock" | "shield" }) {
  if (kind === "voice") {
    return (
      <svg viewBox="0 0 200 120" className="h-full w-full">
        <g stroke="#0B0F0E" strokeLinecap="round">
          {[0.3, 0.55, 0.8, 0.5, 0.95, 0.4, 0.7, 1, 0.6, 0.35].map((h, i) => (
            <line
              key={i}
              x1={20 + i * 18}
              x2={20 + i * 18}
              y1={60 - (h * 40)}
              y2={60 + (h * 40)}
              strokeWidth="6"
              opacity={0.15 + (i / 10) * 0.75}
            />
          ))}
        </g>
      </svg>
    );
  }

  if (kind === "clock") {
    return (
      <svg viewBox="0 0 200 120" className="h-full w-full">
        <circle cx="100" cy="60" r="42" fill="none" stroke="#0B0F0E" strokeWidth="2" opacity="0.15" />
        <circle cx="100" cy="60" r="42" fill="none" stroke="#0B0F0E" strokeWidth="3" strokeDasharray="20 500" strokeLinecap="round" />
        <line x1="100" y1="60" x2="100" y2="34" stroke="#0B0F0E" strokeWidth="3" strokeLinecap="round" />
        <line x1="100" y1="60" x2="120" y2="66" stroke="#0B0F0E" strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="60" r="3.5" fill="#0B0F0E" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 200 120" className="h-full w-full">
      <path
        d="M100 22 L134 34 V62 C134 82 119 96 100 102 C81 96 66 82 66 62 V34 Z"
        fill="none"
        stroke="#0B0F0E"
        strokeWidth="2.5"
        opacity="0.2"
      />
      <path d="M84 61 L95 72 L118 47" fill="none" stroke="#0B0F0E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-paper font-sans text-ink">
      <MarketingNav />

      {/* Hero */}
      <section className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-24 pt-20 text-center md:pt-28">
        <h1 className="text-[2.75rem] font-semibold leading-[1.05] tracking-tight md:text-7xl">
          Post like yourself.
          <br />
          Every time.
        </h1>
        <p className="mt-6 max-w-copy text-lg text-ink/60 md:text-xl">
          Sambungla turns a rough idea into a LinkedIn post in the tone that
          actually fits how Malaysian professionals talk — then publishes it
          for you, on schedule.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-full bg-ink px-7 py-3 text-sm font-medium text-white transition-opacity hover:opacity-80"
          >
            Get started
          </Link>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-ink/70 transition-colors hover:text-ink"
          >
            See how it works ↓
          </a>
        </div>
      </section>

      {/* Dark reveal: the one bold moment */}
      <section className="bg-ink px-4 py-24 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
            One idea. Three ways to say it.
          </h2>
          <p className="mx-auto mt-4 max-w-copy text-white/55">
            The same update, rewritten for how you'd actually say it —
            not a single generic voice stretched three ways.
          </p>
        </div>

        <div className="mt-14">
          <ToneDemo />
        </div>
      </section>

      {/* Hero features: alternating rows */}
      <section className="mx-auto max-w-5xl px-4 py-24">
        <div className="flex flex-col gap-20">
          {HERO_FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className={`flex flex-col items-center gap-10 md:flex-row md:gap-16 ${
                index % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div className="flex-1">
                <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  {feature.title}
                </h3>
                <p className="mt-4 max-w-copy text-ink/60">{feature.description}</p>
              </div>
              <div className="flex h-40 w-full max-w-xs flex-1 items-center justify-center rounded-3xl bg-mist p-8 md:h-52">
                <FeatureGraphic kind={feature.graphic} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* And there's more: quiet bento */}
      <section className="border-t border-ink/10 bg-white px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-semibold tracking-tight text-ink/80">
            And there's more
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-ink/10 sm:grid-cols-3">
            {MORE_FEATURES.map((feature) => (
              <div key={feature.title} className="bg-white p-7">
                <h3 className="text-[15px] font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-ink/55">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
            How it works
          </h2>
          <div className="relative mt-16 grid grid-cols-1 gap-12 md:grid-cols-3">
            <div
              className="absolute left-0 right-0 top-5 hidden h-px bg-ink/10 md:block"
              aria-hidden="true"
            />
            {STEPS.map((step) => (
              <div key={step.number} className="relative text-center md:text-left">
                <span className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-medium text-white md:bg-paper md:text-ink md:ring-1 md:ring-ink/15">
                  {step.number.replace("0", "")}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-ink/60">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — placeholder, kept intentionally quiet */}
      <section className="border-t border-ink/10 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-xl font-semibold tracking-tight text-ink/80">
            From professionals using it
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-dashed border-ink/15 p-6">
                <p className="text-sm italic text-ink/35">
                  Replace with a real customer quote before launch — do not
                  publish placeholder testimonials as genuine.
                </p>
                <p className="mt-4 text-xs font-medium text-ink/35">
                  Name Surname — Role, Company
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Simple pricing
          </h2>
          <p className="mt-3 text-ink/60">One plan. Everything included.</p>

          <div className="mx-auto mt-10 max-w-sm rounded-3xl bg-white p-9 text-left shadow-[0_20px_50px_-20px_rgba(11,15,14,0.15)] ring-1 ring-ink/10">
            <p className="text-sm font-medium text-accent">Standard</p>
            <p className="mt-2 text-5xl font-semibold tracking-tight">
              RM99<span className="text-lg font-normal text-ink/45"> /mo</span>
            </p>
            <ul className="mt-7 flex flex-col gap-3 text-sm text-ink/70">
              <li>Unlimited AI-generated posts</li>
              <li>All three tone styles</li>
              <li>One-tap LinkedIn scheduling</li>
              <li>Learned writing style memory</li>
              <li>Edit lock protection</li>
            </ul>
            <Link
              href="/login"
              className="mt-8 block rounded-full bg-ink px-6 py-3 text-center text-sm font-medium text-white transition-opacity hover:opacity-80"
            >
              Get started
            </Link>
          </div>
          <p className="mt-4 text-xs text-ink/40">
            Pricing shown is a starting placeholder — confirm before launch.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-ink/10 px-4 py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Common questions
          </h2>
          <div className="mt-10 flex flex-col divide-y divide-ink/10">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-medium">
                  {faq.question}
                  <span className="ml-4 shrink-0 text-ink/35 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink/60">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-24 text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
          Start posting like yourself, consistently.
        </h2>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-full bg-ink px-7 py-3 text-sm font-medium text-white transition-opacity hover:opacity-80"
        >
          Get started
        </Link>
      </section>

      <footer className="border-t border-ink/10 px-4 py-10 text-center text-xs text-ink/40">
        © {new Date().getFullYear()} Sambungla. Built for the Malaysian market.
      </footer>
    </div>
  );
}
