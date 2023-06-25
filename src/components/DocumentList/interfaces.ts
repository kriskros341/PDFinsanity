import { FileItem } from "../../types";

export interface DocumentListInterface  {
    inspectedItemId?: string,
    clickEventRouter: (e: any, id: string, dlb?: boolean) => void,
    itemList: FileItem[],
    setItemList: (items: any) => void,
    selectedItemIds: string[],
}
