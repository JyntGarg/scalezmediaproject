import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  deleteGoal,
  selectSelectedGoal,
  updateSelectedGoal,
  selectShowDeleteGoalDialog,
  updateShowDeleteGoalDialog
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

function DeleteGoalDialog() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const projectId = params.projectId;
  const goalId = params.goalId;
  const selectedGoal = useSelector(selectSelectedGoal);
  const showDialog = useSelector(selectShowDeleteGoalDialog);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(showDialog && !!selectedGoal);
  }, [selectedGoal, showDialog]);

  const closeDialog = () => {
    setIsOpen(false);
    dispatch(updateShowDeleteGoalDialog(false));
    dispatch(updateSelectedGoal(null));
  };

  const handleDelete = () => {
    // Pass navigate and goalId to the delete thunk so it can navigate immediately after deletion
    dispatch(deleteGoal({ 
      projectId, 
      goalId,
      navigate,
      closeDialog 
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) closeDialog();
    }}>
      <DialogContent className="max-w-md gap-2">
        <DialogHeader className="text-left sm:text-left">
          <DialogTitle className="text-left">Delete Goal</DialogTitle>
          <DialogDescription className="text-left mt-1">
            Are you sure you want to delete this goal? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={closeDialog}
          >
            Close
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
          >
            Delete Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteGoalDialog;
