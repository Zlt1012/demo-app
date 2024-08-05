import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Map from "./pages/Map";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Map />} />
        <Route path="/map" element={<Map />} />
        {/* 其他路由 */}
      </Routes>
    </Router>
  );
}

export default App;
