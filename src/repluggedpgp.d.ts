/* eslint-disable @typescript-eslint/naming-convention */
import { VerificationResult } from "openpgp";

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
