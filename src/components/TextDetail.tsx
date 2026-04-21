import React from "react";
import { Text } from "../ink";

export function TextDetail(props: { text: string }): React.ReactNode {
  return <Text wrap="wrap">{props.text}</Text>;
}
