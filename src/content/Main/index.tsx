import { DragEvent, useRef, useState } from "react";

import "./style.css";
import { FileItem } from "../../types";
import EmptyDocumentList from "../../components/EmptyDocumentList";
import DocumentList from "../../components/DocumentList";
import DocumentManager from "../../components/DocumentPageList";

import {
  createDocumentFromDocumentIndices,
  download,
  imageToPdf,
  merge,
} from "./documentHelpers";
import RenameModal from "../../components/Modals/Rename";

type layoutType = keyof typeof layoutType;

const Panel = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: (e: any) => void;
}) => {
  return (
    <div className="Panel" onClick={onClick}>
      {children}
    </div>
  );
};

const layoutType = {
  single: "single",
  double: "double",
} as const;

const Layout = ({
  layout,
  children,
}: {
  layout: layoutType;
  children: React.ReactNode;
}) => {
  return (
    <div className="Layout-container">
      <div
        className={
          layout === "single" ? "Layout-singleCol" : "Layout-doubleCol"
        }
      >
        {children}
      </div>
    </div>
  );
};

const Main = () => {
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inspectedItemId, setInspectedItemId] = useState<string | undefined>();
  const [renameModalState, setRenameModalState] = useState<any>();

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const addFileItemsFromFileList = async (fileList: FileList) => {
    const newFileItems = [...fileItems]
    for (let file of fileList) {
      if (file.name.endsWith("pdf")) {
        newFileItems.push(FileItem.fromFile(file));
      } else {
        const blob = new Blob([await imageToPdf(file)], {
          type: "application/pdf",
        });
        newFileItems.push(FileItem.fromFile(new File([blob], file.name)));
      }
    }

    setFileItems(newFileItems);
  }
  const handleDrop = async (e: DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.nativeEvent.preventDefault();
    e.stopPropagation();
    await addFileItemsFromFileList(e.dataTransfer.files);
  };

  const onFileInputClick = (e: any) => {
    e.stopPropagation();
    fileInputRef.current && fileInputRef.current.click();
  };

  const onFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (!e.target.files) {
      return;
    }
    await addFileItemsFromFileList(e.target.files);
    e.target.files = null;
  };

  const toggleInspectedItem = (id: string) => {
    setInspectedItemId((current) => (current === id ? undefined : id));
  };

  const toggleSelectedId = (id: string) => {
    if (selectedItemIds.some((value) => value === id)) {
      return setSelectedItemIds(
        selectedItemIds.filter((value) => value !== id),
      );
    }
    setSelectedItemIds([...selectedItemIds, id]);
  };

  const handleItemClick = (id: string) => {
    if (selectedItemIds[0] !== id) {
      setSelectedItemIds([id]);
    }
  };

  const hanldeItemCtrlClick = (id: string) => {
    toggleSelectedId(id);
  };

  const handleItemShiftClick = (id: string) => {
    let startIdx = fileItems.findIndex((item) => item.id === id);
    // @TODO: have last selected item in separate state
    let endIdx = fileItems.findIndex(
      (item) => item.id === selectedItemIds[selectedItemIds.length - 1],
    );
    if (startIdx > endIdx) {
      [startIdx, endIdx] = [endIdx, startIdx];
    }
    const affectedIds = fileItems
      .slice(startIdx, endIdx + 1)
      .map((item) => item.id);
    const clearedSelection = selectedItemIds.filter((value) =>
      affectedIds.some((id) => value !== id),
    );
    setSelectedItemIds([...clearedSelection, ...affectedIds]);
  };

  const clickEventRouter = (e: any, id: string, dbl?: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (dbl) {
      return toggleInspectedItem(id);
    }
    if (e.ctrlKey) {
      return hanldeItemCtrlClick(id);
    }
    if (e.shiftKey) {
      return handleItemShiftClick(id);
    }
    handleItemClick(id);
  };

  const onClickOutside = (e: any) => {
    e?.stopPropagation();
    setInspectedItemId(undefined);
    setSelectedItemIds([]);
  };

  const handleCommit = (newPageIndices: number[]) => {
    if (!newPageIndices.length) {
      setSelectedItemIds(
        selectedItemIds.filter((item) => item !== inspectedItemId),
      );
      setFileItems(fileItems.filter((item) => item.id !== inspectedItemId));
      setInspectedItemId(undefined);
      return;
    }
    const asyncHelper = async () => {
      const oldDocumentFileItem = fileItems.find(
        (fileItem) => fileItem.id === inspectedItemId,
      );
      if (!oldDocumentFileItem) {
        console.warn("No reorder target file provided");
        return;
      }
      const newDocumentFile = await createDocumentFromDocumentIndices(
        oldDocumentFileItem.file,
        newPageIndices,
      );
      const newDocumentFileItem = FileItem.fromFile(newDocumentFile);
      setSelectedItemIds(
        selectedItemIds.map((id) =>
          id === oldDocumentFileItem.id ? newDocumentFileItem.id : id,
        ),
      );
      setInspectedItemId(newDocumentFileItem.id);
      setFileItems(
        fileItems.map((item) =>
          item.id === oldDocumentFileItem.id ? newDocumentFileItem : item,
        ),
      );
    };
    asyncHelper();
  };

  const onDownload = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    const documentsToDownload = fileItems.filter((fileItem) =>
      selectedItemIds.includes(fileItem.id),
    );
    for (const document of documentsToDownload) {
      download(document.file, document.file.name.slice(0, document.file.name.lastIndexOf('.')) + ".pdf");
    }
  };

  const onMergeConfirm = async (e: any, newName: string) => {
    e.stopPropagation();
    const newDocument = await merge(fileItems, selectedItemIds, newName);
    console.log(newDocument.file.name);
    let result = fileItems.filter(
      (item) => selectedItemIds.indexOf(item.id) === -1,
    );
    result.push(newDocument);
    setFileItems(result);
    setInspectedItemId(newDocument.id);
    setSelectedItemIds([newDocument.id]);
  };

  const onMerge = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    setRenameModalState({
      oldName: "",
      onConfirm: onMergeConfirm,
      text: `Name new document`,
    });
  };

  const onDelete = (e: any) => {
    e.stopPropagation();
    setFileItems(
      fileItems.filter(
        (fileItem) => selectedItemIds.indexOf(fileItem.id) === -1,
      ),
    );
  };

  const onRenameConfirm = (e: any, newName: string) => {
    e.stopPropagation();
    setRenameModalState(undefined);
    const currentFileItemIndex = fileItems.findIndex(
      (fileItem) => fileItem.id === inspectedItemId,
    );
    if (currentFileItemIndex === -1) {
      return;
    }
    const currentFileItem = fileItems[currentFileItemIndex];
    const newFile = new File([currentFileItem.file], `${newName}.png`, {
      type: currentFileItem.file.type,
    });
    const newFileItem = new FileItem(newFile, currentFileItem.id);
    setFileItems(
      fileItems.map((fileItem) =>
        fileItem.id === inspectedItemId ? newFileItem : fileItem,
      ),
    );
  };

  const onRename = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    const document = fileItems.find((item) => item.id === inspectedItemId);
    setRenameModalState({
      oldName: document?.file.name.slice(0, document?.file.name.lastIndexOf('.')) ?? "",
      onConfirm: onRenameConfirm,
      text: `Rename ${document?.file.name}`,
    });
  };

  const onExtractConfirmed = async (indices: number[], newName: string) => {
    const documentFileItem = fileItems.find(
      (item) => item.id === inspectedItemId,
    );
    if (!documentFileItem) {
      return;
    }
    const newDocumentFile = await createDocumentFromDocumentIndices(
      documentFileItem.file,
      indices,
    );
    const newFile = new File([newDocumentFile], `${newName}.png`, {
      type: documentFileItem.file.type,
    });
    const newFileItem = FileItem.fromFile(newFile);
    setFileItems([...fileItems, newFileItem]);
  };

  const onPagesExtract = (indices: number[]) => {
    setRenameModalState({
      oldName: "",
      onConfirm: (_: any, newName: string) =>
        onExtractConfirmed(indices, newName),
      text: `Extract as`,
    });
  };

  let ActionButtonClassName = "MainPanel-action";
  if (!selectedItemIds.length) {
    ActionButtonClassName += " MainPanel-disabledAction";
  }

  let MergeActionButtonClassName = "MainPanel-action";
  if (selectedItemIds.length < 2) {
    MergeActionButtonClassName += " MainPanel-disabledAction";
  }

  let RenameActionButtonClassName = "MainPanel-action";
  if (!inspectedItemId) {
    RenameActionButtonClassName += " MainPanel-disabledAction";
  }

  return (
    <>
      {renameModalState && (
        <RenameModal
          {...renameModalState}
          onHide={() => setRenameModalState(undefined)}
        />
      )}
      <form
        className="App"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onSubmit={(e) => e.preventDefault()}
      >
        {fileItems.length ? (
          <Layout
            layout={inspectedItemId ? layoutType.double : layoutType.single}
          >
            <Panel onClick={onClickOutside}>
              <div className="Panel-content">
                <div className="MainPanel-header">
                  <div className="MainPanel-actions">
                    <div
                      onClick={onRename}
                      className={RenameActionButtonClassName}
                    >
                      Rename
                    </div>
                    <div onClick={onDelete} className={ActionButtonClassName}>
                      Delete
                    </div>
                    <div onClick={onDownload} className={ActionButtonClassName}>
                      Download
                    </div>
                    <div
                      onClick={onMerge}
                      className={MergeActionButtonClassName}
                    >
                      Merge
                    </div>
                  </div>
                </div>
                <DocumentList
                  clickEventRouter={clickEventRouter}
                  itemList={fileItems}
                  selectedItemIds={selectedItemIds}
                  setItemList={(value) => setFileItems(value)}
                  inspectedItemId={inspectedItemId}
                />
              </div>
              <div className="MainContainer-callToActionContainer">
                <div
                  className="MainContent-callToAction"
                  onClick={onFileInputClick}
                >
                  <h3>Drag or click to add more files</h3>
                </div>
              </div>
            </Panel>
            {inspectedItemId && (
              <Panel>
                <DocumentManager
                  handleExtract={onPagesExtract}
                  handleCommit={handleCommit}
                  fileItem={fileItems.find(
                    (item) => item.id === inspectedItemId,
                  )}
                />
              </Panel>
            )}
          </Layout>
        ) : (
          <EmptyDocumentList onClick={onFileInputClick} />
        )}
        <input
          multiple
          style={{ display: "none" }}
          type="file"
          ref={fileInputRef}
          onChange={onFileInputChange}
        />
      </form>
    </>
  );
};

export default Main;
