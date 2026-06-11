import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1200px',
      },
    },
    extend: {
      fontFamily: {
        serif: ['var(--font-roboto-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-roboto)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-roboto-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Brand palette — see drafts/movie-recommender/README.md
        burgundy: {
          DEFAULT: '#9E0A71',
          light: '#FF80DF',
          lighter: '#FFCEF4',
        },
        orange: {
          DEFAULT: '#F17E00',
          light: '#FFC000',
          lighter: '#FFE0A9',
        },
        green: {
          DEFAULT: '#136A4A',
          light: '#3FAF66',
          lighter: '#9EDFA7',
        },
        blue: {
          DEFAULT: '#00568B',
          light: '#00B1D2',
          lighter: '#B2E6F1',
        },
        // Text scale — use named tokens, never opacity, on body copy.
        ink: {
          DEFAULT: '#303030',  // body — primary text
          heading: '#000000',  // headings — pure black
          muted: '#5C5C5C',    // descriptions, secondary body
          subtle: '#808080',   // meta info (dates, tags, captions)
        },
        // shadcn tokens, mapped to brand
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      letterSpacing: {
        heading: '0.005em',
      },
      typography: ({ theme }: { theme: (key: string) => unknown }) => {
        const join = (key: string) => {
          const v = theme(key);
          return Array.isArray(v) ? v.join(', ') : String(v);
        };
        return {
          DEFAULT: {
            css: {
              '--tw-prose-body': theme('colors.ink.DEFAULT'),
              '--tw-prose-headings': theme('colors.ink.heading'),
              '--tw-prose-links': theme('colors.burgundy.DEFAULT'),
              '--tw-prose-bold': theme('colors.ink.heading'),
              '--tw-prose-quotes': theme('colors.ink.muted'),
              '--tw-prose-quote-borders': theme('colors.burgundy.lighter'),
              '--tw-prose-code': theme('colors.burgundy.DEFAULT'),
              maxWidth: 'none',
              fontFamily: join('fontFamily.sans'),
              h1: { fontFamily: join('fontFamily.serif'), letterSpacing: '0.005em', lineHeight: 1.2, fontWeight: '700' },
              h2: { fontFamily: join('fontFamily.serif'), letterSpacing: '0.005em', lineHeight: 1.2, fontWeight: '700' },
              h3: { fontFamily: join('fontFamily.serif'), letterSpacing: '0.005em', lineHeight: 1.2, fontWeight: '700' },
              h4: { fontFamily: join('fontFamily.serif'), letterSpacing: '0.005em', lineHeight: 1.2, fontWeight: '700' },
              // Semibold reads as clearly bolder than 400 body without
              // competing with the 700 headings.
              strong: { fontWeight: '600' },
              'code::before': { content: 'none' },
              'code::after': { content: 'none' },
            },
          },
        };
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
};

export default config;
