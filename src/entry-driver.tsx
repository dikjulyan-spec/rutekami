import React from "react";
import ReactDOM from "react-dom/client";
import { PageShell } from "./components/Layout";
import { WithSupabase } from "./components/ConnectGate";
import DriverPage from "./pages/DriverPage";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PageShell active="driver">
      <WithSupabase>
        <DriverPage />
      </WithSupabase>
    </PageShell>
  </React.StrictMode>
);
