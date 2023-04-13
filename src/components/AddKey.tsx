import { common, components } from "replugged";
import { KeyInfo } from "../repluggedpgp";
import { PGPSettings, pgpFormat } from "../utils";

const { Button, Modal, Text, Divider } = components;
const { closeModal, openModal } = common.modal;

let modalKey: any;

function AddKey(props: any) {
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
        <Text.H1>Add Key?</Text.H1>
      </Modal.ModalHeader>
      <Modal.ModalContent>
        <Text.Eyebrow style={{ marginTop: "10px" }}>
          Add Key from User {info.user.name}?
        </Text.Eyebrow>
        <Divider style={{ marginBottom: "15px", marginTop: "15px" }} />
        <Text style={{ marginBottom: "5px" }}>User ID: {info.user.userID}</Text>
        <Text style={{ marginBottom: "5px" }}>comment: {info.user.comment || "No Comment"}</Text>
        <Text style={{ marginBottom: "5px" }}>Created: {info?.created.toString()}</Text>
        <Divider style={{ marginBottom: "15px", marginTop: "15px" }}></Divider>
        <Text markdown={true} selectable={true}>
          {props.pubKey.includes("`") ? props.pubKey : pgpFormat(props.pubKey)}
        </Text>
      </Modal.ModalContent>
      <Modal.ModalFooter>
        <Button
          onClick={() => {
            const savedArr = PGPSettings.get("savedPubKeys", []);
            PGPSettings.set("savedPubKeys", [...savedArr, { publicKey: props.pubKey, userID: "" }]);
            common.toast.toast("Added Key!", common.toast.Kind.SUCCESS);
            closeModal(modalKey);
          }}>
          Add Public Key
        </Button>
      </Modal.ModalFooter>
    </Modal.ModalRoot>
  );
}

export function buildAddKeyModal(key: any): any {
  modalKey = openModal((props: any) => <AddKey {...props} {...key} />);
}
