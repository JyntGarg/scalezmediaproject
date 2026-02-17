import { Form, FormikProvider, useFormik } from "formik";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import * as Yup from "yup";
import { selectSelectedKeyMetric, updateKeyMetricValue } from "../../../redux/slices/projectSlice";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

function EditMetricValueDialog({ open, onOpenChange }) {
  const selectedKeyMetric = useSelector(selectSelectedKeyMetric);
  const dispatch = useDispatch();
  const params = useParams();
  const goalId = params.goalId;
  const [isOpen, setIsOpen] = useState(false);

  const closeDialog = () => {
    setIsOpen(false);
    if (onOpenChange) {
      onOpenChange(false);
    }
    formik.resetForm();
  };

  const NewProjectSchema = Yup.object().shape({
    value: Yup.number().required("Value is required"),
  });

  const formik = useFormik({
    initialValues: {
      value: "",
    },
    validateOnBlur: true,
    validationSchema: NewProjectSchema,
    onSubmit: async (values, { setErrors, setSubmitting }) => {
      setSubmitting(true);
      try {
        await dispatch(updateKeyMetricValue({ 
          ...values, 
          keymetricId: selectedKeyMetric?._id, 
          goalId, 
          closeDialog,
        }));
      } catch (error) {
        console.error("Error updating metric value:", error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const { errors, touched, handleSubmit, isSubmitting, getFieldProps } = formik;

  useEffect(() => {
    if (selectedKeyMetric?.value !== undefined) {
      formik.setValues({
        value: selectedKeyMetric.value,
      });
    }
  }, [selectedKeyMetric]);

  return (
    <Dialog open={open || isOpen} onOpenChange={onOpenChange || setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold">Update Metric Value</DialogTitle>
          {selectedKeyMetric?.name && (
            <p className="text-sm text-muted-foreground mt-1">{selectedKeyMetric.name}</p>
          )}
        </DialogHeader>

        <FormikProvider value={formik}>
          <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-value">Value</Label>
                <Input 
                  id="edit-value"
                  type="number" 
                  {...getFieldProps("value")} 
                  placeholder="Enter Value" 
                />
                {touched.value && errors.value && (
                  <span className="text-sm text-red-600">
                    {errors.value}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button 
                type="button" 
                variant="outline" 
                size="lg"
                onClick={closeDialog}
              >
                Close
              </Button>
              <Button 
                type="submit" 
                size="lg"
                className="bg-black hover:bg-gray-800 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Value"}
              </Button>
            </div>
          </Form>
        </FormikProvider>
      </DialogContent>
    </Dialog>
  );
}

export default EditMetricValueDialog;
