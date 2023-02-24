import { PublicKey } from "openpgp";
import { common, components } from "replugged";
import { PGPSettings, getKey } from "../utils";

const { React } = common;
const { Button, Modal, Text, CheckboxItem, ErrorBoundary } = components;
const { closeModal, openModal } = common.modal;

let modalKey: any;

interface PubKey {
  keyObject: PublicKey;
  publicKey: string;
}

function RecepientSelection(props: any) {
  let [recepients, setRecepients] = React.useState<string[]>([]);
  let [savedRecepients, setSavedRecepients] = React.useState<PubKey[]>([]);
  let [isLoading, setIsLoading] = React.useState(true);

  const handleConfirm = () => {
    closeModal(modalKey);
    props.onConfirm(recepients);
  };

  onkeydown = (e) => {
    if (e.key === "Enter") handleConfirm();
  };

  React.useEffect(() => {
    async function convertKeys() {
      const keys = PGPSettings.get("savedPubKeys", []);

      const recepients = await Promise.all(
        keys.map(async (res) => {
          const keyObject = await getKey(res);
          return { keyObject, publicKey: res };
        }),
      );
      setSavedRecepients(recepients);
    }

    convertKeys().then(() => setIsLoading(false));
  }, []);

  return (
    <Modal.ModalRoot {...props}>
      <Modal.ModalHeader>
        <Text.H1>Key Selection</Text.H1>
      </Modal.ModalHeader>
      <Modal.ModalContent>
        {!isLoading && (
          <>
            {savedRecepients[0] ? (
              <>
                {savedRecepients.map((key) => (
                  <CheckboxItem
                    key={key.keyObject.getKeyID().toHex()}
                    onChange={() => {
                      setRecepients(
                        recepients.includes(key.publicKey)
                          ? recepients.filter((elem) => elem !== key.publicKey)
                          : recepients.concat(key.publicKey),
                      );
                    }}
                    value={recepients.includes(key.publicKey)}>
                    {`${key.keyObject.users[0].userID?.userID}` ?? "Unknown User"}
                  </CheckboxItem>
                ))}
              </>
            ) : (
              <Text>Looks like you dont have any Public Keys yet, try adding some in Settings</Text>
            )}
          </>
        )}
      </Modal.ModalContent>
      <Modal.ModalFooter>
        <Button onClick={handleConfirm}>Confirm</Button>
      </Modal.ModalFooter>
    </Modal.ModalRoot>
  );
}

export function buildRecepientSelection(): Promise<string[]> {
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
