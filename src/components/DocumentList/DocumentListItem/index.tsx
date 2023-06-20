import { useState, useEffect } from "react";
import { DocumentFileListItem } from "./interface";
import './style.css';
import { Document, Thumbnail } from 'react-pdf';

import { pdfjs } from 'react-pdf';
import { PDFDocument } from "pdf-lib";

import {
    DndContext, 
    pointerWithin,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
  } from '@dnd-kit/core';
  import {
    useSortable,
    arrayMove,
    SortableContext,
    rectSortingStrategy,
  } from '@dnd-kit/sortable';
  import {CSS} from '@dnd-kit/utilities';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

import { v4 as uuid } from 'uuid'

const PageThumbnail = ({id, pageNumber, isSelected, onClick}: {id: string, pageNumber: number, isSelected: boolean, onClick: () => void}) => {
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
        outline: isSelected ? '2px solid green' : undefined,
    };

    const handleClick = (e: any) => {
        e.stopPropagation();
        e.preventDefault();
        onClick()
    }

    return (
        <div ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="PageThumbnail-container"
            onClick={handleClick}
        >
            <Thumbnail width={212} height={300} className="thumbnail" pageNumber={pageNumber} />
        </div>
    )
}

const PageThumbnailOverlay = () => {
    return (
        <div style={{width: 212, height: 300, background: '#eee'}} className="thumbnail" />
    )
}

const ListItem = ({fileItem, onRemove, isSelected}: DocumentFileListItem) => {
    const [toggled, setToggled] = useState(false);
    const [pageItems, setPageItems] = useState<{ id: string, indice: number }[]>([])
    const toggle = (e: any) => {
        e.stopPropagation();
        setToggled(current => !current)
    }
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const [ selectedPageItemIds, setSelectedPageItemIds ] = useState<string[]>([]);

    useEffect(() => {
        const createPreviewUrls = async () => {
            const document = await PDFDocument.load(await fileItem.file.arrayBuffer());
            setPageItems(document.getPageIndices().map(indice => ({ id: uuid(), indice: indice+1 })))
        }
        createPreviewUrls()
    }, [])

    
    const handleReorder = (event: any) => {
        const {active, over} = event;
        if (active?.id && over?.id && active?.id !== over?.id) {
            setPageItems((items) => {
                const oldIndex = items.map(i => i.id).indexOf(active.id);
                const newIndex = items.map(i => i.id).indexOf(over.id);
                
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const isItemSelected = (itemId: string) => {
        return selectedPageItemIds.indexOf(itemId) !== -1
    }

    const onItemSelected = (itemId: string) => {
        if (isItemSelected(itemId)) {
            return setSelectedPageItemIds(current => current.filter(value => value !== itemId))
        }
        setSelectedPageItemIds(current => [...current, itemId])
    }
    return (           
        <div className={isSelected ? 'ListItem ListItem-selected' : 'ListItem'}>
            <div className="ListItem-content">
                <div className="ListItem-text">
                    {fileItem.file.name}
                </div>
                <div>
                    {toggled ? (
                        <span className="listItemRemove" onClick={toggle}>t</span>
                    ) : (
                        <span className="listItemRemove" onClick={toggle}>h</span>
                    )}
                    <span className="listItemRemove" onClick={onRemove}>x</span>
                </div>
            </div>
            {toggled && (
                <Document loading={PageThumbnailOverlay} className="thumbnailContainer" file={fileItem.file} onItemClick={() => {}}>
                    <div className="ListItem-PageListContainer">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={pointerWithin}
                            onDragEnd={handleReorder}
                        >
                            <SortableContext 
                                items={pageItems}
                                strategy={rectSortingStrategy}
                                
                            >
                                {pageItems.map((item) => 
                                    <PageThumbnail onClick={() => onItemSelected(item.id)} id={item.id} pageNumber={item.indice} isSelected={isItemSelected(item.id)} />
                                )}
                            <DragOverlay><></></DragOverlay>
                            </SortableContext>
                        </DndContext>
                    </div>
                </Document>
            )}
        </div>
    )
}

export default ListItem;