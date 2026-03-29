import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './Context/AuthContext';
import Login from './Pages/Login';
import Signup from './Pages/Signup';
import Header from './Components/Header';
import ProtectedRoute from './Components/ProtectedRoute';

function App() {
  const { token } = useAuth();
  return (
     <BrowserRouter>
      <Toaster position="top-right" />
      {/* Only show header when logged in */}
      {token && <Header />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* Protected routes will go here */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;