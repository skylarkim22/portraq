import { defineConfig } from "eslint/config";
import { baseRules, baseIgnores } from "../../eslint.config.base.mjs";

export default defineConfig([
  baseRules,
  {
    files: ["**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              message: "packages/lib는 React에 의존할 수 없습니다 (AGENTS.md 모노레포 패키지 역할).",
            },
            {
              name: "react-dom",
              message: "packages/lib는 React에 의존할 수 없습니다.",
            },
          ],
        },
      ],
    },
  },
  baseIgnores,
]);
