import { Thumbnail } from "react-pdf";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import "./style.css";

const PageThumbnail = ({
  id,
  pageNumber,
  isSelected,
  onClick,
}: {
  id: string;
  pageNumber: number;
  isSelected: boolean;
  onClick: (e: any) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    onClick(e);
  };

  let thumbnailClassName = "PageThumbnail";
  if (isSelected) {
    thumbnailClassName += " PageThumbnail-selected";
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="PageThumbnail-container"
      onClick={handleClick}
    >
      <Thumbnail
        height={300}
        className={thumbnailClassName}
        pageNumber={pageNumber}
      />
    </div>
  );
};

export default PageThumbnail;
