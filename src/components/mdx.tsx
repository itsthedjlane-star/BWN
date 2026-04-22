import type { ComponentProps } from "react";

export const mdxComponents = {
  h1: (props: ComponentProps<"h1">) => (
    <h1 className="text-2xl font-bold text-white mt-8 mb-4" {...props} />
  ),
  h2: (props: ComponentProps<"h2">) => (
    <h2 className="text-xl font-bold text-white mt-8 mb-3" {...props} />
  ),
  h3: (props: ComponentProps<"h3">) => (
    <h3 className="text-lg font-bold text-white mt-6 mb-2" {...props} />
  ),
  p: (props: ComponentProps<"p">) => (
    <p className="text-zinc-300 leading-relaxed mb-3" {...props} />
  ),
  ul: (props: ComponentProps<"ul">) => (
    <ul className="list-disc ml-6 space-y-1 my-3 text-zinc-300" {...props} />
  ),
  ol: (props: ComponentProps<"ol">) => (
    <ol className="list-decimal ml-6 space-y-1 my-3 text-zinc-300" {...props} />
  ),
  li: (props: ComponentProps<"li">) => (
    <li className="text-zinc-300" {...props} />
  ),
  blockquote: (props: ComponentProps<"blockquote">) => (
    <blockquote
      className="border-l-2 border-[#00FF87] pl-4 text-zinc-400 italic my-4"
      {...props}
    />
  ),
  strong: (props: ComponentProps<"strong">) => (
    <strong className="text-white font-semibold" {...props} />
  ),
  em: (props: ComponentProps<"em">) => <em className="italic" {...props} />,
  a: (props: ComponentProps<"a">) => (
    <a
      className="text-[#00FF87] hover:underline"
      rel="noopener noreferrer"
      target="_blank"
      {...props}
    />
  ),
  code: (props: ComponentProps<"code">) => (
    <code
      className="bg-zinc-800 text-[#00FF87] px-1 py-0.5 rounded text-sm"
      {...props}
    />
  ),
  pre: (props: ComponentProps<"pre">) => (
    <pre
      className="bg-zinc-900 border border-zinc-800 rounded p-4 overflow-x-auto my-4 text-sm"
      {...props}
    />
  ),
  hr: (props: ComponentProps<"hr">) => (
    <hr className="border-zinc-800 my-6" {...props} />
  ),
};
