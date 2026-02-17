import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

function FilePreview({ url, loading = false, overwiteIsImage = undefined }) {
  const [fileUrl, setfileUrl] = useState(url);
  const [fileExtension, setfileExtension] = useState("Other");
  const [fileName, setfileName] = useState("File Name");
  const [showOverlay, setshowOverlay] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const dialogId = "_" + uuidv4().slice(0, 4);

  useEffect(() => {
    const urlSplit = fileUrl.split("/");
    if (urlSplit.length > 1) {
      const tempFileName = urlSplit[urlSplit.length - 1];
      setfileName(tempFileName);
      const fileNameSplit = tempFileName.split(".");
      setfileExtension(fileNameSplit[fileNameSplit.length - 1]);
    }
  }, [url]);

  const isImage = (ext) => {
    return overwiteIsImage == undefined ? ["png", "jpg", "jpeg", "gif", "svg"].includes(ext.toLowerCase()) : overwiteIsImage;
  };

  return (
    <>
      <div
        className="card cp col"
        style={{ minHeight: "7rem", maxHeight: "7rem", minWidth: "7rem", maxWidth: "7rem", overflow: "hidden", position: "relative" }}
        onMouseEnter={() => {
          setshowOverlay(true);
        }}
        onMouseLeave={() => {
          setshowOverlay(false);
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Only open modal, don't open the file
          if (!loading) {
            setShowModal(true);
          }
        }}
      >
        {isImage(fileExtension) ? (
          <img 
            src={fileUrl} 
            alt="file preview" 
            style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "7rem" }}>
            <p className="body3">{fileName.length < 7 ? fileName : fileName.slice(0, 6) + "..."}</p>
            <p className="text-secondary mb-0">{fileExtension.toUpperCase()}</p>
          </div>
        )}

        {(showOverlay || loading === true) && (
          <div
            className="p-2 d-flex align-items-center justify-content-center"
            style={{ position: "absolute", left: "0rem", bottom: "0px", width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)" }}
          >
            {loading === true ? (
              <>
                <div className="spinner-border text-light" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </>
            ) : (
              <>
                <i
                  className="bi bi-eye cp text-white"
                  style={{ fontSize: "1rem", cursor: "pointer" }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowModal(true);
                  }}
                ></i>
                {/* <i className="bi bi-trash3-fill cp text-danger" style={{ fontSize: "1rem", marginLeft: "1rem" }}></i> */}
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050 }}
          onClick={() => setShowModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content" style={{ position: "relative" }}>
              {/* Close button */}
              <button
                type="button"
                className="btn-close"
                style={{ position: "absolute", top: "10px", right: "10px", zIndex: 10, backgroundColor: "white", borderRadius: "50%", padding: "8px" }}
                onClick={() => setShowModal(false)}
              ></button>

              <div className="modal-body p-0" style={{ maxHeight: "80vh", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <img
                  src={isImage(fileExtension) ? fileUrl : "/static/icons/file_pdf.png"}
                  alt="file preview"
                  style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }}
                />
                {!isImage(fileExtension) && (
                  <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "6rem" }}>
                    <p className="body3">{fileName}</p>
                    <p className="text-secondary mb-0">{fileExtension.toUpperCase()}</p>
                  </div>
                )}
              </div>

              <div
                className="p-2 d-flex align-items-center justify-content-center"
                style={{ position: "absolute", bottom: "0px", width: "100%", backgroundColor: "rgba(0,0,0,0.7)" }}
              >
                <a href={fileUrl} download>
                  <i className="bi bi-download cp text-white" style={{ fontSize: "1.2rem", cursor: "pointer" }}></i>
                </a>

                {loading === true && (
                  <div className="spinner-border spinner-border-sm text-light" role="status" style={{ marginLeft: "1.4rem" }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FilePreview;
