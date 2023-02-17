import { Injector, common } from "replugged";
import { PGPSettings, encryptMessage, initSettings, signMessage } from "./utils";

import { PGPToggleButton } from "./assets/ToggleButton";

const injector = new Injector();

export async function start(): Promise<void> {
  // Initialize Settings
  await initSettings();
  await injectSendMessage();

  // @ts-expect-error adding to window
  window.RPGP = {
    PGPToggleButton,
  };
}

// eslint-disable-next-line @typescript-eslint/require-await
async function injectSendMessage(): Promise<void> {
  injector.instead(common.messages, "sendMessage", async (args, fn) => {
    const signing = PGPSettings.get("signingActive", false);
    const encryption = PGPSettings.get("encryptionActive", false);
    if (encryption) {
      args[1].content = `\`\`\`\n${await encryptMessage(args[1].content, [])}\n\`\`\``;
    }
    if (signing) args[1].content = `\`\`\`\n${await signMessage(args[1].content)}\n\`\`\``;
    return fn(...args);
  });
}

export function stop(): void {
  injector.uninjectAll();
}

export { Settings } from "./components/Settings";
