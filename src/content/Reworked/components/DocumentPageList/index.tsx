import { useState, useEffect } from 'react';
import { Document, pdfjs } from 'react-pdf';
import { PDFDocument } from "pdf-lib";
import { v4 as uuid } from 'uuid'

import {
    DndContext, 
    pointerWithin,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    rectSortingStrategy,
} from '@dnd-kit/sortable';

import PageThumbnail from './PageThumbnail';

import type { FileItem } from '../../../../types';

import './style.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
).toString();

const PageThumbnailOverlay = () => {
    return (
        <div style={{width: 212, height: 300, background: '#eee'}} className="thumbnail" />
    )
}

type DocumentPageIndiceItem = { id: string, indice: number }

const DocumentPageList = ({documentIndices, handleReorder, isIndiceSelected}: {documentIndices: DocumentPageIndiceItem[], handleReorder: (e: any) => void, isIndiceSelected: (id: string) => boolean}) => {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
    return (
        <div className="PageList">
            <DndContext
                sensors={sensors}
                collisionDetection={pointerWithin}
                onDragEnd={handleReorder}
            >
                <SortableContext 
                    items={documentIndices}
                    strategy={rectSortingStrategy}
                    
                >
                    {documentIndices.map((item) => 
                        <PageThumbnail key={item.id} id={item.id} pageNumber={item.indice+1} isSelected={isIndiceSelected(item.id)} onClick={() => {}} />
                    )}
                <DragOverlay><></></DragOverlay>
                </SortableContext>
            </DndContext>
        </div>
    )
}

const DocumentManager = ({fileItem, handleCommitReorderPages}: {fileItem?: FileItem, handleCommitReorderPages: (indices: number[]) => void}) => {
    const [indices, setIndices] = useState<DocumentPageIndiceItem[]>([]);
    const [selectedIndiceIds, ] = useState<string[]>([]) 

    useEffect(() => {
        if(!fileItem) {
            return;
        }
        const getDocumentIndices = async () => {
            const document = await PDFDocument.load(await fileItem?.file.arrayBuffer());
            setIndices(document.getPageIndices().map(indice => ({ id: uuid(), indice: indice })))
        }
        getDocumentIndices();
    }, [fileItem])

    const handleReorder = (event: any) => {
        const {active, over} = event;
        if (active?.id && over?.id && active?.id !== over?.id) {
            const oldIndex = indices.map(i => i.id).indexOf(active.id);
            const newIndex = indices.map(i => i.id).indexOf(over.id);
            setIndices(arrayMove(indices, oldIndex, newIndex));
        }
    };

    const isIndiceSelected = (id: string) => {
        return selectedIndiceIds.indexOf(id) !== -1;
    }

    return (
        <>
            <button onClick={() => handleCommitReorderPages(indices.map(indice => indice.indice))}>test</button>
            <Document loading={PageThumbnailOverlay} className="thumbnailContainer" file={fileItem!.file} onItemClick={() => {}}>
                <DocumentPageList documentIndices={indices} handleReorder={handleReorder} isIndiceSelected={isIndiceSelected} />
            </Document>
        </>
    )
}

export default DocumentManager;