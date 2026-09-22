import jsPDF from 'jspdf'
import type { Paciente, ResultadoPrueba, ResultadoLaboratorio } from '../types'
import { DOCTOR_INFO } from '../constants/doctor'
import { formatFecha } from './storage'
import { LOGO_BASE64 } from '../assets/logoBase64'

interface ExpedientePDF {
  paciente: Paciente
  pruebas: ResultadoPrueba[]
  laboratorios: ResultadoLaboratorio[]
}

const MARGIN = 14
const PAGE_W = 210
const PAGE_H = 297
const CONTENT_W = PAGE_W - MARGIN * 2
const COL1_X = MARGIN
const COL2_X = PAGE_W / 2 + 2
const COL_W = CONTENT_W / 2 - 4
const FOOTER_H = 28
const PAGE_BOTTOM = PAGE_H - MARGIN - FOOTER_H
const FONT = 8.5
const LH = 4.2
const LOGO_SIZE = 18

function val(value: string): string {
  return value?.trim() ? value.trim() : '-'
}

function splitLines(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[]
}

function drawLines(doc: jsPDF, lines: string[], x: number, y: number): number {
  doc.setFontSize(FONT)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(20, 20, 20)
  lines.forEach((line, i) => doc.text(line, x, y + i * LH))
  return y + lines.length * LH
}

function drawField(doc: jsPDF, label: string, value: string, x: number, y: number, width: number): number {
  const text = `${label} ${val(value)}`
  const lines = splitLines(doc, text, width)
  return drawLines(doc, lines, x, y)
}

function drawTwoFields(doc: jsPDF, left: string, right: string, y: number): number {
  const leftLines = splitLines(doc, left, COL_W)
  const rightLines = splitLines(doc, right, COL_W)
  const rows = Math.max(leftLines.length, rightLines.length)
  doc.setFontSize(FONT)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(20, 20, 20)
  for (let i = 0; i < rows; i++) {
    if (leftLines[i]) doc.text(leftLines[i], COL1_X, y + i * LH)
    if (rightLines[i]) doc.text(rightLines[i], COL2_X, y + i * LH)
  }
  return y + rows * LH + 1.5
}

function drawFullLine(doc: jsPDF, text: string, y: number, indent = 0): number {
  const lines = splitLines(doc, text, CONTENT_W - indent)
  return drawLines(doc, lines, MARGIN + indent, y) + 1.5
}

function drawSectionLabel(doc: jsPDF, label: string, y: number): number {
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(label, MARGIN, y)
  return y + LH + 1
}

function drawHeaderLogo(doc: jsPDF): void {
  try {
    doc.addImage(LOGO_BASE64, 'JPEG', PAGE_W - MARGIN - LOGO_SIZE, MARGIN - 6, LOGO_SIZE, LOGO_SIZE)
  } catch {
    // Si la imagen no se puede incrustar por alguna razón, seguimos sin bloquear la generación del PDF.
  }
}

