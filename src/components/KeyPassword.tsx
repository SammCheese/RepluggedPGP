import { common, components } from "replugged";
import { del, set } from "idb-keyval";

const { React } = common;
const { Button, Flex, Modal, TextInput, Text, Divider, Switch } = components;
const { closeModal, openModal } = common.modal;

let modalKey: any;

function PasswordField(props: any) {
  let [passphrase, setPassphrase] = React.useState("");
  let [savePassword, setSavePassword] = React.useState(false);

  const handleConfirm = () => {
    // Save the Password and start a timer to delete it from indexedDB in 30 minutes
    if (savePassword) {
      setTimeout(() => {
        del("password");
      }, 30 * 60 * 1000);
      set("password", passphrase);
    }
    closeModal(modalKey);
    props.onConfirm(passphrase);
  };

  onkeydown = (e) => {
    if (e.key === "Enter") handleConfirm();
  };

  const { maxRetries, attempts } = props;

  return (
    <Modal.ModalRoot {...props}>
      <Modal.ModalHeader>
        <Text.H1>
          Passphrase Required {props.attempts > 1 ? `(Att. ${attempts} out of ${maxRetries})` : ""}
        </Text.H1>
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
        <Divider style={{ marginTop: "15px", marginBottom: "15px" }} />
        <Flex>
          <Switch
            style={{ marginTop: "15px", marginBottom: "15px" }}
            checked={savePassword}
            onChange={(e) => {
              setSavePassword(e);
            }}
          />
          <Text.Eyebrow
            style={{ left: "20px", top: "4px", position: "relative", marginBottom: "15px" }}>
            Remember Password for 30 Minutes
          </Text.Eyebrow>
        </Flex>
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

export function buildKeyPass(attempts: any): Promise<string> {
  return new Promise((resolve) => {
    modalKey = openModal((props: any) => (
      <PasswordField {...props} onConfirm={resolve} {...attempts} />
    ));
  });
}
