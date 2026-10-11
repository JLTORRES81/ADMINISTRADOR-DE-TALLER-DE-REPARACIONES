import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  parseLogicBoardBarcode,
  LogicBoardScanResult,
  SAMPLE_LOGIC_BOARDS,
} from '../../utils/logicBoardParser';

interface LogicBoardScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScan: (result: LogicBoardScanResult) => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const LogicBoardScannerModal: React.FC<LogicBoardScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyScan,
  onShowToast,
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scannedResult, setScannedResult] = useState<LogicBoardScanResult | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [activeTab, setActiveTab] = useState<'camera' | 'sample' | 'manual'>('camera');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchEnabled(false);
  }, []);

  // Frame processing loop for QR / barcode detection using jsQR + canvas
  const processVideoFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Scan with jsQR
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data && code.data.trim().length > 0) {
          // Play subtle feedback beep using Web Audio API
          playBeep();
          const parsed = parseLogicBoardBarcode(code.data);
          setScannedResult(parsed);
          stopCamera();
          onShowToast(`¡Tarjeta lógica detectada! Modelo: ${parsed.model}`, 'qr_code_scanner');
          return;
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(processVideoFrame);
  }, [stopCamera, onShowToast]);

  // Audio feedback on scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext may be restricted by browser policy before interaction
    }
  };

  // Start video stream from selected device
  const startCamera = useCallback(async (deviceId?: string) => {
    setCameraError(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: deviceId ? undefined : { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        animationFrameRef.current = requestAnimationFrame(processVideoFrame);
      }

      // Enumerate camera devices for selection
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoInputs);
      if (!deviceId && videoInputs.length > 0) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al acceder a la cámara';
      setCameraError(
        msg.includes('Permission') || msg.includes('NotAllowed')
          ? 'Permiso de cámara denegado. Permite el acceso a la cámara o prueba cargando una foto o código de muestra.'
          : `No se pudo iniciar la cámara: ${msg}`
      );
      setCameraActive(false);
    }
  }, [stopCamera, processVideoFrame]);

  // Toggle flash torch if supported
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const capabilities = track.getCapabilities() as { torch?: boolean };
      if (capabilities && capabilities.torch) {
        const nextState = !torchEnabled;
        await track.applyConstraints({
          advanced: [{ torch: nextState } as unknown as MediaTrackConstraintSet],
        });
        setTorchEnabled(nextState);
        onShowToast(nextState ? 'Linterna encendida' : 'Linterna apagada', 'flashlight_on');
      } else {
        onShowToast('La linterna no está disponible en este lente', 'info');
      }
    } catch {
      onShowToast('Dispositivo no admite control de linterna', 'info');
    }
  };

  // Process static uploaded image via canvas
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          setIsProcessingFile(false);
          if (code && code.data) {
            playBeep();
            const parsed = parseLogicBoardBarcode(code.data);
            setScannedResult(parsed);
            onShowToast(`Código QR/Barra procesado de la imagen`, 'check_circle');
          } else {
            onShowToast('No se detectó un código QR nítido en la imagen. Intenta con otra foto.', 'warning');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Manage camera lifecycle with modal open state
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 shadow-2xl max-w-xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-high/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-on-surface">
                Escáner de Tarjetas Lógicas (PCB)
              </h3>
              <p className="text-xs text-on-surface-variant font-mono">
                Cámara en vivo • Extracción de Modelo y Número de Serie
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 p-1.5 mx-4 mt-3 bg-surface-container-low rounded-xl text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab('camera')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'camera'
                ? 'bg-secondary text-on-secondary-fixed shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">videocam</span>
            <span>Cámara En Vivo</span>
          </button>
          <button
            onClick={() => setActiveTab('sample')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'sample'
                ? 'bg-secondary text-on-secondary-fixed shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">memory</span>
            <span>Tarjetas Taller</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'manual'
                ? 'bg-secondary text-on-secondary-fixed shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">keyboard</span>
            <span>Manual / Foto</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: LIVE CAMERA VIEW */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="relative w-full aspect-video sm:aspect-[4/3] bg-black rounded-xl overflow-hidden border border-outline-variant/30 flex items-center justify-center shadow-inner">
                {/* Real video stream */}
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Laser scan animation overlay */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    {/* Corner viewfinder reticles */}
                    <div className="relative w-64 h-64 border-2 border-secondary/50 rounded-2xl">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-secondary rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-secondary rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-secondary rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-secondary rounded-br-lg"></div>
                      {/* Scanning laser beam animation */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#4cd7f6] animate-pulse"></div>
                    </div>
                    <div className="mt-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-cyan-300 font-mono text-[11px] tracking-wider border border-cyan-500/30">
                      ENFOCANDO CÓDIGO QR / MATRIX DE PLACA
                    </div>
                  </div>
                )}

                {/* Camera fallback / error message */}
                {cameraError && (
                  <div className="p-4 text-center space-y-2 max-w-sm">
                    <span className="material-symbols-outlined text-amber-400 text-3xl">no_photography</span>
                    <p className="text-xs text-on-surface-variant font-mono">{cameraError}</p>
                    <button
                      onClick={() => startCamera(selectedDeviceId)}
                      className="px-3 py-1.5 bg-secondary text-on-secondary-fixed text-xs rounded-lg font-bold"
                    >
                      Reintentar Permiso
                    </button>
                  </div>
                )}

                {!cameraActive && !cameraError && (
                  <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl animate-spin text-secondary">
                      progress_activity
                    </span>
                    <span className="text-xs font-mono">Iniciando sensor óptico...</span>
                  </div>
                )}
              </div>

              {/* Camera Controls Bar */}
              <div className="flex items-center justify-between gap-2 bg-surface-container-low p-2 rounded-xl text-xs font-mono">
                {/* Device Selector */}
                {devices.length > 1 && (
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => {
                      setSelectedDeviceId(e.target.value);
                      startCamera(e.target.value);
                    }}
                    className="bg-surface-container px-2.5 py-1.5 rounded-lg border border-outline-variant/30 text-on-surface text-xs outline-none"
                  >
                    {devices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Lente #${i + 1}`}
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={toggleTorch}
                    type="button"
                    className={`h-9 px-3 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
                      torchEnabled
                        ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {torchEnabled ? 'flashlight_on' : 'flashlight_off'}
                    </span>
                    <span>Luz LED</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 flex items-center gap-1.5 font-bold"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    <span>Cargar Foto</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SAMPLE LOGIC BOARDS PRESETS */}
          {activeTab === 'sample' && (
            <div className="space-y-2">
              <p className="text-xs text-on-surface-variant font-mono">
                Selecciona una tarjeta lógica de banco de prueba para simular la lectura de alta precisión:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_LOGIC_BOARDS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      playBeep();
                      const parsed = parseLogicBoardBarcode(sample.code);
                      setScannedResult(parsed);
                      onShowToast(`Placa cargada: ${parsed.model}`, 'memory');
                    }}
                    className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/20 text-left transition-all group flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-headline text-xs font-bold text-on-surface group-hover:text-secondary">
                        {sample.label}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-container-highest text-secondary shrink-0">
                        {sample.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant font-mono mt-1">{sample.desc}</p>
                    <div className="mt-2 pt-2 border-t border-outline-variant/15 flex items-center justify-between text-[10px] font-mono text-secondary">
                      <span>Probar lectura QR ➔</span>
                      <span className="material-symbols-outlined text-[14px]">qr_code_2</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL RAW STRING OR UPLOAD */}
          {activeTab === 'manual' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-mono text-on-surface-variant block uppercase">
                  Código en Bruto de Tarjeta / Escáner USB
                </label>
                <textarea
                  rows={4}
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Pega aquí el texto QR, JSON, o escanea con pistola lectora USB..."
                  className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/30 font-mono text-xs text-on-surface outline-none focus:border-secondary"
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 px-3 rounded-xl bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-mono font-bold flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">photo_library</span>
                  <span>Examinar archivo...</span>
                </button>
                <button
                  type="button"
                  disabled={!manualInput.trim()}
                  onClick={() => {
                    playBeep();
                    const parsed = parseLogicBoardBarcode(manualInput);
                    setScannedResult(parsed);
                    onShowToast('Código decodificado', 'check');
                  }}
                  className="h-10 px-4 rounded-xl bg-secondary text-on-secondary-fixed text-xs font-mono font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
                  <span>Analizar Código</span>
                </button>
              </div>
            </div>
          )}

          {/* PARSED SCAN RESULT CARD */}
          {scannedResult && (
            <div className="p-4 rounded-xl bg-secondary/10 border-2 border-secondary/40 space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[22px]">verified</span>
                  <span className="font-headline text-sm font-bold text-on-surface">
                    Extracción Exitosa de Tarjeta Lógica
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-bold">
                  {scannedResult.sourceFormat}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-surface-container">
                  <span className="text-[10px] text-on-surface-variant block uppercase font-bold">
                    MODELO DETECTADO
                  </span>
                  <span className="font-bold text-secondary text-sm block truncate">
                    {scannedResult.model}
                  </span>
                  {scannedResult.modelCode && (
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      Código PCB: {scannedResult.modelCode}
                    </span>
                  )}
                </div>

                <div className="p-2.5 rounded-lg bg-surface-container">
                  <span className="text-[10px] text-on-surface-variant block uppercase font-bold">
                    NÚMERO DE SERIE / IMEI
                  </span>
                  <span className="font-bold text-on-surface text-sm block truncate font-mono">
                    {scannedResult.serial}
                  </span>
                  {scannedResult.category && (
                    <span className="text-[10px] text-emerald-400 capitalize">
                      Categoría: {scannedResult.category}
                    </span>
                  )}
                </div>
              </div>

              {scannedResult.raw && (
                <div className="p-2 rounded bg-surface-container/60 text-[10px] font-mono text-on-surface-variant break-all line-clamp-2">
                  Payload: {scannedResult.raw}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-outline-variant/20 flex items-center justify-between bg-surface-container-high/40">
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="h-10 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-mono text-xs font-semibold"
          >
            Cancelar
          </button>

          <button
            disabled={!scannedResult}
            onClick={() => {
              if (scannedResult) {
                onApplyScan(scannedResult);
                stopCamera();
                onClose();
              }
            }}
            className={`h-11 px-5 rounded-xl font-headline font-bold text-xs flex items-center gap-2 transition-all ${
              scannedResult
                ? 'bg-secondary text-on-secondary-fixed shadow-[0_0_16px_rgba(76,215,246,0.4)] active:scale-95'
                : 'bg-surface-container-highest text-on-surface-variant opacity-50 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">assignment_turned_in</span>
            <span>Rellenar Ticket Automáticamente</span>
          </button>
        </div>
      </div>
    </div>
  );
};
