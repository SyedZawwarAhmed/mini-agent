import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

export function PromptInput(props: {
  isDisabled: boolean;
  onSubmit: (value: string) => Promise<void> | void;
}) {
  const [value, setValue] = useState("");

  async function handleSubmit(input: string): Promise<void> {
    const nextValue = input.trim();
    if (!nextValue) {
      return;
    }

    setValue("");
    await props.onSubmit(nextValue);
  }

  return (
    <Box>
      <Text color="white">
        <Text color="gray">› </Text>
      </Text>
      <TextInput
        value={value}
        onChange={setValue}
        onSubmit={(input) => {
          void handleSubmit(input);
        }}
        placeholder={props.isDisabled ? "Waiting for response..." : "Ask your question ..."}
        focus={!props.isDisabled}
      />
    </Box>
  );
}
