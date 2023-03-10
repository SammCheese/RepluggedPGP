/* eslint-disable @typescript-eslint/naming-convention */
import { VerificationResult } from "openpgp";
import { types } from "replugged";

interface RPGPWindow {
  PGPToggleButton: JSX.Element;
  popoverIcon: () => JSX.Element;
  receiver: (message: DiscordMessage) => Promise<void>;
  parseMessageFileContent: (url: string) => Promise<string>;
  buildPopover: (fn: types.AnyFunction, channel: object, message: DiscordMessage) => unknown;
}

declare global {
  interface Window {
    RPGP: RPGPWindow;
  }
}

interface savedPubKeyType {
  publicKey: string;
  userID: string;
}

interface KeyInfo {
  created: Date;
  user: {
    name: string;
    email: string;
    comment: string;
    userID: string;
  };
}

interface addFileType {
  addFile: ({
    file: { file: File, platform: number },
    channelId: number,
    draftType: number,
  }) => void;
}

interface decryptMessageType {
  decrypted: string;
  signatures: VerificationResult[];
  match?: false | PublicKey;
}

interface Attachment {
  content_type: string;
  filename: string;
  id: string;
  proxy_url?: string;
  sensitive: boolean;
  size: number;
  spoiler: boolean;
  url: string;
}

interface DiscordMessage {
  channel: object;
  content: string;
  embeds: DiscordEmbed[];
  attachments?: Attachment[];
}

interface Messages {
  sendMessage: (
    channelId: string,
    message: OutgoingMessage,
    promise?: boolean,
    options?: OutgoingMessageOptions,
  ) => void;
}
