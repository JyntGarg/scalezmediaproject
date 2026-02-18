import React, { useState } from "react";
import "../../App.css";
import { getAssetUrl } from "../../utils/backendServerBaseURL";

const PLACEHOLDER_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

function AvatarGroup({ listOfUrls, show, total, userName, owner}) {
  const [showModal, setShowModal] = useState(false);

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleModalShows = () => {
    setShowModal(true);
  };

  return (
    <>
      <div className="flex -space-x-1">
        {listOfUrls?.slice(0, show)?.map((url, index) => {
          const user = userName?.[index];
          const displayName = user ? `${user[0]} ${user[2] || ''}`.trim() : 'Unknown User';

          return (
            <div
              key={index}
              className="w-6 h-6 rounded-full border-2 border-background overflow-hidden hover:scale-110 transition-transform relative group"
              title={displayName}
            >
              <img
                src={url && !String(url).endsWith("/null") ? (url.startsWith("http") ? url : getAssetUrl(url)) : PLACEHOLDER_AVATAR}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            </div>
          );
        })}
        {total > show && (
          <div
            className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium border-2 border-background hover:scale-110 transition-transform text-gray-800"
            title={`${total - show} more member${total - show > 1 ? 's' : ''}`}
          >
            +{total - show}
          </div>
        )}
      </div>

      {userName?.length > 5 && showModal && (
        <>
          <div className="modal-backdrop show" />
          <div
            className="modal d-block"
            tabIndex="-1"
            role="dialog"
            style={{ display: "block" }}
          >
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-body">
                  <h2 className="mb-3">Members</h2>
                  <div className="container-fluid">
                    <div className="row">
                      <div className="col-12">
                        <div className="slider-container">
                          <div className="">
                            <div >
                              <div className="d-flex align-items-center gap-2 p-1">
                                <img
                                  src={owner?.avatar ? getAssetUrl(owner.avatar) : PLACEHOLDER_AVATAR}
                                  width={24}
                                  height={24}
                                  alt="user"
                                />
                                <span>
                                  {owner.firstName} {owner.lastName}
                                  {/* {option[0]} {option[2]} */}
                                </span>
                              </div>
                            </div>
                            {userName?.map((option, i) => (
                              <div key={i}>
                                <div className="d-flex align-items-center gap-2 p-1">
                                  <img
                                    src={option[1]}
                                    width={24}
                                    height={24}
                                    alt="user"
                                  />
                                  <span>
                                    {option[0]} {option[2]}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-end">
                    <button
                      type="button"
                      className="btn btn-primary mt-3"
                      data-bs-dismiss="modal"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault()(handleModalClose());
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default AvatarGroup;
