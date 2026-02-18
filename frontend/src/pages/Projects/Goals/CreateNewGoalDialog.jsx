import React, { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { FieldArray } from "formik";
import { Form, FormikProvider } from "formik";
import { useParams } from "react-router-dom";
import { createGoal, selectProjectUsers, selectSelectedGoal, updateGoal, selectSingleGoalInfo,
} from "../../../redux/slices/projectSlice";
import { useDispatch, useSelector } from "react-redux";
import { selectkeyMetrics } from "../../../redux/slices/settingSlice";
import { backendServerBaseURL } from "../../../utils/backendServerBaseURL";
import { formatDate3 } from "../../../utils/formatTime";
import { goalNameValidation, goalDescriptionValidation } from "../../../utils/validationSchemas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { X, Users } from "lucide-react";

function CreateNewGoalDialog({ openRequestIdeaDialog, selectedTab, open, onOpenChange }) {
  const [selectedTeamMembers, setselectedTeamMembers] = useState([]);
  const [numberOfTeamMembersToShowInSelect, setnumberOfTeamMembersToShowInSelect] = useState(3);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectedMenu, setselectedMenu] = useState(selectedTab);
  const params = useParams();
  const openedProject = JSON.parse(localStorage.getItem("openedProject", "") || "{}");
  const projectId = params.projectId || openedProject?.id || openedProject?._id;
  const goalId = params.goalId;
  const dispatch = useDispatch();
  const projectUsers = useSelector(selectProjectUsers);
  const allKeyMetrics = useSelector(selectkeyMetrics);
  const selectedGoal = useSelector(selectSelectedGoal);
  const [isSubmitting, setisSubmitting] = useState(false);
// console.log('allKeyMetrics :>> ', allKeyMetrics);
  const closeModal = () => {
    onOpenChange(false);
  };
  const singleGoalInfo = useSelector(selectSingleGoalInfo);
console.log('singleGoalInfo 333 ====:>> ', singleGoalInfo);
  const isEditing = Boolean(selectedGoal || singleGoalInfo);
  let singleGoalMetricsData = singleGoalInfo?.keymetric.map(x => x.metrics);


  const ProjectsMenus = [
    {
      name: "About Goal",
    },
    {
      name: "Assign Members",
    },
    {
      name: "Key Metrics",
    },
    {
      name: "Confidence",
    },
  ];

  const RightProjectsMenus = [];

  // Helper function to format date for HTML date input (YYYY-MM-DD)
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return undefined;
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return undefined;
      return date.toISOString().split('T')[0];
    } catch (error) {
      return undefined;
    }
  };

  // Get minimum date (project creation date)
  const getMinDate = () => {
    const projectCreationDate = openedProject?.createdAt || openedProject?.startDate;
    return formatDateForInput(projectCreationDate);
  };

  const aboutGoalFormik = useFormik({
    initialValues: {
      name: "",
      description: "",
      startDate: "",
      endDate: "",
    },
    validationSchema: Yup.object().shape({
      name: goalNameValidation,
      description: goalDescriptionValidation,
      startDate: Yup.date()
        .required("Start date is required")
        .test("is-within-project-range", "Goal start date must be within project date range", function(value) {
          if (!value) return true;

          const goalStart = new Date(value);
          goalStart.setHours(0, 0, 0, 0);

          // Use project creation date (createdAt) as minimum, fallback to startDate if available
          const projectCreationDate = openedProject?.createdAt || openedProject?.startDate;
          if (projectCreationDate) {
            const projectStart = new Date(projectCreationDate);
            projectStart.setHours(0, 0, 0, 0);
            if (goalStart < projectStart) {
              return this.createError({ message: `Goal start date cannot be before project creation date (${new Date(projectCreationDate).toLocaleDateString()})` });
            }
          }

          // Check if after project end date
          if (openedProject?.endDate) {
            const projectEnd = new Date(openedProject.endDate);
            projectEnd.setHours(0, 0, 0, 0);
            if (goalStart > projectEnd) {
              return this.createError({ message: `Goal start date cannot be after project end date (${new Date(openedProject.endDate).toLocaleDateString()})` });
            }
          }

          return true;
        }),
      endDate: Yup.date()
        .required("End Date is required")
        .test("is-after-start", "End date must be after start date", function(value) {
          const { startDate } = this.parent;
          if (!value || !startDate) return true;
          return new Date(value) > new Date(startDate);
        })
        .test("is-within-project-range", "Goal end date must be within project date range", function(value) {
          if (!value) return true;

          const goalEnd = new Date(value);
          goalEnd.setHours(0, 0, 0, 0);

          // Check if after project end date
          if (openedProject?.endDate) {
            const projectEnd = new Date(openedProject.endDate);
            projectEnd.setHours(0, 0, 0, 0);
            if (goalEnd > projectEnd) {
              return this.createError({ message: `Goal end date cannot be after project end date (${new Date(openedProject.endDate).toLocaleDateString()})` });
            }
          }

          return true;
        }),
    }),
    onSubmit: async (values, { setErrors, setSubmitting }) => {
      console.log(aboutGoalFormik.values);
      setSubmitting(false);
    },
  });

  const keyMetricsFormik = useFormik({
    initialValues: {
      keyMetrics: [],
    },
    validationSchema: Yup.object().shape({
      keyMetrics: Yup.array().of(
        Yup.object().shape({
          keyMetric: Yup.string().required(),
          startValue: Yup.number().required(),
          targetValue: Yup.number().required(),
        })
      ),
    }),
    onSubmit: async (values, { setErrors, setSubmitting }) => {
      console.log(aboutGoalFormik.values);
      setSubmitting(false);
    },
  });


  console.log('keyMetricsFormik.values :>> ', keyMetricsFormik.values);


  const confidenceFormik = useFormik({
    initialValues: {},
    validationSchema: Yup.object().shape({
      confidence: Yup.string().required("Confidence is required"),
    }),
    onSubmit: async (values, { setErrors, setSubmitting }) => {
      console.log(aboutGoalFormik.values);
      setSubmitting(false);
    },
  });

  const addTeamMember = (teamMember) => {
    const isAlreadySelected = selectedTeamMembers.some(
      (tm) => (tm._id || tm.id) === (teamMember._id || teamMember.id)
    );

    if (isAlreadySelected) {
      removeSelectedTeamMember(teamMember);
    } else {
      setselectedTeamMembers([...selectedTeamMembers, teamMember]);
    }
  };

  const removeSelectedTeamMember = (data) => {
    let tempTM = [];
    selectedTeamMembers.map((tm, index) => {
      if ((tm.id || tm._id) != (data.id || data._id)) {
        tempTM.push(tm);
      }
    });
    console.log(tempTM);
    setselectedTeamMembers(tempTM);
  };

  const reset = () => {
    setselectedMenu("About Goal");
    aboutGoalFormik.resetForm();
    keyMetricsFormik.resetForm();
    confidenceFormik.resetForm();
    setselectedTeamMembers([]);
  };

  // Validate required fields for the current tab
  const validateCurrentTab = async (targetTab) => {
    // If navigating to the same tab, allow it
    if (targetTab === selectedMenu) {
      return true;
    }

    // Validate based on current tab
    if (selectedMenu === "About Goal") {
      // Validate required fields: name, description, startDate, endDate
      await aboutGoalFormik.validateForm();
      if (!aboutGoalFormik.isValid) {
        // Mark fields as touched to show errors
        aboutGoalFormik.setTouched({
          name: true,
          description: true,
          startDate: true,
          endDate: true,
        });
        return false;
      }
    } else if (selectedMenu === "Key Metrics") {
      // Validate that at least one key metric is added with required fields
      await keyMetricsFormik.validateForm();
      if (!keyMetricsFormik.isValid || !keyMetricsFormik.values.keyMetrics || keyMetricsFormik.values.keyMetrics.length === 0) {
        return false;
      }
      // Check each key metric has required fields
      const hasInvalidMetrics = keyMetricsFormik.values.keyMetrics.some(
        (km) => !km.keyMetric || km.startValue === undefined || km.targetValue === undefined
      );
      if (hasInvalidMetrics) {
        return false;
      }
    } else if (selectedMenu === "Confidence") {
      // Validate confidence is filled
      await confidenceFormik.validateForm();
      if (!confidenceFormik.isValid) {
        confidenceFormik.setTouched({ confidence: true });
        return false;
      }
    }
    // Assign Members tab has no required fields, so always allow navigation away from it
    return true;
  };

  // Handle tab navigation with validation
  const handleTabNavigation = async (targetTab) => {
    // Only validate when editing (selectedGoal or singleGoalInfo exists)
    if (isEditing) {
      const isValid = await validateCurrentTab(targetTab);
      if (!isValid) {
        // Don't navigate if validation fails
        return;
      }
    }
    // Allow navigation if creating or validation passed
    setselectedMenu(targetTab);
  };

  const onChangeKeymetric = (e) => {
console.log('e.target.value :>> ', e.target.value);
  }

  const submitNewGoalForm = async () => {
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log("Already submitting, ignoring duplicate submission");
      return;
    }

    setisSubmitting(true);

    try {
      // Get projectId with fallback (Supabase uses `id`, legacy may use `_id`)
      const currentProjectId = params.projectId || openedProject?.id || openedProject?._id;

    if (selectedGoal) {
      await dispatch(
        updateGoal({
          ...aboutGoalFormik.values,
          ...keyMetricsFormik.values,
           ...confidenceFormik.values,
          members: selectedTeamMembers,
          projectId,
          closeModal,
          reset,
          openRequestIdeaDialog,
          goalId,
        })
      );
    } else {
        if (!currentProjectId) {
          console.error("Project ID is missing! Cannot create goal without a project.");
          console.error("params:", params);
          console.error("openedProject:", openedProject);
          alert("Error: Project ID is missing. Please navigate to a project first.");
          return;
        }

        // Ensure keyMetrics is always an array
        const keyMetrics = keyMetricsFormik.values?.keyMetrics || [];

        console.log("Final payload before dispatch:", {
          ...aboutGoalFormik.values,
          keyMetrics: keyMetrics,
          ...confidenceFormik.values,
          members: selectedTeamMembers,
          projectId: currentProjectId,
        });

      await dispatch(
        createGoal({
          ...aboutGoalFormik.values,
            keyMetrics: keyMetrics, // Explicitly set keyMetrics to ensure it's always an array
          ...confidenceFormik.values,
          members: selectedTeamMembers,
            projectId: currentProjectId, // Use the computed projectId
          closeModal,
          reset,
          openRequestIdeaDialog,
        })
      );
      }
    } catch (error) {
      console.error("Error creating/updating goal:", error);
    } finally {
      setisSubmitting(false);
    }
  };

  const resetAllFields = () => {
    aboutGoalFormik.resetForm();
    setselectedTeamMembers([]);
    keyMetricsFormik.resetForm();
    confidenceFormik.resetForm();
  };

  // Populate form when dialog opens and selectedGoal/singleGoalInfo is available
  useEffect(() => {
    if (open && (selectedGoal || singleGoalInfo)) {
      const goalData = selectedGoal || singleGoalInfo;
      if (goalData) {
      aboutGoalFormik.setValues({
          name: goalData.name || "",
          description: goalData.description || "",
          startDate: goalData.startDate || "",
          endDate: goalData.endDate || "",
        });

        setselectedTeamMembers(goalData.members || []);
      confidenceFormik.setValues({
          confidence: goalData.confidence || "",
      });
      keyMetricsFormik.setValues({
          keyMetrics: goalData.keymetric?.map((keymetric) => {
          return {
            keyMetric: keymetric.name,
            startValue: keymetric.startValue,
            targetValue: keymetric.targetValue,
            metrics: keymetric.metrics
          };
          }) || [],
      });
      }
    } else if (open && !selectedGoal && !singleGoalInfo) {
      // Reset form when creating new goal
      aboutGoalFormik.setValues({
        name: "",
        description: "",
        startDate: "",
        endDate: "",
      });

      setselectedTeamMembers([]);
      confidenceFormik.setValues({
        confidence: "",
      });
      keyMetricsFormik.setValues({
        keyMetrics: [],
      });
    }
  }, [open, selectedGoal, singleGoalInfo]);

  useEffect(() => {
    setselectedMenu(selectedTab);
  }, [selectedTab]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);
  

  useEffect(()=> {
    if(singleGoalInfo?.keymetric?.metrics && singleGoalMetricsData){
      keyMetricsFormik.setValues(singleGoalMetricsData);
    }
  }, [singleGoalInfo?.keymetric?.metrics, singleGoalMetricsData])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-semibold">Edit Goal</DialogTitle>
        </DialogHeader>

        {/* Tabs Navigation */}
        <div className="border-b">
          <div className="flex items-center gap-1">
            {ProjectsMenus.map((menu) => (
              <div
                key={menu.name}
                onClick={() => {
                  // Only allow navigation when editing (selectedGoal or singleGoalInfo exists)
                  if (isEditing) {
                    handleTabNavigation(menu.name);
                  }
                }}
                className={`px-6 py-3 text-sm font-medium transition-all relative rounded-t-md ${
                  selectedMenu === menu.name
                    ? "text-black bg-gray-50"
                    : "text-gray-600"
                } ${
                  isEditing 
                    ? "cursor-pointer hover:bg-gray-100" 
                    : "cursor-not-allowed opacity-60"
                }`}
              >
                {menu.name}
                {selectedMenu === menu.name && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-1">

                {/* About Goal STEP */}
                <FormikProvider value={aboutGoalFormik}>
                  <Form autoComplete="off" noValidate onSubmit={aboutGoalFormik.handleSubmit}>
                    {selectedMenu === "About Goal" && (
                      <div className="space-y-6">
                        {/* Goal Name */}
                        <div className="space-y-2">
                          <Label htmlFor="goal-name">Goal Name</Label>
                          <Input
                            id="goal-name"
                            type="text"
                            {...aboutGoalFormik.getFieldProps("name")}
                            placeholder="Enter Goal Name"
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

                        {/* Goal Description */}
                        <div className="space-y-2">
                          <Label htmlFor="goal-description">Description</Label>
                          <Textarea
                            id="goal-description"
                            rows="4"
                            {...aboutGoalFormik.getFieldProps("description")}
                            placeholder="Enter Description"
                          />
                          {aboutGoalFormik.touched.description && aboutGoalFormik.errors.description && (
                            <span className="text-sm text-red-600">
                              {aboutGoalFormik.errors.description}
                            </span>
                          )}
                        </div>

                        {/* Start and End Date */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* Start Date */}
                          <div className="space-y-2">
                            <Label htmlFor="start-date">Start Date</Label>
                            <Input
                              id="start-date"
                              type="date"
                              name="startDate"
                              value={aboutGoalFormik.values.startDate ? new Date(aboutGoalFormik.values.startDate).toISOString().split('T')[0] : ''}
                              onChange={aboutGoalFormik.handleChange}
                              onBlur={aboutGoalFormik.handleBlur}
                              min={getMinDate()}
                              max={formatDateForInput(openedProject?.endDate)}
                              placeholder="Enter Start Date"
                            />
                            {aboutGoalFormik.touched.startDate && aboutGoalFormik.errors.startDate && (
                              <span className="text-sm text-red-600">
                                {aboutGoalFormik.errors.startDate}
                              </span>
                            )}
                          </div>

                          {/* End Date */}
                          <div className="space-y-2">
                            <Label htmlFor="end-date">End Date</Label>
                            <Input
                              id="end-date"
                              type="date"
                              name="endDate"
                              disabled={!aboutGoalFormik.values.startDate || aboutGoalFormik.values.startDate == ""}
                              value={aboutGoalFormik.values.endDate ? new Date(aboutGoalFormik.values.endDate).toISOString().split('T')[0] : ''}
                              onChange={aboutGoalFormik.handleChange}
                              onBlur={aboutGoalFormik.handleBlur}
                              min={formatDateForInput(aboutGoalFormik.values.startDate)}
                              max={formatDateForInput(openedProject?.endDate)}
                              placeholder="Enter End Date"
                            />
                            {aboutGoalFormik.touched.endDate && aboutGoalFormik.errors.endDate && (
                              <span className="text-sm text-red-600">
                                {aboutGoalFormik.errors.endDate}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => {
                              closeModal();
                            }}
                          >
                            Close
                          </Button>
                          {selectedGoal ? (
                            <Button
                              type="button"
                              size="lg"
                              disabled={isSubmitting}
                              onClick={() => {
                                submitNewGoalForm();
                              }}
                            >
                              {isSubmitting ? "Updating..." : "Update Goal"}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="lg"
                              disabled={!aboutGoalFormik.isValid || !aboutGoalFormik.dirty}
                              onClick={() => {
                                setselectedMenu("Assign Members");
                              }}
                            >
                              Next
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Form>
                </FormikProvider>

                {/* Assign Members STEP */}
                {selectedMenu === "Assign Members" && (
                  <div className="space-y-6">
                    {/* Team Members */}
                    <div className="space-y-2">
                      <Label>Assign To</Label>

                      <div className="relative">
                        <Select
                          open={isSelectOpen}
                          onOpenChange={setIsSelectOpen}
                          onValueChange={(value) => {
                            if (value === "everyone") {
                              setselectedTeamMembers(projectUsers);
                              setIsSelectOpen(false);
                            }
                          }}
                          modal={false}
                          value=""
                        >
                          <SelectTrigger className="w-full min-h-[42px] h-auto">
                            <div className="w-full">
                              {selectedTeamMembers.length > 0 ? (
                                <div className="flex items-center flex-wrap gap-2 py-1">
                                  {selectedTeamMembers.map((teamMember) => (
                                    <span
                                      key={teamMember.id || teamMember._id}
                                      className="inline-flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md text-sm text-foreground"
                                    >
                                    <img
                                      src={`${backendServerBaseURL}/${teamMember.avatar}`}
                                        className="w-5 h-5 rounded-full"
                                      alt=""
                                    />
                                      <span className="text-xs">
                                    {teamMember.firstName} {teamMember.lastName}
                                  </span>
                                      <span
                                        role="button"
                                        tabIndex={0}
                                        className="text-muted-foreground hover:text-foreground ml-1 hover:bg-background rounded-sm p-0.5 transition-colors z-10 cursor-pointer inline-flex items-center"
                                        onPointerDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                        }}
                                    onClick={(e) => {
                                          e.preventDefault();
                                      e.stopPropagation();
                                          removeSelectedTeamMember(teamMember);
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                            e.stopPropagation();
                                      removeSelectedTeamMember(teamMember);
                                          }
                                    }}
                                  >
                                        <X className="h-3 w-3" />
                                </span>
                          </span>
                                  ))}
                        </div>
                              ) : (
                                <span className="text-muted-foreground">Select team members</span>
                              )}
                              </div>
                          </SelectTrigger>
                          <SelectContent className="z-[10000]" position="popper" sideOffset={5}>
                            <SelectItem value="everyone">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                  <Users className="h-3 w-3" />
                                </div>
                                <span>Everyone in your team ({projectUsers?.length})</span>
                              </div>
                            </SelectItem>
                            {projectUsers?.map((teamMember) => (
                              <div
                                key={teamMember.id || teamMember._id}
                                className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-6 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const member = projectUsers.find((u) => (u._id || u.id) === (teamMember._id || teamMember.id));
                                  if (member) {
                                    addTeamMember(member);
                                  }
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <img
                                    src={`${backendServerBaseURL}/${teamMember.avatar}`}
                                    className="w-6 h-6 rounded-full"
                                    alt=""
                                  />
                                  <span>{teamMember?.firstName} {teamMember?.lastName}</span>
                                  {selectedTeamMembers.some((tm) => (tm._id || tm.id) === (teamMember._id || teamMember.id)) && (
                                    <span className="ml-2 text-xs text-green-600">✓</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center mt-6 pt-4 border-t">
                      <div className="flex-1">
                        <p
                          className="skip-for-now"
                          onClick={() => {
                            setselectedTeamMembers([]);
                            setselectedMenu("Key Metrics");
                          }}
                        >
                          Skip For Now
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            setselectedMenu("About Goal");
                          }}
                        >
                          Back
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            closeModal();
                          }}
                        >
                          Close
                        </Button>

                        {selectedGoal ? (
                          <Button
                            type="button"
                            size="lg"
                            disabled={isSubmitting}
                            onClick={() => {
                              submitNewGoalForm();
                            }}
                          >
                            {isSubmitting ? "Updating..." : "Update Goal"}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="lg"
                            disabled={selectedTeamMembers.length === 0}
                            onClick={() => {
                              setselectedMenu("Key Metrics");
                            }}
                          >
                            Next
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Key Metrics STEP */}
                <FormikProvider value={keyMetricsFormik}>
                  <Form autoComplete="off" noValidate onSubmit={keyMetricsFormik.handleSubmit}>
                    {selectedMenu === "Key Metrics" && (
                      <div className="space-y-6">
                        {/* Key Metrics */}
                        <div className="space-y-4 max-h-80 overflow-y-auto">
                          <div className="mb-4">
                            <FieldArray
                              name="keyMetrics"
                              {...keyMetricsFormik.getFieldProps("keyMetrics")}
                              render={(arrayHelpers) => (
                                <div>
                                  {keyMetricsFormik.values.keyMetrics?.map((option, index) => (
                                    <div key={index} className="mb-4">
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <Label>Key Metrics</Label>

                                          <Select
                                            value={keyMetricsFormik.values.keyMetrics[index]?.keyMetric || ""}
                                            onValueChange={(value) => {
                                              keyMetricsFormik.setFieldValue(`keyMetrics.${index}.keyMetric`, value)
                                              if (value === ""){
                                                keyMetricsFormik.setFieldValue(`keyMetrics.${index}.startValue`, "")
                                                keyMetricsFormik.setFieldValue(`keyMetrics.${index}.targetValue`, "")
                                              }
                                            }}
                                            modal={false}
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder="Select a Key Metric" />
                                            </SelectTrigger>
                                            <SelectContent className="z-[99999]">
                                              {allKeyMetrics.map((keyMetric, idx) => (
                                                <React.Fragment key={keyMetric.name}>
                                                  <SelectItem value={keyMetric.name}>
                                                    {keyMetric.name}
                                                  </SelectItem>
                                                  {idx < allKeyMetrics.length - 1 && (
                                                    <div className="border-b border-gray-200 mx-2" />
                                                  )}
                                                </React.Fragment>
                                              ))}
                                            </SelectContent>
                                          </Select>

                                          <span
                                            className="invalid-feedback"
                                            style={{
                                              display:
                                                Object.keys(keyMetricsFormik.errors).includes("keyMetrics") &&
                                                keyMetricsFormik.errors[`keyMetrics`]?.length != 0 &&
                                                keyMetricsFormik.errors[`keyMetrics`][index]?.keyMetric
                                                  ? "block"
                                                  : "none",
                                            }}
                                          >
                                            Key Metric is required
                                          </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="space-y-2">
                                            <Label htmlFor={`start-value-${index}`}>Start Value</Label>
                                            <Input
                                              type="text"
                                              id={`start-value-${index}`}
                                              placeholder="Start Value"
                                              value={keyMetricsFormik.values.keyMetrics[index]?.startValue || ''}
                                              onKeyDown={(e) => {
                                                // Allow: backspace, delete, tab, escape, enter, decimal point
                                                if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                                                    // Allow: Ctrl/cmd+A, Ctrl/cmd+C, Ctrl/cmd+V, Ctrl/cmd+X
                                                    (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
                                                    (e.keyCode === 67 && (e.ctrlKey === true || e.metaKey === true)) ||
                                                    (e.keyCode === 86 && (e.ctrlKey === true || e.metaKey === true)) ||
                                                    (e.keyCode === 88 && (e.ctrlKey === true || e.metaKey === true)) ||
                                                    // Allow: home, end, left, right
                                                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                                                  return;
                                                }
                                                // Ensure that it is a number and stop the keypress if not
                                                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                                                  e.preventDefault();
                                                }
                                              }}
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                // Only allow numbers and decimal point
                                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                  keyMetricsFormik.setFieldValue(`keyMetrics.${index}.startValue`, value === '' ? '' : Number(value));
                                                }
                                              }}
                                              onBlur={() => keyMetricsFormik.setFieldTouched(`keyMetrics.${index}.startValue`, true)}
                                            />
                                            {Object.keys(keyMetricsFormik.errors).includes("keyMetrics") &&
                                              keyMetricsFormik.errors[`keyMetrics`]?.length != 0 &&
                                              keyMetricsFormik.errors[`keyMetrics`][index]?.startValue &&
                                              keyMetricsFormik.touched?.keyMetrics?.[index]?.startValue && (
                                              <span className="text-sm text-red-600">
                                                Start Value is required
                                              </span>
                                            )}
                                          </div>

                                          <div className="space-y-2">
                                            <Label htmlFor={`target-value-${index}`}>Target Value</Label>
                                            <Input
                                              type="text"
                                              id={`target-value-${index}`}
                                              placeholder="Target Value"
                                              value={keyMetricsFormik.values.keyMetrics[index]?.targetValue || ''}
                                              onKeyDown={(e) => {
                                                // Allow: backspace, delete, tab, escape, enter, decimal point
                                                if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                                                    // Allow: Ctrl/cmd+A, Ctrl/cmd+C, Ctrl/cmd+V, Ctrl/cmd+X
                                                    (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
                                                    (e.keyCode === 67 && (e.ctrlKey === true || e.metaKey === true)) ||
                                                    (e.keyCode === 86 && (e.ctrlKey === true || e.metaKey === true)) ||
                                                    (e.keyCode === 88 && (e.ctrlKey === true || e.metaKey === true)) ||
                                                    // Allow: home, end, left, right
                                                    (e.keyCode >= 35 && e.keyCode <= 39)) {
                                                  return;
                                                }
                                                // Ensure that it is a number and stop the keypress if not
                                                if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                                                  e.preventDefault();
                                                }
                                              }}
                                              onChange={(e) => {
                                                const value = e.target.value;
                                                // Only allow numbers and decimal point
                                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                  keyMetricsFormik.setFieldValue(`keyMetrics.${index}.targetValue`, value === '' ? '' : Number(value));
                                                }
                                              }}
                                              onBlur={() => keyMetricsFormik.setFieldTouched(`keyMetrics.${index}.targetValue`, true)}
                                            />
                                            {Object.keys(keyMetricsFormik.errors).includes("keyMetrics") &&
                                              keyMetricsFormik.errors[`keyMetrics`]?.length != 0 &&
                                              keyMetricsFormik.errors[`keyMetrics`][index]?.targetValue &&
                                              keyMetricsFormik.touched?.keyMetrics?.[index]?.targetValue && (
                                              <span className="text-sm text-red-600">
                                                Target Value is required
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* <div className="col-2">
                                        <button className="btn btn-primary" onClick={() => arrayHelpers.remove(index)}>
                                          Remove
                                        </button>
                                      </div> */}
                                      </div>

                                      <hr style={{ marginTop: "2rem" }} />
                                    </div>
                                  ))}

                                  {/* Add New Key Metric */}
                                  <div className="space-y-2">
                                    <Label>Add Key Metric</Label>
                                    <Select
                                      onValueChange={(value) => {
                                        if (value !== "") {
                                          arrayHelpers.push({ keyMetric: allKeyMetrics.filter((k) => k._id == value)[0].name });
                                        }
                                      }}
                                      modal={false}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a Key Metric" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {allKeyMetrics.map((keyMetric, idx) => (
                                          <React.Fragment key={keyMetric._id}>
                                            <SelectItem value={keyMetric._id}>
                                              {keyMetric.name}
                                            </SelectItem>
                                            {idx < allKeyMetrics.length - 1 && (
                                              <div className="border-b border-gray-200 mx-2" />
                                            )}
                                          </React.Fragment>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center mt-6 pt-4 border-t">
                          <div className="flex-1">
                            <p
                              className="skip-for-now"
                              onClick={() => {
                                keyMetricsFormik.setFieldValue("keyMetrics", []);
                                setselectedMenu("Confidence");
                              }}
                            >
                              Skip For Now
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="lg"
                              onClick={() => {
                                setselectedMenu("Assign Members");
                              }}
                            >
                              Back
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="lg"
                              onClick={() => {
                                closeModal();
                              }}
                            >
                              Close
                            </Button>

                            {selectedGoal ? (
                              <Button
                                type="button"
                                size="lg"
                                disabled={isSubmitting}
                                onClick={() => {
                                  submitNewGoalForm();
                                }}
                              >
                                {isSubmitting ? "Updating..." : "Update Goal"}
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="lg"
                                disabled={!keyMetricsFormik.isValid || keyMetricsFormik.values.keyMetrics.length === 0}
                                onClick={() => {
                                  setselectedMenu("Confidence");
                                }}
                              >
                                Next
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Form>
                </FormikProvider>

                {/* Confidence STEP */}
                <FormikProvider value={confidenceFormik}>
                  <Form autoComplete="off" noValidate onSubmit={confidenceFormik.handleSubmit}>
                    {selectedMenu === "Confidence" && (
                      <>
                        {/* Confidence */}
                        <Label htmlFor="confidence">Confidence</Label>
                        <Select
                          value={confidenceFormik.values.confidence || ""}
                          onValueChange={(value) => {
                            confidenceFormik.setFieldValue("confidence", value);
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="How confident are you about this goal" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Very Confident">Very Confident</SelectItem>
                            <SelectItem value="Confident">Confident</SelectItem>
                            <SelectItem value="Realistic">Realistic</SelectItem>
                            <SelectItem value="Achievable">Achievable</SelectItem>
                            <SelectItem value="Ambitious">Ambitious</SelectItem>
                            <SelectItem value="Unsure">Unsure</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Action Buttons */}
                        <div className="flex items-center mt-6 pt-4 border-t">
                          <div className="flex-1">
                            <p
                              className="skip-for-now"
                              onClick={() => {
                                confidenceFormik.setFieldValue("confidence", "");
                                submitNewGoalForm();
                              }}
                            >
                              Skip For Now
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="lg"
                              onClick={() => {
                                setselectedMenu("Key Metrics");
                              }}
                            >
                              Back
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="lg"
                              onClick={() => {
                                closeModal();
                              }}
                            >
                              Close
                            </Button>

                            {selectedGoal ? (
                              <Button
                                type="button"
                                size="lg"
                                disabled={isSubmitting}
                                onClick={() => {
                                  submitNewGoalForm();
                                }}
                              >
                                {isSubmitting ? "Updating..." : "Update Goal"}
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="lg"
                                disabled={!confidenceFormik.isValid || !confidenceFormik.dirty || isSubmitting}
                                onClick={() => {
                                  submitNewGoalForm();
                                }}
                              >
                                {isSubmitting ? "Creating..." : "Create Goal"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </Form>
                </FormikProvider>
        </div>
        {/* Scrollable Content End */}
      </DialogContent>
    </Dialog>
  );
}

export default CreateNewGoalDialog;
