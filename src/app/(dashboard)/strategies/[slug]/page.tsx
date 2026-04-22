import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeSanitize from "rehype-sanitize";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { sportEmoji, formatDate } from "@/lib/utils";
import { mdxComponents } from "@/components/mdx";

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
          <CardContent className="pt-6">
            <MDXRemote
              source={strategy.contentMdx}
              components={mdxComponents}
              options={{
                mdxOptions: {
                  format: "md",
                  rehypePlugins: [rehypeSanitize],
                },
              }}
            />
          </CardContent>
        </Card>
      </article>
    </div>
  );
}
