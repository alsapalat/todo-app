import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset URLs, so the same build works at the domain root or under a
  // repo subpath like https://<user>.github.io/todo-app/.
  base: './',
  server: {
    // Bind every interface so the dev server is reachable over Tailscale.
    host: true,
    port: 3000,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
