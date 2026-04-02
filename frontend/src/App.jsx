import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import GeneDetailPage from "./pages/GeneDetailPage";
import CropPage from "./pages/CropPage";
import TFBSPage from "./pages/TFBSPage";
import HelpPage from "./pages/HelpPage";
import CropsListPage from "./pages/CropsListPage";
import TFFamiliesPage from "./pages/TFFamiliesPage";
import BrowsePage from "./pages/BrowsePage";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/browse" element={<BrowsePage />} />
        <Route path="/crops" element={<CropsListPage />} />
        <Route path="/crop/:crop" element={<CropPage />} />
        <Route path="/tf-families" element={<TFFamiliesPage />} />
        <Route path="/gene/:geneId" element={<GeneDetailPage />} />
        <Route path="/tfbs/:tfbsName" element={<TFBSPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
