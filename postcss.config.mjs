import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Resolve the Tailwind config by absolute path. The dev server may be launched
// from a parent directory, so we can't rely on Tailwind finding the config via
// process.cwd().
const here = dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    tailwindcss: { config: join(here, "tailwind.config.js") },
    autoprefixer: {},
  },
};
