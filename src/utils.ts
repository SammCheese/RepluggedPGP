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
  return await new Promise((resolve) => {
    void getKey(key).then((res) => {
      return resolve(res?.users[0]?.userID);
    });
  });
}

export async function getKey(key: string): Promise<PublicKey> {
  return await pgp.readKey({ armoredKey: key });
}

async function getPrivateKey(passphrase: string): Promise<MaybeArray<PrivateKey>> {
  const selfKeys = await get("selfKeys");

  const privateKey = await pgp.readPrivateKey({
    armoredKey: selfKeys.privateKey,
  });
  return await pgp.decryptKey({
    privateKey,
    passphrase,
  });
}

export async function signMessage(message: string): Promise<string> {
  return new Promise(async (resolve) => {
    const unsigned = await pgp.createCleartextMessage({ text: message });
    const signingKey = await getPrivateKey(await buildKeyPass());
    const ctMessage = await pgp.sign({
      message: unsigned,
      signingKeys: signingKey,
    });
    resolve(ctMessage);
  });
}

export async function verifyMessage(
  ctMessage: string,
  publicKey: string,
): Promise<VerificationResult> {
  return new Promise(async (resolve) => {
    const signedMessage = await pgp.readCleartextMessage({ cleartextMessage: ctMessage });
    const verifyResult = await pgp.verify({
      message: signedMessage,
      verificationKeys: await getKey(publicKey),
    });
    resolve(verifyResult.signatures[0]);
  });
}

export async function encryptMessage(message: string, recepients: PublicKey[]): Promise<string> {
  return new Promise(async (resolve) => {
    const encrypted = await pgp.encrypt({
      message: await pgp.createMessage({ text: message }),
      encryptionKeys: recepients,
    });
    resolve(encrypted);
  });
}

export async function decryptMessage(message: string): Promise<decryptMessageType> {
  return await new Promise(async (resolve, reject) => {
    const readMessage = await pgp.readMessage({ armoredMessage: message });
    try {
      const { data: decrypted, signatures } = await pgp.decrypt({
        message: readMessage,
        decryptionKeys: await getPrivateKey(await buildKeyPass()),
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
