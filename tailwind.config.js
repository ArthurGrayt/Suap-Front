/** @type {import('tailwindcss').Config} */
// Configura o Tailwind/NativeWind com a paleta institucional verde do IF
module.exports = {
  // Define os caminhos onde as classes utilitárias serão escaneadas
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  // Usa o preset padrão do NativeWind v4
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Paleta de cores baseada no verde institucional (#004525 / #195e38) e neutros esverdeados
      colors: {
        "primary": "#004525",
        "outline": "#707971",
        "secondary": "#1b6d24",
        "on-secondary-fixed": "#002204",
        "error-container": "#ffdad6",
        "surface-tint": "#286a43",
        "secondary-fixed": "#a3f69c",
        "on-primary-fixed": "#00210f",
        "surface-container-lowest": "#ffffff",
        "primary-container": "#195e38",
        "on-primary-fixed-variant": "#06522d",
        "surface-container-low": "#eef3ef",
        "on-primary-container": "#91d5a5",
        "outline-variant": "#bfc9bf",
        "on-primary": "#ffffff",
        "secondary-container": "#a0f399",
        "tertiary": "#003f62",
        "surface": "#f6f8f6",
        "tertiary-fixed-dim": "#93ccff",
        "secondary-fixed-dim": "#88d982",
        "on-tertiary-fixed": "#001d31",
        "tertiary-fixed": "#cce5ff",
        "surface-container-highest": "#cedbd1",
        "inverse-on-surface": "#edf2ee",
        "on-secondary-container": "#217128",
        "surface-bright": "#fafcfa",
        "on-tertiary-fixed-variant": "#004b73",
        "surface-dim": "#c9d6cc",
        "on-tertiary": "#ffffff",
        "inverse-primary": "#91d6a5",
        "on-surface-variant": "#3d4a40",
        "primary-fixed-dim": "#91d6a5",
        "error": "#ba1a1a",
        "inverse-surface": "#263229",
        "surface-container-high": "#d9e4dc",
        "primary-fixed": "#adf2c0",
        "tertiary-container": "#005785",
        "surface-container": "#e4ece6",
        "on-background": "#141d17",
        "on-surface": "#141d17",
        "on-secondary-fixed-variant": "#005312",
        "on-secondary": "#ffffff",
        "on-tertiary-container": "#92ccff",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        "background": "#f6f8f6",
        "surface-variant": "#d4dfd6",
        // Tokens semânticos de atenção (âmbar) para prazos da semana
        "warning": "#9a5b00",
        "warning-container": "#fef0d5",
        "on-warning-container": "#5c3500"
      }
    },
  },
  plugins: [],
}
