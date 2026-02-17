import { Form, FormikProvider, useFormik } from "formik";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as Yup from "yup";
import { createProject, editProject, getAllRegisteredUsers, selectRegisteredUsers, selectSelectedProject } from "../../redux/slices/projectSlice";
import { backendServerBaseURL } from "../../utils/backendServerBaseURL";
import { projectNameValidation, projectDescriptionValidation } from "../../utils/validationSchemas";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { X, Users } from "lucide-react";

function CreateNewProjectDialog({ isOpen = false, onClose }) {
  const [selectedTeamMembers, setselectedTeamMembers] = useState([]);
  const [numberOfTeamMembersToShowInSelect, setnumberOfTeamMembersToShowInSelect] = useState(3);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const dispatch = useDispatch();
  const users = useSelector(selectRegisteredUsers);
  const selectedProject = useSelector(selectSelectedProject);

  const NewProjectSchema = Yup.object().shape({
    name: projectNameValidation,
    description: projectDescriptionValidation,
  });

  const closeModal = () => {
    onClose && onClose();
    resetForm();
  };

  const formik = useFormik({
    initialValues: {
      name: "",
      description: "",
      status: "Not Defined",
    },
    validateOnBlur: true,
    validationSchema: NewProjectSchema,
    onSubmit: async (values, { setErrors, setSubmitting, resetForm }) => {
      console.log("Form values:", values);
      console.log("Selected team members:", selectedTeamMembers);
      setSubmitting(true);
      try {
        if (selectedProject) {
          await dispatch(editProject({ ...values, closeModal, projectId: selectedProject._id, team: selectedTeamMembers }));
        } else {
          const payload = { ...values, status: "Not Defined", closeModal, team: selectedTeamMembers };
          console.log("Creating project with payload:", payload);
          await dispatch(createProject(payload));
        }
      } catch (error) {
        console.error("Error creating/updating project:", error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const { errors, touched, handleSubmit, isSubmitting, getFieldProps, values, resetForm } = formik;

  const addTeamMember = (teamMember) => {
    // Check if member is already selected by comparing IDs
    const isAlreadySelected = selectedTeamMembers.some(
      (tm) => (tm._id || tm.id) === (teamMember._id || teamMember.id)
    );

    if (isAlreadySelected) {
      // Remove if already selected
      removeSelectedTeamMember(teamMember);
    } else {
      // Add if not selected
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

  useEffect(() => {
    if (selectedProject) {
      formik.setValues({
        name: selectedProject.name,
        description: selectedProject.description,
        status: selectedProject.status || "Not Defined",
      });
      setselectedTeamMembers(selectedProject.team);
    } else {
      formik.setValues({
        name: "",
        description: "",
        status: "Not Defined",
      });
    }
  }, [selectedProject]);

  useEffect(() => {
    dispatch(getAllRegisteredUsers());
  }, []);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Reset form values
      formik.resetForm();
      // Reset team members
      setselectedTeamMembers([]);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {selectedProject ? "Edit Project" : "Create New Project"}
          </DialogTitle>
          <DialogDescription>
            {selectedProject ? "Update your project details and team members" : "Create a new project and assign team members"}
          </DialogDescription>
        </DialogHeader>
        <FormikProvider value={formik}>
          <Form autoComplete="off" noValidate onSubmit={handleSubmit}>
            <div className="space-y-6">

              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  type="text"
                  {...getFieldProps("name")}
                  placeholder="Enter Project Name"
                />
                {touched.name && errors.name && (
                  <span className="text-sm text-red-600">
                    {errors.name}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  {...getFieldProps("description")}
                  placeholder="Enter Description"
                />
                {touched.description && errors.description && (
                  <span className="text-sm text-red-600">
                    {errors.description}
                  </span>
                )}
              </div>

              {/* Team Members - Combined Input with Dropdown */}
              <div className="space-y-2">
                <Label>Team Members</Label>

                <div className="relative">
                  <Select
                    open={isSelectOpen}
                    onOpenChange={setIsSelectOpen}
                    onValueChange={(value) => {
                      if (value === "everyone") {
                        setselectedTeamMembers(users);
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
                          <span>Everyone in your team ({users?.length})</span>
                        </div>
                      </SelectItem>
                      {users?.map((teamMember) => (
                        <div
                          key={teamMember.id || teamMember._id}
                          className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-6 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const member = users.find((u) => (u._id || u.id) === (teamMember._id || teamMember.id));
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
              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    onClose && onClose();
                  }}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  className="bg-black hover:bg-gray-800"
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? (selectedProject ? "Updating..." : "Creating...") 
                    : (selectedProject ? "Update Project" : "Create Project")
                  }
                </Button>
              </div>
            </div>
          </Form>
        </FormikProvider>
      </DialogContent>
    </Dialog>
  );
}

export default CreateNewProjectDialog;
