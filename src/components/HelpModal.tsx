import React from "react";
import { Box, Text } from "../ink";

export function HelpModal(): React.ReactNode {
  return (
    <Box borderStyle="round" borderColor="cyan" padding={1} flexDirection="column">
      <Text bold>log help</Text>
      <Text>j/k or ↑/↓ move selection</Text>
      <Text>PgUp/PgDn page</Text>
      <Text>Home/End or g/G jump</Text>
      <Text>Enter switch list/detail focus</Text>
      <Text>Space folds JSON nodes in tree detail mode</Text>
      <Text>F opens filter mode</Text>
      <Text>R reverses order</Text>
      <Text>Tab / Shift+Tab change tab</Text>
      <Text>m toggles tree/raw detail mode for JSON entries</Text>
      <Text>Esc closes modal or returns to list</Text>
      <Text>q quits</Text>
    </Box>
  );
}
