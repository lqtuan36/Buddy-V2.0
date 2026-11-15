import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import path from 'path';
import { defineConfig } from 'vite';

function resolveShortGitCommit(): string {
  if (process.env.VITE_GIT_COMMIT && process.env.VITE_GIT_COMMIT.trim()) {
    return process.env.VITE_GIT_COMMIT.trim().slice(0, 12);
  }
  if (process.env.GITHUB_SHA && process.env.GITHUB_SHA.trim()) {
    return process.env.GITHUB_SHA.trim().slice(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'local-preview';
  }
}

export default defineConfig(() => {
  const buildTime =
    process.env.VITE_BUILD_TIME && process.env.VITE_BUILD_TIME.trim()
      ? process.env.VITE_BUILD_TIME.trim()
      : new Date().toISOString();
  const gitCommit = resolveShortGitCommit();

  return {
    plugins: [react(), tailwindcss()],
    define: {
      __BUDDY_BUILD_TIME__: JSON.stringify(buildTime),
      __BUDDY_GIT_COMMIT__: JSON.stringify(gitCommit),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
