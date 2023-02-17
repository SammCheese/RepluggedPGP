import { common, components } from "replugged";
import { set } from "idb-keyval";

const { Button, Modal, Text, Divider } = components;
const { closeModal, openModal } = common.modal;

let modalKey: any;

function KeyResult(props: any) {
  return (
    <Modal.ModalRoot {...props}>
      <Modal.ModalHeader>
        <Text.H1>Your Keys</Text.H1>
      </Modal.ModalHeader>
      <Modal.ModalContent>
        <Text.Eyebrow>Public Key</Text.Eyebrow>
        <Divider style={{ marginBottom: "5px", marginTop: "5px" }} />
        <Text selectable={true} markdown={true}>{`\`\`\`\n${props.publicKey}\n\`\`\``}</Text>
        <Divider style={{ marginBottom: "15px", marginTop: "15px" }} />
        <Text.Eyebrow>Private Key (WARNING: DO NOT SHARE THIS WITH ANYONE)</Text.Eyebrow>
        <Divider style={{ marginBottom: "5px", marginTop: "5px" }} />
        <Text markdown={true}>{`\`\`\`\n${props.privateKey}\n\`\`\``}</Text>
        <Divider style={{ marginBottom: "15px", marginTop: "15px" }} />
        <Text.Eyebrow>Revocation Certificate</Text.Eyebrow>
        <Divider style={{ marginBottom: "5px", marginTop: "5px" }} />
        <Text
          selectable={true}
          markdown={true}>{`\`\`\`\n${props.revocationCertificate}\n\`\`\``}</Text>
      </Modal.ModalContent>
      <Modal.ModalFooter>
        <Button
          onClick={() => {
            set("selfKeys", {
              publicKey: props.publicKey,
              privateKey: props.privateKey,
              revocationCert: props.revocationCertificate,
            });
            closeModal(modalKey);
          }}>
          Save
        </Button>
      </Modal.ModalFooter>
    </Modal.ModalRoot>
  );
}

export function buildKeyResModal(keys: any): any {
  modalKey = openModal((props: any) => <KeyResult {...props} {...keys} />);
}
