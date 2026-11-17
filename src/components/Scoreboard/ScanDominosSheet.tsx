import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, RefreshCw, SwitchCamera } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import {
  blobToDataUrl,
  scanDominoPips,
  type PipScanResult,
} from '../../vision/dominoPips';
import { useAppStore } from '../../hooks/useAppStore';

type ScanDominosSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Fills the scoreboard amount after user confirms. */
  onUsePoints: (points: number) => void;
};

type Phase = 'capture' | 'analyzing' | 'review';

export function ScanDominosSheet({
  open,
  onClose,
  onUsePoints,
}: ScanDominosSheetProps) {
  const { dict } = useAppStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>('capture');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(
    'environment',
  );
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [result, setResult] = useState<PipScanResult | null>(null);
  const [points, setPoints] = useState('');
  const [cameraReady, setCameraReady] = useState(false);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  };

  const startCamera = async (facing: 'environment' | 'user') => {
    stopCamera();
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(dict.scan.cameraUnsupported);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
        setCameraReady(true);
      }
    } catch {
      setCameraError(dict.scan.cameraDenied);
    }
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
      setPhase('capture');
      setResult(null);
      setPoints('');
      setScanError(null);
      return;
    }
    void startCamera(facingMode);
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || phase !== 'capture') return;
    void startCamera(facingMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const analyzeBlob = async (blob: Blob) => {
    setPhase('analyzing');
    setScanError(null);
    stopCamera();
    try {
      const dataUrl = await blobToDataUrl(blob as unknown as Blob);
      const scanned = await scanDominoPips(dataUrl);
      setResult(scanned);
      setPoints(String(scanned.totalPips));
      setPhase('review');
    } catch {
      setScanError(dict.scan.analyzeFailed);
      setPhase('capture');
      void startCamera(facingMode);
    }
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video || !cameraReady) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92),
    );
    if (blob) await analyzeBlob(blob);
  };

  const onFile = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    await analyzeBlob(file);
  };

  const retake = () => {
    setResult(null);
    setPoints('');
    setScanError(null);
    setPhase('capture');
    void startCamera(facingMode);
  };

  const usePoints = () => {
    const n = Number(points);
    if (!Number.isInteger(n) || n < 0) {
      setScanError(dict.errors.invalid);
      return;
    }
    onUsePoints(n);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={dict.scan.title}>
      <p className="scan-hint">{dict.scan.hint}</p>

      {phase === 'capture' && (
        <div className="scan-capture">
          <div className="scan-viewport">
            {cameraError ? (
              <div className="scan-fallback">
                <p>{cameraError}</p>
                <p>{dict.scan.uploadInstead}</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                className="scan-video"
                playsInline
                muted
                autoPlay
                aria-label={dict.scan.cameraPreview}
              />
            )}
          </div>

          {scanError && (
            <p className="error-text" role="alert">
              {scanError}
            </p>
          )}

          <div className="scan-actions">
            {!cameraError && (
              <>
                <button
                  type="button"
                  className="btn btn--primary btn--lg btn--block"
                  onClick={() => void captureFrame()}
                  disabled={!cameraReady}
                >
                  <Camera size={20} aria-hidden />
                  {dict.scan.capture}
                </button>
                <button
                  type="button"
                  className="btn btn--secondary btn--block"
                  onClick={() =>
                    setFacingMode((f) =>
                      f === 'environment' ? 'user' : 'environment',
                    )
                  }
                >
                  <SwitchCamera size={18} aria-hidden />
                  {dict.scan.flipCamera}
                </button>
              </>
            )}
            <button
              type="button"
              className="btn btn--secondary btn--block"
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus size={18} aria-hidden />
              {dict.scan.choosePhoto}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </div>
        </div>
      )}

      {phase === 'analyzing' && (
        <div className="scan-analyzing" role="status">
          <div className="scan-spinner" aria-hidden />
          <p>{dict.scan.analyzing}</p>
        </div>
      )}

      {phase === 'review' && result && (
        <div className="scan-review">
          <img
            src={result.previewDataUrl}
            alt={dict.scan.previewAlt}
            className="scan-preview"
          />
          <p className="scan-detected">
            {dict.scan.detected.replace('{n}', String(result.totalPips))}
          </p>
          <p className="scan-confidence">
            {result.confidence >= 0.7
              ? dict.scan.confidenceHigh
              : result.confidence >= 0.45
                ? dict.scan.confidenceMed
                : dict.scan.confidenceLow}
          </p>

          <div className="field">
            <label htmlFor="scan-points">{dict.scan.adjust}</label>
            <input
              id="scan-points"
              inputMode="numeric"
              pattern="[0-9]*"
              value={points}
              onChange={(e) =>
                setPoints(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
            />
          </div>

          {scanError && (
            <p className="error-text" role="alert">
              {scanError}
            </p>
          )}

          <button
            type="button"
            className="btn btn--primary btn--lg btn--block"
            onClick={usePoints}
          >
            {dict.scan.usePoints}
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--block"
            onClick={retake}
          >
            <RefreshCw size={18} aria-hidden />
            {dict.scan.retake}
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
