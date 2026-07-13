import type { Paciente } from '../types'
import { SECCIONES_EXPEDIENTE } from '../constants/pacienteForm'
import { DOCTOR_INFO } from '../constants/doctor'
import { formatFecha } from '../utils/storage'
import './PacienteExpedienteView.css'

interface Props {
  paciente: Paciente
}

function displayValue(campo: keyof Paciente, value: string): string {
  if (!value) return '—'
  if (campo === 'fechaNacimiento') return formatFecha(value)
  return value
}

export default function PacienteExpedienteView({ paciente }: Props) {
  return (
    <div className="expediente-clinico">
      {SECCIONES_EXPEDIENTE.map(seccion => (
        <div key={seccion.titulo} className="card seccion-clinica">
          <h3>{seccion.titulo}</h3>
          <div className="datos-grid">
            {seccion.campos.map(campo => (
              <div
                key={campo.name}
                className={`dato-item ${campo.fullWidth || campo.type === 'textarea' ? 'full-width' : ''}`}
              >
                <span className="dato-label">{campo.label.replace(' *', '')}</span>
                <span className="dato-value">{displayValue(campo.name, paciente[campo.name])}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card firma-doctora">
        <p className="doctora-nombre">{DOCTOR_INFO.nombre}</p>
        <p>{DOCTOR_INFO.especialidad}</p>
        <p>{DOCTOR_INFO.clinica}</p>
        <p className="doctora-codigo">CODIGO {DOCTOR_INFO.codigo}</p>
      </div>
    </div>
  )
}
