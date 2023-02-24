import { Injector, common, types } from "replugged";
import {
  PGPSettings,
  decryptMessage,
  encryptMessage,
  getKey,
  getKeyUserInfo,
  initSettings,
  parseMessageFileContent,
  pgpFormat,
  sendAsFile,
  signMessage,
  verifyMessage,
} from "./utils";

import { popoverIcon } from "./assets/PopoverIcon";
import { PGPToggleButton } from "./assets/ToggleButton";

import { PGPCONSTS } from "./constants";
import { DiscordMessage } from "./repluggedpgp";
import { buildAddKeyModal } from "./components/AddKey";
import { buildPGPResult } from "./components/PGPResult";
import { del } from "idb-keyval";

const injector = new Injector();

export async function start(): Promise<void> {
  // Delete the remembered password on restart
  await del("password");

  // Initialize Settings
  await initSettings();
  await injectSendMessage();

  // @ts-expect-error adding to window
  window.RPGP = {
    PGPToggleButton,
    popoverIcon,
    receiver,
    parseMessageFileContent,
    buildPopover,
  };
}

// Used for Decryption
async function receiver(message: DiscordMessage): Promise<void> {
  let tempContent = message.content;

  if (message?.attachments![0]?.filename)
    tempContent = await parseMessageFileContent(message?.attachments[0].url);

  if (tempContent.match(PGPCONSTS.PGP_MESSAGE_HEADER)) {
    let result;
    try {
      const decrypted = await decryptMessage(tempContent);
      result = decrypted.decrypted;
    } catch {
      result = "Wrong Password or no Secret Key!";
    }
    buildPGPResult({ pgpresult: result });
  }
  if (tempContent.match(PGPCONSTS.PGP_SIGN_HEADER)) {
    const pubKeys = PGPSettings.get("savedPubKeys", []);

    let sigVerification = "Failed to validate Message";

    for (let i = 0; i < pubKeys.length; i++) {
      try {
        const { verified, keyID } = await verifyMessage(tempContent, pubKeys[i].publicKey);
        console.log(await verified);
        if (await verified) {
          const keyUser = await getKeyUserInfo(pubKeys[i].publicKey);
          sigVerification = `Successfully validated Message from ${keyUser?.userID}\n(${keyID
            .toHex()
            .toUpperCase()})`;
          break;
        }
      } catch {}
    }

    message.content = sigVerification.includes("Successfully")
      ? message.content.replace(
          /^`{3}\n{1,}(-----BEGIN PGP SIGNED MESSAGE-----)\n(.*Hash[^\r\n]*[\r\n]+)([\s\S]*?)(-----BEGIN PGP SIGNATURE-----[\s\S]*?-----END PGP SIGNATURE-----)(\n{1,})`{3}/gms,
          `$3\`\`\`\n${sigVerification}\n\`\`\``,
        )
      : (message.content += `\`\`\`\n${sigVerification}\n\`\`\``);
  }
  if (tempContent.match(PGPCONSTS.PGP_PUBLIC_KEY_HEADER)) {
    void buildAddKeyModal({
      keyInfo: await getKey(tempContent),
      pubKey: tempContent,
    });
  }
}

// eslint-disable-next-line @typescript-eslint/require-await
async function injectSendMessage(): Promise<void> {
  injector.instead(common.messages, "sendMessage", async (args, fn) => {
    const { signingActive, encryptionActive, asFile } = PGPSettings.all();

    if (encryptionActive) args[1].content = await encryptMessage(args[1].content);

    if (signingActive) args[1].content = await signMessage(args[1].content);

    // premiumType, 0 - No nitro, 1 - Nitro Classic, 2 - Nitro, 3 - Nitro Basic
    const isNitro = common.users.getCurrentUser().premiumType === 2;

    // Always send as file if encrypted string is above no-nitro limit
    if (isNitro ? args[1].content.length > 4000 : args[1].content.length > 2000)
      return sendAsFile(args[1].content);

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

export function buildPopover(
  fn: types.AnyFunction,
  channel: object,
  message: DiscordMessage,
): unknown | null {
  const actionType = {
    "Add Key": /BEGIN PGP PUBLIC KEY BLOCK/,
    "Verify Signature": /BEGIN PGP SIGNED MESSAGE/,
    "Decrypt PGP Message": /BEGIN PGP MESSAGE/,
  };

  const contentRegexMatch = Object.entries(actionType).find(([_, regex]) =>
    regex.test(message?.content),
  );

  const hasAttachment = message?.attachments && message?.attachments[0]?.filename.endsWith(".txt");

  if (contentRegexMatch || hasAttachment) {
    return fn({
      label: contentRegexMatch ? contentRegexMatch[0] : "PGP Actions",
      icon: popoverIcon,
      message,
      channel,
      onClick: () => {
        // @ts-expect-error added to window
        window.RPGP.receiver(message);
      },
    });
  }

  return null;
}
