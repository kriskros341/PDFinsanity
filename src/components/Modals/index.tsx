import './index.css';

interface ModalAction {
    className?: string,
    text: string,
    onClick?: (e: any) => void
};

interface Modal {
    children: React.ReactNode,
    additionalActions?: ModalAction[],
    onHide: (e: any) => void,
};

const Modal = ({children, onHide, additionalActions}: Modal) => {
    return (
        <div className="Modal-container">
            <div className="Modal">
                <div className="Modal-content">
                    {children}
                </div>
                <div className="Modal-actions">
                    <div className="Modal-action" onClick={onHide}>Cancel</div>
                    {additionalActions?.map((action) => (
                        <div className={`Modal-action ${action.className ?? ''}`} onClick={action.onClick}>{action.text}</div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Modal