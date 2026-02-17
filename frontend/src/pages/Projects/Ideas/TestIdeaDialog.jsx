import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { ReactSortable } from "react-sortablejs";
import { Form, FormikProvider } from "formik";
import {
  getProjectUsers,
  selectProjectUsers,
  selectSelectedIdea,
  selectselectedTest,
  testIdea,
  updateTest,
  selectselectedLearning,
  updateselectedTest,
} from "../../../redux/slices/projectSlice";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { backendServerBaseURL } from "../../../utils/backendServerBaseURL";
import { GripVertical, Trash2, X, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

function TestIdeaDialog() {
  const [selectedTeamMembers, setselectedTeamMembers] = useState([]);
  const [numberOfTeamMembersToShowInSelect] = useState(3);
  const [showDropdown, setShowDropdown] = useState(false);
  const [tasksList, settasksList] = useState([]);
  const [taskInput, setTaskInput] = useState("");
  const params = useParams();
  const selectedIdea = useSelector(selectSelectedIdea);
  const projectId = params.projectId;
  const ideaId = selectedIdea ? selectedIdea._id : params.ideaId;
  const testId = params.testId;
  const NewProjectSchema = Yup.object().shape({
    dueDate: Yup.string().required("Due date is required"),
  });
  const projectUsers = useSelector(selectProjectUsers);
  const navigate = useNavigate();
  const selectedTest = useSelector(selectselectedTest);
  const selectedLearning = useSelector(selectselectedLearning);
  const dispatch = useDispatch();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(!!selectedTest);
  }, [selectedTest]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      try {
        const dropdown = document.querySelector('[data-team-dropdown-test]');
        const trigger = document.querySelector('[data-team-trigger-test]');
        if (dropdown && trigger && !dropdown.contains(e.target) && !trigger.contains(e.target)) {
          setShowDropdown(false);
        }
      } catch (err) {}
    };

    if (showDropdown) {
      window.addEventListener("click", handleClickOutside);
    }

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [showDropdown]);

  const closeDialog = () => {
    setIsOpen(false);
    dispatch(updateselectedTest(null));
    formik.resetForm();
    setselectedTeamMembers([]);
    settasksList([]);
  };

  // Use Set for O(1) lookup instead of O(n) includes check
  const selectedTeamMemberIds = useMemo(() => {
    return new Set(selectedTeamMembers.map(m => m._id));
  }, [selectedTeamMembers]);

  const addTeamMember = useCallback((teamMember) => {
    if (selectedTeamMemberIds.has(teamMember._id)) {
      removeSelectedTeamMember(teamMember);
    } else {
      setselectedTeamMembers(prev => [...prev, teamMember]);
    }
  }, [selectedTeamMemberIds]);

  const removeSelectedTeamMember = useCallback((teamMember) => {
    setselectedTeamMembers(prev => prev.filter(m => m._id !== teamMember._id));
  }, []);

  const formik = useFormik({
    initialValues: {
      dueDate: "",
    },
    validationSchema: NewProjectSchema,
    onSubmit: (values) => {
      // Check if we're updating an existing test (testId in URL params) or creating a new test from an idea
      if (testId) {
        // Updating existing test
        dispatch(
          updateTest({
            values,
            selectedTeamMembers,
            tasksList,
            testId: testId,
            projectId,
            navigate,
            closeDialog,
          })
        );
      } else {
        // Creating new test from idea
        dispatch(
          testIdea({
            ...values,
            selectedTeamMembers,
            tasksList,
            ideaId: ideaId,
            projectId,
            navigate,
            closeDialog,
          })
        );
      }
    },
  });

  const { errors, touched, values, getFieldProps, handleSubmit } = formik;

  useEffect(() => {
    if (projectId) {
      dispatch(getProjectUsers({ projectId }));
    }
  }, []);

  useEffect(() => {
    // Only populate form when editing an existing test (testId exists)
    if (testId && selectedTest) {
      formik.setValues({
        dueDate: selectedTest.dueDate
          ? new Date(selectedTest.dueDate).toISOString().substring(0, 10)
          : "",
      });
      setselectedTeamMembers(selectedTest.assignedTo || []);
      settasksList(selectedTest.tasks ? selectedTest.tasks.map((task) => task.name) : []);
    }
  }, [selectedTest, testId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) closeDialog();
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {testId ? "Edit Test" : "Test Idea"}
          </DialogTitle>
          <DialogDescription>
            Looks like you liked the idea, now it's time to test it. Assign Idea
            to your teammates
          </DialogDescription>
        </DialogHeader>

        <FormikProvider value={formik}>
          <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Assign to */}
              <div>
                <Label className="text-sm font-medium mb-2">
                  Assign to
                </Label>
                <div className="relative">
                  <div
                    data-team-trigger-test
                    className={`border border-input bg-background rounded-md px-3 py-2 cursor-pointer hover:border-ring transition-colors flex items-center justify-between min-h-[42px] text-foreground ${
                      showDropdown ? 'bg-muted' : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown(!showDropdown);
                    }}
                  >
                    {selectedTeamMembers.length === 0 && (
                      <p className="m-0 text-sm text-muted-foreground">
                        Select team members
                      </p>
                    )}

                    <div className="flex items-center flex-wrap gap-2 flex-1">
                      {selectedTeamMembers
                        .slice(0, numberOfTeamMembersToShowInSelect)
                        .map((teamMember) => {
                          return (
                            <span
                              key={teamMember._id}
                              className="inline-flex items-center gap-2 bg-muted px-2 py-1 rounded-md text-sm text-foreground"
                            >
                              <img
                                src={`${backendServerBaseURL}/${teamMember.avatar}`}
                                className="w-6 h-6 rounded-full"
                                alt=""
                              />
                              <span className="text-sm text-foreground">
                                {teamMember.firstName} {teamMember.lastName}
                              </span>
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSelectedTeamMember(teamMember);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })}

                      {selectedTeamMembers.length >
                        numberOfTeamMembersToShowInSelect && (
                        <span className="text-sm text-foreground">
                          {`+${
                            selectedTeamMembers.length -
                            numberOfTeamMembersToShowInSelect
                          } Others`}
                        </span>
                      )}
                    </div>

                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {showDropdown && (
                    <div 
                      data-team-dropdown-test
                      className="absolute z-50 w-full mt-1 border border-border rounded-md shadow-lg bg-popover text-popover-foreground max-h-60 overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        className="px-3 py-2 hover:bg-accent cursor-pointer flex items-center gap-2 border-b border-border text-foreground"
                        onClick={() => {
                          setselectedTeamMembers(projectUsers);
                          setShowDropdown(false);
                        }}
                      >
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-foreground">
                          {projectUsers?.length}
                        </div>
                        <span className="text-sm text-foreground">Everyone in your team</span>
                      </div>

                      {projectUsers.map((teamMember) => {
                        return (
                          <div
                            key={teamMember._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              addTeamMember(teamMember);
                            }}
                            className={`px-3 py-2 cursor-pointer flex items-center gap-2 hover:bg-accent text-foreground ${
                              selectedTeamMemberIds.has(teamMember._id)
                                ? "bg-accent"
                                : ""
                            }`}
                          >
                            <img
                              src={`${backendServerBaseURL}/${teamMember.avatar}`}
                              className="w-6 h-6 rounded-full"
                              alt=""
                            />
                            <span className="text-sm flex-1 text-foreground">
                              {teamMember.firstName} {teamMember.lastName}
                            </span>

                            {selectedTeamMemberIds.has(teamMember._id) && (
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeSelectedTeamMember(teamMember);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Tasks */}
              <div>
                <Label className="text-sm font-medium text-gray-900 mb-2">
                  Tasks
                </Label>
                <div className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={taskInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Limit to 20 characters
                        if (value.length <= 20) {
                          setTaskInput(value);
                        }
                      }}
                      placeholder="Enter Task Here (max 20 chars)"
                      className="w-full"
                      maxLength={20}
                    />
                    <span className="text-xs text-muted-foreground mt-1">
                      {taskInput.length}/20 characters
                    </span>
                  </div>
                  <Button
                    type="button"
                    className="bg-gray-900 text-white hover:bg-gray-800"
                    disabled={taskInput.trim() === "" || taskInput.length > 20}
                    onClick={() => {
                      if (taskInput.trim() !== "" && taskInput.length <= 20) {
                        settasksList([...tasksList, taskInput]);
                        setTaskInput("");
                      }
                    }}
                  >
                    Add Task
                  </Button>
                </div>

                <ReactSortable
                  list={tasksList.map((task, index) => ({ id: index, name: task }))}
                  setList={(newList) => settasksList(newList.map((item) => item.name))}
                  animation={150}
                  handle=".drag-handle"
                  delayOnTouchStart={true}
                  delay={2}
                >
                  {tasksList.map((task, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 border border-gray-200 rounded-md p-3 mb-2 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <GripVertical className="h-4 w-4 text-gray-400 cursor-move drag-handle" />
                      <div className="flex-1">
                        <p className="m-0 text-sm">{task}</p>
                      </div>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        onClick={() => {
                          let tempTaskList = [...tasksList];
                          tempTaskList.splice(index, 1);
                          settasksList(tempTaskList);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </ReactSortable>
              </div>

              {/* Due Date */}
              <div>
                <Label className="text-sm font-medium text-gray-900 mb-2">
                  Due Date
                </Label>
                <Input
                  type="date"
                  {...getFieldProps("dueDate")}
                  placeholder="Set a due date"
                  required={true}
                />
                {Boolean(touched.dueDate && errors.dueDate) && (
                  <p className="mt-1 text-sm text-red-600">{errors.dueDate}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  className="bg-gray-900 text-white hover:bg-gray-800"
                  disabled={!formik.isValid || !formik.dirty}
                >
                  {testId ? "Update Test" : "Assign Test"}
                </Button>
              </div>
            </div>
          </Form>
        </FormikProvider>
      </DialogContent>
    </Dialog>
  );
}

export default TestIdeaDialog;
