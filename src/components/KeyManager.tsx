import { common, components } from "replugged";
import { PGPSettings, getKeyUserInfo } from "../utils";
import { UserIDPacket } from "openpgp";

const { React } = common;
const { closeModal, openModal } = common.modal;
const { Button, Modal, Text, ErrorBoundary } = components;

let modalKey: any;

interface KeyCardType {
  onButtonClick: () => void;
  publicKey: string;
  userID: string;
}

/*function KeyDetails(props: any) {
  return (
    <Modal.ModalRoot>
      <Modal.ModalHeader>
        <Text.H1>Key Details</Text.H1>
      </Modal.ModalHeader>
      <Modal.ModalContent>
        <Text> Balls</Text>
      </Modal.ModalContent>
    </Modal.ModalRoot>
  );
}*/

function KeyCard(props: KeyCardType) {
  const [userID, setUserData] = React.useState<UserIDPacket | null>();

  React.useEffect(() => {
    async function populateInfo() {
      setUserData(await getKeyUserInfo(props.publicKey));
    }
    if (!userID) populateInfo();
  }, []);

  return (
    <ErrorBoundary>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text.Normal selectable={true}>{userID?.userID ?? "Invalid"}</Text.Normal>
        <div
          style={{
            display: "flex",
            marginLeft: "auto",
            flexDirection: "row",
          }}>
          {/*<Button
            style={{ marginRight: "7px" }}
            look={Button.Looks.LINK}
            onClick={() => openModal((props) => <KeyDetails {...props} />)}>
            View
        </Button>*/}
          <Button
            onClick={() => {
              const keys = PGPSettings.get("savedPubKeys", []);
              PGPSettings.set(
                "savedPubKeys",
                keys.filter((key) => !key.publicKey.includes(props.publicKey)),
              );
              props.onButtonClick();
            }}
            color={Button.Colors.RED}>
            Delete
          </Button>
        </div>
      </div>
    </ErrorBoundary>
  );
}

function KeyManager(props: any) {
  const keys = PGPSettings.get("savedPubKeys", []);
  const [, setUpdateKeyManager] = React.useState(0); // State to trigger update

  // Callback function to force update KeyManager
  const handleKeyCardButtonClick = () => {
    setUpdateKeyManager((prev) => prev + 1);
  };

  const keyCardArray = Object.values(keys).map((key) => (
    <KeyCard {...key} onButtonClick={handleKeyCardButtonClick} />
  ));

  return (
    <Modal.ModalRoot {...props} size="large" className="RPGPManager">
      <Modal.ModalHeader>
        <Text.H1>Key Manager</Text.H1>
      </Modal.ModalHeader>
      <Modal.ModalContent>{keyCardArray}</Modal.ModalContent>
      <Modal.ModalFooter>
        <Button
          color={Button.Colors.TRANSPARENT}
          look={Button.Looks.LINK}
          onClick={() => closeModal(modalKey)}>
          Close
        </Button>
      </Modal.ModalFooter>
    </Modal.ModalRoot>
  );
}

export function buildKeyManager(): any {
  modalKey = openModal((props: any) => <KeyManager {...props} />);
}
