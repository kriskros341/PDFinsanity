import { FileItem } from "../../../types";

export interface DocumentFileListItem {
    fileItem: FileItem,
    onRemove: () => void,
    isSelected: boolean,
}