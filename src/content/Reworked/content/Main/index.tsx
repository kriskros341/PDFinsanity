import { DragEvent, useRef, useState } from 'react';

import './style.css'
import { FileItem } from '../../../../types';
import EmptyDocumentList from '../../../../components/EmptyDocumentList';
import DocumentList from '../../components/DocumentList';
import DocumentManager from '../../components/DocumentPageList';
import { PDFDocument, PDFPageTree } from 'pdf-lib';

type layoutType = keyof typeof layoutType

const Panel = ({children}: {children: React.ReactNode}) => {
    return (
        <div className="Panel">
            {children}
        </div>
    )
}

const layoutType = {
    single: 'single',
    double: 'double',
} as const

const Layout = ({layout, children}: {layout: layoutType, children: React.ReactNode}) => {
    return (
        <div className="Layout-container">
            <div className={layout === 'single' ? "Layout-singleCol" : "Layout-doubleCol" }>
                {children}
            </div>
        </div>
    )
}

const Main = () => {
    const [ fileItems, setFileItems ] = useState<FileItem[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [ inspectedItemId, setInspectedItemId ] = useState<string | undefined>();
    const [ dragCounter, setDragCounter ] = useState(0);

    const [ selectedItemIds, setSelectedItemIds ] = useState<string[]>([])

    const handleDrop = (e: DragEvent<HTMLFormElement>) => {
        e.preventDefault()
        e.nativeEvent.preventDefault();
        e.stopPropagation();
        const { files } = e.dataTransfer;
        if (files.length > 0) {
            setFileItems([...fileItems, ...[...files].map(FileItem.fromFile)]);
        }
        setDragCounter(0)
    }

    const onFileInputClick = () => {
        fileInputRef.current && fileInputRef.current.click()
    }

    const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        console.log(e.target.files)
        if (e.target) {
            setFileItems([...fileItems, ...[...e.target.files!].map(FileItem.fromFile)]);
        }
        // @ts-ignore
        e.target.files = [];
    }


    const onDragLeave = (e: any) => {
        e.stopPropagation()
        setDragCounter(current => current-1)
    }
    const onDragEnter = (e: DragEvent<HTMLFormElement>) => {
        e.preventDefault()
        setDragCounter(current => current+1)
    }

    
    const toggleInspectedItem = (id: string) => {
        setInspectedItemId(current => current === id ? undefined : id)
    }

    const toggleSelectedId = (id: string) => {
        if (selectedItemIds.some(value => value === id)) {
            return setSelectedItemIds(selectedItemIds.filter(value => value !== id))
        }
        setSelectedItemIds([...selectedItemIds, id])
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
        let startIdx = fileItems.findIndex(item => item.id === id);
        // @TODO: have last selected item in separate state
        let endIdx = fileItems.findIndex(item => item.id === selectedItemIds[selectedItemIds.length - 1]);  
        if(startIdx > endIdx) {
            [startIdx, endIdx] = [endIdx, startIdx] 
        }
        const affectedIds = fileItems.slice(startIdx, endIdx+1).map(item => item.id);
        const clearedSelection = selectedItemIds.filter(value => affectedIds.some(id => value !== id))
        setSelectedItemIds([...clearedSelection, ...affectedIds])
    }

    const clickEventRouter = (e: any, id: string, dbl?: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        console.log(id, fileItems)
        if (dbl) {
            return toggleInspectedItem(id)
        }
        if (e.ctrlKey) {
            return hanldeItemCtrlClick(id)
        }
        if(e.shiftKey) {
            return handleItemShiftClick(id)
        }
        handleItemClick(id)
    }

    const onClickOutside = (e: any) => {
        e?.stopPropagation();
        setSelectedItemIds([]);
    }

    const handleCommitReorderPages = (newPageIndices: number[]) => {
        const asyncHelper = async () => {
            const oldDocumentFileItem = fileItems.find(fileItem => fileItem.id === inspectedItemId);
            if (!oldDocumentFileItem) {
                console.warn('No reorder target file provided');
                return;
            }
            const document = await PDFDocument.load(await oldDocumentFileItem.file.arrayBuffer());
            const documentPages = document.getPages();
            const changedIndices = document.getPageIndices()
                .filter((value, index) => value !== newPageIndices[index]);

            for (let i of changedIndices) {
                document.removePage(i);
                document.insertPage(i, documentPages[newPageIndices[i]]);
            }
            const newDocumentFile = new File([await document.save()], oldDocumentFileItem.file.name);
            const newDocumentFileItem = FileItem.fromFile(newDocumentFile);
            setSelectedItemIds((current) => {
                current[current.indexOf(oldDocumentFileItem.id)] = newDocumentFileItem.id
                return current
            });
            setInspectedItemId(() => newDocumentFileItem.id);
            setFileItems((current) => 
                current.map(item => item.id === oldDocumentFileItem.id ? newDocumentFileItem : item)
            );
        }
        asyncHelper();
    }

    return (
        <form onClick={onClickOutside} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onDragEnter={onDragEnter} onDragLeave={onDragLeave} onSubmit={(e) => e.preventDefault()}>
            {
                fileItems.length ? (
                    <Layout layout={inspectedItemId ? layoutType.double : layoutType.single}>
                        <Panel>
                            <div className="MainPanel-header">
                                <button />
                            </div>
                            <div className="Panel-content">
                                <DocumentList clickEventRouter={clickEventRouter} itemList={fileItems} selectedItemIds={selectedItemIds} setItemList={(value) => setSelectedItemIds(value)} inspectedItemId={inspectedItemId} />
                            </div>
                        </Panel>
                        {inspectedItemId && (
                            <Panel>
                                <div className="Panel-content">
                                    <DocumentManager handleCommitReorderPages={handleCommitReorderPages} fileItem={fileItems.find(item => item.id === inspectedItemId)} />
                                </div>
                            </Panel>
                        )}
                    </Layout>
                ) : (
                    <EmptyDocumentList onClick={onFileInputClick} />
                    )
                }
            <input multiple style={{display: 'none'}} type="file" ref={fileInputRef} onChange={onFileInputChange} />
        </form>
    )
}

export default Main