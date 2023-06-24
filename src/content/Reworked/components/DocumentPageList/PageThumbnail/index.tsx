import { Thumbnail } from 'react-pdf';

import {
useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import './style.css';

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
            className="PageThumbnail"
            onClick={handleClick}
        >
            <Thumbnail width={212} height={300} className="thumbnail" pageNumber={pageNumber} />
        </div>
    )
}

export default PageThumbnail;