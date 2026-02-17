import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  deleteIdea,
  selectSelectedIdea,
  updateSelectedIdea,
  selectShowDeleteIdeaDialog,
  updateShowDeleteIdeaDialog
} from "../../../redux/slices/projectSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

function DeleteIdeaDialog() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const projectId = params.projectId;
  const ideaId = params.ideaId;
  const selectedIdea = useSelector(selectSelectedIdea);
  const showDialog = useSelector(selectShowDeleteIdeaDialog);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(showDialog && !!selectedIdea);
  }, [selectedIdea, showDialog]);

  const closeDialog = () => {
    setIsOpen(false);
    dispatch(updateShowDeleteIdeaDialog(false));
    dispatch(updateSelectedIdea(null));
  };

  const handleDelete = () => {
    // Pass navigate and ideaId to the delete thunk so it can navigate immediately after deletion
    dispatch(deleteIdea({ 
      projectId, 
      ideaId,
      navigate,
      closeDialog 
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) closeDialog();
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Idea</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this idea? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={closeDialog}
          >
            Close
          </Button>
          <Button
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
            onClick={handleDelete}
          >
            Delete Idea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteIdeaDialog;
