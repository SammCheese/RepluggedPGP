import { Injector, common, types, webpack } from "replugged";
import {
  PGPSettings,
  decryptMessage,
  encryptMessage,
  getKey,
  initSettings,
  parseMessageFileContent,
  pgpFormat,
  resetSettings,
  sendAsFile,
  signMessage,
  verifyMessage,
} from "./utils";

import { popoverIcon } from "./assets/PopoverIcon";
import { PGPToggleButton } from "./assets/ToggleButton";

import { PGPCONSTS } from "./constants";
import { DiscordMessage, Messages, RPGPWindow } from "./repluggedpgp";
import { buildAddKeyModal } from "./components/AddKey";
import { del } from "idb-keyval";

const injector = new Injector();

export async function start(): Promise<void> {
  // Delete the remembered password on restart
  await del("password");

  // Initialize Settings
  await initSettings();
  await injectSendMessage();
  await injectPopover();
  await resetSettings();

  window.RPGP = {
    PGPToggleButton,
    popoverIcon,
    receiver,
    parseMessageFileContent,
  } as RPGPWindow;
}

// Used for Decryption
async function receiver(message: DiscordMessage): Promise<void> {
  let tempContent = message.content;

  if (message?.attachments![0]?.filename)
    tempContent = await parseMessageFileContent(message?.attachments[0].url);

  if (tempContent.includes(PGPCONSTS.PGP_MESSAGE_HEADER)) {
    let signature;

    try {
      let result = await decryptMessage(tempContent);

      // If its not signed, skip all additional steps and immediately set the content
      if (!result?.signatures[0]) {
        message.content =
          result?.decrypted ?? "Wrong Password or no secret key. Was this message meant for you?";
        return;
      }

      signature = result?.match;

      // No signature, it failed to verify
      if (!signature) {
        message.content = `${
          result?.decrypted ?? "Wrong Password or no secret key. Was this message meant for you?"
        }\n\`\`\`\nFailed to verify Message\n\`\`\``;
        return;
      }

      const verifiedUser = result?.match.users[0].userID.userID;
      const fingerprint = result?.match?.keyPacket?.keyID?.toHex()?.toUpperCase();
      message.content = `${result.decrypted}\n\`\`\`\nSuccessfully verified message from ${verifiedUser} (${fingerprint})\n\`\`\``;
    } catch (error) {
      console.error(error);
      message.content = `Failed to decrypt message: ${error}`;
    }
  }

  if (tempContent.includes(PGPCONSTS.PGP_SIGN_HEADER)) {
    let sigVerification = await verifyMessage(tempContent);

    message.content = sigVerification.includes("Successfully")
      ? tempContent
          .replace(PGPCONSTS.PGP_SIGNED_REGEX, `$3\`\`\`\n${sigVerification}\n\`\`\``)
          .replaceAll("- -", "-")
      : (message.content += `\`\`\`\n${sigVerification}\n\`\`\``);
  }

  if (tempContent.includes(PGPCONSTS.PGP_PUBLIC_KEY_HEADER)) {
    void buildAddKeyModal({
      keyInfo: await getKey(tempContent),
      pubKey: tempContent,
    });
  }
}

async function injectSendMessage(): Promise<void> {
  const sendMessageModule = await webpack.waitForModule<types.RawModule & Messages>(
    webpack.filters.byProps("sendMessage", "editMessage", "deleteMessage"),
  );

  if (!sendMessageModule) return;

  injector.instead(sendMessageModule, "sendMessage", async (args, fn) => {
    const { signingActive, encryptionActive, asFile, onlyOnce } = PGPSettings.all();

    // We sign the
    if (encryptionActive) args[1].content = await encryptMessage(args[1].content, signingActive);

    // Sign Message normally if no encryption active
    if (signingActive && !encryptionActive) args[1].content = await signMessage(args[1].content);

    // premiumType, 0 - No nitro, 1 - Nitro Classic, 2 - Nitro, 3 - Nitro Basic
    const isNitro = common.users.getCurrentUser().premiumType === 2;

    // Always send as file if encrypted string is above no-nitro limit
    if (isNitro ? args[1].content.length > 4000 : args[1].content.length > 2000)
      return sendAsFile(args[1].content);

    // do not format in files
    if (!asFile && (encryptionActive || signingActive))
      args[1].content = pgpFormat(args[1].content);

    // Reset all if we have "only once" enabled
    if (onlyOnce) void resetSettings();

    // only send as file if enabled and either signing or encryption is active
    return asFile && (signingActive || encryptionActive)
      ? sendAsFile(args[1].content)
      : fn(...args);
  });
}

// eslint-disable-next-line @typescript-eslint/require-await
async function injectPopover(): Promise<void> {
  injector.utils.addPopoverButton((message: DiscordMessage) => {
    const actionType = {
      "Add Key": /BEGIN PGP PUBLIC KEY BLOCK/,
      "Verify Signature": /BEGIN PGP SIGNED MESSAGE/,
      "Decrypt PGP Message": /BEGIN PGP MESSAGE/,
    };

    const contentRegexMatch = Object.entries(actionType).find(([_, regex]) =>
      regex.test(message?.content),
    );

    const hasAttachment =
      message?.attachments && message?.attachments[0]?.filename.endsWith(".txt");

    if (!contentRegexMatch && !hasAttachment) return null;

    return {
      label: contentRegexMatch ? contentRegexMatch[0] : "PGP Actions",
      icon: popoverIcon,
      onClick: () => {
        void window.RPGP.receiver(message);
      },
    };
  });
}

export { Settings } from "./components/Settings";

export function stop(): void {
  injector.uninjectAll();
}
