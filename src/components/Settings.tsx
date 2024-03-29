import { common, components } from "replugged";
import { buildAddKeyModal } from "./AddKey";
import { buildKeyManager } from "./KeyManager";
import { PGPSettings, getKey, pgpFormat } from "../utils";
import { get, set } from "idb-keyval";

const { React } = common;
const { Text, TextInput, Button, Divider, Flex } = components;

export function Settings() {
  let [publicKeyField, setPublicKeyField] = React.useState("");
  let [showPublicKey, setShowPublicKey] = React.useState(false);
  let [showImportOwn, setShowImportOwn] = React.useState(false);
  let [ownPublicKey, setOwnPublicKey] = React.useState("");
  let [privKey, setPrivKey] = React.useState("");
  let [pubKey, setPubKey] = React.useState("");

  const PKeyFormatting =
    /(?<=-----BEGIN PGP PUBLIC KEY BLOCK-----\n)[\s\S]*?(?=\n-----END PGP PUBLIC KEY BLOCK-----)/gm;

  React.useEffect(() => {
    async function fetchPublicKey() {
      const result = await get("selfKeys");
      // Making the PGP block look like a block instead of a huge string
      const match = result.publicKey.match(PKeyFormatting)[0];
      const keyContent = match.replace(/(?<=\S)\s+(?=\S)/g, "\n");
      setOwnPublicKey(result.publicKey.replace(match, keyContent));
    }
    fetchPublicKey();
  });

  function handleViewPublicKey() {
    setShowPublicKey(!showPublicKey);
    setShowImportOwn(false);
  }

  function handleShowImport() {
    setShowImportOwn(!showImportOwn);
    setShowPublicKey(false);
  }

  return (
    <>
      <Text.Eyebrow style={{ marginBottom: "5px" }}>Add other Public Key</Text.Eyebrow>
      <span style={{ width: "100%", display: "flex" }}>
        <TextInput
          maxLength={Infinity}
          value={publicKeyField}
          onChange={(e: string) => {
            setPublicKeyField(
              e.replace("BLOCK-----", `BLOCK-----\n\n`).replace("-----END", `\n-----END`),
            );
          }}
          placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----"
        />
        <Button
          style={{ flexBasis: "10%" }}
          // eslint-disable-next-line consistent-return
          onClick={async () => {
            if (
              PGPSettings.get("savedPubKeys")?.some(
                (element) => element.publicKey === publicKeyField,
              )
            )
              return common.toast.toast("Key already Added", common.toast.Kind.MESSAGE);
            buildAddKeyModal({
              keyInfo: await getKey(publicKeyField),
              pubKey: publicKeyField,
            });
          }}>
          Add
        </Button>
      </span>
      <Divider style={{ marginBottom: "15px", marginTop: "15px" }} />

      <Flex>
        <Button onClick={handleViewPublicKey} look={Button.Looks.LINK}>
          View Public Key
        </Button>
        <Button onClick={handleShowImport} look={Button.Looks.LINK}>
          Import your own Keys
        </Button>
        <Button onClick={() => buildKeyManager()} look={Button.Looks.LINK}>
          Manage Keys
        </Button>
      </Flex>
      {showPublicKey && (
        <>
          <Text selectable={true} markdown={true} lineClamp={80} style={{ marginBottom: "20px" }}>
            {pgpFormat(ownPublicKey)}
          </Text>
        </>
      )}
      {showImportOwn && (
        <>
          <Text.Eyebrow style={{ marginTop: "5px", marginBottom: "5px" }}>Public Key</Text.Eyebrow>
          <TextInput value={pubKey} maxLength={Infinity} onChange={(e) => setPubKey(e)}></TextInput>
          <Divider style={{ marginBottom: "15px", marginTop: "15px" }} />
          <Text.Eyebrow style={{ marginBottom: "5px" }}>Private Key</Text.Eyebrow>
          <TextInput
            value={privKey}
            maxLength={Infinity}
            onChange={(e) => setPrivKey(e)}></TextInput>

          <Button
            style={{ marginTop: "15px", marginBottom: "15px" }}
            onClick={() => {
              try {
                const formattedPriv = privKey
                  .replace("BLOCK-----", `BLOCK-----\n\n`)
                  .replace("-----END", `\n-----END`);
                const formattedPub = pubKey
                  .replace("BLOCK-----", `BLOCK-----\n\n`)
                  .replace("-----END", `\n-----END`);

                set("selfKeys", { privateKey: formattedPriv, publicKey: formattedPub });
                common.toast.toast("Added Keypair!", common.toast.Kind.SUCCESS);
              } catch (e) {
                common.toast.toast("Failed to add Keys", common.toast.Kind.FAILURE);
              }
            }}>
            Save
          </Button>
        </>
      )}
    </>
  );
}
