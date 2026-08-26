import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Laptop } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CompareTray } from './components/CompareTray';
import { HomePage } from './pages/HomePage';
import { RecommendPage } from './pages/RecommendPage';
import { BrowsePage } from './pages/BrowsePage';
import { LaptopDetailPage } from './pages/LaptopDetailPage';
import { ComparePage } from './pages/ComparePage';
import { MethodologyPage } from './pages/MethodologyPage';

export function App() {
  const [comparedLaptops, setComparedLaptops] = useState<Laptop[]>([]);

  const handleToggleCompare = (laptop: Laptop) => {
    setComparedLaptops((prev) => {
      const exists = prev.some((l) => l.id === laptop.id);
      if (exists) {
        return prev.filter((l) => l.id !== laptop.id);
      }
      if (prev.length >= 4) {
        alert('You can compare up to 4 laptops at a time.');
        return prev;
      }
      return [...prev, laptop];
    });
  };

  const handleAddCompare = (laptop: Laptop) => {
    setComparedLaptops((prev) => {
      if (prev.some((l) => l.id === laptop.id)) return prev;
      if (prev.length >= 4) return prev;
      return [...prev, laptop];
    });
  };

  const handleRemoveCompare = (id: number) => {
    setComparedLaptops((prev) => prev.filter((l) => l.id !== id));
  };

  const handleClearCompare = () => {
    setComparedLaptops([]);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-truespec-500 selection:text-white">
        <Navbar compareCount={comparedLaptops.length} />

        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  comparedLaptops={comparedLaptops}
                  onToggleCompare={handleToggleCompare}
                />
              }
            />
            <Route
              path="/recommend"
              element={
                <RecommendPage
                  comparedLaptops={comparedLaptops}
                  onToggleCompare={handleToggleCompare}
                />
              }
            />
            <Route
              path="/laptops"
              element={
                <BrowsePage
                  comparedLaptops={comparedLaptops}
                  onToggleCompare={handleToggleCompare}
                />
              }
            />
            <Route
              path="/laptops/:id"
              element={
                <LaptopDetailPage
                  comparedLaptops={comparedLaptops}
                  onToggleCompare={handleToggleCompare}
                />
              }
            />
            <Route
              path="/compare"
              element={
                <ComparePage
                  comparedLaptops={comparedLaptops}
                  onRemoveCompare={handleRemoveCompare}
                  onAddCompare={handleAddCompare}
                  onClearCompare={handleClearCompare}
                />
              }
            />
            <Route path="/methodology" element={<MethodologyPage />} />
          </Routes>
        </main>

        {/* Global floating comparison tray */}
        <CompareTray
          laptops={comparedLaptops}
          onRemove={handleRemoveCompare}
          onClear={handleClearCompare}
        />

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
