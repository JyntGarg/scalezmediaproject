import React from "react";
import { Outlet } from "react-router-dom";
import SettingSidebar from "./SettingSidebar";
import Toolbar from "./Toolbar";
import PopupMessage from "./PopupMessage";

function SettingsLayout({ socket }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-muted">
      <PopupMessage />
      <Toolbar socket={socket} />

      <div className="flex">
        <SettingSidebar />
        <div className="flex-1 p-6 mt-[68px] min-h-[calc(100vh-68px)] overflow-x-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default SettingsLayout;
