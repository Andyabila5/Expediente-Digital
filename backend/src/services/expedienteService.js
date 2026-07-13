import { pool } from '../db/pool.js'

const PACIENTE_SELECT = `
  select
    id,
    nombre,
    cedula,
    fecha_nacimiento,
    telefono,
    correo,
    datos_demograficos,
    ahf,
    app,
    apnp,
    aqxt,
    mc,
    pa,
    aua,
    hematuria,
    rao,
    disuria,
    ef_tr,
    ef_testis,
    ef_pene,
    lab_psa,
    lab_ego,
    lab_pfr,
    plan,
    fecha_registro
  from pacientes
`

const RESULTADO_PRUEBA_SELECT = `
  select
    id,
    paciente_id,
    nombre_prueba,
    fecha,
    resultado,
    notas,
    attachment_name,
    attachment_mime_type,
    attachment_size
  from resultados_pruebas
`

const RESULTADO_LABORATORIO_SELECT = `
  select
    id,
    paciente_id,
    nombre_analisis,
    fecha,
    valores,
    notas,
    attachment_name,
    attachment_mime_type,
    attachment_size
  from resultados_laboratorio
`

const CITA_SELECT = `
  select
    id,
    paciente_id,
    fecha_hora,
    motivo,
    notas,
    estado,
    recordatorio_whatsapp
  from citas
`

function createHttpError(message, status = 400, details = null) {
  const error = new Error(message)
  error.status = status
  error.details = details
  return error
}

function asText(value) {
  return typeof value === 'string' ? value : String(value ?? '')
}

function toIsoValue(value) {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  return String(value)
}

function normalizePaciente(data = {}) {
  const paciente = {
    nombre: asText(data.nombre).trim(),
    cedula: asText(data.cedula).trim(),
    fechaNacimiento: asText(data.fechaNacimiento).trim(),
    telefono: asText(data.telefono).trim(),
    correo: asText(data.correo).trim(),
    datosDemograficos: asText(data.datosDemograficos).trim(),
    ahf: asText(data.ahf).trim(),
    app: asText(data.app).trim(),
    apnp: asText(data.apnp).trim(),
    aqxt: asText(data.aqxt).trim(),
    mc: asText(data.mc).trim(),
    pa: asText(data.pa).trim(),
    aua: asText(data.aua).trim(),
    hematuria: asText(data.hematuria).trim(),
    rao: asText(data.rao).trim(),
    disuria: asText(data.disuria).trim(),
    efTr: asText(data.efTr).trim(),
    efTestis: asText(data.efTestis).trim(),
    efPene: asText(data.efPene).trim(),
    labPsa: asText(data.labPsa).trim(),
    labEgo: asText(data.labEgo).trim(),
    labPfr: asText(data.labPfr).trim(),
    plan: asText(data.plan).trim(),
  }

  if (!paciente.nombre) {
    throw createHttpError('El nombre del paciente es obligatorio.')
  }

  return paciente
}

function normalizeResultadoPrueba(data = {}) {
  const resultado = {
    pacienteId: asText(data.pacienteId).trim(),
    nombrePrueba: asText(data.nombrePrueba).trim(),
    fecha: asText(data.fecha).trim() || new Date().toISOString().slice(0, 10),
    resultado: asText(data.resultado).trim(),
    notas: asText(data.notas).trim(),
  }

  if (!resultado.pacienteId || !resultado.nombrePrueba || !resultado.resultado) {
    throw createHttpError('Paciente, nombre de prueba y resultado son obligatorios.')
  }

  return resultado
}

function normalizeResultadoLaboratorio(data = {}) {
  const resultado = {
    pacienteId: asText(data.pacienteId).trim(),
    nombreAnalisis: asText(data.nombreAnalisis).trim(),
    fecha: asText(data.fecha).trim() || new Date().toISOString().slice(0, 10),
    valores: asText(data.valores).trim(),
    notas: asText(data.notas).trim(),
  }

  if (!resultado.pacienteId || !resultado.nombreAnalisis || !resultado.valores) {
    throw createHttpError('Paciente, nombre de análisis y valores son obligatorios.')
  }

  return resultado
}

function normalizeCita(data = {}) {
  const cita = {
    pacienteId: asText(data.pacienteId).trim(),
    fechaHora: asText(data.fechaHora).trim(),
    motivo: asText(data.motivo).trim(),
    notas: asText(data.notas).trim(),
    estado: asText(data.estado).trim() || 'programada',
    recordatorioWhatsApp:
      typeof data.recordatorioWhatsApp === 'boolean'
        ? data.recordatorioWhatsApp
        : ['true', '1', 'on', 'yes'].includes(asText(data.recordatorioWhatsApp).toLowerCase()),
  }

  if (!cita.pacienteId || !cita.fechaHora || !cita.motivo) {
    throw createHttpError('Paciente, fecha y motivo son obligatorios para la cita.')
  }

  return cita
}

