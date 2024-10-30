export interface DocumentListItem {
  id: string;
  text: string;
  isSelected: boolean;
  inspectedItemId: string;
  clickEventRouter: (...args: any[]) => void;
}
