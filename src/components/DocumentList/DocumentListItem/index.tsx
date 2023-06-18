import { DocumentFileListItem } from "./interface";
import './style.css';

const ListItem = ({text, onRemove, isSelected}: DocumentFileListItem) => {
    return (
        <div className={isSelected ? 'ListItem ListItem-selected' : 'ListItem'}>
            <div className="ListItem-content">
                <div className="ListItem-text">
                    {text}
                </div>
                <span className="listItemRemove" onClick={onRemove}>x</span>
            </div>
        </div>
    )
}

export default ListItem;