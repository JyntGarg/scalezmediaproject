import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";

function TourModal({ open: controlledOpen, onOpenChange: controlledOnOpenChange }) {
  const dispatch = useDispatch();
  const [selectedMenu, setselectedMenu] = useState("Goals");
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const onOpenChange = controlledOnOpenChange || setInternalOpen;
  const ProjectsMenus = [
    {
      name: "Goals",
    },
    {
      name: "Ideas",
    },
    {
      name: "Tests",
    },
    {
      name: "Learnings",
    },
    {
      name: "Insights",
    },
  ];

  const RightProjectsMenus = [];

  const Note = (note) => {
    return (
      <div
        className="border border-border p-3 rounded-md mb-2 bg-[#F5F8FF] text-[#111827] dark:bg-[#0b1220] dark:text-[#F9FAFB]"
      >
        <span style={{ marginRight: "0.45rem", position: "relative", top: "-3px" }}>
          <img src="/static/images/tour/star.svg" alt="" />
        </span>
        <span className="text-sm font-semibold">{note}</span>
      </div>
    );
  };

  const previous = () => {
    const currentIndex = ProjectsMenus.map((a) => a.name).indexOf(selectedMenu);
    if (currentIndex != 0) {
      setselectedMenu(ProjectsMenus[currentIndex - 1].name);
    }
  };

  const next = () => {
    const currentIndex = ProjectsMenus.map((a) => a.name).indexOf(selectedMenu);
    if (currentIndex != ProjectsMenus.length - 1) {
      setselectedMenu(ProjectsMenus[currentIndex + 1].name);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Scalez Process</DialogTitle>
          <DialogDescription className="text-base">
            A 5-Step Formula that drives results
          </DialogDescription>
          <p className="text-muted-foreground mt-2">
            A quick guide of how a project process takes place at Pulse!
          </p>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="border-b mb-3">
            <div className="flex items-center gap-4">
              {ProjectsMenus.map((menu, index) => {
                return (
                  <button
                    key={index}
                    type="button"
                    className={`text-sm font-medium pb-2 px-2 transition-colors ${
                      selectedMenu === menu.name
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => {
                      setselectedMenu(menu.name);
                    }}
                  >
                    {menu.name}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedMenu === "Goals" && (
                <>
                  <img src="/static/images/tour/goals.svg" alt="" style={{ maxWidth: "100%", marginBottom: "1rem" }} />

                  {Note("A goal can be any form of improvment you want to accomplish, ex : Increase ad clicks.")}
                  {Note("Each goal consist of Key metrics that you’re trying to improve. ex : Weekly Sales, MRR, etc.")}
                  {Note("Goals are set on a specific timeline/duration.")}
                  {Note("Goals can be assigned to multiple members.")}
                </>
              )}

          {selectedMenu === "Ideas" && (
                <>
                  <img src="/static/images/tour/ideas.svg" alt="" style={{ maxWidth: "100%", marginBottom: "1rem" }} />

                  {Note("For each goal, all the members added will be able to ideate together!")}
                  {Note("Each Idea is calculated based on I.C.E Score")}
                  {Note("Ideas also consist of Levers, to show what impact they’ll make")}
                  {Note("Ideas can also be nominated to see which ones are being liked the most!")}
                </>
              )}

          {selectedMenu === "Tests" && (
                <>
                  <img src="/static/images/tour/tests.svg" alt="" style={{ maxWidth: "100%", marginBottom: "1rem" }} />

                  {Note("The highest I.C.E score or nominated Ideas are usually tested first")}
                  {Note("Tests consist of assigned members & tasks to do")}
                  {Note("Once tests are ready to analyze, they can be sent to learnings")}
                  {Note("Tests can also be sent back to ideas incase there is any change in mind")}
                </>
              )}

          {selectedMenu === "Learnings" && (
                <>
                  <img src="/static/images/tour/learnings.svg" alt="" style={{ maxWidth: "100%", marginBottom: "1rem" }} />

                  {Note("Learnings is basically conclusion to an idea")}
                  {Note("Learnings consist of : Worked, Din’t worked and Inconclusive")}
                  {Note("Great learnings can also be used on other projects as it’s a good data")}
                  {Note("You can also add screenshots or any other media in learnings")}
                </>
              )}

          {selectedMenu === "Insights" && (
                <>
                  <img src="/static/images/tour/insights.svg" alt="" style={{ maxWidth: "100%", marginBottom: "1rem" }} />

                  {Note("Track your team’s contribution towards the organization’s growth")}
                  {Note("Other Insights consist of graphs, charts and statistics")}
                  {Note("Graphs can also be exported (Coming soon)")}
                  {Note("Teammates are also rewarded points based on contribution (Coming soon)")}
                </>
              )}

          <div className="flex items-center justify-between border-t pt-4 mt-4">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={previous}
                disabled={ProjectsMenus.map((a) => a.name).indexOf(selectedMenu) === 0}
              >
                Back
              </Button>
              <Button
                onClick={next}
                disabled={ProjectsMenus.map((a) => a.name).indexOf(selectedMenu) === ProjectsMenus.length - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TourModal;
