import { defineConfig } from 'vitest/config';
import path from 'path';

const root = import.meta.dirname;

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['lib/**/*.ts'],
      exclude: ['lib/prisma.ts'],
    },
  },
  resolve: {
    // Mirrors tsconfig "@/*": ["./src/*", "./*"]. Vite aliases do not fall back,
    // so the src/ subtree must be listed before the catch-all.
    alias: [
      { find: /^@\/app\//, replacement: path.resolve(root, 'src/app') + '/' },
      { find: /^@\//, replacement: root + '/' },
    ],
  },
});
