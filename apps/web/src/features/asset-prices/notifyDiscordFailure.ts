// KR/US 종가 배치 Cron 라우트가 실패했을 때 디스코드로 알린다.
// 예전 GitHub Actions 워크플로우의 실패 알림 단계와 같은 웹훅을 그대로 재사용한다.
// DISCORD_WEBHOOK_URL이 없으면 조용히 건너뛴다(로컬 개발 환경 등).

const DISCORD_EMBED_COLOR_RED = 15158332;

export const notifyDiscordFailure = async ({ title, description }: { title: string; description: string }) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{ title, description, color: DISCORD_EMBED_COLOR_RED }],
      }),
    });
  } catch (e) {
    // 알림 전송 실패가 배치 자체의 실패 응답을 가리지 않도록 로그만 남긴다.
    console.error(`[notifyDiscordFailure] 디스코드 알림 전송 실패: ${e instanceof Error ? e.message : String(e)}`);
  }
};
