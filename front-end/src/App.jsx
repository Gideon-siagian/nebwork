import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import NebworkAnalytics from "@/pages/NebworkAnalytics";
import NebworkAdmin from "@/pages/NebworkAdmin";
import NebworkAssistantChat from "@/pages/NebworkAssistantChat";
import NebworkEditor from "@/pages/NebworkEditor";
import NebworkHome from "@/pages/NebworkHome";
import NebworkLogin from "@/pages/NebworkLogin";
import NebworkMyWorklogs from "@/pages/NebworkMyWorklogs";
import NebworkNotFound from "@/pages/NebworkNotFound";

const RequireSession = ({ children }) => {
  const token = sessionStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

const RequireAdmin = ({ children }) => {
  try {
    const raw = sessionStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : null;
    return user?.role === "admin" ? children : <Navigate to="/" replace />;
  } catch (error) {
    return <Navigate to="/" replace />;
  }
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<NebworkLogin />} />
        <Route path="/" element={<RequireSession><NebworkHome /></RequireSession>} />
        <Route path="/my-worklogs" element={<RequireSession><NebworkMyWorklogs /></RequireSession>} />
        <Route path="/worklog/new" element={<RequireSession><NebworkEditor /></RequireSession>} />
        <Route path="/worklog/:id" element={<RequireSession><NebworkEditor /></RequireSession>} />
        <Route path="/assistant" element={<RequireSession><NebworkAssistantChat /></RequireSession>} />
        <Route path="/analytics" element={<RequireSession><NebworkAnalytics /></RequireSession>} />
        <Route path="/admin" element={<RequireSession><RequireAdmin><NebworkAdmin /></RequireAdmin></RequireSession>} />
        <Route path="*" element={<NebworkNotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

