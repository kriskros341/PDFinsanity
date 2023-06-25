import { useSortable } from "@dnd-kit/sortable";
import { CSS } from '@dnd-kit/utilities';

import type { DocumentListItem } from './interfaces';

import './style.css';

const DocumentListItem = ({id, text, isSelected, inspectedItemId, clickEventRouter}: DocumentListItem) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({id: id});
      
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        filter: isSelected ? 'brightness(120%)' : undefined,
        outline: inspectedItemId === id ? '2px solid green' : undefined,
    };


    const handleClick = (e: any) => {
        clickEventRouter(e, id);
    };

    const handleDoubleClick = (e: any) => {
        clickEventRouter(e, id, true);
    };

    return (
        <div ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            className="DocumentListItem"
        >
            {text.slice(0, -4)}
        </div>
    );
}

export default DocumentListItem;