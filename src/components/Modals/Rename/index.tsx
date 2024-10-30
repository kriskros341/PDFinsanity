import { useState } from "react";

import Modal from "../";

interface RenameModal {
  oldName: string;
  onHide: (e: any) => void;
  onConfirm: (e: any, newName: string) => void;
  text?: string;
}

const RenameModal = ({ oldName, onHide, onConfirm, text }: RenameModal) => {
  const [newName, setNewName] = useState(oldName);

  const additionalActions = [
    {
      text: "Confirm",
      onClick: (e: any) => {
        onConfirm(e, newName);
        onHide(e);
      },
    },
  ];
  return (
    <Modal onHide={onHide} additionalActions={additionalActions}>
      <div className="RenameModal-content">
        <div className="RenameModal-title">{text ?? "Rename document"}</div>
        <input
          className="RenameModal-form"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
      </div>
    </Modal>
  );
};

export default RenameModal;
