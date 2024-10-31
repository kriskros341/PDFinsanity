import { DragEvent, useRef, useState } from "react";

import "./style.css";
import { FileItem } from "../../types";
import DocumentList from "../../components/DocumentList";
import DocumentManager from "../../components/DocumentPageList";

import {
  createDocumentFromDocumentIndices,
  download,
  imageToPdf,
  merge,
} from "./documentHelpers";
import RenameModal from "../../components/Modals/Rename";
import clsx from "clsx";

const Main = () => {
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inspectedItemId, setInspectedItemId] = useState<string | undefined>();
  const [renameModalState, setRenameModalState] = useState<any>();

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  const addFileItemsFromFileList = async (fileList: FileList) => {
    const newFileItems = [...fileItems];
    for (const file of fileList) {
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
  };
  const handleDrop = async (e: DragEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.nativeEvent.preventDefault();
    e.stopPropagation();
    addFileItemsFromFileList(e.dataTransfer.files);
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
    addFileItemsFromFileList(e.target.files);
    e.target.files = null;
  };

  const toggleInspectedItem = (id: string) => {
    setInspectedItemId((current) => (current === id ? undefined : id));
  };

  const toggleSelectedId = (id: string) => {
    if (selectedItemIds.some((value) => value === id)) {
      return setSelectedItemIds(
        selectedItemIds.filter((value) => value !== id)
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
      (item) => item.id === selectedItemIds[selectedItemIds.length - 1]
    );
    if (startIdx > endIdx) {
      [startIdx, endIdx] = [endIdx, startIdx];
    }
    const affectedIds = fileItems
      .slice(startIdx, endIdx + 1)
      .map((item) => item.id);
    const clearedSelection = selectedItemIds.filter((value) =>
      affectedIds.some((id) => value !== id)
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
        selectedItemIds.filter((item) => item !== inspectedItemId)
      );
      setFileItems(fileItems.filter((item) => item.id !== inspectedItemId));
      setInspectedItemId(undefined);
      return;
    }
    const asyncHelper = async () => {
      const oldDocumentFileItem = fileItems.find(
        (fileItem) => fileItem.id === inspectedItemId
      );
      if (!oldDocumentFileItem) {
        console.warn("No reorder target file provided");
        return;
      }
      const newDocumentFile = await createDocumentFromDocumentIndices(
        oldDocumentFileItem.file,
        newPageIndices
      );
      const newDocumentFileItem = FileItem.fromFile(newDocumentFile);
      setSelectedItemIds(
        selectedItemIds.map((id) =>
          id === oldDocumentFileItem.id ? newDocumentFileItem.id : id
        )
      );
      setInspectedItemId(newDocumentFileItem.id);
      setFileItems(
        fileItems.map((item) =>
          item.id === oldDocumentFileItem.id ? newDocumentFileItem : item
        )
      );
    };
    asyncHelper();
  };

  const onDownload = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    const documentsToDownload = fileItems.filter((fileItem) =>
      selectedItemIds.includes(fileItem.id)
    );
    for (const document of documentsToDownload) {
      download(
        document.file,
        document.file.name.slice(0, document.file.name.lastIndexOf(".")) +
          ".pdf"
      );
    }
  };

  const onMergeConfirm = async (e: any, newName: string) => {
    e.stopPropagation();
    const newDocument = await merge(fileItems, selectedItemIds, newName);
    console.log(newDocument.file.name);
    const result = fileItems.filter(
      (item) => selectedItemIds.indexOf(item.id) === -1
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
        (fileItem) => selectedItemIds.indexOf(fileItem.id) === -1
      )
    );
  };

  const onRenameConfirm = (e: any, newName: string) => {
    e.stopPropagation();
    setRenameModalState(undefined);
    const currentFileItemIndex = fileItems.findIndex(
      (fileItem) => fileItem.id === inspectedItemId
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
        fileItem.id === inspectedItemId ? newFileItem : fileItem
      )
    );
  };

  const onRename = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    const document = fileItems.find((item) => item.id === inspectedItemId);
    setRenameModalState({
      oldName:
        document?.file.name.slice(0, document?.file.name.lastIndexOf(".")) ??
        "",
      onConfirm: onRenameConfirm,
      text: `Rename ${document?.file.name}`,
    });
  };

  const onExtractConfirmed = async (indices: number[], newName: string) => {
    const documentFileItem = fileItems.find(
      (item) => item.id === inspectedItemId
    );
    if (!documentFileItem) {
      return;
    }
    const newDocumentFile = await createDocumentFromDocumentIndices(
      documentFileItem.file,
      indices
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

  return (
    <div className="overflow-hidden max-h-screen h-screen">
      {renameModalState && (
        <RenameModal
          {...renameModalState}
          onHide={() => setRenameModalState(undefined)}
        />
      )}
      <form
        className="App flex h-full"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onSubmit={(e) => e.preventDefault()}
      >
        <div onClick={onClickOutside} className="flex flex-col bg-white panel-shadow py-4 gap-4">
          <div className="flex gap-4 px-4">
            <div
              onClick={onRename}
              className={clsx("px-4 py-2 rounded-sm bg-[#ddd] cursor-pointer btn-shadow", !inspectedItemId && "text-gray-400 cursor-no-drop")}
            >
              Rename
            </div>
            <div
              onClick={onDelete}
              className={clsx("px-4 py-2 rounded-sm bg-[#ddd] cursor-pointer btn-shadow", !selectedItemIds.length && "text-gray-400 cursor-no-drop")}
            >
              Delete
            </div>
            <div
              onClick={onDownload}
              className={clsx("px-4 py-2 rounded-sm bg-[#ddd] cursor-pointer btn-shadow", !selectedItemIds.length && "text-gray-400 cursor-no-drop")}
            >
              Download
            </div>
            <div
              onClick={onMerge}
              className={clsx("px-4 py-2 rounded-sm bg-[#ddd] cursor-pointer btn-shadow", selectedItemIds.length < 2 && "text-gray-400 cursor-no-drop")}
            >
              Merge
            </div>
          </div>
          <div className="flex-1 overflow-scroll p-4">
            <DocumentList
              clickEventRouter={clickEventRouter}
              itemList={fileItems}
              selectedItemIds={selectedItemIds}
              setItemList={(value) => setFileItems(value)}
              inspectedItemId={inspectedItemId}
            />
          </div>
          <div className="flex justify-center items-center">
            <button
              className="px-8 py-4 rounded-sm bg-[#ddd] cursor-pointer btn-shadow"
              onClick={onFileInputClick}
            >
              <h3>Drag or click to add more files</h3>
            </button>
          </div>
        </div>
        <div className="flex flex-col bg-white panel-shadow py-4 gap-4 flex-1">
          <DocumentManager
            handleExtract={onPagesExtract}
            handleCommit={handleCommit}
            fileItem={fileItems.find(
              (item) => item.id === inspectedItemId
            )}
          />
        </div>
        <input
          multiple
          style={{ display: "none" }}
          type="file"
          ref={fileInputRef}
          onChange={onFileInputChange}
        />
      </form>
    </div>
  );
};

export default Main;
