import React from "react";
import { Box, Text } from "ink";
import { MarkdownMessage } from "./MarkdownMessage.js";
import { SkillStatus } from "./SkillStatus.js";

interface TurnViewModel {
  id: number;
  userMessage: string;
  assistantMessage: string;
  skillName: string;
}

export function MessageList(props: {
  turns: TurnViewModel[];
  activeSkill: string | null;
  isLoading: boolean;
  pendingPrompt: string | null;
}) {
  return (
    <Box flexDirection="column">
      {props.turns.length === 0 ? (
        <Box marginTop={1} marginBottom={1}>
          <Text color="gray">No messages yet.</Text>
        </Box>
      ) : null}
      {props.turns.map((turn) => (
        <Box key={turn.id} flexDirection="column" marginBottom={2}>
          <Text color="cyan">
            <Text color="gray">› </Text>
            {turn.userMessage}
          </Text>
          <SkillStatus skillName={turn.skillName} />
          <Box marginTop={turn.skillName !== "none" ? 0 : 1}>
            <MarkdownMessage content={turn.assistantMessage} />
          </Box>
        </Box>
      ))}
      {props.isLoading ? (
        <Box flexDirection="column">
          <Text color="cyan">
            <Text color="gray">› </Text>
            {props.pendingPrompt ?? "sending..."}
          </Text>
          <SkillStatus skillName={props.activeSkill ?? "none"} />
          <Box marginTop={props.activeSkill && props.activeSkill !== "none" ? 0 : 1}>
            <Text color="white">thinking...</Text>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