function mapArchivo(row, basePath) {
  if (!row.attachment_name) {
    return null
  }

  return {
    nombre: row.attachment_name,
    mimeType: row.attachment_mime_type,
    tamano: Number(row.attachment_size || 0),
    url: `${basePath}/${row.id}/archivo`,
  }
}

function mapPaciente(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    cedula: row.cedula ?? '',
    fechaNacimiento: row.fecha_nacimiento ?? '',
    telefono: row.telefono ?? '',
    correo: row.correo ?? '',
    datosDemograficos: row.datos_demograficos ?? '',
    ahf: row.ahf ?? '',
    app: row.app ?? '',
    apnp: row.apnp ?? '',
    aqxt: row.aqxt ?? '',
    mc: row.mc ?? '',
    pa: row.pa ?? '',
    aua: row.aua ?? '',
    hematuria: row.hematuria ?? '',
    rao: row.rao ?? '',
    disuria: row.disuria ?? '',
    efTr: row.ef_tr ?? '',
    efTestis: row.ef_testis ?? '',
    efPene: row.ef_pene ?? '',
    labPsa: row.lab_psa ?? '',
    labEgo: row.lab_ego ?? '',
    labPfr: row.lab_pfr ?? '',
    plan: row.plan ?? '',
    fechaRegistro: toIsoValue(row.fecha_registro),
  }
}

function mapResultadoPrueba(row) {
  return {
    id: row.id,
    pacienteId: row.paciente_id,
    nombrePrueba: row.nombre_prueba,
    fecha: toIsoValue(row.fecha),
    resultado: row.resultado ?? '',
    notas: row.notas ?? '',
    archivo: mapArchivo(row, '/api/resultados-pruebas'),
  }
}

function mapResultadoLaboratorio(row) {
  return {
    id: row.id,
    pacienteId: row.paciente_id,
    nombreAnalisis: row.nombre_analisis,
    fecha: toIsoValue(row.fecha),
    valores: row.valores ?? '',
    notas: row.notas ?? '',
    archivo: mapArchivo(row, '/api/resultados-laboratorio'),
  }
}

function mapCita(row) {
  return {
    id: row.id,
    pacienteId: row.paciente_id,
    fechaHora: toIsoValue(row.fecha_hora),
    motivo: row.motivo,
    notas: row.notas ?? '',
    estado: row.estado,
    recordatorioWhatsApp: Boolean(row.recordatorio_whatsapp),
  }
}

function attachmentColumns(file) {
  if (!file) {
    return null
  }

  return {
    name: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    data: file.buffer,
  }
}

export async function getExpedienteData() {
  const [pacientes, pruebas, laboratorios, citas] = await Promise.all([
    pool.query(`${PACIENTE_SELECT} order by fecha_registro desc, nombre asc`),
    pool.query(`${RESULTADO_PRUEBA_SELECT} order by fecha desc, created_at desc`),
    pool.query(`${RESULTADO_LABORATORIO_SELECT} order by fecha desc, created_at desc`),
    pool.query(`${CITA_SELECT} order by fecha_hora asc`),
  ])

  return {
    pacientes: pacientes.rows.map(mapPaciente),
    resultadosPruebas: pruebas.rows.map(mapResultadoPrueba),
    resultadosLaboratorio: laboratorios.rows.map(mapResultadoLaboratorio),
    citas: citas.rows.map(mapCita),
  }
}

export async function createPaciente(data) {
  const paciente = normalizePaciente(data)
  const result = await pool.query(
    `
      insert into pacientes (
        nombre, cedula, fecha_nacimiento, telefono, correo, datos_demograficos,
        ahf, app, apnp, aqxt, mc, pa, aua, hematuria, rao, disuria,
        ef_tr, ef_testis, ef_pene, lab_psa, lab_ego, lab_pfr, plan
      ) values (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23
      )
      returning *
    `,
    [
      paciente.nombre,
      paciente.cedula,
      paciente.fechaNacimiento || null,
      paciente.telefono,
      paciente.correo,
      paciente.datosDemograficos,
      paciente.ahf,
      paciente.app,
      paciente.apnp,
      paciente.aqxt,
      paciente.mc,
      paciente.pa,
      paciente.aua,
      paciente.hematuria,
      paciente.rao,
      paciente.disuria,
      paciente.efTr,
      paciente.efTestis,
      paciente.efPene,
      paciente.labPsa,
      paciente.labEgo,
      paciente.labPfr,
      paciente.plan,
    ],
  )

  return mapPaciente(result.rows[0])
}

