/**
 * Logic Board Scanner & Parser Utility
 * Parses standard logic board (tarjeta lógica / motherboard) barcodes & QR formats:
 * - Apple Logic Board 2D DataMatrix/QR (e.g. C02..., DX4..., F2L... e.g. "820-02016-A / C02X54...")
 * - Samsung PBBA / Motherboard format (e.g. "GH82-26400A", "SM-S918B", "RFCT805PZAK")
 * - Xiaomi / Motorola / Huawei format (e.g. "M2102K1G", "XT2125", "LLD-L31")
 * - JSON format (e.g. {"model": "iPhone 15 Pro", "serial": "F2LNW0160PW8", "category": "smartphone"})
 * - Key-Value pair format (e.g. "MODEL: iPhone 14 Pro Max; SN: DX4G7892LN; REV: 1.2")
 * - URL params format (e.g. https://service.parts/scan?m=MacBook+Air+M2&sn=C02GK08BQ6L4)
 * - Raw serials or IMEI 15-digits or Apple MLB 17/18-char strings
 */

import { DeviceCategory } from '../types';

export interface LogicBoardScanResult {
  raw: string;
  model: string;
  serial: string;
  modelCode?: string;
  category?: DeviceCategory;
  boardRevision?: string;
  confidence: 'high' | 'medium' | 'low';
  sourceFormat: string;
}

export const SAMPLE_LOGIC_BOARDS: {
  label: string;
  code: string;
  type: string;
  desc: string;
}[] = [
  {
    label: 'Apple MacBook Pro M3 (820-03080)',
    code: 'MODEL:MacBook Pro 14 M3 (A2918)\nMLB_CODE:820-03080-A\nSERIAL:C02L50G9Q05D\nREV:2.0\nCAT:laptop',
    type: 'Apple Logic Board',
    desc: 'Tarjeta Lógica MacBook Pro Retina Liquid XDR',
  },
  {
    label: 'Apple iPhone 15 Pro Max (Logic Board A3106)',
    code: '{"model":"iPhone 15 Pro Max","modelCode":"A3106","serial":"G6TXT0P90PW7","category":"smartphone","board":"820-03488-02"}',
    type: 'JSON Tagged',
    desc: 'Dual-deck Logic Board A17 Pro Bionic',
  },
  {
    label: 'Samsung Galaxy S24 Ultra (PBBA SM-S928B)',
    code: 'PBBA:SM-S928B/DS;MODEL:Galaxy S24 Ultra;SN:RFCT805PZAK401;REV:Rev0.8;CAT:smartphone',
    type: 'Samsung PBBA Barcode',
    desc: 'Placa Principal Snapdragon 8 Gen 3 for Galaxy',
  },
  {
    label: 'Sony PlayStation 5 Motherboard (EDM-020)',
    code: 'MODEL:PlayStation 5 Disc Edition;CODE:EDM-020;SN:AK783921094-11;CAT:console',
    type: 'Console Logic Board',
    desc: 'Mainboard SoC Oberon / Liquid Metal Interface',
  },
  {
    label: 'Lenovo ThinkPad X1 Carbon Gen 10 (NM-E381)',
    code: 'FRU:5B21B35641;MODEL:ThinkPad X1 Carbon Gen 10;SN:PF3K49XA2021;CAT:laptop;REV:NM-E381',
    type: 'Lenovo FRU Barcode',
    desc: 'Tarjeta Madre Intel Core i7-1260P Soldered',
  },
  {
    label: 'iPad Pro 12.9" M2 (820-02553)',
    code: 'MODEL:iPad Pro 12.9 6th Gen;CODE:A2436;SERIAL:DLXKD9450P8R;CAT:tablet',
    type: 'Apple iPad Mainboard',
    desc: 'Tarjeta Lógica Apple Silicon M2',
  },
];

