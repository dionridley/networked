// import React from "react";
import { createRoot } from "react-dom/client";
import "./assets/css/style.css";
import { Header, Counter } from "@repo/ui";

const App = () => (
  <div className="flex flex-col p-4">
    <Header title="Web" />
    <div className="card">
      <Counter />
    </div>
  </div>
);

createRoot(document.getElementById("app")!).render(<App />);
