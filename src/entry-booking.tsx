import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { PageShell } from "./components/Layout";
import { WithSupabase } from "./components/ConnectGate";
import { AuthGate, useAuthState } from "./components/AuthGate";
import CustomerPage from "./pages/CustomerPage";
import "./styles.css";

function BookingRoot() {
  const { state, refresh } = useAuthState();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <PageShell active="booking" role={state?.profile.role ?? null} onAuthed={() => refresh()}>
      <WithSupabase>
        {/* Katalog bisa dilihat tanpa login; saat checkout wajib login (onRequireAuth). */}
        <CustomerPage authState={state} onRequireAuth={() => setShowLogin(true)} />

        {showLogin && !state && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-cream">
            <AuthGate onAuthed={() => { setShowLogin(false); refresh(); }} mode="booking" />
          </div>
        )}
      </WithSupabase>
    </PageShell>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BookingRoot />
  </React.StrictMode>
);
