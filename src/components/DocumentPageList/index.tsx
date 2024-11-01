import { useState, useEffect } from "react";
import { Document, pdfjs } from "react-pdf";
import { PDFDocument } from "pdf-lib";
import { v4 as uuid } from "uuid";

import {
  DndContext,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

import PageThumbnail from "./PageThumbnail";

import type { FileItem } from "../../types";

import "./style.css";
import clsx from "clsx";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url,
).toString();

const PageThumbnailOverlay = () => {
  return (
    <div
      style={{ width: 212, height: 300, background: "#eee" }}
      className="thumbnail"
    />
  );
};

type DocumentPageIndiceItem = { id: string; indice: number };

const DocumentPageList = ({
  onPageClick,
  documentIndices,
  handleReorder,
  isIndiceSelected,
}: {
  onPageClick: (e: any, id: string) => void;
  documentIndices: DocumentPageIndiceItem[];
  handleReorder: (e: any) => void;
  isIndiceSelected: (id: string) => boolean;
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  return (
    <div className="flex gap-4 px-4 flex-wrap">
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragEnd={handleReorder}
      >
        <SortableContext items={documentIndices} strategy={rectSortingStrategy}>
          {documentIndices.map((item) => (
            <PageThumbnail
              onClick={(e: any) => onPageClick(e, item.id)}
              key={item.id}
              id={item.id}
              pageNumber={item.indice + 1}
              isSelected={isIndiceSelected(item.id)}
            />
          ))}
          <DragOverlay>
            <></>
          </DragOverlay>
        </SortableContext>
      </DndContext>
    </div>
  );
};

const DocumentManager = ({
  fileItem,
  handleCommit,
  handleExtract,
}: {
  fileItem?: FileItem;
  handleCommit: (indices: number[]) => void;
  handleExtract: (a: number[]) => void;
}) => {
  const [indices, setIndices] = useState<DocumentPageIndiceItem[]>([]);
  const [documentPageCount, setDocumentPageCount] = useState<number>(0);
  const [selectedIndiceIds, setSelectedIndiceIds] = useState<string[]>([]);

  useEffect(() => {
    if (!fileItem) {
      return;
    }
    const getDocumentIndices = async () => {
      const document = await PDFDocument.load(
        await fileItem?.file.arrayBuffer(),
      );
      setIndices(
        document
          .getPageIndices()
          .map((indice) => ({ id: uuid(), indice: indice })),
      );
      setDocumentPageCount(document.getPageCount());
    };
    getDocumentIndices();
  }, [fileItem]);

  const handleReorder = (event: any) => {
    const { active, over } = event;
    if (active?.id && over?.id && active?.id !== over?.id) {
      const oldIndex = indices.map((i) => i.id).indexOf(active.id);
      const newIndex = indices.map((i) => i.id).indexOf(over.id);
      setIndices(arrayMove(indices, oldIndex, newIndex));
    }
  };

  const toggleSelectedId = (id: string) => {
    if (selectedIndiceIds.some((value) => value === id)) {
      return setSelectedIndiceIds(
        selectedIndiceIds.filter((value) => value !== id),
      );
    }
    setSelectedIndiceIds([...selectedIndiceIds, id]);
  };

  const handleItemClick = (id: string) => {
    if (selectedIndiceIds[0] !== id) {
      return setSelectedIndiceIds([id]);
    }
    setSelectedIndiceIds([]);
  };

  const hanldeItemCtrlClick = (id: string) => {
    toggleSelectedId(id);
  };

  const handleItemShiftClick = (id: string) => {
    let startIdx = indices.findIndex((item) => item.id === id);
    // @TODO: have last selected item in separate state
    let endIdx = indices.findIndex(
      (item) => item.id === selectedIndiceIds[selectedIndiceIds.length - 1],
    );
    if (startIdx > endIdx) {
      [startIdx, endIdx] = [endIdx, startIdx];
    }
    const affectedIds = indices
      .slice(startIdx, endIdx + 1)
      .map((item) => item.id);
    const clearedSelection = selectedIndiceIds.filter((value) =>
      affectedIds.some((id) => value !== id),
    );
    setSelectedIndiceIds([...clearedSelection, ...affectedIds]);
  };

  const clickEventRouter = (e: any, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.ctrlKey) {
      return hanldeItemCtrlClick(id);
    }
    if (e.shiftKey) {
      return handleItemShiftClick(id);
    }
    handleItemClick(id);
  };

  const isIndiceSelected = (id: string) => {
    return selectedIndiceIds.indexOf(id) !== -1;
  };

  const onClickOutside = () => {
    setSelectedIndiceIds([]);
  };

  const getIsDocumentAltered = () => {
    if (indices.length !== documentPageCount) {
      return true;
    }
    for (let i = 0; i < documentPageCount; i++) {
      if (i !== indices[i].indice) {
        return true;
      }
    }
    return false;
  };

  const onSaveChanges = () => {
    handleCommit(indices.map((indice) => indice.indice));
  };

  const onDiscardChanges = () => {
    const result = [];
    for (const indice of new Array(documentPageCount).fill(0).keys()) {
      result.push({ id: uuid(), indice });
    }
    setIndices(result);
  };

  const onClone = () => {
    const result = [];
    for (const indiceItem of indices) {
      result.push(indiceItem);
      if (selectedIndiceIds.includes(indiceItem.id)) {
        result.push({ id: uuid(), indice: indiceItem.indice });
      }
    }
    setIndices(result);
  };

  const onDelete = () => {
    setIndices(
      indices.filter((indice) => !selectedIndiceIds.includes(indice.id)),
    );
  };

  const onExtract = (e: any) => {
    e.stopPropagation();
    handleExtract(
      indices
        .filter((indice) => selectedIndiceIds.includes(indice.id))
        .map((indice) => indice.indice),
    );
  };

  return (
    <div onClick={onClickOutside}>
      <div className="flex flex-wrap gap-4 px-4">
        <div
          className={clsx("px-4 py-2 rounded-sm bg-[#ddd] cursor-pointer btn-shadow", !getIsDocumentAltered() && "text-gray-400 cursor-no-drop")}
          onClick={onDiscardChanges}
        >
          Discard
        </div>
        <div
          className={clsx("px-4 py-2 rounded-sm bg-[#ddd] cursor-pointer btn-shadow", !getIsDocumentAltered() && "text-gray-400 cursor-no-drop")}
          onClick={onSaveChanges}
          >
          Save
        </div>
        <div
          className={clsx("px-4 py-2 rounded-sm bg-[#ddd] cursor-pointer btn-shadow", !selectedIndiceIds.length && "text-gray-400 cursor-no-drop")}
          onClick={onExtract}
        >
          Extract as
        </div>
        <div
          className={clsx("px-4 py-2 rounded-sm bg-[#ddd] cursor-pointer btn-shadow", !selectedIndiceIds.length && "text-gray-400 cursor-no-drop")}
          onClick={onDelete}
        >
          Delete
        </div>
        <div
          className={clsx("px-4 py-2 rounded-sm bg-[#ddd] cursor-pointer btn-shadow", !selectedIndiceIds.length && "text-gray-400 cursor-no-drop")}
          onClick={onClone}
        >
          Clone
        </div>
      </div>
      <div className="p-4">
        <fieldset className="border border-solid border-gray-300 p-2">
          <legend className="text-sm">{fileItem?.file.name}</legend>
          <Document
            loading={PageThumbnailOverlay}
            className="py-4"
            file={fileItem?.file}
          >
            <DocumentPageList
              onPageClick={clickEventRouter}
              documentIndices={indices}
              handleReorder={handleReorder}
              isIndiceSelected={isIndiceSelected}
            />
          </Document>
        </fieldset>
      </div>

    </div>
  );
};

export default DocumentManager;
