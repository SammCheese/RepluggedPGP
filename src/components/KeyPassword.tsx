import { common, components } from "replugged";

const { React } = common;
const { Button, Modal, TextInput, Text, Divider } = components;
const { closeModal, openModal } = common.modal;

let modalKey: any;

function PasswordField(props: any) {
  let [passphrase, setPassphrase] = React.useState("");

  const handleConfirm = () => {
    closeModal(modalKey);
    console.log(passphrase);
    props.onConfirm(passphrase);
  };

  onkeydown = (e) => {
    if (e.key === "Enter") handleConfirm();
  };

  return (
    <Modal.ModalRoot {...props}>
      <Modal.ModalHeader>
        <Text.H1>Passphrase Required</Text.H1>
      </Modal.ModalHeader>
      <Modal.ModalContent>
        <Text.Eyebrow style={{ marginTop: "15px" }}>Private Key Passphrase</Text.Eyebrow>
        <Divider style={{ marginBottom: "5px", marginTop: "5px" }} />
        <TextInput
          autoFocus={true}
          type={"password"}
          value={passphrase}
          onChange={(e) => {
            setPassphrase(e);
          }}></TextInput>
        <div style={{ marginTop: "5px", marginBottom: "10px" }} />
      </Modal.ModalContent>
      <Modal.ModalFooter>
        <Button onClick={handleConfirm}>Confirm</Button>
        <Button
          style={{ left: 15, position: "absolute" }}
          color={Button.Colors.TRANSPARENT}
          look={Button.Looks.LINK}
          onClick={() => {
            closeModal(modalKey);
          }}>
          Cancel
        </Button>
      </Modal.ModalFooter>
    </Modal.ModalRoot>
  );
}

export function buildKeyPass(): Promise<string> {
  return new Promise((resolve) => {
    modalKey = openModal((props: any) => <PasswordField {...props} onConfirm={resolve} />);
  });
}