export function parseLogicBoardBarcode(rawValue: string): LogicBoardScanResult {
  const trimmed = rawValue.trim();

  // 1. Try parsing as JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      const model = parsed.model || parsed.modelo || parsed.deviceModel || parsed.name || '';
      const serial = parsed.serial || parsed.serialNumber || parsed.sn || parsed.imei || parsed.imeiSerial || parsed.mlb || '';
      const modelCode = parsed.modelCode || parsed.board || parsed.code || parsed.fru || '';
      const category = (parsed.category || parsed.cat) as DeviceCategory | undefined;

      if (model || serial) {
        return {
          raw: trimmed,
          model: model || 'Dispositivo Desconocido',
          serial: serial || trimmed,
          modelCode: modelCode || (model ? model.slice(0, 8) : undefined),
          category: normalizeCategory(category, model),
          confidence: 'high',
          sourceFormat: 'QR JSON Estructurado',
        };
      }
    } catch {
      // not json, continue
    }
  }

  // 2. Try parsing URL queries (e.g. https://.../?m=iPhone+15&sn=C02...)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const m = url.searchParams.get('model') || url.searchParams.get('m') || url.searchParams.get('modelo');
      const sn = url.searchParams.get('serial') || url.searchParams.get('sn') || url.searchParams.get('s') || url.searchParams.get('imei');
      const code = url.searchParams.get('code') || url.searchParams.get('c');
      if (m || sn) {
        return {
          raw: trimmed,
          model: m || 'Dispositivo Escaneado',
          serial: sn || 'SN-UNKNOWN',
          modelCode: code || undefined,
          category: normalizeCategory(undefined, m || ''),
          confidence: 'high',
          sourceFormat: 'URL con Parámetros',
        };
      }
    } catch {
      // ignore
    }
  }

  // 3. Try parsing Key: Value or Key=Value pairs (delimiters: newline, semicolon, pipe)
  const lines = trimmed.split(/[\n;\r|]+/).map((s) => s.trim()).filter(Boolean);
  const kv: Record<string, string> = {};

  for (const line of lines) {
    const separatorIdx = line.indexOf(':') !== -1 ? line.indexOf(':') : line.indexOf('=');
    if (separatorIdx !== -1) {
      const key = line.slice(0, separatorIdx).trim().toUpperCase();
      const val = line.slice(separatorIdx + 1).trim();
      kv[key] = val;
    }
  }

  const modelFromKV = kv['MODEL'] || kv['MODELO'] || kv['DEVICE'] || kv['NAME'] || kv['PBBA'];
  const serialFromKV = kv['SERIAL'] || kv['SN'] || kv['S/N'] || kv['IMEI'] || kv['SERIE'] || kv['MLB'] || kv['FRU'];
  const modelCodeFromKV = kv['CODE'] || kv['BOARD'] || kv['MODELCODE'] || kv['MLB_CODE'] || kv['REV'] || kv['PCB'];
  const catFromKV = kv['CAT'] || kv['CATEGORY'] || kv['CATEGORIA'];

  if (modelFromKV || serialFromKV) {
    const extractedModel = modelFromKV || detectModelFromCode(modelCodeFromKV || trimmed);
    const extractedSerial = serialFromKV || trimmed;
    return {
      raw: trimmed,
      model: extractedModel,
      serial: extractedSerial,
      modelCode: modelCodeFromKV || (extractedModel.includes('A') ? extractedModel.split(' ')[0] : undefined),
      category: normalizeCategory(catFromKV as DeviceCategory, extractedModel),
      boardRevision: kv['REV'] || kv['REVISION'],
      confidence: 'high',
      sourceFormat: 'Clave-Valor de Tarjeta Lógica',
    };
  }

  // 4. Heuristic patterns for Logic Board part numbers:
  // Apple Logic Board format: 820-XXXXX-XX (e.g. 820-02016-A)
  const appleBoardMatch = trimmed.match(/820-\d{4,5}-[A-Z0-9]{1,2}/i);
  if (appleBoardMatch) {
    const boardCode = appleBoardMatch[0].toUpperCase();
    const mapped = mapAppleBoardCode(boardCode);
    return {
      raw: trimmed,
      model: mapped.model,
      serial: trimmed.replace(boardCode, '').replace(/[^A-Z0-9]/gi, '') || 'SN-MLB-' + boardCode,
      modelCode: boardCode,
      category: mapped.category,
      confidence: 'high',
      sourceFormat: 'Apple Logic Board P/N (820-Series)',
    };
  }

  // Samsung PBBA format: GH82-XXXXXA or SM-XXXX
  const samsungPBBAMatch = trimmed.match(/GH82-\d{5}[A-Z]/i) || trimmed.match(/SM-[A-Z]\d{3}[A-Z0-9]?/i);
  if (samsungPBBAMatch) {
    const part = samsungPBBAMatch[0].toUpperCase();
    const mappedModel = mapSamsungModel(part);
    return {
      raw: trimmed,
      model: mappedModel,
      serial: trimmed,
      modelCode: part,
      category: 'smartphone',
      confidence: 'high',
      sourceFormat: 'Samsung Mainboard PBBA',
    };
  }

  // 15-digit IMEI check
  const imeiMatch = trimmed.match(/\b\d{15}\b/);
  if (imeiMatch) {
    return {
      raw: trimmed,
      model: 'Dispositivo Detectado vía IMEI',
      serial: imeiMatch[0],
      category: 'smartphone',
      confidence: 'medium',
      sourceFormat: 'IMEI Estándar (15 Dígitos)',
    };
  }

  // Serial Number format (10-18 alphanumeric chars e.g. C02..., DX4..., F2L...)
  if (/^[A-Z0-9]{10,24}$/i.test(trimmed)) {
    const upper = trimmed.toUpperCase();
    let detectedModel = 'Dispositivo con Serie ' + upper.slice(0, 6);
    let cat: DeviceCategory = 'smartphone';

    if (upper.startsWith('C02') || upper.startsWith('FVF') || upper.startsWith('C1M')) {
      detectedModel = 'Apple MacBook Pro / Air';
      cat = 'laptop';
    } else if (upper.startsWith('DX4') || upper.startsWith('F2L') || upper.startsWith('G6T') || upper.startsWith('DN6')) {
      detectedModel = 'Apple iPhone';
      cat = 'smartphone';
    } else if (upper.startsWith('DMP') || upper.startsWith('DLX') || upper.startsWith('GG7')) {
      detectedModel = 'Apple iPad';
      cat = 'tablet';
    }

    return {
      raw: trimmed,
      model: detectedModel,
      serial: upper,
      modelCode: upper.slice(0, 5),
      category: cat,
      confidence: 'medium',
      sourceFormat: 'Número de Serie / MLB Alfanumérico',
    };
  }

  // Fallback generic
  return {
    raw: trimmed,
    model: trimmed.length > 20 ? trimmed.slice(0, 20) : trimmed,
    serial: trimmed,
    confidence: 'low',
    sourceFormat: 'Texto sin formato',
  };
}

