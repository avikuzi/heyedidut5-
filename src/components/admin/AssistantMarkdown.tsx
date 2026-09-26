import React from 'react';
import { parseMarkdown, type InlineNode } from '../../lib/assistantMarkdown';

function Inline({ nodes }: { nodes: InlineNode[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        if (node.type === 'text') {
          return <React.Fragment key={index}>{node.text}</React.Fragment>;
        }
        if (node.type === 'bold') {
          return (
            <strong key={index} className="font-bold">
              <Inline nodes={node.children} />
            </strong>
          );
        }
        return (
          <em key={index}>
            <Inline nodes={node.children} />
          </em>
        );
      })}
    </>
  );
}

/** Assistant bubble body. Text nodes only — model HTML is never parsed as markup. */
export function AssistantMarkdown({ text }: { text: string }) {
  const blocks = parseMarkdown(text);
  if (blocks.length === 0) return null;

  return (
    <div dir="rtl" className="space-y-2 text-right">
      {blocks.map((block, index) => {
        if (block.type === 'hr') {
          return <hr key={index} className="border-0 border-t border-slate-200 my-2" />;
        }
        if (block.type === 'ul') {
          return (
            <ul key={index} dir="rtl" className="list-disc list-inside space-y-1 text-right">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  <Inline nodes={item} />
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === 'ol') {
          return (
            <ol key={index} dir="rtl" className="list-decimal list-inside space-y-1 text-right">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} value={Number(item.n)}>
                  <Inline nodes={item.children} />
                </li>
              ))}
            </ol>
          );
        }
        return (
          <p key={index} className="leading-relaxed">
            {block.lines.map((line, lineIndex) => (
              <React.Fragment key={lineIndex}>
                {lineIndex > 0 ? <br /> : null}
                <Inline nodes={line} />
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
