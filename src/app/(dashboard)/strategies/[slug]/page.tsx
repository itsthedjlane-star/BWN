import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { sportEmoji, formatDate } from "@/lib/utils";

export default async function StrategyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const strategy = await prisma.strategy.findUnique({
    where: { slug },
    include: { author: { select: { name: true } } },
  });

  if (!strategy) {
    notFound();
  }

  // Simple MDX-like rendering for markdown content
  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("### ")) {
        return (
          <h3 key={i} className="text-lg font-bold text-white mt-6 mb-2">
            {line.replace("### ", "")}
          </h3>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={i} className="text-xl font-bold text-white mt-8 mb-3">
            {line.replace("## ", "")}
          </h2>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h1 key={i} className="text-2xl font-bold text-white mt-8 mb-4">
            {line.replace("# ", "")}
          </h1>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <li key={i} className="text-zinc-300 ml-4 list-disc">
            {line.replace("- ", "")}
          </li>
        );
      }
      if (line.startsWith("> ")) {
        return (
          <blockquote
            key={i}
            className="border-l-2 border-[#00FF87] pl-4 text-zinc-400 italic my-3"
          >
            {line.replace("> ", "")}
          </blockquote>
        );
      }
      if (line.trim() === "") {
        return <br key={i} />;
      }
      // Bold text
      const formatted = line.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="text-white font-semibold">$1</strong>'
      );
      return (
        <p
          key={i}
          className="text-zinc-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/strategies">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        {strategy.sport ? (
          <Badge>
            {sportEmoji(strategy.sport)} {strategy.sport.replace(/_/g, " ")}
          </Badge>
        ) : (
          <Badge variant="info">General</Badge>
        )}
      </div>

      <article>
        <h1 className="text-3xl font-bold text-white mb-2">
          {strategy.title}
        </h1>
        <p className="text-sm text-zinc-500 mb-8">
          By {strategy.author.name ?? "Unknown"} &middot;{" "}
          {formatDate(strategy.createdAt)}
        </p>

        <Card>
          <CardContent className="pt-6 space-y-1">
            {renderContent(strategy.contentMdx)}
          </CardContent>
        </Card>
      </article>
    </div>
  );
}
