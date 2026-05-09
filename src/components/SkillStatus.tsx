import React from "react";
import { Box, Text } from "ink";

export function SkillStatus(props: { skillName: string }) {
  if (props.skillName === "none") {
    return null;
  }

  return (
    <Box marginTop={1} marginBottom={1}>
      <Text color="gray">  [skill] </Text>
      <Text color="cyan">{props.skillName}</Text>
    </Box>
  );
}
