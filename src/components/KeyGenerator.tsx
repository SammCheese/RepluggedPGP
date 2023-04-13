import { common, components } from "replugged";
import { pgp } from "../lib";
import { buildKeyResModal } from "./KeyResult";

const { React } = common;
const { Button, Modal, TextInput, Text, Divider } = components;
const { closeModal, openModal } = common.modal;

let modalKey: any;

function KeyGenerateModal(props: any) {
  let [name, setName] = React.useState("");
  let [email, setEmail] = React.useState("");
  let [passphrase, setPassphrase] = React.useState("");
  let [comment, setComment] = React.useState("");
  return (
    <Modal.ModalRoot {...props}>
      <Modal.ModalHeader>
        <Text.H1>Generate Keypair</Text.H1>
      </Modal.ModalHeader>
      <Modal.ModalContent>
        <Text.Eyebrow>Username (required)</Text.Eyebrow>
        <TextInput value={name} onChange={(e: string) => setName(e)} />
        <Divider style={{ marginBottom: "15px", marginTop: "15px" }} />
        <Text.Eyebrow>Email (required)</Text.Eyebrow>
        <TextInput value={email} onChange={(e: string) => setEmail(e)} />
        <Divider style={{ marginBottom: "15px", marginTop: "15px" }} />
        <Text.Eyebrow>Comment</Text.Eyebrow>
        <TextInput value={comment} onChange={(e: string) => setComment(e)} />
        <Divider style={{ marginBottom: "15px", marginTop: "15px" }} />
        <Text.Eyebrow>Passphrase</Text.Eyebrow>
        <TextInput value={passphrase} onChange={(e: string) => setPassphrase(e)} />
      </Modal.ModalContent>
      <Modal.ModalFooter>
        <Button
          disabled={!name || !email}
          onClick={async () => {
            const generatedKey = await pgp.generateKey({
              userIDs: { name, email, comment },
              passphrase,
            });
            buildKeyResModal(generatedKey);

            if (generatedKey) closeModal(modalKey);
          }}>
          Generate
        </Button>
        <Button
          style={{ left: 15, position: "absolute" }}
          color={Button.Colors.TRANSPARENT}
          look={Button.Looks.LINK}
          onClick={() => closeModal(modalKey)}>
          Close
        </Button>
      </Modal.ModalFooter>
    </Modal.ModalRoot>
  );
}

export function buildKeyModal(): any {
  modalKey = openModal((props: any) => <KeyGenerateModal {...props} />);
}
