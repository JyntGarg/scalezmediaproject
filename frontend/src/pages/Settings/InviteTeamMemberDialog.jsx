import React, { useState, useEffect } from "react";
import { ReactMultiEmail, isEmail } from "react-multi-email";
import "react-multi-email/style.css";
import { useDispatch, useSelector } from "react-redux";
import { getAllRoles, inviteUser, selectallRoles, selectAllUsers } from "../../redux/slices/settingSlice";
import { hasPermission_add_roles } from "../../utils/permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { AlertCircle } from "lucide-react";

function InviteTeamMemberDialog({ open, onOpenChange }) {
  const [inviteEmails, setinviteEmails] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const dispatch = useDispatch();
  const allRoles = useSelector(selectallRoles);
  const existingUsers = useSelector(selectAllUsers);

  // Get all existing user emails
  const existingEmails = existingUsers?.map(user => user.email?.toLowerCase()) || [];

  const closeDialog = () => {
    setinviteEmails([]);
    setSelectedRole("");
    setErrorMessage("");
    onOpenChange(false);
  };

  const filterRoles = allRoles.filter((el) => {
    return el.name !== "Owner";
  });

  useEffect(() => {
    dispatch(getAllRoles());
  }, []);

  useEffect(() => {
    if (filterRoles.length > 0 && !selectedRole) {
      setSelectedRole(filterRoles[0]._id);
    }
  }, [filterRoles]);

  // Reset error when dialog closes
  useEffect(() => {
    if (!open) {
      setErrorMessage("");
    }
  }, [open]);

  const validateEmails = () => {
    // Check if emails list is empty
    if (inviteEmails.length === 0) {
      setErrorMessage("Please add at least one email address");
      return false;
    }

    // Check for invalid email formats
    const invalidEmails = inviteEmails.filter(email => !isEmail(email));
    if (invalidEmails.length > 0) {
      setErrorMessage(`Invalid email format: ${invalidEmails.join(", ")}`);
      return false;
    }

    // Check for duplicate emails in the input list
    const duplicates = inviteEmails.filter((email, index) =>
      inviteEmails.indexOf(email.toLowerCase()) !== index
    );
    if (duplicates.length > 0) {
      setErrorMessage(`Duplicate emails found: ${duplicates.join(", ")}`);
      return false;
    }

    // Check if any email already exists as a team member
    const existingMemberEmails = inviteEmails.filter(email =>
      existingEmails.includes(email.toLowerCase())
    );
    if (existingMemberEmails.length > 0) {
      setErrorMessage(`These emails are already team members: ${existingMemberEmails.join(", ")}`);
      return false;
    }

    // Check if role is selected
    if (!selectedRole) {
      setErrorMessage("Please select a role for the invited members");
      return false;
    }

    setErrorMessage("");
    return true;
  };

  const handleEmailChange = (_emails) => {
    setErrorMessage(""); // Clear error when user makes changes

    // Convert all emails to lowercase for consistency
    const normalizedEmails = _emails.map(email => email.toLowerCase());

    // Remove duplicates
    const uniqueEmails = [...new Set(normalizedEmails)];

    // Filter out emails that are already members
    const validEmails = uniqueEmails.filter(email => !existingEmails.includes(email));

    // Show warning if some emails were filtered out
    if (validEmails.length < _emails.length) {
      const filteredCount = _emails.length - validEmails.length;
      setErrorMessage(`${filteredCount} email(s) removed: already a member or duplicate`);
    }

    setinviteEmails(validEmails);
  };

  const handleSendInvites = () => {
    if (!validateEmails()) {
      return;
    }

    dispatch(
      inviteUser({
        emails: inviteEmails,
        role: selectedRole,
        closeDialog,
      })
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Invite team members</DialogTitle>
          <p className="text-sm text-muted-foreground">Build your team!</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* Invite emails */}
          <div className="space-y-2">
            <Label>Enter emails</Label>
            <ReactMultiEmail
              style={{ minHeight: "10rem" }}
              placeholder="Type email and press Enter"
              emails={inviteEmails}
              onChange={handleEmailChange}
              validateEmail={(email) => {
                return isEmail(email);
              }}
              getLabel={(email, index, removeEmail) => {
                return (
                  <div data-tag key={index}>
                    {email}
                    <span data-tag-handle onClick={() => removeEmail(index)}>
                      ×
                    </span>
                  </div>
                );
              }}
            />
            <p className="text-xs text-muted-foreground">
              Use "," to separate emails. Emails of existing members will be automatically removed.
            </p>
          </div>

          {/* Role selection */}
          {hasPermission_add_roles() && (
            <div className="space-y-2">
              <Label>Select Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {filterRoles.map((role) => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
            >
              Close
            </Button>

            <Button
              type="button"
              onClick={handleSendInvites}
              disabled={inviteEmails.length === 0 || !selectedRole}
              className="bg-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Invites {inviteEmails.length > 0 && `(${inviteEmails.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default InviteTeamMemberDialog;
