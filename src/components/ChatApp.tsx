import React, { useEffect, useRef, useState } from "react";
import { Box, Text, useApp, useStdout } from "ink";
import { AgentSession } from "../session.js";
import { MessageList } from "./MessageList.js";
import { PromptInput } from "./PromptInput.js";

interface TurnViewModel {
  id: number;
  userMessage: string;
  assistantMessage: string;
  skillName: string;
}

export function ChatApp(props: {
  session: AgentSession;
  initialPrompt?: string;
  modelLabel: string;
  cwd: string;
}) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [turns, setTurns] = useState<TurnViewModel[]>([]);
  const [statusSkill, setStatusSkill] = useState<string | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasSubmittedInitialPrompt = useRef(false);

  async function submitPrompt(rawInput: string): Promise<void> {
    const input = rawInput.trim();
    if (!input || isLoading) {
      return;
    }

    if (input === "/exit") {
      exit();
      return;
    }

    setError(null);
    setIsLoading(true);
    setPendingPrompt(input);
    setStatusSkill(null);

    try {
      const selectedSkillName = await props.session.getMatchedSkillName(input);
      setStatusSkill(selectedSkillName === "none" ? null : selectedSkillName);

      const result = await props.session.submitTurn({ input, selectedSkillName });
      setStatusSkill(result.skillName);
      setTurns((current) => [
        ...current,
        {
          id: current.length + 1,
          userMessage: input,
          assistantMessage: result.reply,
          skillName: result.skillName
        }
      ]);
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : String(submissionError);
      setError(message);
      setStatusSkill(null);
    } finally {
      setPendingPrompt(null);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!props.initialPrompt || hasSubmittedInitialPrompt.current) {
      return;
    }

    hasSubmittedInitialPrompt.current = true;
    void submitPrompt(props.initialPrompt);
  }, [props.initialPrompt]);

  const divider = "─".repeat(Math.max(24, (stdout?.columns || 80) - 4));

  return (
    <Box flexDirection="column" paddingX={1} paddingY={0}>
      <Text color="gray"># <Text bold color="white">Command Code Mini Agent</Text> <Text color="gray">v1.0.0</Text></Text>
      <Text color="gray"># model: <Text color="blue">{props.modelLabel}</Text> <Text color="gray">· anthropic</Text></Text>
      <Text color="gray"># {props.cwd}</Text>

      <Box marginTop={1}>
        <MessageList
          turns={turns}
          activeSkill={statusSkill}
          isLoading={isLoading}
          pendingPrompt={pendingPrompt}
        />
      </Box>

      <Box marginTop={1}>
        <Text color="gray">{divider}</Text>
      </Box>

      {error ? (
        <Box marginTop={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      ) : null}

      <Box marginTop={1} marginBottom={1}>
        <PromptInput isDisabled={isLoading} onSubmit={submitPrompt} />
      </Box>

      <Box>
        <Text color="gray">{divider}</Text>
      </Box>
    </Box>
  );
}
