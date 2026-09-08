import React from "react";
import ReactDOM from "react-dom/client";
import { PageShell } from "./components/Layout";
import { WithSupabase } from "./components/ConnectGate";
import { RequireAuth, useAuthState } from "./components/AuthGate";
import PartnerPage from "./pages/PartnerPage";
import "./styles.css";

function PartnerRoot() {
  const { state, refresh } = useAuthState();
  return (
    <PageShell active="partner" role={state?.profile.role ?? null} onAuthed={() => refresh()}>
      <WithSupabase>
        <RequireAuth allowed={["partner", "admin"]}>
          <PartnerPage />
        </RequireAuth>
      </WithSupabase>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PartnerRoot />
  </React.StrictMode>
);
