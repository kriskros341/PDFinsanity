import "./style.css";

const EmptyDocumentList = ({ onClick }: { onClick: (e: any) => void }) => {
  return (
    <div className="EmptyDocumentList-container">
      <div className="EmptyDocumentList">
        <div className="EmptyDocumentList-text">
          <h2>Document list is empty</h2>
        </div>
        <div onClick={onClick} className="EmptyDocumentList-callToAction">
          <h3>Drag over or click here to add files</h3>
        </div>
      </div>
    </div>
  );
};

export default EmptyDocumentList;
