import React, { useState } from "react";
import { backendServerBaseURL } from "../../utils/backendServerBaseURL";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Trash2, Upload } from "lucide-react";

function ImageComponent({ image, handleImage, handleDelete }) {
  const [showModal, setShowModal] = useState(false);

  const handleImageClick = () => {
    setShowModal(true);
  };

  const handleImageChange = (event) => {
    if (event.target.files.length !== 0) {
      handleImage(event.target.files[0]);
    }
    setShowModal(false);
  };

  const handleDeleteImage = () => {
    handleDelete();
    setShowModal(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const isDefaultImage = image === "/static/icons/logo.svg" || image === " /static/icons/logo.svg";

  const handleImageError = (e) => {
    // Fallback to default logo if uploaded logo fails to load
    if (image !== "/static/icons/logo.svg" && image !== " /static/icons/logo.svg") {
      e.target.src = "/static/icons/logo.svg";
    }
  };

  return (
    <div>
      <img
        style={{ cursor: "pointer" }}
        src={image}
        onClick={handleImageClick}
        onError={handleImageError}
        alt="logo"
        width={"85px"}
        height={"90px"}
        className="rounded-lg object-cover border border-border"
      />
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px] bg-background">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Change Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Select Image</label>
              <input
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-row justify-between sm:justify-end gap-2">
            <Button
              type="button"
              variant="destructive"
              disabled={isDefaultImage}
              onClick={handleDeleteImage}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Image
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ImageComponent;
