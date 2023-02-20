import { pgp } from "./lib";
import { get } from "idb-keyval";
import { common, settings, types, webpack } from "replugged";
import { buildKeyPass } from "./components/KeyPassword";
import { MaybeArray, PrivateKey, PublicKey, UserIDPacket, VerificationResult } from "openpgp";
import { addFileType, decryptMessageType } from "./repluggedpgp";

const { channels } = common;
const { addFile }: types.ModuleExportsWithProps<"addFiles"> & addFileType =
  webpack.getByProps("addFiles")!;

export const pgpFormat = (msg: string): string => {
  return `\`\`\`\n${msg}\n\`\`\``;
};

export let PGPSettings: settings.SettingsManager<
  {
    savedPubKeys: string[];
    encryptionActive: boolean;
    signingActive: boolean;
    asFile: boolean;
  },
  never
>;

export async function initSettings(): Promise<void> {
  PGPSettings = await settings.init("repluggedpgp", {
    savedPubKeys: [],
    encryptionActive: false,
    signingActive: false,
    asFile: false,
  });
}

export async function getKeyUserInfo(key: string): Promise<UserIDPacket | null> {
  const resp = await getKey(key);
  return resp?.users[0]?.userID ?? null;
}

export async function getKey(key: string): Promise<PublicKey> {
  return await pgp.readKey({ armoredKey: key });
}

async function getPrivateKey(retries = 3): Promise<MaybeArray<PrivateKey>> {
  const selfKeys = await get("selfKeys");
  const existingPassword = await get("password");

  if (existingPassword) {
    try {
      return await pgp.decryptKey({
        privateKey: await pgp.readPrivateKey({ armoredKey: selfKeys.privateKey }),
        passphrase: existingPassword,
      });
    } catch {}
  }

  for (let i = 0; i < retries; i++) {
    try {
      const passphrase = await buildKeyPass({ attempts: i + 1, maxRetries: retries });
      return await pgp.decryptKey({
        privateKey: await pgp.readPrivateKey({ armoredKey: selfKeys.privateKey }),
        passphrase,
      });
    } catch {
      console.log(`Failed to decrypt key, attempt ${i + 1} of ${retries}`);
    }
  }
  throw new Error(`Failed to decrypt private key after ${retries} attempts`);
}

export async function signMessage(message: string): Promise<string> {
  const unsigned = await pgp.createCleartextMessage({ text: message });
  const signingKey = await getPrivateKey();
  const signed = await pgp.sign({
    message: unsigned,
    signingKeys: signingKey,
  });
  return signed;
}

export async function verifyMessage(
  ctMessage: string,
  publicKey: string,
): Promise<VerificationResult> {
  const signedMessage = await pgp.readCleartextMessage({ cleartextMessage: ctMessage });

  // // @ts-expect-error Typemismatch https://github.com/openpgpjs/openpgpjs/issues/1582
  const vResult = await pgp.verify({
    // // @ts-expect-error Typemismatch
    message: signedMessage,
    verificationKeys: await getKey(publicKey),
  });

  return vResult.signatures[0];
}

export async function encryptMessage(message: string, recepients: PublicKey[]): Promise<string> {
  return await pgp.encrypt({
    message: await pgp.createMessage({ text: message }),
    encryptionKeys: recepients,
  });
}

export async function decryptMessage(message: string): Promise<decryptMessageType> {
  return await new Promise(async (resolve, reject) => {
    const readMessage = await pgp.readMessage({ armoredMessage: message });
    try {
      const { data: decrypted, signatures } = await pgp.decrypt({
        message: readMessage,
        decryptionKeys: await getPrivateKey(),
      });
      resolve({ decrypted, signatures });
    } catch (e) {
      reject(e);
    }
  });
}

export async function parseMessageFileContent(url: string): Promise<string> {
  if (!url.endsWith("message.txt")) return "";
  return await new Promise(async (resolve) => {
    await fetch(url)
      .then((res) => resolve(res.text()))
      .catch((e) => console.error(e));
  });
}

export function sendAsFile(message: string): void {
  addFile({
    file: {
      file: new File([new Blob([message], { type: "text/plain" })], "message.txt", {
        type: "text/plain",
      }),
      platform: 1,
    },
    channelId: channels.getCurrentlySelectedChannelId(),
    draftType: 0,
  });
}
