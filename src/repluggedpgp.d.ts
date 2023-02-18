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
