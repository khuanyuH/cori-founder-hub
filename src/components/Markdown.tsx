import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Safe markdown renderer (no raw HTML) with light Tailwind styling. Used for
// post bodies and comments. Links open in a new tab.
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-stone-700 [&_a]:font-medium [&_a]:text-brand [&_a]:underline [&_code]:rounded [&_code]:bg-stone-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:font-semibold [&_li]:ml-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-stone-900 [&_pre]:p-3 [&_pre]:text-stone-100 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-stone-100 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-stone-300 [&_blockquote]:pl-3 [&_blockquote]:text-stone-500">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => (
            <a {...props} target="_blank" rel="noreferrer noopener" />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
