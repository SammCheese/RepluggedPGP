import { common, components } from "replugged";

const { Button, Modal, Text } = components;
const { closeModal, openModal } = common.modal;

let modalKey: any;

function PGPResult(props: any) {
  return (
    <Modal.ModalRoot {...props}>
      <Modal.ModalHeader>
        <Text.H1>Result</Text.H1>
      </Modal.ModalHeader>
      <Modal.ModalContent>
        <Text.H3 selectable={true} markdown={true} lineClamp={40} style={{ marginTop: "15px" }}>
          {`\`\`\`\n${props.pgpresult}\`\`\``}
        </Text.H3>
      </Modal.ModalContent>
      <Modal.ModalFooter>
        <Button
          color={Button.Colors.TRANSPARENT}
          look={Button.Looks.LINK}
          onClick={() => {
            closeModal(modalKey);
          }}>
          Close
        </Button>
      </Modal.ModalFooter>
    </Modal.ModalRoot>
  );
}

export function buildPGPResult(data: any) {
  modalKey = openModal((props: any) => <PGPResult {...props} {...data} />);
}
