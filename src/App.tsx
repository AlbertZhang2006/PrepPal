import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Welcome from "./screens/Welcome";
import UploadInstructions from "./screens/UploadInstructions";
import ReviewParsed from "./screens/ReviewParsed";
import Dashboard from "./screens/Dashboard";
import Timeline from "./screens/Timeline";
import EventDetail from "./screens/EventDetail";
import AskPrepPal from "./screens/AskPrepPal";
import Emergency from "./screens/Emergency";
import Instructions from "./screens/Instructions";
import ManualSetup from "./screens/ManualSetup";
import ProcedureSelect from "./screens/ProcedureSelect";
import SymptomTracker from "./screens/SymptomTracker";
import Supplies from "./screens/Supplies";
import PrintSummary from "./screens/PrintSummary";
import Reminders from "./screens/Reminders";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Welcome />} />
        <Route path="/select-procedure" element={<ProcedureSelect />} />
        <Route path="/upload" element={<UploadInstructions />} />
        <Route path="/setup" element={<ManualSetup />} />
        <Route path="/review" element={<ReviewParsed />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/event/:eventId" element={<EventDetail />} />
        <Route path="/ask" element={<AskPrepPal />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/symptoms" element={<SymptomTracker />} />
        <Route path="/supplies" element={<Supplies />} />
        <Route path="/summary" element={<PrintSummary />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
