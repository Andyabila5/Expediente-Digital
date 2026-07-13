import type { PacienteFormData, SeccionExpediente } from '../types'

export const EMPTY_PACIENTE_FORM: PacienteFormData = {
  nombre: '',
  cedula: '',
  fechaNacimiento: '',
  telefono: '',
  correo: '',
  datosDemograficos: '',
  ahf: '',
  app: '',
  apnp: '',
  aqxt: '',
  mc: '',
  pa: '',
  aua: '',
  hematuria: '',
  rao: '',
  disuria: '',
  efTr: '',
  efTestis: '',
  efPene: '',
  labPsa: '',
  labEgo: '',
  labPfr: '',
  plan: '',
}

export const SECCIONES_EXPEDIENTE: SeccionExpediente[] = [
  {
    titulo: 'Datos personales',
    campos: [
      { name: 'nombre', label: 'Nombre del paciente *', placeholder: 'Ej. ANGEL DAVID DÍAZ ARRIETA', fullWidth: true },
      { name: 'cedula', label: 'Cédula', placeholder: 'Ej. 800800058' },
      { name: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date' },
      { name: 'telefono', label: 'Número de teléfono', type: 'tel', placeholder: 'Ej. 8693-9826' },
      { name: 'correo', label: 'Correo', type: 'email', placeholder: 'Ej. paciente@correo.com', fullWidth: true },
      {
        name: 'datosDemograficos',
        label: 'Datos demográficos',
        type: 'textarea',
        rows: 2,
        placeholder: 'Ej. PTE MASC 73 AÑOS, VECINO DE AGUAS ZARCAS, PENSIONADO // TRABAJABA EN REFORESTACION, CASADO',
        fullWidth: true,
      },
    ],
  },
  {
    titulo: 'Antecedentes',
    campos: [
      { name: 'ahf', label: 'AHF (Antecedentes heredo-familiares)', type: 'textarea', rows: 2, placeholder: 'Ej. DM-2', fullWidth: true },
      { name: 'app', label: 'APP (Antecedentes personales patológicos)', type: 'textarea', rows: 2, placeholder: 'Ej. OBESIDAD, HTA, DM-2, ECV HACE 4 MESES, DLP', fullWidth: true },
      { name: 'apnp', label: 'APNP (Antecedentes personales no patológicos)', type: 'textarea', rows: 2, placeholder: 'Ej. NIEGA', fullWidth: true },
      { name: 'aqxt', label: 'AQXT (Antecedentes quirúrgicos / tratamientos)', type: 'textarea', rows: 2, placeholder: 'Ej. VASECTOMIA, BXTRP 2021 HPB', fullWidth: true },
    ],
  },
  {
    titulo: 'Motivo y padecimiento actual',
    campos: [
      { name: 'mc', label: 'MC (Motivo de consulta)', type: 'textarea', rows: 2, placeholder: 'Ej. LUTS', fullWidth: true },
      { name: 'pa', label: 'PA (Padecimiento actual)', type: 'textarea', rows: 3, placeholder: 'Ej. ESPOSA REFIERE QUE POLAQUIURIA Y NICTURIA...', fullWidth: true },
    ],
  },
  {
    titulo: 'Evaluación urológica',
    campos: [
      { name: 'aua', label: 'AUA', placeholder: 'Ej. V5I0F1UCH4E0N: 10 /35' },
      { name: 'hematuria', label: 'Hematuria', placeholder: 'Ej. -' },
      { name: 'rao', label: 'RAO', placeholder: 'Ej. -' },
      { name: 'disuria', label: 'Disuria', placeholder: 'Ej. -' },
    ],
  },
  {
    titulo: 'Examen físico (EF)',
    campos: [
      { name: 'efTr', label: 'TR', type: 'textarea', rows: 2, placeholder: 'Ej. PROSTATA G III BORDES LIBRES NO NODULOS CONSISTENCIA SUAVE', fullWidth: true },
      { name: 'efTestis', label: 'Testis', placeholder: 'Ej. NO MASAS' },
      { name: 'efPene', label: 'Pene', placeholder: 'Ej. SIN LESIONES' },
    ],
  },
  {
    titulo: 'Laboratorio',
    campos: [
      { name: 'labPsa', label: 'L/ PSA', placeholder: 'Ej. 6.2----28%' },
      { name: 'labEgo', label: 'EGO', placeholder: 'Ej. -' },
      { name: 'labPfr', label: 'PFR', placeholder: 'Ej. NL' },
    ],
  },
  {
    titulo: 'Plan',
    campos: [
      {
        name: 'plan',
        label: 'Plan de tratamiento',
        type: 'textarea',
        rows: 6,
        placeholder: 'Ej.\n1. RECOMENDACIONES\n2. EDUCACION VESICAL\n3. FULMEN DUO 1 COMP X DIA VO...',
        fullWidth: true,
      },
    ],
  },
]

export function pacienteToFormData(paciente: PacienteFormData & { id?: string; fechaRegistro?: string }): PacienteFormData {
  return {
    nombre: paciente.nombre ?? '',
    cedula: paciente.cedula ?? '',
    fechaNacimiento: paciente.fechaNacimiento ?? '',
    telefono: paciente.telefono ?? '',
    correo: paciente.correo ?? '',
    datosDemograficos: paciente.datosDemograficos ?? '',
    ahf: paciente.ahf ?? '',
    app: paciente.app ?? '',
    apnp: paciente.apnp ?? '',
    aqxt: paciente.aqxt ?? '',
    mc: paciente.mc ?? '',
    pa: paciente.pa ?? '',
    aua: paciente.aua ?? '',
    hematuria: paciente.hematuria ?? '',
    rao: paciente.rao ?? '',
    disuria: paciente.disuria ?? '',
    efTr: paciente.efTr ?? '',
    efTestis: paciente.efTestis ?? '',
    efPene: paciente.efPene ?? '',
    labPsa: paciente.labPsa ?? '',
    labEgo: paciente.labEgo ?? '',
    labPfr: paciente.labPfr ?? '',
    plan: paciente.plan ?? '',
  }
}
