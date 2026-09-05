import React from "react";
import ReactDOM from "react-dom/client";
import { PageShell } from "./components/Layout";
import { WithSupabase } from "./components/ConnectGate";
import HomePage from "./pages/HomePage";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PageShell active="main">
      <WithSupabase>
        <HomePage />
      </WithSupabase>
    </PageShell>
  </React.StrictMode>
);
