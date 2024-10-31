import {
  DndContext,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import DocumentListItem from "./DocumentListItem";
import { DocumentListInterface } from "./interfaces";

const DocumentList = ({
  clickEventRouter,
  itemList,
  selectedItemIds,
  setItemList,
  inspectedItemId,
}: DocumentListInterface) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleReorder = (event: any) => {
    const { active, over } = event;
    if (active?.id && over?.id && active?.id !== over?.id) {
      const oldIndex = itemList.map((i) => i.id).indexOf(active.id);
      const newIndex = itemList.map((i) => i.id).indexOf(over.id);
      setItemList(arrayMove(itemList, oldIndex, newIndex));
    }
  };

  const isSelected = (itemId: string) => {
    return selectedItemIds.indexOf(itemId) !== -1;
  };

  return (
    <div className="flex flex-col gap-4">
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragEnd={handleReorder}
      >
        <SortableContext
          items={itemList}
          strategy={verticalListSortingStrategy}
        >
          {itemList.map((item) => (
            <DocumentListItem
              clickEventRouter={clickEventRouter}
              inspectedItemId={inspectedItemId ?? ""}
              key={item.id}
              id={item.id}
              text={item.file.name}
              isSelected={isSelected(item.id)}
            />
          ))}
          <DragOverlay>
            <></>
          </DragOverlay>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default DocumentList;
