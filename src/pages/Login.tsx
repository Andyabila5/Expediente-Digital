import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const success = login(username, password)

    if (!success) {
      setError('Usuario o contraseña incorrectos.')
      return
    }

    setError('')
    navigate(from, { replace: true })
  }

  return (
    <div className="login-shell">
      <div className="login-card card">
        <div className="login-copy">
          <span className="login-eyebrow">Acceso protegido</span>
          <h1>Expediente Digital</h1>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={event => setUsername(event.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="alert login-alert">{error}</div>}

          <button type="submit" className="btn btn-primary login-submit">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  )
}
