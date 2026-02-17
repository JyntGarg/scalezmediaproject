import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
// import { HelmetProvider } from 'react-helmet-async';
import App from "./App";
import "./index.css";
import { store } from "./redux/store";
// Bootstrap CSS - kept for styling, JS removed to prevent modal errors
import "bootstrap/dist/css/bootstrap.min.css";
// import "bootstrap/dist/js/bootstrap.bundle.min"; // Removed to prevent _config.backdrop error
import "bootstrap-icons/font/bootstrap-icons.css";

// NOTE: Don't remove, import Chart from "chart.js/auto";
import Chart from "chart.js/auto";


const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <>
    {/* <HelmetProvider> */}
    <Provider store={store}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </BrowserRouter>
    </Provider>
    {/* </HelmetProvider> */}
  </>
);
