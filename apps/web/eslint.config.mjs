import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { baseRules, baseIgnores } from "../../eslint.config.base.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  baseRules,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["./*", "../*"],
              message:
                "상대경로 대신 '@/' 절대경로를 사용하세요 (AGENTS.md Import 컨벤션).",
            },
          ],
        },
      ],
    },
  },
  baseIgnores,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
