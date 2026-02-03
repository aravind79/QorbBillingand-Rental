import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X, FlipHorizontal } from "lucide-react";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const startScanning = useCallback(async () => {
    if (!videoRef.current || !open) return;

    try {
      readerRef.current = new BrowserMultiFormatReader();
      
      // Get available video devices
      const videoDevices = await readerRef.current.listVideoInputDevices();
      setDevices(videoDevices);

      if (videoDevices.length === 0) {
        setError("No camera found on this device");
        return;
      }

      const deviceId = videoDevices[currentDeviceIndex]?.deviceId;

      await readerRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const barcode = result.getText();
            onScan(barcode);
            stopScanning();
            onClose();
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error("Scanning error:", err);
          }
        }
      );
      
      setError(null);
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError") {
        setError("Camera access denied. Please allow camera permissions.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Failed to access camera. Please try again.");
      }
    }
  }, [open, currentDeviceIndex, onScan, onClose]);

  const stopScanning = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (open) {
      startScanning();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [open, startScanning, stopScanning]);

  const switchCamera = () => {
    if (devices.length > 1) {
      stopScanning();
      setCurrentDeviceIndex((prev) => (prev + 1) % devices.length);
    }
  };

  useEffect(() => {
    if (open && devices.length > 0) {
      startScanning();
    }
  }, [currentDeviceIndex]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Scan Barcode
            </span>
            {devices.length > 1 && (
              <Button variant="ghost" size="icon" onClick={switchCamera}>
                <FlipHorizontal className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative aspect-square bg-black">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
              <p className="text-destructive-foreground bg-destructive/80 rounded-lg p-4">
                {error}
              </p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-48 border-2 border-primary rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                  {/* Scanning line animation */}
                  <div className="absolute left-2 right-2 h-0.5 bg-primary/80 animate-pulse top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Position the barcode within the frame to scan
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