export async function updatePaciente(id, data) {
  const paciente = normalizePaciente(data)
  const result = await pool.query(
    `
      update pacientes
      set
        nombre = $2,
        cedula = $3,
        fecha_nacimiento = $4,
        telefono = $5,
        correo = $6,
        datos_demograficos = $7,
        ahf = $8,
        app = $9,
        apnp = $10,
        aqxt = $11,
        mc = $12,
        pa = $13,
        aua = $14,
        hematuria = $15,
        rao = $16,
        disuria = $17,
        ef_tr = $18,
        ef_testis = $19,
        ef_pene = $20,
        lab_psa = $21,
        lab_ego = $22,
        lab_pfr = $23,
        plan = $24,
        updated_at = now()
      where id = $1
      returning *
    `,
    [
      id,
      paciente.nombre,
      paciente.cedula,
      paciente.fechaNacimiento || null,
      paciente.telefono,
      paciente.correo,
      paciente.datosDemograficos,
      paciente.ahf,
      paciente.app,
      paciente.apnp,
      paciente.aqxt,
      paciente.mc,
      paciente.pa,
      paciente.aua,
      paciente.hematuria,
      paciente.rao,
      paciente.disuria,
      paciente.efTr,
      paciente.efTestis,
      paciente.efPene,
      paciente.labPsa,
      paciente.labEgo,
      paciente.labPfr,
      paciente.plan,
    ],
  )

  if (result.rowCount === 0) {
    throw createHttpError('Paciente no encontrado.', 404)
  }

  return mapPaciente(result.rows[0])
}

export async function deletePaciente(id) {
  const result = await pool.query('delete from pacientes where id = $1 returning id', [id])

  if (result.rowCount === 0) {
    throw createHttpError('Paciente no encontrado.', 404)
  }
}

export async function createResultadoPrueba(data, file) {
  const payload = normalizeResultadoPrueba(data)
  const archivo = attachmentColumns(file)

  const result = await pool.query(
    `
      insert into resultados_pruebas (
        paciente_id, nombre_prueba, fecha, resultado, notas,
        attachment_name, attachment_mime_type, attachment_size, attachment_data
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      returning id, paciente_id, nombre_prueba, fecha, resultado, notas,
        attachment_name, attachment_mime_type, attachment_size
    `,
    [
      payload.pacienteId,
      payload.nombrePrueba,
      payload.fecha,
      payload.resultado,
      payload.notas,
      archivo?.name ?? null,
      archivo?.mimeType ?? null,
      archivo?.size ?? null,
      archivo?.data ?? null,
    ],
  )

  return mapResultadoPrueba(result.rows[0])
}

export async function updateResultadoPrueba(id, data, file) {
  const payload = normalizeResultadoPrueba(data)
  const archivo = attachmentColumns(file)

  const result = await pool.query(
    `
      update resultados_pruebas
      set
        paciente_id = $2,
        nombre_prueba = $3,
        fecha = $4,
        resultado = $5,
        notas = $6,
        attachment_name = coalesce($7, attachment_name),
        attachment_mime_type = coalesce($8, attachment_mime_type),
        attachment_size = coalesce($9, attachment_size),
        attachment_data = coalesce($10, attachment_data),
        updated_at = now()
      where id = $1
      returning id, paciente_id, nombre_prueba, fecha, resultado, notas,
        attachment_name, attachment_mime_type, attachment_size
    `,
    [
      id,
      payload.pacienteId,
      payload.nombrePrueba,
      payload.fecha,
      payload.resultado,
      payload.notas,
      archivo?.name ?? null,
      archivo?.mimeType ?? null,
      archivo?.size ?? null,
      archivo?.data ?? null,
    ],
  )

  if (result.rowCount === 0) {
    throw createHttpError('Resultado de prueba no encontrado.', 404)
  }

  return mapResultadoPrueba(result.rows[0])
}

export async function deleteResultadoPrueba(id) {
  const result = await pool.query('delete from resultados_pruebas where id = $1 returning id', [id])

  if (result.rowCount === 0) {
    throw createHttpError('Resultado de prueba no encontrado.', 404)
  }
}

