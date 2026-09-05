import React from "react";
import ReactDOM from "react-dom/client";
import { PageShell } from "./components/Layout";
import { WithSupabase } from "./components/ConnectGate";
import AdminPage from "./pages/AdminPage";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PageShell active="admin">
      <WithSupabase>
        <AdminPage />
      </WithSupabase>
    </PageShell>
  </React.StrictMode>
);
