import { common, components } from "replugged";
import { buildAddKeyModal } from "./AddKey";
import { getKey, pgpFormat } from "../utils";
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

  React.useEffect(() => {
    async function fetchPublicKey() {
      const result = await get("selfKeys");
      setOwnPublicKey(result.publicKey);
    }
    fetchPublicKey();
  });

  function handleViewPublicKey() {
    setShowPublicKey(!showPublicKey);
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
          onClick={async () => {
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
        <Button onClick={() => setShowImportOwn(!showImportOwn)} look={Button.Looks.LINK}>
          Import your own Keys
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
              if (!privKey || !pubKey) return;

              const formattedPriv = privKey
                .replace("BLOCK-----", `BLOCK-----\n\n`)
                .replace("-----END", `\n-----END`);
              const formattedPub = pubKey
                .replace("BLOCK-----", `BLOCK-----\n\n`)
                .replace("-----END", `\n-----END`);
              set("selfKeys", { privateKey: formattedPriv, publicKey: formattedPub });
              common.toast.toast("Added Keypair!", common.toast.Kind.SUCCESS);
            }}>
            Save
          </Button>
        </>
      )}
    </>
  );
}
