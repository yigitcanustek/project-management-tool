import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppLayout } from "./Index/index.tsx";
import { Board } from "./Index/Board/index.tsx";
import Workflow from "./Index/Workflow/index.tsx";
import React from "react";

function App() {
  return (
    <Router>
      <Routes>
        {/* Use DashboardLayout for nested routes */}
        <Route path="/" element={<AppLayout />}>
          <Route path="board" element={<Board />} />
          <Route path="workflow" element={<Workflow />} />
        </Route>

        {/* Fallback for unmatched routes */}
        <Route path="*" element={<h2>Page Not Found</h2>} />
      </Routes>
    </Router>
  );
}

export default App;
