import { pgp } from "./lib";
import { get } from "idb-keyval";
import { common, settings, types, webpack } from "replugged";
import { buildKeyPass } from "./components/KeyPassword";
import { KeyID, MaybeArray, PrivateKey, PublicKey, UserIDPacket } from "openpgp";
import { addFileType, decryptMessageType, savedPubKeyType } from "./repluggedpgp";
import { buildRecipientSelection } from "./components/RecipientSelection";

const { channels } = common;
const { addFile }: types.ModuleExportsWithProps<"addFiles"> & addFileType =
  webpack.getByProps("addFiles")!;

export const pgpFormat = (msg: string): string => {
  return `\`\`\`\n${msg}\n\`\`\``;
};

export let PGPSettings: settings.SettingsManager<
  {
    savedPubKeys: savedPubKeyType[];
    encryptionActive: boolean;
    signingActive: boolean;
    asFile: boolean;
    onlyOnce: boolean;
  },
  never
>;

export async function initSettings(): Promise<void> {
  PGPSettings = await settings.init("repluggedpgp", {
    savedPubKeys: [],
    encryptionActive: false,
    signingActive: false,
    asFile: false,
    onlyOnce: false,
  });

  await tryMigrateSettings();
  await tryAddSelfPubkey();
}

export async function tryAddSelfPubkey(): Promise<void> {
  const selfKeys = await get("selfKeys");
  const savedPubKeys = PGPSettings.get("savedPubKeys", []);
  if (!selfKeys || savedPubKeys?.some((elem) => elem.publicKey.includes(selfKeys.publicKey)))
    return;
  PGPSettings.set("savedPubKeys", [...savedPubKeys, { publicKey: selfKeys.publicKey, userID: "" }]);
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function resetSettings(): Promise<void> {
  PGPSettings.set("asFile", false);
  PGPSettings.set("encryptionActive", false);
  PGPSettings.set("signingActive", false);
  PGPSettings.set("onlyOnce", false);
}

// eslint-disable-next-line @typescript-eslint/require-await
async function tryMigrateSettings(): Promise<void> {
  const prevSettings = PGPSettings.get("savedPubKeys", []);
  if (!prevSettings || !prevSettings.some((element) => typeof element === "string")) return;
  let newSettings: savedPubKeyType[] = prevSettings.map((element) => {
    if (typeof element === "string") return { publicKey: element, userID: "" };
    return element;
  });
  console.log(newSettings);
  PGPSettings.set("savedPubKeys", newSettings);
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
  const signed: string = await pgp.sign({
    message: unsigned,
    signingKeys: signingKey,
  });
  return signed;
}

export async function verifyMessage(ctMessage: string): Promise<string> {
  const pubKeys = PGPSettings.get("savedPubKeys", []);

  const signedMessage = await pgp.readCleartextMessage({ cleartextMessage: ctMessage });

  let sigVerification = "Failed to validate Message";

  for (let i = 0; i < pubKeys.length; i++) {
    try {
      // // @ts-expect-error Typemismatch https://github.com/openpgpjs/openpgpjs/issues/1582
      const vResult = await pgp.verify({
        // // @ts-expect-error Typemismatch
        message: signedMessage,
        verificationKeys: await getKey(pubKeys[i].publicKey),
      });

      const { verified, keyID } = vResult.signatures[0];

      if (await verified) {
        console.log("Success", verified, keyID);
        const keyUser = await getKeyUserInfo(pubKeys[i].publicKey);
        sigVerification = `Successfully Validated message from ${keyUser?.userID}\n(${keyID
          .toHex()
          .toString()
          .toUpperCase()})`;
      }
    } catch {}
  }
  return sigVerification;
}

export async function encryptMessage(message: string, sign?: boolean): Promise<string> {
  const recipients = await buildRecipientSelection();
  const publicKeys = await Promise.all(recipients.map((armoredKey) => pgp.readKey({ armoredKey })));

  return await pgp.encrypt({
    message: await pgp.createMessage({ text: message }),
    encryptionKeys: publicKeys,
    // eslint-disable-next-line no-undefined
    signingKeys: sign ? await getPrivateKey() : undefined,
  });
}

export async function decryptMessage(message: string): Promise<decryptMessageType | undefined> {
  const readMessage = await pgp.readMessage({ armoredMessage: message });
  const key = await getPrivateKey();

  try {
    const { data: decrypted, signatures } = await pgp.decrypt({
      message: readMessage,
      decryptionKeys: key,
    });

    if (!signatures[0]?.keyID) return { decrypted, signatures };

    const match = await findPubKeyWithKeyID(signatures[0].keyID);

    if (!match) return { decrypted, signatures, match };

    return { decrypted, signatures, match: await getKey(match) };
  } catch {}
}

async function findPubKeyWithKeyID(targetKey: KeyID): Promise<string | false> {
  const keys = PGPSettings.get("savedPubKeys", []);

  if (!keys) return false;

  for (let i = 0; i < keys.length; i++) {
    const key = await getKey(keys[i].publicKey);
    console.log(targetKey, key);
    if (key.getKeyID().equals(targetKey)) {
      return keys[i].publicKey;
    }
  }
  return false;
}

export async function parseMessageFileContent(url: string): Promise<string> {
  if (!url.endsWith(".txt") && !url.endsWith(".asc")) return "";
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
