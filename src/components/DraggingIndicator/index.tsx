import './style.css'

const DraggingIndicator = () => {
    return (
        <>
            <div className="DraggingIndicator-backdrop">
                <div className="DraggingIndicator-container">
                    <h4 className="DraggingIndicator-text">Droping items</h4>
                </div>
            </div>
        </>
    )
}

export default DraggingIndicator;