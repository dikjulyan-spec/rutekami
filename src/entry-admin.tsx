import React from "react";
import ReactDOM from "react-dom/client";
import { PageShell } from "./components/Layout";
import { WithSupabase } from "./components/ConnectGate";
import { RequireAuth, useAuthState } from "./components/AuthGate";
import AdminPage from "./pages/AdminPage";
import "./styles.css";

function AdminRoot() {
  const { state, refresh } = useAuthState();
  return (
    <PageShell active="admin" role={state?.profile.role ?? null} onAuthed={() => refresh()}>
      <WithSupabase>
        <RequireAuth allowed={["admin"]}>
          <AdminPage />
        </RequireAuth>
      </WithSupabase>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AdminRoot />
  </React.StrictMode>
);
