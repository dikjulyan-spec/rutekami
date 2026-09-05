import React from "react";
import ReactDOM from "react-dom/client";
import { PageShell } from "./components/Layout";
import { WithSupabase } from "./components/ConnectGate";
import CustomerPage from "./pages/CustomerPage";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PageShell active="booking">
      <WithSupabase>
        <CustomerPage />
      </WithSupabase>
    </PageShell>
  </React.StrictMode>
);
