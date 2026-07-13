import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

const navItems = [
  { to: '/', label: 'Pacientes' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/pruebas', label: 'Resultados de Pruebas' },
  { to: '/laboratorio', label: 'Resultados de Laboratorio' },
]

export default function Layout() {
  const { username, logout } = useAuth()

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header sidebar-header-block">
          <div>
            <h1>Expediente Digital</h1>
            <p className="sidebar-user">Sesión: {username}</p>
          </div>
          <button className="btn btn-secondary btn-sm sidebar-logout" onClick={logout}>
            Salir
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
