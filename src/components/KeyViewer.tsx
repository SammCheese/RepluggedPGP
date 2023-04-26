import { common, components } from "replugged";
import { KeyInfo } from "../repluggedpgp";
import { PGPSettings, associateUserWithKey, pgpFormat } from "../utils";

const { Button, Modal, Text, Divider, TextInput } = components;
const {
  React,
  modal: { closeModal, openModal },
} = common;

let modalKey: any;

function KeyViewer(props: any) {
  const settingsIndex = PGPSettings.get("savedPubKeys", [])[
    PGPSettings.get("savedPubKeys", []).findIndex((e) => e.publicKey.includes(props.pubKey))
  ];
  const [associatedUser, setAssociatedUser] = React.useState(settingsIndex.userID);

  const info: KeyInfo = {
    created: props.keyInfo.keyPacket.created,
    user: {
      name: props.keyInfo.users[0].userID?.name,
      email: props.keyInfo.users[0].userID?.email,
      comment: props.keyInfo.users[0].userID?.comment,
      userID: props.keyInfo.users[0].userID?.userID,
    },
  };

  return (
    <Modal.ModalRoot {...props}>
      <Modal.ModalHeader>
        <Text.H1>Key Viewer</Text.H1>
      </Modal.ModalHeader>
      <Modal.ModalContent>
        <Text.Eyebrow style={{ marginTop: "10px" }}>Key Details for {info.user.name}</Text.Eyebrow>
        <Divider style={{ marginBottom: "15px", marginTop: "15px" }} />
        <Text style={{ marginBottom: "5px" }}>User ID: {info.user.userID}</Text>
        <Text style={{ marginBottom: "5px" }}>Comment: {info.user.comment || "No Comment"}</Text>
        <Text style={{ marginBottom: "5px" }}>Created: {info?.created.toString()}</Text>
        <Divider style={{ marginBottom: "15px", marginTop: "15px" }} />
        <Text.Eyebrow>Associate with User</Text.Eyebrow>
        <TextInput
          placeholder="372148345894076416"
          value={associatedUser}
          onChange={(e) => {
            setAssociatedUser(e);
            associateUserWithKey(props.pubKey, e);
          }}></TextInput>
        <Divider style={{ marginBottom: "15px", marginTop: "15px" }} />
        <Text markdown={true} selectable={true}>
          {pgpFormat(props.pubKey)}
        </Text>
      </Modal.ModalContent>
      <Modal.ModalFooter>
        <Button onClick={() => closeModal(modalKey)}>Close</Button>
      </Modal.ModalFooter>
    </Modal.ModalRoot>
  );
}

export function buildKeyViewer(key: any): any {
  modalKey = openModal((props: any) => <KeyViewer {...props} {...key} />);
}
