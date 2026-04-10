interface TipAlertPayload {
  id: string;
  sport: string;
  event: string;
  pick: string;
  odds: string;
  confidence: number;
  stake: number;
  authorName: string | null;
}

const SPORT_EMOJI: Record<string, string> = {
  FOOTBALL: "\u26BD",
  HORSE_RACING: "\uD83C\uDFC7",
  GREYHOUND_RACING: "\uD83D\uDC15",
  CRICKET: "\uD83C\uDFCF",
  TENNIS: "\uD83C\uDFBE",
  DARTS: "\uD83C\uDFAF",
  GOLF: "\u26F3",
};

export async function sendTipAlert(tip: TipAlertPayload): Promise<void> {
  const webhookUrl = process.env.DISCORD_TIP_WEBHOOK_URL;
  if (!webhookUrl) return;

  const siteUrl = process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL ?? "";
  const tipUrl = siteUrl ? `${siteUrl.replace(/\/$/, "")}/tips` : null;
  const emoji = SPORT_EMOJI[tip.sport] ?? "\uD83C\uDFAF";
  const stars = "\u2605".repeat(tip.confidence) + "\u2606".repeat(5 - tip.confidence);

  const body = {
    username: "BWN Tips",
    embeds: [
      {
        title: `${emoji} New tip: ${tip.pick}`,
        url: tipUrl,
        description: tip.event,
        color: 0x00ff87,
        fields: [
          { name: "Odds", value: tip.odds, inline: true },
          { name: "Stake", value: `${tip.stake}u`, inline: true },
          { name: "Confidence", value: stars, inline: true },
        ],
        footer: {
          text: tip.authorName ? `Posted by ${tip.authorName}` : "BWN",
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`Discord webhook failed: ${res.status}`);
    }
  } catch (err) {
    console.error("Discord webhook error:", err);
  }
}
