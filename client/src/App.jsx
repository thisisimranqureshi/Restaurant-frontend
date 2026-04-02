import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './Context/AuthContext';
import Login from './Pages/Login';
import Signup from './Pages/Signup';
import Header from './Components/Header';
import Inventory from './Pages/Inventory';
import SalePurchase from './Pages/SalePurchase';
import Transaction from './Pages/Transaction';
import Usage from './Pages/Usage';
import ShortcutsGuide from './Pages/ShortcutsGuide';
import ProtectedRoute from './Components/ProtectedRoute';

function App() {
  const { token } = useAuth();
  return (
     <BrowserRouter>
      <Toaster position="top-right" />
      {/* Only show header when logged in */}
      {token && <Header />}
      <Routes>
        
        <Route path="/" element={<Navigate to="/inventory" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* Protected routes will go here */}
        <Route path="/inventory" element={
  <ProtectedRoute><Inventory /></ProtectedRoute>
} />
<Route path="/sale-purchase" element={
  <ProtectedRoute><SalePurchase /></ProtectedRoute>
} />
<Route path="/transaction" element={
  <ProtectedRoute><Transaction /></ProtectedRoute>
} />
<Route path="/usage" element={<Usage />} />
<Route path="/shortcuts" element={<ShortcutsGuide />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;