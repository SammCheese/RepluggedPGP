import { Injector, common } from "replugged";
import {
  PGPSettings,
  decryptMessage,
  encryptMessage,
  getKey,
  initSettings,
  parseMessageFileContent,
  pgpFormat,
  sendAsFile,
  signMessage,
  verifyMessage,
} from "./utils";

import { popoverIcon } from "./assets/PopoverIcon";
import { PGPToggleButton } from "./assets/ToggleButton";
import { buildRecepientSelection } from "./components/RecepientSelection";

import { PGPCONSTS } from "./constants";
import { DiscordMessage } from "./repluggedpgp";
import { buildAddKeyModal } from "./components/AddKey";
import { buildPGPResult } from "./components/PGPResult";

const injector = new Injector();

export async function start(): Promise<void> {
  // Initialize Settings
  await initSettings();
  await injectSendMessage();

  // @ts-expect-error adding to window
  window.RPGP = {
    PGPToggleButton,
    popoverIcon,
    receiver,
    parseMessageFileContent,
  };
}

async function receiver(message: DiscordMessage): Promise<void> {
  if (message.content.match(PGPCONSTS.PGP_MESSAGE_HEADER)) {
    let result;

    try {
      const decrypted = await decryptMessage(message.content);
      result = decrypted.decrypted;
    } catch {
      result = "Wrong Password or no Secret Key!";
    }
    buildPGPResult({ pgpresult: result });
  }
  if (message.content.match(PGPCONSTS.PGP_SIGN_HEADER)) {
    let result;

    try {
      const { verified, keyID } = await verifyMessage(
        message.content,
        await buildRecepientSelection(),
      );

      if (await verified) result = `Successfully validated message with Key: ${keyID.toHex()}`;
    } catch (e) {
      result = `Message verification failed\n${e}`;
    }

    buildPGPResult({ pgpresult: result });
  }
  if (message.content.match(PGPCONSTS.PGP_PUBLIC_KEY_HEADER)) {
    void buildAddKeyModal({
      keyInfo: await getKey(message.content),
      pubKey: message.content,
    });
  }
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
    if (!asFile && (encryptionActive || signingActive))
      args[1].content = pgpFormat(args[1].content);

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
