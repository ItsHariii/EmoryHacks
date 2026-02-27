# Ovi Landing Page — Smoke Test

A React + Tailwind + Framer Motion landing site to validate demand for Ovi. When visitors click **"Download Early Access"** or **"Join the Waitlist"**, they see a modal asking for their email instead of going to an App Store. Uses Ovi's brand colors and smooth animations.

## Tech Stack

- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** (Ovi colors & design tokens)
- **Framer Motion** (scroll-triggered & hover animations)

## Quick Start

```bash
cd ovi-landing
npm install
npm run dev
```

Open http://localhost:5173

## Capturing Emails (Formspree)

1. Go to [formspree.io](https://formspree.io) and create a free account.
2. Create a new form and copy the form endpoint (e.g. `https://formspree.io/f/abcdefgh`).
3. In `src/App.tsx`, set:

```ts
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/yourformid'
```

4. Signups will appear in your Formspree dashboard.

## Deploying

```bash
npm run build
```

Output is in `dist/`. Deploy to:

| Platform | Steps |
|----------|--------|
| **Netlify** | `netlify deploy --prod` or connect repo |
| **Vercel** | `vercel` or connect repo |
| **GitHub Pages** | Push repo, enable Pages, build command: `npm run build`, output: `dist` |

## Metrics to Track

- **Click-through**: Visitors who click the CTA vs. total visitors.
- **Conversion**: Visitors who enter email and submit vs. visitors who open the modal.
- **Drop-off**: If clicks are high but signups are low, refine messaging or CTA.
