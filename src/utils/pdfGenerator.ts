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