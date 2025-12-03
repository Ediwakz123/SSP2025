import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./index.html",
        "./src/**/*.{ts,tsx,js,jsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "sans-serif"],
                heading: ["Outfit", "sans-serif"],
            },
        },
    },
    plugins: [],
};

export default config;
