import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-sunken": "var(--surface-sunken)",
        "ink-primary": "var(--ink-primary)",
        "ink-secondary": "var(--ink-secondary)",
        "ink-tertiary": "var(--ink-tertiary)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-soft": "var(--accent-soft)",
        "rating-gold": "var(--rating-gold)",
        success: "var(--success)",
        error: "var(--error)",
        border: "var(--border)",
        background: "var(--background)",
        "surface-muted": "var(--surface-muted)",
        text: "var(--text)",
        muted: "var(--muted)",
        line: "var(--line)",
        "accent-strong": "var(--accent-strong)",
        warning: "var(--warning)",
      },
      borderRadius: {
        card: "16px",
        control: "12px",
        avatar: "10px",
      },
      boxShadow: {
        card: "0 16px 44px rgba(5, 4, 3, 0.26), inset 0 1px 0 rgba(246, 237, 222, 0.04)",
        raised: "0 18px 60px rgba(5, 4, 3, 0.46), inset 0 1px 0 rgba(246, 237, 222, 0.06)",
        soft: "0 16px 44px rgba(5, 4, 3, 0.26), inset 0 1px 0 rgba(246, 237, 222, 0.04)",
      },
      fontFamily: {
        display: "var(--font-display)",
        ui: "var(--font-ui)",
      },
    },
  },
};

export default config;
