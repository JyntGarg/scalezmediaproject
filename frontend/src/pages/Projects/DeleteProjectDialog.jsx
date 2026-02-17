import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { deleteProject } from "../../redux/slices/projectSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Trash2 } from "lucide-react";

function DeleteProjectDialog({ projectToDelete, isOpen, onOpenChange }) {
  const dispatch = useDispatch();
  const [isDeleting, setIsDeleting] = useState(false);

  const closeDialog = () => {
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    if (!projectToDelete?._id) return;
    
    setIsDeleting(true);
    try {
      await dispatch(deleteProject({ 
        projectId: projectToDelete._id,
        closeModal: closeDialog
      }));
    } catch (error) {
      console.error("Error deleting project:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Delete Project
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{projectToDelete?.name}</strong>? 
            <span className="block mt-2 font-semibold text-foreground">
              All the data will be erased. This action cannot be undone.
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={closeDialog}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
            onClick={handleDelete}
            disabled={isDeleting || !projectToDelete?._id}
          >
            {isDeleting ? "Deleting..." : "Delete Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteProjectDialog;
