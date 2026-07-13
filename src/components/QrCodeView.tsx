import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy } from 'lucide-react';

interface QrCodeViewProps {
  value: string;
  size?: number;
}

export function QrCodeView({ value, size = 200 }: QrCodeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: 2,
        color: {
          dark: '#ffffff', // Neon light/white codes
          light: '#0f172a', // Dark background slate-900 matches our dashboard
        },
      },
      (err) => {
        if (err) {
          console.error(err);
          setError('Не удалось сгенерировать QR-код');
        } else {
          setError(null);
        }
      }
    );
  }, [value, size]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Ошибка копирования в буфер обмена', err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-900 border border-slate-800 rounded-2xl max-w-sm mx-auto shadow-xl">
      {error ? (
        <div className="text-red-400 text-sm py-8">{error}</div>
      ) : (
        <div className="relative group p-3 bg-slate-950 border border-cyan-500/20 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
          <canvas ref={canvasRef} className="rounded-lg max-w-full" />
        </div>
      )}

      <p className="text-xs text-slate-400 mt-4 mb-3 text-center max-w-[250px] truncate">
        {value}
      </p>

      <button
        id="copy-qrcode-btn"
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer bg-slate-800 hover:bg-cyan-950/40 text-slate-200 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/30 w-full justify-center"
      >
        {copied ? (
          <>
            <Check size={14} className="text-emerald-400 animate-scale" />
            <span className="text-emerald-400 font-medium">Ссылка скопирована!</span>
          </>
        ) : (
          <>
            <Copy size={14} />
            <span>Скопировать ссылку</span>
          </>
        )}
      </button>
    </div>
  );
}
