import React from "react";
import { Box, Text } from "ink";

export function MarkdownMessage(props: { content: string }) {
  const blocks = parseMarkdown(props.content);

  return (
    <Box flexDirection="column">
      {blocks.map((block, index) => (
        <Box key={index} flexDirection="column">
          {renderBlock(block, index)}
        </Box>
      ))}
    </Box>
  );
}

type MarkdownBlock =
  | { type: "blank" }
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: number; text: string }
  | { type: "blockquote"; text: string }
  | { type: "unordered-list"; text: string }
  | { type: "ordered-list"; order: string; text: string }
  | { type: "code"; lines: string[] };

function parseMarkdown(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        blocks.push({ type: "code", lines: codeLines });
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (line.trim() === "") {
      blocks.push({ type: "blank" });
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2]
      });
      continue;
    }

    const blockquoteMatch = /^>\s?(.*)$/.exec(line);
    if (blockquoteMatch) {
      blocks.push({ type: "blockquote", text: blockquoteMatch[1] });
      continue;
    }

    const unorderedMatch = /^[-*]\s+(.*)$/.exec(line);
    if (unorderedMatch) {
      blocks.push({ type: "unordered-list", text: unorderedMatch[1] });
      continue;
    }

    const orderedMatch = /^(\d+)\.\s+(.*)$/.exec(line);
    if (orderedMatch) {
      blocks.push({ type: "ordered-list", order: `${orderedMatch[1]}.`, text: orderedMatch[2] });
      continue;
    }

    blocks.push({ type: "paragraph", text: line });
  }

  if (codeLines.length > 0) {
    blocks.push({ type: "code", lines: codeLines });
  }

  return blocks;
}

function renderBlock(block: MarkdownBlock, index: number): React.ReactNode {
  switch (block.type) {
    case "blank":
      return <Text key={`blank-${index}`}> </Text>;
    case "heading":
      return (
        <Text bold color={block.level <= 2 ? "cyan" : "white"}>
          {renderInline(block.text)}
        </Text>
      );
    case "blockquote":
      return (
        <Text color="gray">
          <Text color="cyan">&gt; </Text>
          {renderInline(block.text)}
        </Text>
      );
    case "unordered-list":
      return (
        <Text color="white">
          <Text color="cyan">• </Text>
          {renderInline(block.text)}
        </Text>
      );
    case "ordered-list":
      return (
        <Text color="white">
          <Text color="cyan">{block.order} </Text>
          {renderInline(block.text)}
        </Text>
      );
    case "code":
      return (
        <Box flexDirection="column" marginY={1} marginLeft={2}>
          {block.lines.map((line, lineIndex) => (
            <Text key={lineIndex} color="yellow">
              {line || " "}
            </Text>
          ))}
        </Box>
      );
    case "paragraph":
      return <Text color="white">{renderInline(block.text)}</Text>;
  }
}

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g;
  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    const fullMatch = match[0];
    const start = match.index ?? 0;

    if (start > cursor) {
      nodes.push(text.slice(cursor, start));
    }

    if (fullMatch.startsWith("**")) {
      nodes.push(
        <Text key={`${start}-bold`} bold>
          {fullMatch.slice(2, -2)}
        </Text>
      );
    } else if (fullMatch.startsWith("`")) {
      nodes.push(
        <Text key={`${start}-code`} color="yellow">
          {fullMatch.slice(1, -1)}
        </Text>
      );
    } else {
      nodes.push(
        <Text key={`${start}-italic`} italic color="cyan">
          {fullMatch.slice(1, -1)}
        </Text>
      );
    }

    cursor = start + fullMatch.length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
}
