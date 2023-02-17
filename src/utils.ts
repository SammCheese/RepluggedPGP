import { Key, MaybeArray, PrivateKey, PublicKey, UserIDPacket, VerificationResult } from "openpgp";
import { settings } from "replugged";
import { pgp } from "./lib";
import { buildKeyPass } from "./components/KeyPassword";
import { get } from "idb-keyval";

export let PGPSettings: settings.SettingsManager<
  { savedPubKeys: string[]; encryptionActive: boolean; signingActive: boolean },
  never
>;

export async function initSettings(): Promise<void> {
  PGPSettings = await settings.init("repluggedpgp", {
    savedPubKeys: [],
    encryptionActive: false,
    signingActive: false,
  });
}

export async function getKeyUserInfo(key: string): Promise<UserIDPacket | null> {
  return await new Promise((resolve) => {
    void getKey(key).then((res) => {
      return resolve(res?.users[0]?.userID);
    });
  });
}

export async function getKey(key: string): Promise<Key> {
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
    console.log(signingKey);
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
