import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import toast from 'react-hot-toast';
import './Header.css';

const Header = () => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const links = [
    { path: '/inventory', label: 'Inventory' },
    { path: '/sale-purchase', label: 'Sale / Purchase' },
    { path: '/transaction', label: 'Transaction' },
    { path: '/usage', label: 'Usage' },
    
  ];

  return (
    <header className="header">
      <div className="header-inner">

        <Link to="/" className="header-logo">
          🍽️ RestroManager
        </Link>

        <nav className="header-nav">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${pathname === link.path ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-right">
          <span className="header-user">👤 {user?.name || 'Admin'}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

      </div>
    </header>
  );
};

export default Header;