export interface DocumentFileListItem {
    text: React.ReactNode,
    onRemove: () => void,
    isSelected: boolean,
}