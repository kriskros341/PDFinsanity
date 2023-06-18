import { OnDragEndResponder } from "react-beautiful-dnd";
import { FileItem } from "../../types";

export interface DocumentFileList {
    items: FileItem[],
    selectedItemIds: string[],
    handleReorder: OnDragEndResponder,
    handleRemove: (filename: string) => void,
    handleItemClick: (e: any, id: string) => void,
}
