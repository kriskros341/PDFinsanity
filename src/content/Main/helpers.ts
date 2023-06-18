import { PDFDocument } from "pdf-lib";

export const getPageIndices = async (file: File) => {
    const docData = await file.arrayBuffer();
    const document = await PDFDocument.load(docData);
    return document.getPageIndices();
}