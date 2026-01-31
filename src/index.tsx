import { createCliRenderer, TextAttributes } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./App";

const renderer = await createCliRenderer({ exitOnCtrlC: true, targetFps: 60 });
createRoot(renderer).render(<App />);
