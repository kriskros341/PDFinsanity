import { useState, DragEvent, useRef, useEffect } from 'react'
import { PDFDocument } from 'pdf-lib';
import PDFMerger from 'pdf-merger-js/browser';
import DocumentFileList from '../../components/DocumentList';
import { v4 as uuid } from 'uuid';

import {  } from 'react-beautiful-dnd'

import { FileItem } from '../../types'

import './style.css';
import EmptyDocumentList from '../../components/EmptyDocumentList';
import DraggingIndicator from '../../components/DraggingIndicator';

const download = (data: Blob, filename: string) => {
    let file = new File([data], filename, {type: "application/pdf"});
    const fileUrl = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = fileUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(fileUrl);
};

const split = (file: File) => {
    return new Promise<File[]>(async (resolve) => {
        const result = []
        const docData = await file.arrayBuffer();
        const document = await PDFDocument.load(docData);
        const indices = document.getPageIndices();
        for (let indice of indices) {
            const pageDocument = await PDFDocument.create()
            const [page,] = await pageDocument.copyPages(document, [indice])
            pageDocument.addPage(page)
            const docData = await pageDocument.save();
            result.push(new File([docData], indices.length === 1 ? file.name : `${file.name}_page_${indice+1}`));
        }
        resolve(result)
    })
}

const createFileItemFromFile = async (file: File) => {
    return { id: uuid(), file }
}

const Main = () => {
    const [items, setItems] = useState<FileItem[]>([]);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [ dragCounter, setDragCounter ] = useState(0)

    useEffect(() => {

    })

    const fileInputRef = useRef<HTMLInputElement>(null);

    const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (e.target) {
            setItems([...items, ...[...e.target.files!].map(FileItem.fromFile)]);
        }
    }

    const toggleSelectedId = (id: string) => {
        if (selectedItemIds.some(value => value === id)) {
            return setSelectedItemIds(selectedItemIds.filter(value => value !== id))
        }
        setSelectedItemIds([...selectedItemIds, id])
    }

    const onFileInputClick = () => {
        fileInputRef.current && fileInputRef.current.click()
    }

    const handleItemClick = (id: string) => {
        if (selectedItemIds[0] !== id) {
            setSelectedItemIds([id])
        }
    }

    const hanldeItemCtrlClick = (id: string) => {
        toggleSelectedId(id)
    }

    const handleItemShiftClick = (id: string) => {

        let startIdx = items.findIndex(item => item.id === id);
        // @TODO: have last selected item in separate state
        let endIdx = items.findIndex(item => item.id === selectedItemIds[selectedItemIds.length - 1]);  
        if(startIdx > endIdx) {
            [startIdx, endIdx] = [endIdx, startIdx] 
        }
        const affectedIds = items.slice(startIdx, endIdx+1).map(item => item.id);
        const clearedSelection = selectedItemIds.filter(value => affectedIds.some(id => value !== id))
        setSelectedItemIds([...clearedSelection, ...affectedIds])
    }

    const clickEventRouter = (e: any, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.ctrlKey) {
            return hanldeItemCtrlClick(id)
        }
        if(e.shiftKey) {
            return handleItemShiftClick(id)
        }
        handleItemClick(id)
        
    }

    const handleDrop = (e: DragEvent<HTMLFormElement>) => {
        e.preventDefault()
        const { files } = e.dataTransfer;
        if (files.length > 0) {
            setItems([...items, ...[...files].map(FileItem.fromFile)]);
        }
        setDragCounter(0)
    }

    const onDragOver = (e: DragEvent<HTMLFormElement>) => {
        e.preventDefault()
    }

    
    const onDragEnter = (e: DragEvent<HTMLFormElement>) => {
        e.preventDefault()
        setDragCounter(current => current+1)
    }


    const handleRemove = (id: string) => {
        setItems(files => files.filter(file => file.id != id));
    }

    const handleReorder = (updatedFile: any) => {
        if (!updatedFile.destination) return;
        var updatedList = [...items];
        const [reorderedItem] = updatedList.splice(updatedFile.source.index, 1);
        updatedList.splice(updatedFile.destination.index, 0, reorderedItem);
        setItems(updatedList);
    };

    const onMerge = async () => {
        const idsToMerge = selectedItemIds.length === 0 ? items.map(item => item.id) : selectedItemIds
        const result: FileItem[] = [];
        const merger = new PDFMerger();
        console.log('merge')
        for (let item of items) {
            console.log(idsToMerge, items)
            if (idsToMerge.find(value => value === item.id)) {
                await merger.add(item.file)
            } else {
                result.push(item)
            }
        }
        const mergedPdf = await merger.saveAsBuffer()
        let file = new File([mergedPdf], "merged documents", {type: "application/pdf"});
        const newDocument = await createFileItemFromFile(file)
        result.push(newDocument)
        setItems(result);
        setSelectedItemIds([newDocument.id]);
    }

    const onDownload = () => {
        const itemsToDownload = selectedItemIds.length === 0 ? items : items.filter(item => selectedItemIds.find(value => value === item.id))
        itemsToDownload.forEach(f => {
            download(f.file, f.file.name)
        })
    }

    const onSplit = async () => {
        const idsToSplit = selectedItemIds.length === 0 ? items.map(item => item.id) : selectedItemIds
        const result: FileItem[] = [];
        for (let item of items) {
            console.log(idsToSplit, items)
            if (idsToSplit.find(value => value === item.id)) {
                const newDocuments = await split(item.file);
                console.log('jd')
                for (const newDocument of newDocuments) {
                    result.push(await createFileItemFromFile(newDocument))
                }
            } else {
                result.push(item)
            }
        }
        setItems(result);
        setSelectedItemIds(result.map(item => item.id));
    }

    const onDragLeave = (e: any) => {
        e.stopPropagation()
        console.log('dragLeave')
        setDragCounter(current => current-1)
    }

    const onClickOut = (e: any) => {
        e?.stopPropagation();
        setSelectedItemIds([]);
    }

    return (
        <form onDrop={handleDrop} onDragOver={onDragOver} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onSubmit={(e) => e.preventDefault()}>
            {dragCounter !== 0 && <DraggingIndicator />}
            <div className="App" onClick={onClickOut}>
                {(items.length === 0) ? (
                    <EmptyDocumentList onClick={onFileInputClick}/>
                ) : (
                    <div className="MainContainer">
                        <div className="MainContainer-Toolbar">
                            <div className="icon-button" onClick={onMerge}>
                                <div className="icon merge" />
                                <div>Merge</div>
                            </div>
                            <div className="icon-button" onClick={onDownload}>
                                <div className="icon download" />
                                <div>{selectedItemIds.length === 0 ? 'Download all' : 'Download selected'}</div>
                            </div>
                            <div className="icon-button" onClick={onSplit}>
                                <div className="icon split" />
                                <div>{selectedItemIds.length === 0 ? 'Split all' : 'Split selected'}</div>
                            </div>
                        </div>
                        <div className="DragContainer">
                            <DocumentFileList
                                items={items}
                                selectedItemIds={selectedItemIds}
                                handleItemClick={clickEventRouter}
                                handleRemove={handleRemove}
                                handleReorder={handleReorder}
                            />
                        </div>
                        <div onClick={onFileInputClick} className="MainContainer-callToAction">
                            <h4>Drag over or Click here to add files</h4>
                        </div>
                    </div>
                )}
                <input multiple style={{display: 'none'}} type="file" ref={fileInputRef} onChange={onFileInputChange} />
            </div>
        </form>
    )
}

export default Main;