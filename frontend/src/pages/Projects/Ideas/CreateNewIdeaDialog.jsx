import React, { useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Field, FieldArray } from "formik";
import { Form, FormikProvider } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { createIdea, getAllGoals, selectGoals, selectSelectedIdea, updateIdea, updateIdeaInTest, readSingleIdea } from "../../../redux/slices/projectSlice";
import { useParams, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { getAllGrowthLevers, getAllkeyMetrics, selectallGrowthLevers, selectkeyMetrics } from "../../../redux/slices/settingSlice";
import LoadingButton from "../../../components/common/LoadingButton";
import { backendServerBaseURL } from "../../../utils/backendServerBaseURL";
import { ideaNameValidation, ideaDescriptionValidation } from "../../../utils/validationSchemas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { X, Plus, Upload, Eye, Trash2, FileIcon } from "lucide-react";
import SunEditor from "suneditor-react";
import "suneditor/dist/css/suneditor.min.css";

function CreateNewIdeaDialog({ selectedGoal, isOpen = false, onClose }) {
  const nameInputRef = useRef(null);
  const [selectedTeamMembers, setselectedTeamMembers] = useState([]);
  const [numberOfTeamMembersToShowInSelect, setnumberOfTeamMembersToShowInSelect] = useState(4);
  const teamMembersDropdown = useRef();
  const [selectedMenu, setselectedMenu] = useState("About Your Idea");
  const [mediaDocuments, setmediaDocuments] = useState([]);
  const [isSubmitting, setisSubmitting] = useState(false);
  const dispatch = useDispatch();
  const mediaAndDocRef = useRef();
  const params = useParams();
  const openedProject = JSON.parse(localStorage.getItem("openedProject") || "{}");
  const projectId = params.projectId || openedProject?.id || openedProject?._id;
  const testId = params.testId;
  const ideaId = params.ideaId;
  const goals = useSelector(selectGoals);
  const allGrowthLevers = useSelector(selectallGrowthLevers);
  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
      ["link", "image"],
      ["clean"],
    ],
  };
  const closeRef = useRef();
  const closeRef2 = useRef();
  const allKeyMetrics = useSelector(selectkeyMetrics);
  const selectedIdea = useSelector(selectSelectedIdea);
  const [mediaActionsOverlay, setmediaActionsOverlay] = useState(null);
  const formats = ["header", "bold", "italic", "underline", "strike", "blockquote", "list", "bullet", "indent", "link", "image"];
  const [viewingFile, setViewingFile] = useState(null);
  const [viewFileUrl, setViewFileUrl] = useState(null);

  const ProjectsMenus = [
    {
      name: "About Your Idea",
    },
    {
      name: "I.C.E Score",
    },
  ];

  const RightProjectsMenus = [];
  const location = useLocation();

  const closeDialog = () => {
    closeRef.current.click();
    closeRef2.current.click();
  };

  const aboutGoalFormik = useFormik({
    initialValues: {
      name: "",
      goal: "",
      keyMetric: "",
      lever: "",
      description: "",
      files: []
    },
    validateOnChange: true,
    validateOnBlur: true,
    validationSchema: Yup.object().shape({
      name: ideaNameValidation,
      goal: Yup.string().required("Goal is required"),
      keyMetric: Yup.string().required("Key Metric is required"),
      lever: Yup.string().required("Growth lever is required"),
      description: ideaDescriptionValidation,
    }),
    onSubmit: async (values, { setErrors, setSubmitting }) => {

      console.log("aboutGoalFormik.values",aboutGoalFormik.values);
      setSubmitting(false);
    },
  });

  //
  const confidenceFormik = useFormik({
    initialValues: {
      impact: "",
      confidence: "",
      ease: "",
      score: ""
    },
    validationSchema: Yup.object().shape({
      confidence: Yup.number().min(1).max(10).required("Confidence is required"),
      ease: Yup.number().min(1).max(10).required("Ease is required"),
      impact: Yup.number().min(1).max(10).required("Impact is required"),
      score: Yup.number().min(1).max(10).required("Score is required"),
    }),
    onSubmit: async (values, { setErrors, setSubmitting }) => {
      console.log(aboutGoalFormik.values);
      setSubmitting(false);
    },
  });

  const submitNewGoalForm = async () => {
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log("Already submitting, ignoring duplicate submission");
      return;
    }

    setisSubmitting(true);

    try {
    console.log("aboutGoalFormik.values", aboutGoalFormik.values);
    console.log(confidenceFormik.values);
    if (selectedIdea) {
      console.log('aboutGoalFormik.values.goal :>> ', aboutGoalFormik.values.keyMetric);
      if (testId) {
        await dispatch(
          updateIdeaInTest({ ...aboutGoalFormik.values, ...confidenceFormik.values, files: mediaDocuments, projectId, closeDialog, testId })
        );
      } else {
        const id = !selectedIdea ? ideaId : selectedIdea?._id;

        await dispatch(
          updateIdea({ ...aboutGoalFormik.values, ...confidenceFormik.values, files: mediaDocuments, deletedMedia , projectId, closeDialog, ideaId: id, setmediaDocuments })
        );
        console.log('goals.filter',  goals.filter((g) => g._id === selectedIdea?.goal?._id).map((x) => x.keymetric.filter((keymetric) => keymetric._id === selectedIdea?.keymetric?._id)));
        console.log('g.filter :>> ', goals.filter((g) => g._id === aboutGoalFormik.values.goal));

        localStorage.setItem("keymetric", JSON.stringify(selectedIdea.keymetric))

      }
    } else {
      await dispatch(createIdea({ ...aboutGoalFormik.values, ...confidenceFormik.values, files: mediaDocuments, projectId, closeDialog }));
      console.log("aboutGoalFormik.values",aboutGoalFormik.values);

      }
    } catch (error) {
      console.error("Error creating/updating idea:", error);
    } finally {
      setisSubmitting(false);
    }
  };

  const keymetricData = JSON.parse(localStorage.getItem("keymetric", ""));

  const resetAllFields = () => {
    aboutGoalFormik.resetForm({
      values: {
        name: "",
        goal: selectedGoal ? (selectedGoal?._id ?? selectedGoal?.id) : "",
        keyMetric: "",
        lever: "",
        description: "",
        files: []
      },
      errors: {},
      touched: {},
      status: {}
    });
    confidenceFormik.resetForm({
      values: {},
      errors: {},
      touched: {},
      status: {}
    });
    setmediaDocuments([]);
    setdeletedMedia([]);
    setselectedMenu("About Your Idea");
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

  useEffect(() => {
    if (projectId) {
      dispatch(getAllGoals({ projectId }));
    }
    dispatch(getAllkeyMetrics());
    dispatch(getAllGrowthLevers());
    dispatch(readSingleIdea());
  }, [dispatch, projectId]);

  // Scroll modal into view when it opens
  useEffect(() => {
    if (viewingFile && viewFileUrl) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        const modal = document.querySelector('[style*="zIndex: 9999"]');
        if (modal) {
          modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [viewingFile, viewFileUrl]);

  useEffect(() => {
    if (selectedIdea) {
      aboutGoalFormik.setValues({
        name: selectedIdea.name,
        goal: selectedIdea.goal?._id ?? selectedIdea.goal?.id,
        keyMetric: selectedIdea?.keymetric ?? selectedIdea?.keymetric_id,
        lever: selectedIdea.lever,
        description: selectedIdea.description,
        files: selectedIdea.media
      });
      console.log('aboutGoalFormik.keyMetric :>> ', aboutGoalFormik.values.keyMetric);
      confidenceFormik.setValues({
        confidence: selectedIdea.confidence,
        ease: selectedIdea.ease,
        impact: selectedIdea.impact,
        score: selectedIdea.score,
      });
    } else {
      aboutGoalFormik.setValues({
        name: "",
        goal: selectedGoal ? (selectedGoal?._id ?? selectedGoal?.id) : "",
        keyMetric: "",
        lever: "",
        description: "",
        files: [],
      });
      confidenceFormik.setValues({
        confidence: "",
        ease: "",
        impact: "",
        score: "",
      });
    }
    console.log('src={{...aboutGoalFormik.getFieldProps("files")}} :>> ', {...aboutGoalFormik.getFieldProps("files").value});
  }, [selectedIdea, selectedGoal]);

  // Ensure form is populated when dialog opens
  useEffect(() => {
    if (isOpen && selectedIdea) {
      aboutGoalFormik.setValues({
        name: selectedIdea.name || "",
        goal: selectedIdea.goal?._id ?? selectedIdea.goal?.id ?? "",
        keyMetric: selectedIdea?.keymetric ?? selectedIdea?.keymetric_id ?? "",
        lever: selectedIdea.lever || "",
        description: selectedIdea.description || "",
        files: selectedIdea.media || []
      });
      confidenceFormik.setValues({
        confidence: selectedIdea.confidence || "",
        ease: selectedIdea.ease || "",
        impact: selectedIdea.impact || "",
        score: selectedIdea.score || "",
      });
      
      // Set cursor to end of name field after dialog opens to prevent auto-selection
      setTimeout(() => {
        if (nameInputRef.current) {
          const input = nameInputRef.current;
          if (input.value) {
            const length = input.value.length;
            input.setSelectionRange(length, length);
          }
        }
      }, 100);
    }
  }, [isOpen, selectedIdea]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Reset both formik instances with initial values and clear errors
      aboutGoalFormik.resetForm({
        values: {
          name: "",
          goal: selectedGoal ? (selectedGoal?._id ?? selectedGoal?.id) : "",
          keyMetric: "",
          lever: "",
          description: "",
          files: []
        },
        errors: {},
        touched: {},
        status: {}
      });
      confidenceFormik.resetForm({
        values: {},
        errors: {},
        touched: {},
        status: {}
      });
      // Clear media documents
      setmediaDocuments([]);
      setdeletedMedia([]);
      // Reset selected menu
      setselectedMenu("About Your Idea");
    }
  }, [isOpen]);

  const [deletedMedia, setdeletedMedia] = useState([]);

  let data = goals.filter((g) => g._id === selectedIdea?.goal?._id).map((x) => x.keymetric.filter((keymetric) => keymetric._id === selectedIdea?.keymetric?._id))
  console.log('data Idea:>> ', data[0]?.map((x) => x.name.toString()));
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-2xl font-semibold text-center">
            {selectedIdea ? "Edit Idea" : "New Idea"}
          </DialogTitle>
        </DialogHeader>

                <div className="py-4">
                  {/* Tabs */}
                  <div className="flex items-center border-b border-border mb-4">
                    {ProjectsMenus.map((menu) => {
                      return (
                        <div
                          key={menu.name}
                          onClick={() => {
                            // Only allow navigation when editing (selectedIdea exists)
                            if (selectedIdea) {
                              setselectedMenu(menu.name);
                            }
                          }}
                          className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                            selectedMenu === menu.name
                              ? "text-foreground"
                              : "text-muted-foreground"
                          } ${
                            selectedIdea 
                              ? "cursor-pointer hover:bg-gray-100" 
                              : "cursor-not-allowed opacity-60"
                          }`}
                        >
                          {menu.name}
                          {selectedMenu === menu.name && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
                          )}
                        </div>
                      );
                    })}

                    <div className="flex-1"></div>

                    {RightProjectsMenus.map((menu) => {
                      return (
                        <div
                          style={{ textDecoration: "none" }}
                          className="text-dark body3 regular-weight cp"
                          onClick={() => {
                            setselectedMenu(menu.name);
                          }}
                        >
                          <div
                            className={selectedMenu === menu.name ? "text-center border-bottom border-primary border-3" : "text-center pb-1"}
                            style={{ minWidth: "7rem" }}
                          >
                            <p className="mb-1">{menu.name}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* About your Idea STEP */}
                <FormikProvider value={aboutGoalFormik}>
                  <Form autoComplete="off" noValidate onSubmit={aboutGoalFormik.handleSubmit}>
                    {selectedMenu === "About Your Idea" && (
                      <>
                        {/* Name */}
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            ref={nameInputRef}
                            id="name"
                            type="text"
                            {...aboutGoalFormik.getFieldProps("name")}
                            placeholder="A short name for your idea"
                            autoComplete="off"
                            onMouseDown={(e) => {
                              // Prevent auto-selection on mouse down
                              const input = e.target;
                              if (input.value && input.selectionStart === 0 && input.selectionEnd === input.value.length) {
                                e.preventDefault();
                                const length = input.value.length;
                                setTimeout(() => {
                                  input.focus();
                                  input.setSelectionRange(length, length);
                                }, 0);
                              }
                            }}
                            onFocus={(e) => {
                              // Prevent auto-selection of text when editing
                              const input = e.target;
                              // Always move cursor to end on focus to prevent selection
                              setTimeout(() => {
                                const length = input.value.length;
                                input.setSelectionRange(length, length);
                              }, 0);
                            }}
                            onClick={(e) => {
                              // Prevent auto-selection on click
                              const input = e.target;
                              if (input.value && input.selectionStart === 0 && input.selectionEnd === input.value.length) {
                                const length = input.value.length;
                                input.setSelectionRange(length, length);
                              }
                            }}
                            onSelect={(e) => {
                              // Prevent selection if all text is selected
                              const input = e.target;
                              if (input.value && input.selectionStart === 0 && input.selectionEnd === input.value.length) {
                                const length = input.value.length;
                                setTimeout(() => {
                                  input.setSelectionRange(length, length);
                                }, 0);
                              }
                            }}
                          />
                          {aboutGoalFormik.touched.name && aboutGoalFormik.errors.name && (
                            <span className="text-sm text-red-600">
                              {aboutGoalFormik.errors.name}
                            </span>
                          )}
                        </div>

                        {/* Select a goal AND Key Metric */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {/* Select a goal */}
                          <div className="space-y-2">
                            <Label htmlFor="goal">Select a Goal</Label>
                            <Select value={aboutGoalFormik.values.goal} onValueChange={(value) => { aboutGoalFormik.setFieldValue("goal", value); aboutGoalFormik.setFieldValue("keyMetric", ""); aboutGoalFormik.setFieldTouched("goal", true); }}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a Goal" className="truncate" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {(goals || []).map((goal) => {
                                  const goalId = goal._id ?? goal.id;
                                  if (!goalId) return null;
                                  return (
                                    <SelectItem
                                      key={goalId}
                                      value={goalId}
                                      className="cursor-pointer"
                                      title={goal.name}
                                    >
                                      <span className="truncate block">
                                        {goal.name}
                                      </span>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            {aboutGoalFormik.touched.goal && aboutGoalFormik.errors.goal && (
                              <span className="text-sm text-red-600">
                                {aboutGoalFormik.errors.goal}
                              </span>
                            )}
                          </div>

                          {/* Key Metric */}
                          <div className="space-y-2">
                            <Label htmlFor="keyMetric">Key Metric</Label>
                            <Select
                              value={aboutGoalFormik.values.keyMetric}
                              onValueChange={(value) => { aboutGoalFormik.setFieldValue("keyMetric", value); aboutGoalFormik.setFieldTouched("keyMetric", true); }}
                              disabled={aboutGoalFormik.values.goal === "" || aboutGoalFormik.values.goal === null}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="What will it impact" className="truncate" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {aboutGoalFormik.values.goal !== "" &&
                                    aboutGoalFormik.values.goal !== null &&
                                    (goals || [])
                                      .filter((g) => (g._id ?? g.id) === aboutGoalFormik.values.goal)
                                      .map((goal) => (
                                        <React.Fragment key={goal._id ?? goal.id}>
                                          {(goal.keymetric || []).map((keymetric) => {
                                            const kmId = keymetric._id ?? keymetric.id;
                                            if (!kmId) return null;
                                            return (
                                              <SelectItem
                                                key={kmId}
                                                value={kmId}
                                                className="cursor-pointer"
                                                title={keymetric.name}
                                              >
                                                <span className="truncate block">
                                                  {keymetric.name}
                                                </span>
                                              </SelectItem>
                                            );
                                          })}
                                        </React.Fragment>
                                      ))}
                              </SelectContent>
                            </Select>
                            {aboutGoalFormik.touched.keyMetric && aboutGoalFormik.errors.keyMetric && (
                              <span className="text-sm text-red-600">
                                {aboutGoalFormik.errors.keyMetric}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Growth Lever */}
                        <div className="space-y-2">
                          <Label htmlFor="lever">Growth Lever</Label>
                          <Select value={aboutGoalFormik.values.lever} onValueChange={(value) => { aboutGoalFormik.setFieldValue("lever", value); aboutGoalFormik.setFieldTouched("lever", true); }}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a growth lever" className="truncate" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {allGrowthLevers?.map((singleGrowthLever) => {
                                return (
                                  <SelectItem
                                    key={singleGrowthLever?.name}
                                    value={singleGrowthLever?.name}
                                    className="cursor-pointer"
                                    title={singleGrowthLever?.name}
                                  >
                                    <span className="truncate block">
                                      {singleGrowthLever?.name}
                                    </span>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          {aboutGoalFormik.touched.lever && aboutGoalFormik.errors.lever && (
                            <span className="text-sm text-red-600">
                              {aboutGoalFormik.errors.lever}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2 mt-4">
                          <Label htmlFor="description">Description</Label>
                          <SunEditor
                            height="200px"
                            setDefaultStyle="font-family: 'Inter', sans-serif; font-size: 14px;"
                            defaultValue={aboutGoalFormik.values.description}
                            onChange={(content) => {
                              aboutGoalFormik.setFieldValue("description", content);
                              aboutGoalFormik.setFieldTouched("description", true);
                            }}
                            setOptions={{
                              buttonList: [
                                ["undo", "redo"],
                                ["bold", "underline", "italic", "strike"],
                                ["fontColor", "hiliteColor"],
                                ["align", "list", "lineHeight"],
                                ["link", "image"],
                                ["fullScreen", "showBlocks", "codeView"],
                                ["removeFormat"]
                              ],
                              formats: ["p", "div", "h1", "h2", "h3"],
                            }}
                          />
                          {aboutGoalFormik.touched.description && aboutGoalFormik.errors.description && (
                            <span className="text-sm text-red-600">
                              {aboutGoalFormik.errors.description}
                            </span>
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
                            {(selectedIdea?.media?.filter(mediaUrl => deletedMedia.includes(mediaUrl) === false).length > 0 || mediaDocuments.length > 0) ? (
                              <div 
                                className="overflow-y-auto thin-scrollbar" 
                                style={{ 
                                  maxHeight: '200px',
                                  scrollbarWidth: 'thin',
                                  scrollbarColor: '#cbd5e1 transparent'
                                }}
                              >
                                <div className="flex flex-col gap-2">
                                  {/* Existing Media from Selected Idea */}
                                  {selectedIdea?.media
                                    .filter(mediaUrl => deletedMedia.includes(mediaUrl) === false)
                                    .map((mediaUrl, index) => {
                                      const fileUrl = getFileUrl(mediaUrl);
                                      const fileName = getFileName(mediaUrl);
                                      const fileExt = getFileExtension(mediaUrl);

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
                                    const fileExt = getFileExtension(file);

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

                        {/* Action buttons */}
                        <div className="flex items-center justify-end mt-6">
                          <div className="flex gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                resetAllFields();
                                onClose && onClose();
                              }}
                              ref={closeRef}
                            >
                              Close
                            </Button>

                            {selectedIdea ? (
                                <Button
                                type="button"
                                className="bg-black hover:bg-gray-800"
                                onClick={() => {
                                  submitNewGoalForm();
                                }}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? "Updating..." : "Update Idea"}
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                onClick={() => {
                                  setselectedMenu("I.C.E Score");
                                }}
                                className={!aboutGoalFormik.isValid ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"}
                                disabled={!aboutGoalFormik.isValid}
                              >
                                Next
                              </Button>
                            )}
                        </div>
                        </div>
                      </>
                    )}
                  </Form>
                </FormikProvider>

                {/* ICE Score STEP */}
                <FormikProvider value={confidenceFormik}>
                  <Form autoComplete="off" noValidate onSubmit={confidenceFormik.handleSubmit}>
                    {selectedMenu === "I.C.E Score" && (
                      <>
                        {/* Total Score */}
                        <div className="space-y-2">
                          <Label htmlFor="score">Total Score</Label>
                          <Input
                            id="score"
                            {...confidenceFormik.getFieldProps("score")}
                            type="number"
                            placeholder="Score"
                            disabled={true}
                          />
                          {confidenceFormik.touched.score && confidenceFormik.errors.score && (
                            <span className="text-sm text-red-600">
                              {confidenceFormik.errors.score}
                            </span>
                          )}
                        </div>

                        {/* Impact */}
                        <div className="space-y-2">
                          <Label htmlFor="impact">Impact</Label>
                          <Select
                            value={confidenceFormik.values.impact?.toString()}
                            onValueChange={(value) => {
                              const numValue = parseInt(value);
                              confidenceFormik.setFieldValue("impact", numValue);

                              const confVal = confidenceFormik.values.confidence;
                              const easeVal = confidenceFormik.values.ease;

                              if (numValue && confVal && easeVal) {
                                const calculatedScore = Math.round(
                                  ((numValue + confVal + easeVal) / 3) * 100
                                ) / 100;
                                confidenceFormik.setFieldValue("score", calculatedScore);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Score 1-10" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="4">4</SelectItem>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="6">6</SelectItem>
                              <SelectItem value="7">7</SelectItem>
                              <SelectItem value="8">8</SelectItem>
                              <SelectItem value="9">9</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                            </SelectContent>
                          </Select>
                          {confidenceFormik.touched.impact && confidenceFormik.errors.impact && (
                            <span className="text-sm text-red-600">
                              {confidenceFormik.errors.impact}
                            </span>
                          )}
                        </div>

                        {/* Confidence */}
                        <div className="space-y-2">
                          <Label htmlFor="confidence">Confidence</Label>
                          <Select
                            value={confidenceFormik.values.confidence?.toString()}
                            onValueChange={(value) => {
                              const numValue = parseInt(value);
                              confidenceFormik.setFieldValue("confidence", numValue);

                              const impactVal = confidenceFormik.values.impact;
                              const easeVal = confidenceFormik.values.ease;

                              if (numValue && impactVal && easeVal) {
                                const calculatedScore = Math.round(
                                  ((numValue + impactVal + easeVal) / 3) * 100
                                ) / 100;
                                confidenceFormik.setFieldValue("score", calculatedScore);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Score 1-10" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="4">4</SelectItem>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="6">6</SelectItem>
                              <SelectItem value="7">7</SelectItem>
                              <SelectItem value="8">8</SelectItem>
                              <SelectItem value="9">9</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                            </SelectContent>
                          </Select>
                          {confidenceFormik.touched.confidence && confidenceFormik.errors.confidence && (
                            <span className="text-sm text-red-600">
                              {confidenceFormik.errors.confidence}
                            </span>
                          )}
                        </div>

                        {/* Ease */}
                        <div className="space-y-2">
                          <Label htmlFor="ease">Ease</Label>
                          <Select
                            value={confidenceFormik.values.ease?.toString()}
                            onValueChange={(value) => {
                              const numValue = parseInt(value);
                              confidenceFormik.setFieldValue("ease", numValue);

                              const impactVal = confidenceFormik.values.impact;
                              const confVal = confidenceFormik.values.confidence;

                              if (numValue && impactVal && confVal) {
                                const calculatedScore = Math.round(
                                  ((numValue + impactVal + confVal) / 3) * 100
                                ) / 100;
                                confidenceFormik.setFieldValue("score", calculatedScore);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Score 1-10" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="3">3</SelectItem>
                              <SelectItem value="4">4</SelectItem>
                              <SelectItem value="5">5</SelectItem>
                              <SelectItem value="6">6</SelectItem>
                              <SelectItem value="7">7</SelectItem>
                              <SelectItem value="8">8</SelectItem>
                              <SelectItem value="9">9</SelectItem>
                              <SelectItem value="10">10</SelectItem>
                            </SelectContent>
                          </Select>
                          {confidenceFormik.touched.ease && confidenceFormik.errors.ease && (
                            <span className="text-sm text-red-600">
                              {confidenceFormik.errors.ease}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end mt-6">
                          <div className="flex gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setselectedMenu("About Your Idea");
                              }}
                            >
                              Back
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                resetAllFields();
                                onClose && onClose();
                              }}
                              ref={closeRef}
                            >
                              Close
                            </Button>

                            {selectedIdea ? (
                              <Button
                                type="button"
                                className="bg-black hover:bg-gray-800"
                                onClick={() => {
                                  submitNewGoalForm();
                                }}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? "Updating..." : "Update Idea"}
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                onClick={() => {
                                  submitNewGoalForm();
                                }}
                                disabled={
                                  !confidenceFormik.values.impact ||
                                  !confidenceFormik.values.confidence ||
                                  !confidenceFormik.values.ease ||
                                  !confidenceFormik.values.score ||
                                  isSubmitting
                                }
                                className={
                                  !confidenceFormik.values.impact ||
                                  !confidenceFormik.values.confidence ||
                                  !confidenceFormik.values.ease ||
                                  !confidenceFormik.values.score ||
                                  isSubmitting
                                    ? "bg-gray-400"
                                    : "bg-black hover:bg-gray-800"
                                }
                              >
                                {isSubmitting ? "Creating..." : "Create Idea"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </Form>
                </FormikProvider>

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
      </DialogContent>
    </Dialog>
  );
}

export default CreateNewIdeaDialog;
