import React from "react";
import ReactDOM from "react-dom/client";
import { PageShell } from "./components/Layout";
import { WithSupabase } from "./components/ConnectGate";
import PartnerPage from "./pages/PartnerPage";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PageShell active="partner">
      <WithSupabase>
        <PartnerPage />
      </WithSupabase>
    </PageShell>
  </React.StrictMode>
);
