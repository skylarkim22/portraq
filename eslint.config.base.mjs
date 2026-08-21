import tsParser from "@typescript-eslint/parser";

export const baseRules = {
  files: ["**/*.{ts,tsx}"],
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
  rules: {
    "func-style": ["error", "expression"],
    "prefer-arrow-callback": "error",
  },
};

export const baseIgnores = {
  ignores: ["**/dist/**", "**/coverage/**", "**/node_modules/**", "**/*.tsbuildinfo"],
};
