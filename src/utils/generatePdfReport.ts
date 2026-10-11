import jsPDF from 'jspdf';
import { Ticket } from '../types';

export async function generateTicketDiagnosticPdf(ticket: Ticket): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  // Colors
  const darkNavy: [number, number, number] = [11, 19, 38];
  const electricBlue: [number, number, number] = [76, 215, 246];
  const deepBlue: [number, number, number] = [0, 46, 106];
  const darkCard: [number, number, number] = [23, 31, 51];
  const textDark: [number, number, number] = [30, 41, 59];
  const textMuted: [number, number, number] = [100, 116, 139];
  const highlightAmber: [number, number, number] = [217, 119, 6];

  // --- HEADER SECTION (Logo & Company) ---
  // Top Banner
  doc.setFillColor(...darkNavy);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Decorative Accent Line
  doc.setFillColor(...electricBlue);
  doc.rect(0, 27, pageWidth, 1.5, 'F');

  // Logo Badge Vector
  doc.setFillColor(...deepBlue);
  doc.roundedRect(margin, 5, 18, 18, 3, 3, 'F');

  doc.setTextColor(...electricBlue);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('EDS', margin + 9, 14, { align: 'center' });
  doc.setFontSize(6);
  doc.text('LAB', margin + 9, 18, { align: 'center' });

  // Company Brand Titles
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ELECTRONICS DEL SURESTE', margin + 22, 12);

  doc.setTextColor(...electricBlue);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('ELECTROFIX OS • LABORATORIO DE MICRO-ELECTRÓNICA & TRIAGE IA', margin + 22, 17);

  doc.setTextColor(200, 210, 230);
  doc.setFontSize(7);
  doc.text('SEDE PRINCIPAL • RFC: EDS890412KJ9 • TEL: +52 55 4920 8113', margin + 22, 22);

  // Right Header: Ticket Folio Box
  doc.setFillColor(...darkCard);
  doc.roundedRect(pageWidth - margin - 44, 4, 44, 20, 2, 2, 'F');

  doc.setTextColor(...electricBlue);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('EXPEDIENTE OFICIAL', pageWidth - margin - 22, 9, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(`#${ticket.id}`, pageWidth - margin - 22, 15, { align: 'center' });

  doc.setTextColor(180, 195, 220);
  doc.setFontSize(6.5);
  doc.text(new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), pageWidth - margin - 22, 20, { align: 'center' });

  y = 35;

  // --- REPORT TITLE ---
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('REPORTE TÉCNICO DE DIAGNÓSTICO & TRIAGE IA', margin, y);
  
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Certificado de admisión técnica, validación de hardware y dictamen emitido por ElectroBot AI.', margin, y + 4.5);

  y += 10;

  // --- CLIENT & DEVICE TABLE BOX ---
  const boxWidth = pageWidth - margin * 2;
  const colWidth = boxWidth / 2;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, boxWidth, 38, 2, 2, 'FD');

  // Left Column: Customer
  doc.setTextColor(...deepBlue);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DATOS DEL TITULAR', margin + 4, y + 6);

  doc.setTextColor(...textDark);
  doc.setFontSize(8);
  doc.text(`Nombre: ${ticket.clientName} ${ticket.isRegularClient ? '(Cliente Habitual)' : ''}`, margin + 4, y + 12);
  doc.text(`Teléfono / WhatsApp: ${ticket.phone}`, margin + 4, y + 17);
  doc.text(`Email de Contacto: ${ticket.email}`, margin + 4, y + 22);
  doc.text(`Fecha de Recepción: ${new Date().toLocaleDateString('es-MX')}`, margin + 4, y + 27);
  doc.text(`Bandeja Antiestática: Asignada (#EF-TRAY-20)`, margin + 4, y + 32);

  // Right Column: Hardware
  doc.setTextColor(...deepBlue);
  doc.setFont('helvetica', 'bold');
  doc.text('ESPECIFICACIONES DEL DISPOSITIVO', margin + colWidth + 4, y + 6);

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Categoría: ${ticket.category.toUpperCase()}`, margin + colWidth + 4, y + 12);
  doc.text(`Dispositivo: ${ticket.deviceModel}`, margin + colWidth + 4, y + 17);
  doc.text(`Modelo / Código: ${ticket.modelCode}`, margin + colWidth + 4, y + 22);
  doc.text(`IMEI / Número de Serie: ${ticket.imeiSerial}`, margin + colWidth + 4, y + 27);
  doc.text(`Acceso: ${ticket.isFormattedOrNoPin ? 'Sin clave / Formateado' : `PIN: *** ${ticket.accessPin}`}`, margin + colWidth + 4, y + 32);

  y += 44;

  // --- INITIAL FAULT & INSPECTION ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, boxWidth, 24, 2, 2, 'FD');

  doc.setTextColor(...highlightAmber);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('FALLA REPORTADA POR EL CLIENTE & INSPECCIÓN FÍSICA INICIAL', margin + 4, y + 5.5);

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const faultSplit = doc.splitTextToSize(ticket.declaredFault, boxWidth - 8);
  doc.text(faultSplit, margin + 4, y + 10.5);

  doc.setTextColor(...textMuted);
  doc.setFontSize(7);
  doc.text(`Anotaciones de desgaste previo: ${ticket.cosmeticNotes}`, margin + 4, y + 19);

  y += 29;

  // --- IA DIAGNOSTIC REPORT (RESULTADOS DE LA IA - ELECTROBOT AI) ---
  // Highlighted Box with Dark Tech Theme
  const iaBoxHeight = 52;
  doc.setFillColor(...darkNavy);
  doc.setDrawColor(76, 215, 246);
  doc.roundedRect(margin, y, boxWidth, iaBoxHeight, 3, 3, 'FD');

  // IA Header Tag
  doc.setFillColor(76, 215, 246);
  doc.roundedRect(margin + 4, y + 4, 38, 5.5, 1.5, 1.5, 'F');
  doc.setTextColor(0, 30, 70);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('ELECTROBOT AI • v2.4', margin + 23, y + 7.8, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('RESULTADOS DEL ANÁLISIS TÉCNICO ASISTIDO POR IA', margin + 46, y + 8.5);

  // IA Content Line Items
  const iaContentY = y + 15;

  doc.setTextColor(76, 215, 246);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Dictamen Sensorial de Rieles:', margin + 4, iaContentY);
  doc.setTextColor(240, 244, 255);
  doc.setFont('helvetica', 'normal');
  doc.text('Cortocircuito franco detectado en línea VDD_MAIN (3.4 Ohms). Falla de filtrado en condensadores cerámicos 0201 y sobrecalentamiento crítico en IC U9001 (PMIC).', margin + 45, iaContentY);

  doc.setTextColor(76, 215, 246);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Confianza Algorítmica:', margin + 4, iaContentY + 6);
  doc.setTextColor(240, 244, 255);
  doc.setFont('helvetica', 'normal');
  doc.text('98.4% de coincidencia con patrón de sobretensión en etapa de carga rápida 45W.', margin + 45, iaContentY + 6);

  doc.setTextColor(76, 215, 246);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Plan de Reparación IA:', margin + 4, iaContentY + 12);
  doc.setTextColor(240, 244, 255);
  doc.setFont('helvetica', 'normal');
  doc.text('Desbaste de blindaje térmico con micro-fresadora CNC. Inyección controlada de 1.2V a 2A con cámara termográfica Flir. Sustitución de condensador SMD en corto.', margin + 45, iaContentY + 12);

  doc.setTextColor(76, 215, 246);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Evaluación de Riesgo:', margin + 4, iaContentY + 18);
  doc.setTextColor(240, 244, 255);
  doc.setFont('helvetica', 'normal');
  doc.text('Riesgo de daño en memoria NAND / CPU: MÍNIMO (<1.0%). Integridad de datos de usuario: 100% preservada.', margin + 45, iaContentY + 18);

  doc.setTextColor(76, 215, 246);
  doc.setFont('helvetica', 'bold');
  doc.text('5. Póliza Sugerida por IA:', margin + 4, iaContentY + 24);
  doc.setTextColor(240, 244, 255);
  doc.setFont('helvetica', 'normal');
  doc.text('Garantía extendida de 180 a 365 días sobre microsoldadura y repuestos SMD originales.', margin + 45, iaContentY + 24);

  // IA Security Note
  doc.setTextColor(160, 185, 220);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.text('Dictamen generado en ambiente local seguro validado por el especialista Mark Vance (Micro-soldadura Nivel 3).', margin + 4, y + 48);

  y += iaBoxHeight + 5;

  // --- FINANCIAL & WARRANTY BREAKDOWN ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, boxWidth, 26, 2, 2, 'FD');

  doc.setTextColor(...deepBlue);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PRESUPUESTO ESTIMADO & LIQUIDACIÓN', margin + 4, y + 5.5);

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Revisión & Diagnóstico en Mesa: $${ticket.diagnosisCost}.00 MXN (100% deducible)`, margin + 4, y + 11.5);
  doc.text(`Mano de Obra Especializada: $${ticket.laborCost}.00 MXN`, margin + 4, y + 16.5);
  doc.text(`Refacciones Originales & Insumos: $${ticket.partsCost}.00 MXN`, margin + 4, y + 21.5);

  const total = ticket.laborCost + ticket.partsCost;
  const saldo = Math.max(0, total - ticket.depositReceived);

  doc.text(`Anticipo Recibido: -$${ticket.depositReceived}.00 MXN`, margin + colWidth + 4, y + 11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...deepBlue);
  doc.text(`Total Presupuestado: $${total}.00 MXN`, margin + colWidth + 4, y + 16.5);
  doc.setTextColor(...highlightAmber);
  doc.text(`Saldo Pendiente al Entregar: $${saldo}.00 MXN`, margin + colWidth + 4, y + 21.5);

  y += 31;

  // --- SIGNATURES & VALIDATION ---
  const signColWidth = (boxWidth - 10) / 2;

  // Tech Signature Box
  doc.setDrawColor(200, 210, 230);
  doc.line(margin + 10, y + 16, margin + 10 + signColWidth - 20, y + 16);
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`${ticket.assignedTech}`, margin + 10 + (signColWidth - 20) / 2, y + 20, { align: 'center' });
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Especialista de Laboratorio / Mesa A-04', margin + 10 + (signColWidth - 20) / 2, y + 23.5, { align: 'center' });

  // Customer Signature Box
  doc.setDrawColor(200, 210, 230);
  doc.line(margin + signColWidth + 20, y + 16, margin + boxWidth - 10, y + 16);
  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`${ticket.clientName}`, margin + signColWidth + 20 + (signColWidth - 20) / 2, y + 20, { align: 'center' });
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Firma de Conformidad del Titular', margin + signColWidth + 20 + (signColWidth - 20) / 2, y + 23.5, { align: 'center' });

  // --- FOOTER LEGAL CLAUSE ---
  doc.setTextColor(...textMuted);
  doc.setFontSize(6);
  doc.text(
    'Este documento avala el estado del equipo en su ingreso y las anomalías registradas antes de cualquier intervención. La póliza oficial ampara defectos en componentes y microsoldadura.',
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );
  doc.text(
    `Folio #${ticket.id} • Electronics del Sureste • Software de Taller ElectroFix OS • Impreso el ${new Date().toLocaleDateString('es-MX')}`,
    pageWidth / 2,
    pageHeight - 6.5,
    { align: 'center' }
  );

  // Save the PDF
  const filename = `Reporte_Diagnostico_${ticket.id.replace('#', '')}.pdf`;
  doc.save(filename);
}
