import { pgp } from "./lib";
import { get } from "idb-keyval";
import { common, settings, types, webpack } from "replugged";
import { buildKeyPass } from "./components/KeyPassword";
import { MaybeArray, PrivateKey, PublicKey, UserIDPacket, VerificationResult } from "openpgp";

const { channels } = common;
const { addFile }: types.ModuleExportsWithProps<"addFiles"> & addFile =
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
): Promise<VerificationResult[]> {
  return new Promise(async (resolve) => {
    const signedMessage = await pgp.readCleartextMessage({ cleartextMessage: ctMessage });
    const verifyResult = await pgp.verify({
      // @ts-expect-error TODO
      message: signedMessage,
      verificationKeys: await getKey(publicKey),
    });
    resolve(verifyResult.signatures);
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
