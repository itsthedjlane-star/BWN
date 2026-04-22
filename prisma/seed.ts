import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import { POLICY_VERSION } from "../src/lib/legal";

dotenv.config();

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const strategies = [
  {
    title: "Value Betting: Finding Edges the Bookies Miss",
    slug: "value-betting",
    sport: null,
    file: "value-betting.mdx",
  },
  {
    title: "Each-Way Racing Strategy",
    slug: "each-way-racing",
    sport: "HORSE_RACING" as const,
    file: "each-way-racing.mdx",
  },
  {
    title: "Lay the Draw: In-Play Football Strategy",
    slug: "lay-the-draw",
    sport: "FOOTBALL" as const,
    file: "lay-the-draw.mdx",
  },
  {
    title: "Tennis Betting: Surface & Form Analysis",
    slug: "tennis-surface-form",
    sport: "TENNIS" as const,
    file: "tennis-surface-form.mdx",
  },
  {
    title: "Bankroll Management: The Only Strategy That Matters",
    slug: "bankroll-management",
    sport: null,
    file: "bankroll-management.mdx",
  },
];

const sampleTips = [
  {
    sport: "FOOTBALL" as const,
    event: "Arsenal vs Manchester City - Premier League",
    pick: "Arsenal to win & BTTS - 7/2",
    reasoning:
      "Arsenal's home form this season is incredible - W12 D1 L0 at the Emirates. City have been vulnerable on the road, conceding in 8 of their last 10 away games. Arsenal's pressing game suits their home ground perfectly, and with Saka in the form of his life, I can see them nicking this. Both teams to score because City always create chances, even in defeat. 7/2 is massive value here.",
    odds: "7/2",
    oddsDecimal: 4.5,
    confidence: 4,
    stake: 2,
    source: "Own analysis",
  },
  {
    sport: "HORSE_RACING" as const,
    event: "14:30 Cheltenham - Handicap Chase",
    pick: "Desert Crown EW @ 8/1",
    reasoning:
      "Trainer in superb form (3 winners from last 7 runners). Horse has been freshened up since a wind op and drops back to a trip that suits. Course form of 1-2-1. Going is perfect for this horse who loves soft ground. Each-way value at 8/1 with 4 places.",
    odds: "8/1",
    oddsDecimal: 9.0,
    confidence: 3,
    stake: 1,
    source: "Racing Post analysis",
  },
  {
    sport: "TENNIS" as const,
    event: "Sinner vs Alcaraz - French Open SF",
    pick: "Alcaraz to win in 4 sets @ 3/1",
    reasoning:
      "Alcaraz's clay court movement has been sensational this tournament. Sinner struggles in best-of-5 on clay historically. Alcaraz dropped a set in both previous rounds but came through strong. I think he drops one early then takes control. The 4-set line at 3/1 is where the value is.",
    odds: "3/1",
    oddsDecimal: 4.0,
    confidence: 3,
    stake: 1.5,
    source: "Own analysis",
  },
  {
    sport: "FOOTBALL" as const,
    event: "Liverpool vs Chelsea - Premier League",
    pick: "Both Teams to Score - 4/5",
    reasoning:
      "BTTS has landed in 7 of Liverpool's last 10 home games and 8 of Chelsea's last 10 away. Both teams are leaky at the back but clinical in attack. 4/5 isn't massive odds but it's a near-certainty in this fixture. Low confidence because the odds are short, but the probability is high.",
    odds: "4/5",
    oddsDecimal: 1.8,
    confidence: 4,
    stake: 2,
    source: "Stats analysis",
  },
  {
    sport: "DARTS" as const,
    event: "Premier League Darts - Night 12",
    pick: "Luke Littler to win @ 5/4",
    reasoning:
      "Littler has been averaging over 100 in his last 5 PL matches. His opponent tonight has lost 3 in a row and is struggling with doubles. Littler's scoring power should be too much. 5/4 is generous for the form player in the competition.",
    odds: "5/4",
    oddsDecimal: 2.25,
    confidence: 4,
    stake: 1.5,
    source: "Own analysis",
  },
];

async function main() {
  console.log("Seeding database...");

  // Create admin user if not exists
  let adminUser = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        name: "Harry",
        email: "admin@bwn.com",
        role: "ADMIN",
        approved: true,
        ageConfirmedAt: new Date(),
        policyAcceptedAt: new Date(),
        policyVersionAccepted: POLICY_VERSION,
      },
    });
    console.log("Created admin user:", adminUser.name);
  }

  // Seed strategies
  const contentDir = path.join(process.cwd(), "content", "strategies");
  for (const strategy of strategies) {
    const existing = await prisma.strategy.findUnique({
      where: { slug: strategy.slug },
    });
    if (existing) {
      console.log(`Strategy "${strategy.title}" already exists, skipping.`);
      continue;
    }

    const filePath = path.join(contentDir, strategy.file);
    const content = fs.readFileSync(filePath, "utf-8");

    await prisma.strategy.create({
      data: {
        title: strategy.title,
        slug: strategy.slug,
        sport: strategy.sport,
        contentMdx: content,
        authorId: adminUser.id,
      },
    });
    console.log(`Created strategy: ${strategy.title}`);
  }

  // Seed sample tips
  const tipCount = await prisma.tip.count();
  if (tipCount === 0) {
    for (const tip of sampleTips) {
      await prisma.tip.create({
        data: {
          ...tip,
          authorId: adminUser.id,
        },
      });
      console.log(`Created tip: ${tip.pick}`);
    }
  } else {
    console.log(`${tipCount} tips already exist, skipping.`);
  }

  // Create sample invite codes
  const codeCount = await prisma.inviteCode.count();
  if (codeCount === 0) {
    for (let i = 0; i < 3; i++) {
      const code = `BWN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await prisma.inviteCode.create({ data: { code } });
      console.log(`Created invite code: ${code}`);
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
