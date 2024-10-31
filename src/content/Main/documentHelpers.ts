import { PDFDocument, PageSizes } from "pdf-lib";
import { FileItem } from "../../types";
import PDFMerger from "pdf-merger-js";

export const download = (data: Blob, filename: string) => {
  const file = new File([data], filename, { type: "application/pdf" });
  const fileUrl = URL.createObjectURL(file);
  const anchor = document.createElement("a");
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
  for (const indice of indices) {
    const pageDocument = await PDFDocument.create();
    const [page] = await pageDocument.copyPages(document, [indice]);
    pageDocument.addPage(page);
    const docData = await pageDocument.save();
    result.push(
      new File(
        [docData],
        indices.length === 1 ? file.name : `${file.name}_page_${indice + 1}`,
      ),
    );
  }
  return result;
};

const defaultMergeName = "MergedDocuments.pdf";
export const merge = async (
  files: FileItem[],
  mergeIds: string[],
  newName?: string,
) => {
  const merger = new PDFMerger();
  for (const item of files) {
    if (mergeIds.indexOf(item.id) !== -1) {
      await merger.add(item.file as any);
    }
  }
  const mergedPdf = await merger.saveAsBuffer();
  const mergedPdfFile = new File(
    [mergedPdf],
    newName ? `${newName}.pdf` : defaultMergeName,
    { type: "application/pdf" },
  );
  const newDocument = FileItem.fromFile(mergedPdfFile);
  return newDocument;
};

export const createDocumentFromDocumentIndices = async (
  documentFile: File,
  indices: number[],
) => {
  const newDocument = await PDFDocument.create();
  const document = await PDFDocument.load(await documentFile.arrayBuffer());
  const pages = await newDocument.copyPages(document, indices);
  for (const page of pages) {
    newDocument.addPage(page);
  }

  const newDocumentFile = new File(
    [await newDocument.save()],
    documentFile.name,
  );
  return newDocumentFile;
};

// Function to read a file into an ArrayBuffer
const readFileAsArrayBuffer = (file: File) => {
  const temporaryFileReader = new FileReader();

  return new Promise((resolve, reject) => {
    temporaryFileReader.onerror = () => {
      temporaryFileReader.abort();
      reject(new DOMException("Problem parsing input file."));
    };

    temporaryFileReader.onload = () => {
      if (temporaryFileReader.result instanceof ArrayBuffer) {
        resolve(temporaryFileReader.result);
      } else {
        reject(
          new DOMException("Problem parsing input file, unexpected type..."),
        );
      }
    };
    temporaryFileReader.readAsArrayBuffer(file);
  });
};

export async function imageToPdf(image: any) {
  const pdfDoc = await PDFDocument.create();

  // A4 format
  const pdfPage = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = pdfPage.getSize();

  let imagePdf = null;
  if (image.type === "image/jpeg") {
    imagePdf = await pdfDoc.embedJpg(
      (await readFileAsArrayBuffer(image)) as any,
    );
  } else if (image.type === "image/png") {
    imagePdf = await pdfDoc.embedPng(
      (await readFileAsArrayBuffer(image)) as any,
    );
  } else {
    throw new Error(`Image type ${image.type} NOT supported`);
  }

  let imageDims = imagePdf.size();
  // Make sure the image is not larger than the page, and scale down to fit if it is
  if (imageDims.width > width || imageDims.height > height) {
    imageDims = imagePdf.scaleToFit(width, height);
  }
  // Draw image in page, centered horizontally and vertically
  pdfPage.drawImage(imagePdf, {
    x: width / 2 - imageDims.width / 2,
    y: height / 2 - imageDims.height / 2,
    width: imageDims.width,
    height: imageDims.height,
  });

  return await pdfDoc.save();
}