export async function getResultadoPruebaAttachment(id) {
  const result = await pool.query(
    `
      select attachment_name, attachment_mime_type, attachment_data
      from resultados_pruebas
      where id = $1
    `,
    [id],
  )

  if (result.rowCount === 0 || !result.rows[0].attachment_data) {
    throw createHttpError('El archivo adjunto no existe.', 404)
  }

  return {
    fileName: result.rows[0].attachment_name,
    mimeType: result.rows[0].attachment_mime_type || 'application/octet-stream',
    data: result.rows[0].attachment_data,
  }
}

export async function createResultadoLaboratorio(data, file) {
  const payload = normalizeResultadoLaboratorio(data)
  const archivo = attachmentColumns(file)

  const result = await pool.query(
    `
      insert into resultados_laboratorio (
        paciente_id, nombre_analisis, fecha, valores, notas,
        attachment_name, attachment_mime_type, attachment_size, attachment_data
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      returning id, paciente_id, nombre_analisis, fecha, valores, notas,
        attachment_name, attachment_mime_type, attachment_size
    `,
    [
      payload.pacienteId,
      payload.nombreAnalisis,
      payload.fecha,
      payload.valores,
      payload.notas,
      archivo?.name ?? null,
      archivo?.mimeType ?? null,
      archivo?.size ?? null,
      archivo?.data ?? null,
    ],
  )

  return mapResultadoLaboratorio(result.rows[0])
}

export async function updateResultadoLaboratorio(id, data, file) {
  const payload = normalizeResultadoLaboratorio(data)
  const archivo = attachmentColumns(file)

  const result = await pool.query(
    `
      update resultados_laboratorio
      set
        paciente_id = $2,
        nombre_analisis = $3,
        fecha = $4,
        valores = $5,
        notas = $6,
        attachment_name = coalesce($7, attachment_name),
        attachment_mime_type = coalesce($8, attachment_mime_type),
        attachment_size = coalesce($9, attachment_size),
        attachment_data = coalesce($10, attachment_data),
        updated_at = now()
      where id = $1
      returning id, paciente_id, nombre_analisis, fecha, valores, notas,
        attachment_name, attachment_mime_type, attachment_size
    `,
    [
      id,
      payload.pacienteId,
      payload.nombreAnalisis,
      payload.fecha,
      payload.valores,
      payload.notas,
      archivo?.name ?? null,
      archivo?.mimeType ?? null,
      archivo?.size ?? null,
      archivo?.data ?? null,
    ],
  )

  if (result.rowCount === 0) {
    throw createHttpError('Resultado de laboratorio no encontrado.', 404)
  }

  return mapResultadoLaboratorio(result.rows[0])
}

export async function deleteResultadoLaboratorio(id) {
  const result = await pool.query('delete from resultados_laboratorio where id = $1 returning id', [id])

  if (result.rowCount === 0) {
    throw createHttpError('Resultado de laboratorio no encontrado.', 404)
  }
}

export async function getResultadoLaboratorioAttachment(id) {
  const result = await pool.query(
    `
      select attachment_name, attachment_mime_type, attachment_data
      from resultados_laboratorio
      where id = $1
    `,
    [id],
  )

  if (result.rowCount === 0 || !result.rows[0].attachment_data) {
    throw createHttpError('El archivo adjunto no existe.', 404)
  }

  return {
    fileName: result.rows[0].attachment_name,
    mimeType: result.rows[0].attachment_mime_type || 'application/octet-stream',
    data: result.rows[0].attachment_data,
  }
}

export async function createCita(data) {
  const cita = normalizeCita(data)
  const result = await pool.query(
    `
      insert into citas (paciente_id, fecha_hora, motivo, notas, estado, recordatorio_whatsapp)
      values ($1, $2, $3, $4, $5, $6)
      returning *
    `,
    [cita.pacienteId, cita.fechaHora, cita.motivo, cita.notas, cita.estado, cita.recordatorioWhatsApp],
  )

  return mapCita(result.rows[0])
}

export async function updateCita(id, data) {
  const cita = normalizeCita(data)
  const result = await pool.query(
    `
      update citas
      set
        paciente_id = $2,
        fecha_hora = $3,
        motivo = $4,
        notas = $5,
        estado = $6,
        recordatorio_whatsapp = $7,
        updated_at = now()
      where id = $1
      returning *
    `,
    [id, cita.pacienteId, cita.fechaHora, cita.motivo, cita.notas, cita.estado, cita.recordatorioWhatsApp],
  )

  if (result.rowCount === 0) {
    throw createHttpError('Cita no encontrada.', 404)
  }

  return mapCita(result.rows[0])
}

export async function deleteCita(id) {
  const result = await pool.query('delete from citas where id = $1 returning id', [id])

  if (result.rowCount === 0) {
    throw createHttpError('Cita no encontrada.', 404)
  }
}
