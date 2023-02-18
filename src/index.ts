import { Injector, common } from "replugged";
import {
  PGPSettings,
  encryptMessage,
  getKey,
  initSettings,
  pgpFormat,
  sendAsFile,
  signMessage,
} from "./utils";

import { PGPToggleButton } from "./assets/ToggleButton";
import { buildRecepientSelection } from "./components/RecepientSelection";

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
    const { signingActive, encryptionActive, asFile } = PGPSettings.all();

    if (encryptionActive)
      args[1].content = await encryptMessage(args[1].content, [
        await getKey(await buildRecepientSelection()),
      ]);

    if (signingActive) args[1].content = await signMessage(args[1].content);

    // Always send as file if encrypted string is above no-nitro limit
    if (args[1].content.length > 2000) return sendAsFile(args[1].content);

    // do not format in files
    if (!asFile) args[1].content = pgpFormat(args[1].content);

    // only send as file if enabled and either signing or encryption is active
    return asFile && (signingActive || encryptionActive)
      ? sendAsFile(args[1].content)
      : fn(...args);
  });
}

export function stop(): void {
  injector.uninjectAll();
}

export { Settings } from "./components/Settings";
