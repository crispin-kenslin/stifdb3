import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import BrowsePage from "./pages/BrowsePage";
import GeneDetailPage from "./pages/GeneDetailPage";
import CropPage from "./pages/CropPage";
import TFBSPage from "./pages/TFBSPage";
import TFFamiliesPage from "./pages/TFFamiliesPage";
import StifalPredictPage from "./pages/StifalPredictPage";
import HelpPage from "./pages/HelpPage";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"            element={<HomePage />} />
        <Route path="/browse"      element={<BrowsePage />} />
        <Route path="/search"      element={<SearchPage />} />
        <Route path="/crop/:crop"  element={<CropPage />} />
        <Route path="/tf-families" element={<TFFamiliesPage />} />
        <Route path="/gene/:geneId" element={<GeneDetailPage />} />
        <Route path="/tfbs/:tfbsName" element={<TFBSPage />} />
        <Route path="/predict"     element={<StifalPredictPage />} />
        <Route path="/help"        element={<HelpPage />} />
        <Route path="*"            element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
