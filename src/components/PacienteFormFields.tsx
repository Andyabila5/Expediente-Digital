import type { PacienteFormData } from '../types'
import { SECCIONES_EXPEDIENTE } from '../constants/pacienteForm'
import './PacienteFormFields.css'

interface Props {
  form: PacienteFormData
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export default function PacienteFormFields({ form, onChange }: Props) {
  return (
    <div className="expediente-form-sections">
      {SECCIONES_EXPEDIENTE.map(seccion => (
        <fieldset key={seccion.titulo} className="form-section">
          <legend>{seccion.titulo}</legend>
          <div className="form-grid">
            {seccion.campos.map(campo => {
              const id = campo.name
              const className = campo.fullWidth ? 'form-group full-width' : 'form-group'

              if (campo.type === 'textarea') {
                return (
                  <div key={campo.name} className={className}>
                    <label htmlFor={id}>{campo.label}</label>
                    <textarea
                      id={id}
                      name={campo.name}
                      value={form[campo.name]}
                      onChange={onChange}
                      placeholder={campo.placeholder}
                      rows={campo.rows ?? 3}
                    />
                  </div>
                )
              }

              return (
                <div key={campo.name} className={className}>
                  <label htmlFor={id}>{campo.label}</label>
                  <input
                    id={id}
                    name={campo.name}
                    type={campo.type ?? 'text'}
                    value={form[campo.name]}
                    onChange={onChange}
                    placeholder={campo.placeholder}
                    required={campo.name === 'nombre'}
                  />
                </div>
              )
            })}
          </div>
        </fieldset>
      ))}
    </div>
  )
}
