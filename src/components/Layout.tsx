import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

const navItems = [
  { to: '/', label: 'Pacientes', icon: '👤' },
  { to: '/agenda', label: 'Agenda', icon: '📅' },
  { to: '/pruebas', label: 'Pruebas', icon: '🧪' },
  { to: '/laboratorio', label: 'Laboratorio', icon: '🔬' },
]

export default function Layout() {
  const { username, logout } = useAuth()

  const initials = username ? username.slice(0, 2).toUpperCase() : '?'

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">🏥</div>
            <h1>Expediente Digital</h1>
          </div>
          <div className="sidebar-user-row">
            <div className="sidebar-user-info">
              <div className="sidebar-avatar">{initials}</div>
              <span className="sidebar-user">{username}</span>
            </div>
            <button className="btn btn-sm sidebar-logout" onClick={logout}>
              Salir
            </button>
          </div>
        </div>

        <div className="sidebar-nav-section">
          <p className="sidebar-nav-label">Menú</p>
          <nav className="sidebar-nav">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-link-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
