import React from "react";
import ReactDOM from "react-dom/client";
import { AppRouter } from "./app/AppRouter";
import { AuthProvider } from "./features/auth/AuthProvider";
import { AuthGate } from "./features/auth/components/AuthGate";
import "./styles.css";

if (import.meta.env.DEV) {
  const developmentWindow = window as typeof window & {
    runSevenDaySessionSmokeTest?: (startDate: string) => Promise<unknown>;
  };
  developmentWindow.runSevenDaySessionSmokeTest = async (startDate: string) => {
    const { runSevenDaySessionSmokeTest } = await import(
      "./features/researchSessions/testing/runSevenDaySessionSmokeTest"
    );
    return runSevenDaySessionSmokeTest(startDate);
  };
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <AuthGate>
        <AppRouter />
      </AuthGate>
    </AuthProvider>
  </React.StrictMode>,
);
