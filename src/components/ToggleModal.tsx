import { common, components } from "replugged";
import { PGPSettings } from "../utils";
import { get } from "idb-keyval";
import { buildKeyModal } from "./KeyGenerator";

const { React } = common;
const { Switch, Modal, Text, Flex, Divider, Button } = components;
const { openModal } = common.modal;

function ToggleModal(props: any) {
  let [signing, setSigning] = React.useState(PGPSettings.get("signingActive", false));
  let [encryption, setEncryption] = React.useState(PGPSettings.get("encryptionActive", false));
  let [hasKeyPair, setHasKeyPair] = React.useState(false);

  React.useEffect(() => {
    async function fetchPublicKey() {
      setHasKeyPair(Boolean(await get("selfKeys")));
    }
    fetchPublicKey();
  });

  return (
    <Modal.ModalRoot {...props}>
      <Modal.ModalHeader>
        <Text.H1>Toggle PGP</Text.H1>
      </Modal.ModalHeader>
      <Modal.ModalContent>
        {hasKeyPair && (
          <>
            <Flex style={{ marginTop: "15px" }}>
              <Switch
                style={{ marginBottom: "15px" }}
                checked={signing}
                onChange={(e) => {
                  setSigning(e);
                  PGPSettings.set("signingActive", e);
                }}
              />
              <Text.Eyebrow style={{ left: "20px", top: "4px", position: "relative" }}>
                Enable PGP Signing
              </Text.Eyebrow>
            </Flex>
            <Divider style={{ marginTop: "10px", marginBottom: "10px" }} />
            <Flex>
              <Switch
                style={{ marginTop: "15px", marginBottom: "15px" }}
                checked={encryption}
                onChange={(e) => {
                  setEncryption(e);
                  PGPSettings.set("encryptionActive", e);
                }}
              />
              <Text.Eyebrow style={{ left: "20px", top: "4px", position: "relative" }}>
                Enable PGP Encryption
              </Text.Eyebrow>
            </Flex>
          </>
        )}
        {!hasKeyPair && (
          <Button
            style={{ marginBottom: "15px", marginTop: "15px" }}
            onClick={() => buildKeyModal()}>
            Generate a Keypair
          </Button>
        )}
      </Modal.ModalContent>
    </Modal.ModalRoot>
  );
}

export function buildToggleModal() {
  openModal((props: any) => <ToggleModal {...props} />);
}
