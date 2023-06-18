import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import type { DocumentFileList } from './interface';
import ListItem from './DocumentListItem';
import './style.css'

const DocumentFileList = ({ items, selectedItemIds, handleReorder, handleRemove, handleItemClick }: DocumentFileList) => {
    return (
        <DragDropContext onDragEnd={handleReorder}>
            <Droppable droppableId='list-container'>
            {(provided) => (
                <div className={items.length ? "DocumentList" : 'DocumentList DocumentList-empty'}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                >
                    {items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided) => (
                            <div 
                                ref={provided.innerRef}
                                {...provided.dragHandleProps}
                                {...provided.draggableProps}
                                onClick={(e: any) => handleItemClick(e, item.id)}
                                className="dragItemContainer"
                            >
                                <ListItem
                                    text={item.file.name}
                                    onRemove={() => handleRemove(item.id)}
                                    isSelected={selectedItemIds.some(id => id === item.id)}
                                />
                            </div>
                        )}
                    </Draggable>
                    ))}
                    {provided.placeholder}
                </div>
            )}
            </Droppable>
        </DragDropContext>

    )
}

export default DocumentFileList;