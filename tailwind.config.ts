import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom zinc shades for dark theme
        background: '#09090b',    // zinc-950
        surface: '#18181b',       // zinc-900
        card: '#27272a',          // zinc-800
        border: '#3f3f46',        // zinc-700
        muted: '#52525b',         // zinc-600
        subtle: '#71717a',        // zinc-500
        secondary: '#a1a1aa',     // zinc-400
        primary: '#e4e4e7',       // zinc-200
        foreground: '#fafafa',    // zinc-50
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
