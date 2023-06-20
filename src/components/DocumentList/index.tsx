import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import type { DocumentFileList } from './interface';
import ListItem from './DocumentListItem';
import './style.css'
import { pdfjs } from 'react-pdf';
import {
    DndContext, 
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    useSortable,
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
  ).toString();

const DocumentFileList = ({ items, selectedItemIds, handleReorder, handleRemove, handleItemClick }: DocumentFileList) => {
    
    return (
        <div className={items.length ? "DocumentList" : 'DocumentList DocumentList-empty'}>
            {items.map((item) => (
                <div 
                    key={item.id}
                    onClick={(e: any) => handleItemClick(e, item.id)}
                    className="dragItemContainer"
                >
                    <ListItem
                        fileItem={item}
                        onRemove={() => handleRemove(item.id)}
                        isSelected={selectedItemIds.some(id => id === item.id)}
                    />
                </div>
            ))}
        </div>

    )
}

export default DocumentFileList;