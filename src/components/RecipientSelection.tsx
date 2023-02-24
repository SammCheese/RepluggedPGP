import { PublicKey } from "openpgp";
import { common, components } from "replugged";
import { savedPubKeyType } from "../repluggedpgp";
import { PGPSettings, getKey } from "../utils";

const { React } = common;
const { Button, Modal, Text, CheckboxItem, ErrorBoundary } = components;
const { closeModal, openModal } = common.modal;

let modalKey: any;

interface PubKey {
  keyObject: PublicKey;
  savedKeyObject: savedPubKeyType;
}

function RecipientSelection(props: any) {
  let [recipients, setRecipients] = React.useState<string[]>([]);
  let [savedRecipients, setSavedRecipients] = React.useState<PubKey[]>([]);
  let [isLoading, setIsLoading] = React.useState(true);

  const handleConfirm = () => {
    closeModal(modalKey);
    props.onConfirm(recipients);
  };

  onkeydown = (e) => {
    if (e.key === "Enter") handleConfirm();
  };

  React.useEffect(() => {
    async function convertKeys() {
      const keys = PGPSettings.get("savedPubKeys", []);

      const recipients = await Promise.all(
        keys.map(async (res) => {
          const keyObject = await getKey(res.publicKey);
          return { keyObject, savedKeyObject: res };
        }),
      );
      setSavedRecipients(recipients);
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
            {savedRecipients[0] ? (
              <>
                {savedRecipients.map((key) => (
                  <CheckboxItem
                    key={key.keyObject.getKeyID().toHex()}
                    onChange={() => {
                      setRecipients(
                        recipients.includes(key.savedKeyObject.publicKey)
                          ? recipients.filter((elem) => elem !== key.savedKeyObject.publicKey)
                          : recipients.concat(key.savedKeyObject.publicKey),
                      );
                    }}
                    value={recipients.includes(key.savedKeyObject.publicKey)}>
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

export function buildRecipientSelection(): Promise<string[]> {
  return new Promise((resolve) => {
    try {
      modalKey = openModal((props: any) => (
        <ErrorBoundary>
          <RecipientSelection {...props} onConfirm={resolve} />
        </ErrorBoundary>
      ));
    } catch (e) {}
  });
}
