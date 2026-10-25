import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import vercelConfig from "./vercel.json" with { type: "json" };

// Security headers live in vercel.json; nitro copies them into the build output so prebuilt
// deploys (vercel deploy --prebuilt) get them too, not only Vercel-side builds.
const securityHeaders = Object.fromEntries(vercelConfig.headers[0]!.headers.map((h) => [h.key, h.value]));

export default defineConfig(({ command }) => ({
  resolve: { dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-start"] },
  plugins: [
    tailwindcss(),
    tsConfigPaths(),
    tanstackStart({
      importProtection: { behavior: "error", client: { files: ["**/server/**"], specifiers: ["server-only"] } },
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
    }),
    ...(command === "build" ? [nitro({ preset: "vercel", routeRules: { "/**": { headers: securityHeaders } } })] : []),
    viteReact(),
  ],
}));