function drawDoctorFooter(doc: jsPDF, y: number, pinToBottom = false): void {
  if (needsNewPage(y, FOOTER_H + 6)) {
    doc.addPage()
    y = MARGIN + 4
    pinToBottom = false
  }

  const startY = pinToBottom
    ? Math.max(y + 6, PAGE_H - MARGIN - 22)
    : y + 6

  doc.setDrawColor(200, 210, 230)
  doc.line(MARGIN, startY - 4, PAGE_W - MARGIN, startY - 4)

  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20, 20, 20)
  doc.text(DOCTOR_INFO.nombre, PAGE_W / 2, startY, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text(DOCTOR_INFO.especialidad, PAGE_W / 2, startY + 5, { align: 'center' })
  doc.text(DOCTOR_INFO.clinica, PAGE_W / 2, startY + 9.5, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.text(`CODIGO ${DOCTOR_INFO.codigo}`, PAGE_W / 2, startY + 14, { align: 'center' })
}

function needsNewPage(y: number, needed: number): boolean {
  return y + needed > PAGE_BOTTOM
}

function renderExtraResults(
  doc: jsPDF,
  y: number,
  pruebas: ResultadoPrueba[],
  laboratorios: ResultadoLaboratorio[],
): number {
  if (pruebas.length === 0 && laboratorios.length === 0) return y

  if (needsNewPage(y, 20)) {
    doc.addPage()
    y = MARGIN + 4
  }

  if (pruebas.length > 0) {
    y = drawSectionLabel(doc, 'RESULTADOS DE PRUEBAS', y)
    pruebas.forEach((prueba, index) => {
      if (needsNewPage(y, 12)) { doc.addPage(); y = MARGIN + 4 }
      y = drawFullLine(doc, `${index + 1}. ${prueba.nombrePrueba} (${formatFecha(prueba.fecha)}): ${prueba.resultado}`, y, 2)
      if (prueba.notas) y = drawFullLine(doc, `Notas: ${prueba.notas}`, y, 4)
    })
    y += 2
  }

  if (laboratorios.length > 0) {
    if (needsNewPage(y, 12)) { doc.addPage(); y = MARGIN + 4 }
    y = drawSectionLabel(doc, 'RESULTADOS DE LABORATORIO', y)
    laboratorios.forEach((lab, index) => {
      if (needsNewPage(y, 12)) { doc.addPage(); y = MARGIN + 4 }
      y = drawFullLine(doc, `${index + 1}. ${lab.nombreAnalisis} (${formatFecha(lab.fecha)}): ${lab.valores}`, y, 2)
      if (lab.notas) y = drawFullLine(doc, `Notas: ${lab.notas}`, y, 4)
    })
  }

  return y
}

export function generarExpedientePDF({ paciente, pruebas, laboratorios }: ExpedientePDF): void {
  const doc = new jsPDF()
  let y = MARGIN + 2

  drawHeaderLogo(doc)

  doc.setFontSize(17)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('EXPEDIENTE CLINICO', PAGE_W / 2, y, { align: 'center' })
  y += 6

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text(`Generado el ${new Date().toLocaleDateString('es-MX')}`, PAGE_W / 2, y, { align: 'center' })
  y += 7

  y = drawTwoFields(doc,
    `NOMBRE DEL PACIENTE: ${val(paciente.nombre)}`,
    `CEDULA: ${val(paciente.cedula)}`,
    y,
  )
  y = drawTwoFields(doc,
    `FECHA DE NACIMIENTO: ${formatFecha(paciente.fechaNacimiento)}`,
    `NUMERO DE TELEFONO: ${val(paciente.telefono)}`,
    y,
  )
  y = drawField(doc, 'CORREO:', paciente.correo, COL1_X, y, CONTENT_W)

  if (paciente.datosDemograficos) {
    y += 1.5
    y = drawFullLine(doc, paciente.datosDemograficos, y)
  }

  y += 2
  y = drawTwoFields(doc, `AHF: ${val(paciente.ahf)}`, `APP: ${val(paciente.app)}`, y)
  y = drawTwoFields(doc, `APNP: ${val(paciente.apnp)}`, `AQXT: ${val(paciente.aqxt)}`, y)

  y += 1
  y = drawField(doc, 'MC:', paciente.mc, COL1_X, y, CONTENT_W)
  y = drawField(doc, 'PA:', paciente.pa, COL1_X, y, CONTENT_W)

  y += 1
  y = drawTwoFields(doc,
    `AUA: ${val(paciente.aua)}`,
    `HEMATURIA: ${val(paciente.hematuria)}`,
    y,
  )
  y = drawTwoFields(doc,
    `RAO: ${val(paciente.rao)}`,
    `DISURIA: ${val(paciente.disuria)}`,
    y,
  )

  y += 1
  y = drawFullLine(doc, 'EF:', y)
  y = drawField(doc, 'TR:', paciente.efTr, COL1_X, y, CONTENT_W)
  y = drawTwoFields(doc,
    `TESTIS: ${val(paciente.efTestis)}`,
    `PENE: ${val(paciente.efPene)}`,
    y,
  )

  y += 1
  y = drawTwoFields(doc,
    `L/ PSA: ${val(paciente.labPsa)}`,
    `EGO: ${val(paciente.labEgo)}`,
    y,
  )
  y = drawField(doc, 'PFR:', paciente.labPfr, COL1_X, y, COL_W)

  y += 1
  y = drawFullLine(doc, 'PLAN:', y)
  y = drawFullLine(doc, val(paciente.plan), y, 2)

  const hasExtras = pruebas.length > 0 || laboratorios.length > 0
  if (hasExtras) {
    y = renderExtraResults(doc, y + 2, pruebas, laboratorios)
    drawDoctorFooter(doc, y, false)
  } else {
    drawDoctorFooter(doc, y, y < PAGE_BOTTOM - 50)
  }

  const nombreArchivo = `expediente-${paciente.nombre.replace(/\s+/g, '-').toLowerCase()}.pdf`
  doc.save(nombreArchivo)
}

// ─── Solicitud de Análisis de Laboratorio ────────────────────────────────────

import { COLUMNAS_SOLICITUD } from '../constants/laboratorioSolicitud'

export interface SolicitudLaboratorioData {
  paciente: Pick<Paciente, 'nombre' | 'cedula' | 'telefono'>
  sexo: string
  diagnostico: string
  seleccionados: Set<string>
}

export function generarSolicitudLaboratorio(data: SolicitudLaboratorioData): void {
  const doc = new jsPDF()

  const PW  = 210
  const PH  = 297
  const ML  = 10   // margin left/right
  const MT  = 10   // margin top
  const CW  = PW - ML * 2

  // ── Fuentes y tamaños base ─────────────────────────────────────────────
  const FS_TITLE   = 15
  const FS_CLINIC  = 11
  const FS_LABEL   = 7.5   // categoría
  const FS_ITEM    = 7     // nombre del examen
  const LH_ITEM    = 4.6   // interlineado entre ítems

  // ── Header ──────────────────────────────────────────────────────────────
  let y = MT + 3

  doc.setFontSize(FS_CLINIC)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('NOVA UROCLÍNICA', PW - ML, y, { align: 'right' })

  y += 8
  doc.setFontSize(FS_TITLE)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(90, 90, 90)
  doc.text('Solicitud De Análisis De Laboratorio', PW / 2, y, { align: 'center' })

  // ── Patient info box ─────────────────────────────────────────────────────
  y += 8
  const ROW_H  = 7
  const COL1_W = 72

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)
  doc.setFontSize(8)

  const drawInfoRow = (
    label1: string, value1: string,
    label2: string, value2: string,
    rowY: number,
  ) => {
    doc.rect(ML, rowY, COL1_W, ROW_H)
    doc.rect(ML + COL1_W, rowY, CW - COL1_W, ROW_H)
    const ty = rowY + ROW_H * 0.68
    doc.setFont('helvetica', 'bold');  doc.text(label1, ML + 1.5, ty)
    doc.setFont('helvetica', 'normal'); doc.text(value1, ML + 1.5 + doc.getTextWidth(label1) + 1, ty)
    doc.setFont('helvetica', 'bold');  doc.text(label2, ML + COL1_W + 1.5, ty)
    doc.setFont('helvetica', 'normal'); doc.text(value2, ML + COL1_W + 1.5 + doc.getTextWidth(label2) + 1, ty)
  }

  drawInfoRow('Nombre del paciente:', data.paciente.nombre ?? '', 'Teléfono:', data.paciente.telefono ?? '', y)
  y += ROW_H
  drawInfoRow('Cédula:', data.paciente.cedula ?? '', 'Sexo:', data.sexo, y)
  y += ROW_H

  // Diagnóstico — full width, hasta 2 líneas
  const diagText = data.diagnostico?.trim() || ''
  doc.rect(ML, y, CW, ROW_H)
  const ty1 = y + ROW_H * 0.68
  doc.setFont('helvetica', 'bold');   doc.text('Diagnóstico:', ML + 1.5, ty1)
  doc.setFont('helvetica', 'normal')
  const diagW  = CW - doc.getTextWidth('Diagnóstico:') - 4
  const diagLines = doc.splitTextToSize(diagText, diagW) as string[]
  doc.text(diagLines[0] ?? '', ML + 1.5 + doc.getTextWidth('Diagnóstico:') + 1, ty1)
  y += ROW_H
  doc.rect(ML, y, CW, ROW_H)
  if (diagLines[1]) doc.text(diagLines[1], ML + 1.5, y + ROW_H * 0.68)
  y += ROW_H + 5

  // ── 3-column exam grid ────────────────────────────────────────────────────
  // Columnas con padding interno para que el texto no toque el borde
  const DIVIDER_X1 = ML + CW / 3
  const DIVIDER_X2 = ML + (CW / 3) * 2

  // Posición X del contenido de cada columna (con padding de 2mm)
  const PAD = 2.5
  const COL_CONTENT_W = CW / 3 - PAD * 2   // ancho disponible para texto
  const COL_XS = [ML + PAD, DIVIDER_X1 + PAD, DIVIDER_X2 + PAD]

  // Tamaño del checkbox: un cuadrado pequeño alineado con la línea de texto
  const CB = 2.8   // lado del cuadrado
  const CB_OFFSET_Y = -CB + 0.4  // desplazamiento vertical relativo al baseline del texto

  const GRID_TOP = y

  // Función que calcula la altura total de una columna (para el borde exterior)
  const colHeight = (colIdx: number): number => {
    let h = 0
    COLUMNAS_SOLICITUD[colIdx].categorias.forEach(cat => {
      if (cat.titulo) h += FS_LABEL * 0.6 + 3.5  // título + separador
      cat.examenes.forEach(ex => {
        const lines = doc.splitTextToSize(ex, COL_CONTENT_W - CB - 1.5) as string[]
        h += lines.length * LH_ITEM
      })
      h += 2 // espacio entre categorías
    })
    return h
  }

  const maxH   = Math.max(colHeight(0), colHeight(1), colHeight(2))
  const GRID_H = Math.min(maxH + 6, PH - y - 38)

  // Borde exterior del grid
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.35)
  doc.rect(ML, GRID_TOP, CW, GRID_H)

  // Divisores verticales
  doc.setLineWidth(0.25)
  doc.line(DIVIDER_X1, GRID_TOP, DIVIDER_X1, GRID_TOP + GRID_H)
  doc.line(DIVIDER_X2, GRID_TOP, DIVIDER_X2, GRID_TOP + GRID_H)

  // Renderizar cada columna
  COLUMNAS_SOLICITUD.forEach((col, colIdx) => {
    let cy = GRID_TOP + 3   // padding superior dentro del grid
    const cx = COL_XS[colIdx]
    const maxLabelW = COL_CONTENT_W - CB - 1.5

    col.categorias.forEach(cat => {
      // ── Título de categoría ──────────────────────────────────────────
      if (cat.titulo) {
        doc.setFontSize(FS_LABEL)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 0, 0)
        doc.text(cat.titulo, cx, cy)
        cy += 1.5
        // Línea separadora debajo del título
        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.2)
        doc.line(cx, cy, cx + COL_CONTENT_W, cy)
        cy += 2
      }

      // ── Ítems de la categoría ────────────────────────────────────────
      cat.examenes.forEach(examen => {
        const labelLines = doc.splitTextToSize(examen, maxLabelW) as string[]

        // El checkbox se alinea con la primera línea de texto.
        // baseline de la primera línea = cy
        // checkbox top = cy + CB_OFFSET_Y  (justo arriba del baseline)
        const cbTop = cy + CB_OFFSET_Y

        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.22)
        doc.rect(cx, cbTop, CB, CB)

        // Tilde si está seleccionado
        if (data.seleccionados.has(examen)) {
          doc.setFontSize(6)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(0, 0, 0)
          doc.text('x', cx + 0.5, cy - 0.2)
        }

        // Texto del examen
        doc.setFontSize(FS_ITEM)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(20, 20, 20)
        const textX = cx + CB + 1.2

        labelLines.forEach((line, li) => {
          doc.text(line, textX, cy + li * LH_ITEM)
        })

        cy += labelLines.length * LH_ITEM
      })

      cy += 2  // espacio entre categorías
    })
  })

  // ── Doctor footer ────────────────────────────────────────────────────────
  const footerY = GRID_TOP + GRID_H + 8

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(140, 140, 140)
  doc.text(DOCTOR_INFO.nombre, PW - ML, footerY, { align: 'right' })

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text('ESPECIALISTA UROLOGÍA', PW - ML, footerY + 5, { align: 'right' })
  doc.text(`CÓDIGO ${DOCTOR_INFO.codigo}`, PW - ML, footerY + 10, { align: 'right' })

  const sigY = footerY + 22
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(PW - ML - 55, sigY, PW - ML, sigY)
  doc.setFontSize(7)
  doc.setTextColor(180, 180, 180)
  doc.text('Firma y sello del médico', PW - ML, sigY + 4, { align: 'right' })

  doc.save(`solicitud-laboratorio-${(data.paciente.nombre ?? 'paciente').replace(/\s+/g, '-').toLowerCase()}.pdf`)
}
