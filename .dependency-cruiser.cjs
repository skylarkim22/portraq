module.exports = {
  forbidden: [
    {
      name: "no-ui-boundary-violation",
      severity: "error",
      comment:
        "packages/ui는 apps/web 또는 Supabase에 의존할 수 없다 (AGENTS.md 모노레포 패키지 역할)",
      from: { path: "^packages/ui" },
      to: { path: "^apps/web|@supabase" },
    },
    {
      name: "no-lib-react",
      severity: "error",
      comment: "packages/lib는 React에 의존할 수 없다 (AGENTS.md 모노레포 패키지 역할)",
      from: { path: "^packages/lib" },
      to: { path: "^(react|react-dom)$" },
    },
    {
      name: "no-circular",
      severity: "error",
      comment: "순환 의존성 금지",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    tsConfig: { fileName: "tsconfig.base.json" },
    doNotFollow: { path: "node_modules" },
  },
};
