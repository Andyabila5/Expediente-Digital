import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ExpedienteProvider } from './context/ExpedienteContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Pacientes from './pages/Pacientes'
import PacienteDetalle from './pages/PacienteDetalle'
import ResultadosPruebas from './pages/ResultadosPruebas'
import ResultadosLaboratorio from './pages/ResultadosLaboratorio'
import Agenda from './pages/Agenda'
import Login from './pages/Login'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            {/*
              ExpedienteProvider ahora vive DENTRO de ProtectedRoute.
              Esto garantiza que fetchExpedienteData() solo se ejecuta
              cuando el usuario tiene una sesión autenticada.
            */}
            <Route
              path="/"
              element={
                <ExpedienteProvider>
                  <Layout />
                </ExpedienteProvider>
              }
            >
              <Route index element={<Pacientes />} />
              <Route path="paciente/:id" element={<PacienteDetalle />} />
              <Route path="pruebas" element={<ResultadosPruebas />} />
              <Route path="laboratorio" element={<ResultadosLaboratorio />} />
              <Route path="agenda" element={<Agenda />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
