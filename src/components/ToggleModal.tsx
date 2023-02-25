import { common, components } from "replugged";
import { PGPSettings } from "../utils";
import { get } from "idb-keyval";
import { buildKeyModal } from "./KeyGenerator";

const { React } = common;
const { Modal, Text, Button, CheckboxItem } = components;
const { openModal } = common.modal;

function ToggleModal(props: any) {
  let [signing, setSigning] = React.useState(PGPSettings.get("signingActive", false));
  let [encryption, setEncryption] = React.useState(PGPSettings.get("encryptionActive", false));
  let [asFile, setAsFile] = React.useState(PGPSettings.get("asFile", false));
  let [hasKeyPair, setHasKeyPair] = React.useState(false);
  let [onlyOnce, setOnlyOnce] = React.useState(PGPSettings.get("onlyOnce", false));

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
            <CheckboxItem
              style={{ marginTop: "15px" }}
              value={signing}
              onChange={() => {
                setSigning(!signing);
                PGPSettings.set("signingActive", !signing);
              }}>
              Enable PGP Signing
            </CheckboxItem>
            <CheckboxItem
              style={{ marginTop: "10px", marginBottom: "10px" }}
              value={encryption}
              onChange={() => {
                setEncryption(!encryption);
                PGPSettings.set("encryptionActive", !encryption);
              }}>
              Enable PGP Encryption
            </CheckboxItem>
            <CheckboxItem
              style={{ marginBottom: "15px" }}
              value={asFile}
              onChange={() => {
                setAsFile(!asFile);
                PGPSettings.set("asFile", !asFile);
              }}>
              Always Send as File
            </CheckboxItem>
          </>
        )}
        {!hasKeyPair && (
          <Button
            style={{ marginBottom: "15px", marginTop: "15px" }}
            onClick={() => buildKeyModal()}>
            Generate a Keypair First!
          </Button>
        )}
      </Modal.ModalContent>
      <Modal.ModalFooter>
        <CheckboxItem
          value={onlyOnce}
          onChange={() => {
            setOnlyOnce(!onlyOnce);
            PGPSettings.set("onlyOnce", !onlyOnce);
          }}>
          One Time Only
        </CheckboxItem>
      </Modal.ModalFooter>
    </Modal.ModalRoot>
  );
}

export function buildToggleModal() {
  openModal((props: any) => <ToggleModal {...props} />);
}
