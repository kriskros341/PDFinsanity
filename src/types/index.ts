import { v4 as uuid } from 'uuid';

export class FileItem {
    id: string
    file: File
    constructor(f: File, id?: string) {
        this.file = f;
        this.id = id ?? uuid();
    }


    static fromFileArgs(...args: ConstructorParameters<typeof File>) {
        const file = new File(...args)
        return new FileItem(file)
    }

    static fromFile(f: File) {
        return new FileItem(f);
    }
}