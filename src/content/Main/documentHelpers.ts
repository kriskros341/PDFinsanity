import { PDFDocument } from 'pdf-lib';
import { FileItem } from '../../types';
import PDFMerger from 'pdf-merger-js';

export const download = (data: Blob, filename: string) => {
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

// unused
export const split = async (file: File) => {
    const result = [];
    const docData = await file.arrayBuffer();
    const document = await PDFDocument.load(docData);
    const indices = document.getPageIndices();
    for (let indice of indices) {
        const pageDocument = await PDFDocument.create();
        const [page,] = await pageDocument.copyPages(document, [indice]);
        pageDocument.addPage(page);
        const docData = await pageDocument.save();
        result.push(new File([docData], indices.length === 1 ? file.name : `${file.name}_page_${indice+1}`));
    }
    return result;
}

const defaultMergeName = "MergedDocuments.pdf";
export const merge = async (files: FileItem[], mergeIds: string[], newName?: string) => {
    const merger = new PDFMerger();
    for (let item of files) {
        if (mergeIds.indexOf(item.id) !== -1) {
            await merger.add(item.file)
        }
    }
    const mergedPdf = await merger.saveAsBuffer()
    let mergedPdfFile = new File([mergedPdf], `${newName}.pdf` ?? defaultMergeName, {type: "application/pdf"});
    const newDocument = FileItem.fromFile(mergedPdfFile)
    return newDocument;
}

export const createDocumentFromDocumentIndices = async (documentFile: File, indices: number[]) => {
    const newDocument = await PDFDocument.create();
    const document = await PDFDocument.load(await documentFile.arrayBuffer());
    const pages = await newDocument.copyPages(document, indices);
    for (const page of pages) {
        newDocument.addPage(page);
    }

    const newDocumentFile = new File([await newDocument.save()], documentFile.name);
    return newDocumentFile;
}