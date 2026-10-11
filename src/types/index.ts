export type ScreenTab = 'dashboard' | 'ordenes' | 'ingreso' | 'diagnostico' | 'facturacion' | 'entregas';

export type DeviceCategory = 'smartphone' | 'laptop' | 'console' | 'tablet' | 'wearable' | 'audio';

export interface InspectionPhoto {
  id: string;
  label: string;
  status: string;
  isWarning?: boolean;
  url: string;
}

export interface Ticket {
  id: string;
  clientName: string;
  isRegularClient: boolean;
  phone: string;
  email: string;
  category: DeviceCategory;
  deviceModel: string;
  modelCode: string;
  imeiSerial: string;
  accessPin: string;
  isFormattedOrNoPin: boolean;
  accessories: {
    funda: boolean;
    cargador: boolean;
    cable: boolean;
    bandejaSim: boolean;
  };
  declaredFault: string;
  tags: string[];
  photos: InspectionPhoto[];
  cosmeticNotes: string;
  requiresThermalLabel: boolean;
  stage: 'ingreso' | 'triage' | 'reparacion' | 'qc' | 'entregado';
  assignedTech: string;
  assignedBench: string;
  estimatedHours: string;
  warrantyPeriod: string;
  diagnosisCost: number;
  laborCost: number;
  partsCost: number;
  depositReceived: number;
  // Resolution knowledge base fields
  solutionApplied?: string;
  rootCauseFound?: string;
  partsReplaced?: string[];
  resolvedAt?: string;
}

export interface HistoricalMatch {
  ticketId: string;
  deviceModel: string;
  declaredFault: string;
  solutionApplied: string;
  similarityScore: number;
}

export interface FaultResolutionResult {
  diagnosis: string;
  likelyRootCause: string;
  confidence: number;
  similarHistoricalCount: number;
  historicalMatches: HistoricalMatch[];
  recommendedSteps: string[];
  suggestedParts: string[];
  estimatedTimeMinutes?: number;
  riskLevel: 'Bajo' | 'Medio' | 'Alto';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  timestamp: string;
  text?: string;
  showTicketSubCard?: boolean;
  showEvidencePreview?: boolean;
  ticketRef?: string;
}

export interface Technician {
  id: string;
  name: string;
  level: string;
  role: string;
  specialty: string;
  activeOrders: number;
  qcRate: number;
  weeklyCommission: number;
  bench: string;
  isWorkloadActive: boolean;
  avatarUrl: string;
  canApproveQc: boolean;
  canTakeParts: boolean;
  // Individual Performance Metrics
  successRate?: number; // Tasa de éxito (%)
  resolvedPerWeek?: number; // Tickets resueltos por semana
  weeklyTarget?: number; // Meta semanal de tickets
  avgRepairTimeHours?: number; // Tiempo promedio de reparación (horas)
  reworkRate?: number; // Tasa de reingresos o retrabajo (%)
}

export interface PriceCategoryItem {
  id: string;
  title: string;
  description: string;
  group: 'tv' | 'audio_optica' | 'computo_movil' | 'otros';
  badge?: string;
  reviewCost: number;
  laborCost: number;
  isDeductible: boolean;
  requiresTwoTechs?: boolean;
  footerNote: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  type: 'review' | 'labor' | 'parts';
}

export interface InvoiceRecord {
  id: string;
  folio: string;
  type: 'nota' | 'cfdi';
  clientName: string;
  rfc?: string;
  date: string;
  amount: number;
  deviceSummary: string;
  status: 'Timbrado SAT' | 'Liquidado Efectivo' | 'Liquidado POS' | 'Liquidado SPEI';
  items: InvoiceItem[];
}
