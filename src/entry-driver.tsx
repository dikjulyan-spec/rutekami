import React from "react";
import ReactDOM from "react-dom/client";
import { PageShell } from "./components/Layout";
import { WithSupabase } from "./components/ConnectGate";
import { RequireAuth, useAuthState } from "./components/AuthGate";
import DriverPage from "./pages/DriverPage";
import "./styles.css";

function DriverRoot() {
  const { state, refresh } = useAuthState();
  return (
    <PageShell active="driver" role={state?.profile.role ?? null} onAuthed={() => refresh()}>
      <WithSupabase>
        <RequireAuth allowed={["driver"]}>
          <DriverPage authState={state} />
        </RequireAuth>
      </WithSupabase>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DriverRoot />
  </React.StrictMode>
);