function normalizeCategory(cat?: string, modelHint?: string): DeviceCategory {
  if (cat && ['smartphone', 'laptop', 'console', 'tablet', 'wearable', 'audio'].includes(cat.toLowerCase())) {
    return cat.toLowerCase() as DeviceCategory;
  }
  const hint = (modelHint || '').toLowerCase();
  if (hint.includes('macbook') || hint.includes('laptop') || hint.includes('thinkpad') || hint.includes('dell') || hint.includes('asus')) {
    return 'laptop';
  }
  if (hint.includes('playstation') || hint.includes('ps5') || hint.includes('ps4') || hint.includes('xbox') || hint.includes('switch') || hint.includes('nintendo')) {
    return 'console';
  }
  if (hint.includes('ipad') || hint.includes('tablet') || hint.includes('tab')) {
    return 'tablet';
  }
  if (hint.includes('watch') || hint.includes('reloj') || hint.includes('band')) {
    return 'wearable';
  }
  if (hint.includes('airpods') || hint.includes('audio') || hint.includes('bose') || hint.includes('sony wh')) {
    return 'audio';
  }
  return 'smartphone';
}

function mapAppleBoardCode(boardCode: string): { model: string; category: DeviceCategory } {
  switch (boardCode) {
    case '820-02016-A':
    case '820-02016':
      return { model: 'MacBook Air 13" M2 (A2681)', category: 'laptop' };
    case '820-03080-A':
    case '820-03080':
      return { model: 'MacBook Pro 14" M3 (A2918)', category: 'laptop' };
    case '820-02098-A':
    case '820-02098':
      return { model: 'MacBook Pro 14" M1 Pro (A2442)', category: 'laptop' };
    case '820-02553-A':
    case '820-02553':
      return { model: 'iPad Pro 12.9" 6th Gen M2 (A2436)', category: 'tablet' };
    case '820-03488-02':
    case '820-03488':
      return { model: 'iPhone 15 Pro Max (A3106)', category: 'smartphone' };
    case '820-02868':
    case '820-02868-A':
      return { model: 'iPhone 14 Pro (A2890)', category: 'smartphone' };
    default:
      return { model: `Apple Logic Board (${boardCode})`, category: 'laptop' };
  }
}

function mapSamsungModel(code: string): string {
  if (code.includes('SM-S928')) return 'Samsung Galaxy S24 Ultra';
  if (code.includes('SM-S918')) return 'Samsung Galaxy S23 Ultra';
  if (code.includes('SM-S921')) return 'Samsung Galaxy S24';
  if (code.includes('SM-A546')) return 'Samsung Galaxy A54 5G';
  if (code.includes('SM-F946')) return 'Samsung Galaxy Z Fold 5';
  if (code.includes('GH82-')) return `Samsung Logic Board (${code})`;
  return `Samsung Device (${code})`;
}

function detectModelFromCode(code?: string): string {
  if (!code) return 'Dispositivo Lógico';
  if (code.startsWith('820-')) return mapAppleBoardCode(code).model;
  if (code.startsWith('SM-') || code.startsWith('GH82-')) return mapSamsungModel(code);
  if (code.includes('EDM-') || code.includes('SAA-')) return 'PlayStation 5 Console';
  return `Equipo Placa ${code}`;
}
