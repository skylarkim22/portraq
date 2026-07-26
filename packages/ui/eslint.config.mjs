import { defineConfig } from "eslint/config";
import { baseRules, baseIgnores } from "../../eslint.config.base.mjs";

export default defineConfig([
  baseRules,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@supabase/*", "next/navigation", "next/router"],
              message:
                "packages/ui는 Supabase·라우팅을 가질 수 없습니다 (AGENTS.md 모노레포 패키지 역할).",
            },
          ],
        },
      ],
    },
  },
  baseIgnores,
  { ignores: ["storybook-static/**", ".storybook/**"] },
]);
