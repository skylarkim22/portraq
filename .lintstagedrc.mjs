export default {
  "apps/web/**/*.{ts,tsx}": ["eslint --config apps/web/eslint.config.mjs --fix"],
  "packages/ui/**/*.{ts,tsx}": ["eslint --config packages/ui/eslint.config.mjs --fix"],
  "packages/lib/**/*.ts": ["eslint --config packages/lib/eslint.config.mjs --fix"],
};
