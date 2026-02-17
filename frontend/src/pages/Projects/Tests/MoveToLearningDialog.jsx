import React, { useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Field, FieldArray } from "formik";
import { Form, FormikProvider } from "formik";
import { useParams, useLocation } from "react-router-dom";
import { moveToLearning, selectsingleLearningInfo, selectselectedLearning, selectselectedTest, selectShowSendBackToTestsDialog, updateLearning, updateselectedLearning, updateselectedTest } from "../../../redux/slices/projectSlice";
import { useDispatch, useSelector } from "react-redux";
import { backendServerBaseURL } from "../../../utils/backendServerBaseURL";
import { useEffect } from "react";
import LoadingButton from "../../../components/common/LoadingButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Trash2, Plus, Upload, Eye, FileIcon, X } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";

function MoveToLearningDialog() {
  const [mediaDocuments, setmediaDocuments] = useState([]);
  const mediaAndDocRef = useRef();
  const params = useParams();
  const projectId = params.projectId;
  const dispatch = useDispatch();
  const closeRef = useRef();
  const [isSubmitting, setisSubmitting] = useState(false);

  const closeDialog = () => {
    setIsOpen(false);
    dispatch(updateselectedLearning(null));
    dispatch(updateselectedTest(null));
    aboutGoalFormik.resetForm();
    setmediaDocuments([]);
    setdeletedMedia([]);
  };

  const aboutGoalFormik = useFormik({
    initialValues: {
      result: "",
      description: "",
    },
    validationSchema: Yup.object().shape({
      result: Yup.string().required("result is required"),
      description: Yup.string().required("description is required"),
    }),
      onSubmit: async (values, { setErrors, setSubmitting }) => {
        console.log(aboutGoalFormik.values);
        setSubmitting(false);
      },
    });

    const onSubmitAboutGoalsForm = async () => {
      console.log(aboutGoalFormik.values);
      // setSubmitting(false);
      
      if(selectedLearning) {
        // Editing existing learning
        const id = !selectedLearning ? projectId : selectedLearning?._id;
        await dispatch(
          updateLearning({ ...aboutGoalFormik.values, files: mediaDocuments, deletedMedia , projectId , learningId: id, setmediaDocuments })
        );
        closeDialog();
      } else if (selectedTest) {
        // Moving test to learning
        // Note: moveToLearning action gets testId from Redux state (selectedTest)
        await dispatch(moveToLearning({ 
          projectId, 
          ...aboutGoalFormik.values, 
          files: mediaDocuments, 
          closeDialog 
        }));
      }
  };

  const resetAllFields = () => {
    aboutGoalFormik.resetForm();
  };

  function isFileImage(file) {
    if (!file) return false;
    if (typeof file === 'string') {
      // For URL strings, check extension
      const ext = file.split('.').pop()?.toLowerCase();
      return ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '');
    }
    const acceptedImageTypes = ["image/gif", "image/jpeg", "image/png", "image/jpg", "image/svg+xml"];
    return acceptedImageTypes.includes(file["type"]);
  }

  const getFileUrl = (fileOrUrl) => {
    if (typeof fileOrUrl === 'string') {
      // Existing media URL
      return `${backendServerBaseURL}/${fileOrUrl}`;
    } else {
      // New file object
      return URL.createObjectURL(fileOrUrl);
    }
  };

  const getFileName = (fileOrUrl) => {
    if (typeof fileOrUrl === 'string') {
      // Existing media URL - extract filename from URL
      const urlParts = fileOrUrl.split('/');
      return urlParts[urlParts.length - 1];
    } else {
      // New file object
      return fileOrUrl.name;
    }
  };

  const getFileExtension = (fileOrUrl) => {
    const fileName = getFileName(fileOrUrl);
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  };

  const [viewingFile, setViewingFile] = useState(null);
  const [viewFileUrl, setViewFileUrl] = useState(null);

  const selectedLearning = useSelector(selectselectedLearning);
  const selectedTest = useSelector(selectselectedTest);
  const showSendBackToTestsDialog = useSelector(selectShowSendBackToTestsDialog);
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  console.log('selectedLearning :>> ', selectedLearning);
  console.log('selectedTest :>> ', selectedTest);

  useEffect(() => {
    // Only open dialog when:
    // 1. selectedTest is set AND we're NOT on a test detail page (moving test to learning from list view)
    // 2. selectedLearning is set AND we're on a test page (editing learning from test page)
    // 3. selectedLearning is set AND we're on a learning page AND SendBackToTestsDialog is NOT open (editing learning from learning page)
    // Do NOT open when selectedTest is set on a test detail page (that's for editing test/tasks)
    // Do NOT open when SendBackToTestsDialog is open (that's for sending learning back to test)
    
    const isOnTestDetailPage = location.pathname.includes('/tests/') && params.testId;
    const isOnTestPage = location.pathname.includes('/tests/');
    const isOnLearningPage = location.pathname.includes('/learnings/');
    
    // Don't open if SendBackToTestsDialog is open
    if (showSendBackToTestsDialog) {
      setIsOpen(false);
      return;
    }
    
    if (selectedTest && !isOnTestDetailPage) {
      // Moving test to learning from list view (not from detail page)
      setIsOpen(true);
      // Reset form for new learning from test, but preserve test media if available
      aboutGoalFormik.setValues({
        result: "",
        description: "",
        files: selectedTest.media || [],
      });
    } else if (selectedLearning && (isOnTestPage || isOnLearningPage)) {
      // Editing learning from test page or learning page (only if SendBackToTestsDialog is not open)
      setIsOpen(true);
      aboutGoalFormik.setValues({
        result: selectedLearning.result || "",
        description: selectedLearning.conclusion || "",
        files: selectedLearning.media || []
      });
    } else {
      // Don't open if on test detail page (editing test)
      setIsOpen(false);
      aboutGoalFormik.setValues({
        result: "",
        description: "",
        files: [],
      });
    }
    console.log('src={{...aboutGoalFormik.getFieldProps("files")}} :>> ', {...aboutGoalFormik.getFieldProps("files").value});
  }, [selectedLearning, selectedTest, showSendBackToTestsDialog, location.pathname, params.testId]);
  const singleLearningInfo = useSelector(selectsingleLearningInfo);
  console.log('singleLearningInfo :>> ', singleLearningInfo);

  const [mediaActionsOverlay, setmediaActionsOverlay] = useState(null);

  const [deletedMedia, setdeletedMedia] = useState([]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) closeDialog();
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selectedLearning ? "Edit Learning" : "Move to Learning"}</DialogTitle>
          <DialogDescription>
            Successful or not? Share your experience with this test!
          </DialogDescription>
        </DialogHeader>
        <FormikProvider value={aboutGoalFormik}>
          <Form autoComplete="off" noValidate onSubmit={aboutGoalFormik.handleSubmit}>
            <div className="space-y-4">
              {/* Result */}
              <div className="space-y-2">
                <Label htmlFor="result">Result *</Label>

                <Select
                  value={aboutGoalFormik.values.result}
                  onValueChange={(value) => aboutGoalFormik.setFieldValue("result", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Successful">Successful</SelectItem>
                    <SelectItem value="Unsuccessful">Unsuccessful</SelectItem>
                    <SelectItem value="Inconclusive">Inconclusive</SelectItem>
                  </SelectContent>
                </Select>
                {aboutGoalFormik.touched.result && aboutGoalFormik.errors.result && (
                  <p className="text-sm text-red-600">{aboutGoalFormik.errors.result}</p>
                )}
              </div>

              {/* Learning/Conclusion */}
              <div className="space-y-2">
                <Label htmlFor="description">Learning *</Label>
                <Textarea
                  rows={4}
                  {...aboutGoalFormik.getFieldProps("description")}
                  placeholder="Enter your learning or conclusion"
                  className="resize-none"
                />
                {aboutGoalFormik.touched.description && aboutGoalFormik.errors.description && (
                  <p className="text-sm text-red-600">{aboutGoalFormik.errors.description}</p>
                )}
              </div>

              {/* Media & Documents */}
              <Card className="mt-6">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Label htmlFor="media" className="text-sm font-semibold">Media & Documents</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => {
                        mediaAndDocRef.current.click();
                      }}
                    >
                      <Upload className="h-4 w-4" />
                      Add Media
                    </Button>
                  </div>
                 
                  <input
                    className="hidden"
                    ref={mediaAndDocRef}
                    type="file"
                    multiple={true}
                    accept="*/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setmediaDocuments([...mediaDocuments, ...Array.from(e.target.files)]);
                      }
                    }}
                  />

                  {/* Files Column - Vertical scrolling with 3 items visible */}
                  {((selectedLearning?.media || selectedTest?.media || []).filter(mediaUrl => !deletedMedia.includes(mediaUrl)).length > 0 || mediaDocuments.length > 0) ? (
                    <div className="overflow-y-auto thin-scrollbar" style={{ maxHeight: '200px' }}>
                      <div className="flex flex-col gap-2">
                        {/* Existing Media */}
                        {(selectedLearning?.media || selectedTest?.media || []).filter(mediaUrl => !deletedMedia.includes(mediaUrl)).map((mediaUrl, index) => {
                          const fileUrl = getFileUrl(mediaUrl);
                          const fileName = getFileName(mediaUrl);

                          return (
                            <div key={`existing-${index}`} className="flex items-center gap-2 border rounded hover:bg-muted/50 transition-colors">
                              {/* File Icon */}
                              <div className="flex-shrink-0">
                                <FileIcon className="h-3 w-3 text-muted-foreground" />
                              </div>

                              {/* File Name - Like email attachment, centered with icon */}
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-medium truncate block" title={fileName}>{fileName}</span>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1.5 text-xs"
                                  onClick={() => {
                                    setViewingFile(mediaUrl);
                                    setViewFileUrl(fileUrl);
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-0.5" />
                                  View
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setdeletedMedia([...deletedMedia, mediaUrl]);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}

                        {/* New Media Files */}
                        {mediaDocuments.map((file, index) => {
                          const fileUrl = getFileUrl(file);
                          const fileName = getFileName(file);

                          return (
                            <div key={`new-${index}`} className="flex items-center gap-2 border rounded hover:bg-muted/50 transition-colors">
                              {/* File Icon */}
                              <div className="flex-shrink-0">
                                <FileIcon className="h-3 w-3 text-muted-foreground" />
                              </div>

                              {/* File Name - Like email attachment, centered with icon */}
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-medium truncate block" title={fileName}>{fileName}</span>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1.5 text-xs"
                                  onClick={() => {
                                    setViewingFile(file);
                                    setViewFileUrl(fileUrl);
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-0.5" />
                                  View
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setmediaDocuments([
                                      ...mediaDocuments.slice(0, index),
                                      ...mediaDocuments.slice(index + 1, mediaDocuments.length),
                                    ]);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No media files added yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* File View Modal - Rendered via Portal outside Dialog */}
              {viewingFile && viewFileUrl && typeof document !== 'undefined' && createPortal(
                <div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center overflow-y-auto p-4"
                  style={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0,
                    zIndex: 9999
                  }}
                  onClick={() => {
                    setViewingFile(null);
                    setViewFileUrl(null);
                  }}
                >
                  <div 
                    className="bg-background rounded-lg max-w-4xl w-full relative shadow-2xl my-auto"
                    style={{ 
                      maxHeight: '90vh',
                      margin: 'auto',
                      pointerEvents: 'auto'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Close Button */}
                    <button
                      type="button"
                      className="absolute top-4 right-4 z-[100] p-2 rounded-full bg-background/90 hover:bg-muted transition-colors shadow-lg border cursor-pointer"
                      style={{ zIndex: 100 }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setViewingFile(null);
                        setViewFileUrl(null);
                      }}
                    >
                      <X className="h-5 w-5" />
                    </button>

                    {/* File Content */}
                    <div 
                      className="p-6 overflow-auto" 
                      style={{ maxHeight: 'calc(90vh - 3rem)' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center min-h-[300px]">
                        {isFileImage(viewingFile) ? (
                          <img 
                            src={viewFileUrl} 
                            alt={getFileName(viewingFile)}
                            className="max-w-full object-contain"
                            style={{ maxHeight: 'calc(90vh - 6rem)' }}
                            onClick={(e) => e.stopPropagation()}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div 
                            className="flex flex-col items-center justify-center space-y-4 py-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileIcon className="h-16 w-16 text-muted-foreground" />
                            <div className="text-center">
                              <p className="text-lg font-medium">{getFileName(viewingFile)}</p>
                              <p className="text-sm text-muted-foreground uppercase">{getFileExtension(viewingFile) || 'FILE'}</p>
                            </div>
                            <a 
                              href={viewFileUrl} 
                              download={getFileName(viewingFile)}
                              className="text-sm text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Download File
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </div>
          </Form>
        </FormikProvider>

        {/* Action buttons */}
        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={closeDialog}
          >
            Close
          </Button>
          <Button
            type="button"
            className="bg-black hover:bg-gray-800 text-white"
            onClick={async () => {
              setisSubmitting(true);
              await onSubmitAboutGoalsForm();
              setisSubmitting(false);
            }}
            disabled={isSubmitting || (!aboutGoalFormik.isValid && !selectedLearning)}
          >
            {isSubmitting ? "Saving..." : (selectedLearning ? "Update Learning" : "Create Learning")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MoveToLearningDialog;
