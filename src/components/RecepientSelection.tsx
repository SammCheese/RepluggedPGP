import { PublicKey } from "openpgp";
import { common, components } from "replugged";
import { PGPSettings, getKey } from "../utils";

const { React } = common;
const { Button, Modal, Text, SelectItem, ErrorBoundary } = components;
const { closeModal, openModal } = common.modal;

let modalKey: any;

interface PubKey {
  keyObject: PublicKey;
  publicKey: string;
}

function RecepientSelection(props: any) {
  let [recepient, setRecepient] = React.useState("");
  let [savedRecepients] = React.useState<PubKey[]>([]);

  const handleConfirm = () => {
    closeModal(modalKey);
    props.onConfirm(recepient);
  };

  onkeydown = (e) => {
    if (e.key === "Enter") handleConfirm();
  };

  async function convertKeys() {
    const keys = PGPSettings.get("savedPubKeys", []);

    for (const res of keys) {
      const keyObject = await getKey(res);
      savedRecepients.push({ keyObject, publicKey: res });
    }
  }

  React.useEffect(() => {
    convertKeys();
  }, []);

  return (
    <Modal.ModalRoot {...props}>
      <Modal.ModalHeader>
        <Text.H1>Key Selection</Text.H1>
      </Modal.ModalHeader>
      <Modal.ModalContent>
        {savedRecepients[0] ? (
          <SelectItem
            style={{ marginTop: "15px" }}
            value={recepient}
            options={savedRecepients.map((key) => ({
              label: key.keyObject.users[0].userID?.userID! ?? "Couldnt fetch Username",
              value: key.publicKey,
            }))}
            onChange={(e) => {
              setRecepient(e);
            }}></SelectItem>
        ) : (
          <Text>Looks like you dont have any Public Keys yet, try adding some in Settings</Text>
        )}
      </Modal.ModalContent>
      <Modal.ModalFooter>
        <Button onClick={handleConfirm}>Confirm</Button>
      </Modal.ModalFooter>
    </Modal.ModalRoot>
  );
}

export function buildRecepientSelection(): Promise<string> {
  return new Promise((resolve) => {
    try {
      modalKey = openModal((props: any) => (
        <ErrorBoundary>
          <RecepientSelection {...props} onConfirm={resolve} />
        </ErrorBoundary>
      ));
    } catch (e) {}
  });
}
