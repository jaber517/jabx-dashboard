import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

// Renders note content written in Markdown (with GitHub-style tables, task
// lists and strikethrough). Raw HTML in the text is not rendered.
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        "text-[15px] leading-7 text-foreground/90",
        "[&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:tracking-[-0.03em]",
        "[&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-[-0.02em]",
        "[&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-bold",
        "[&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1",
        "[&_li:has(>input)]:list-none [&_li>input]:mr-2 [&_li>input]:accent-[hsl(var(--primary-strong))]",
        "[&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
        "[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground",
        "[&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px]",
        "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-border [&_pre]:bg-background [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_table]:my-3 [&_table]:w-full [&_table]:text-sm [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left",
        "[&_hr]:my-6 [&_hr]:border-border [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
              {children}
            </a>
          )
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
