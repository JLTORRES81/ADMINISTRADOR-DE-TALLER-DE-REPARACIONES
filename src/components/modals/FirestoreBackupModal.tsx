import React, { useState, useEffect } from 'react';
import {
  exportFirestoreDatabaseBackup,
  downloadBackupJsonFile,
  restoreFirestoreFromBackup,
  FirestoreBackupPackage,
} from '../../firebase';

interface FirestoreBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, icon?: string) => void;
  onRefreshData?: () => void;
}

export const FirestoreBackupModal: React.FC<FirestoreBackupModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onRefreshData,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupPreview, setBackupPreview] = useState<FirestoreBackupPackage | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      exportFirestoreDatabaseBackup().then((data) => {
        setBackupPreview(data);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const data = await exportFirestoreDatabaseBackup();
      downloadBackupJsonFile(data);
      onShowToast(
        `Copia de seguridad descargada (${data.metadata.totalDocuments} documentos JSON)`,
        'cloud_download'
      );
    } catch (e) {
      console.error(e);
      onShowToast('Error al generar la copia de seguridad', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleRestoreSubmit = async () => {
    if (!uploadFile) return;

    setIsRestoring(true);
    try {
      const text = await uploadFile.text();
      const pkg = JSON.parse(text) as FirestoreBackupPackage;

      if (!pkg.collections || !pkg.metadata) {
        throw new Error('Estructura de archivo de respaldo inválida.');
      }

      const { restoredCount } = await restoreFirestoreFromBackup(pkg);
      onShowToast(
        `¡Restauración exitosa! ${restoredCount} documentos sincronizados en Firestore`,
        'cloud_done'
      );
      if (onRefreshData) onRefreshData();
      onClose();
    } catch (err) {
      console.error(err);
      onShowToast('Error al procesar el archivo JSON de respaldo', 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-surface-container rounded-2xl border border-secondary/30 max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">
        {/* Header */}
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[20px]">database</span>
            </div>
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface">
                Copia de Seguridad de Firestore
              </h3>
              <p className="font-mono text-[10px] text-secondary font-semibold">
                Exportación JSON • Contingencia & Respaldo Local
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Status & Integrity Notice */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="text-secondary font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                Garantía de Integridad
              </span>
              <span className="text-on-surface-variant">Base: (default)</span>
            </div>
            <p className="text-on-surface leading-relaxed">
              Esta función genera un archivo <strong>.JSON</strong> completo y autosuficiente con todas las colecciones activas del taller (Tickets, Técnicos, Tarifario, Facturas CFDI y Alertas push). Puede resguardarse en almacenamiento externo para restauración inmediata en contingencias.
            </p>
          </div>

          {/* Collection Document Counts Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                Resumen de Colecciones por Respaldar
              </span>
              <span className="font-mono text-[10px] text-secondary font-bold">
                Total: {backupPreview?.metadata.totalDocuments || 'Calculando...'} docs
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 flex flex-col justify-between">
                <span className="text-on-surface-variant text-[10px]">/tickets</span>
                <span className="font-headline text-base text-secondary font-bold mt-1">
                  {backupPreview?.metadata.collectionCounts.tickets ?? 3}
                </span>
                <span className="text-[9px] text-on-surface-variant">Órdenes de servicio</span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 flex flex-col justify-between">
                <span className="text-on-surface-variant text-[10px]">/technicians</span>
                <span className="font-headline text-base text-primary font-bold mt-1">
                  {backupPreview?.metadata.collectionCounts.technicians ?? 3}
                </span>
                <span className="text-[9px] text-on-surface-variant">Especialistas activos</span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 flex flex-col justify-between">
                <span className="text-on-surface-variant text-[10px]">/priceCategories</span>
                <span className="font-headline text-base text-tertiary font-bold mt-1">
                  {backupPreview?.metadata.collectionCounts.priceCategories ?? 7}
                </span>
                <span className="text-[9px] text-on-surface-variant">Tarifas y catálogo</span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 flex flex-col justify-between">
                <span className="text-on-surface-variant text-[10px]">/invoices</span>
                <span className="font-headline text-base text-on-surface font-bold mt-1">
                  {backupPreview?.metadata.collectionCounts.invoices ?? 3}
                </span>
                <span className="text-[9px] text-on-surface-variant">CFDI 4.0 / Notas</span>
              </div>

              <div className="col-span-2 sm:col-span-2 p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 flex flex-col justify-between">
                <span className="text-on-surface-variant text-[10px]">/workbenchNotifications</span>
                <span className="font-headline text-base text-secondary font-bold mt-1">
                  {backupPreview?.metadata.collectionCounts.workbenchNotifications ?? 0}
                </span>
                <span className="text-[9px] text-on-surface-variant">Registro de alertas push</span>
              </div>
            </div>
          </div>

          {/* Primary Download Button */}
          <div className="space-y-1.5 pt-1">
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary-fixed text-on-secondary-fixed font-headline text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 transition-all active:scale-98 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isExporting ? 'hourglass_top' : 'download'}
              </span>
              <span>
                {isExporting
                  ? 'Compilando respaldo de Firestore...'
                  : 'Descargar Copia de Seguridad JSON'}
              </span>
            </button>
            <span className="font-mono text-[9px] text-on-surface-variant text-center block">
              Genera archivo con fecha y hora: ElectroFix_Firestore_Backup_YYYY-MM-DD.json
            </span>
          </div>

          {/* Contingency Restore Box */}
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2.5 pt-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-tertiary uppercase font-bold tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">restore</span>
                Recuperación ante Contingencia
              </span>
              <span className="font-mono text-[9px] text-on-surface-variant">Restaurar desde JSON</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="w-full text-xs font-mono text-on-surface-variant file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-mono file:font-bold file:bg-surface-container-high file:text-secondary hover:file:bg-surface-bright cursor-pointer"
              />
            </div>

            {uploadFile && (
              <button
                onClick={handleRestoreSubmit}
                disabled={isRestoring}
                className="w-full h-9 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-headline text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isRestoring ? 'hourglass_top' : 'cloud_upload'}
                </span>
                <span>
                  {isRestoring ? 'Restaurando documentos...' : `Restaurar Datos desde ${uploadFile.name}`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface text-xs font-bold transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
