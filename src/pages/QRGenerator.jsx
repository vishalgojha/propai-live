import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { QrCode, Download } from "lucide-react";
import { toast, Toaster } from "sonner";

export default function QRGenerator() {
  const [text, setText] = useState("");
  const [qrImage, setQrImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateQR = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text');
      return;
    }
    
    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('generateQRCode', {
        text: text.trim(),
        size: 500
      });
      
      if (response.data.success) {
        setQrImage(response.data.qrCodeDataUrl);
        toast.success('QR code generated!');
      }
    } catch (error) {
      toast.error('Failed to generate QR code: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrImage;
    link.download = 'qrcode.png';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
      <Toaster position="top-center" richColors closeButton />
      
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">QR Code Generator</h1>
          <p className="text-slate-600">Convert any text to QR code instantly</p>
        </div>

        <div className="bg-white rounded-3xl border-2 border-purple-200 p-6 shadow-xl mb-6">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your text here (WhatsApp pairing code, URL, etc.)..."
            className="min-h-[150px] mb-4"
          />
          
          <Button
            onClick={generateQR}
            disabled={isGenerating || !text.trim()}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-12 text-lg font-bold"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </div>
            ) : (
              <>
                <QrCode className="w-5 h-5 mr-2" />
                Generate QR Code
              </>
            )}
          </Button>
        </div>

        {qrImage && (
          <div className="bg-white rounded-3xl border-2 border-purple-200 p-6 shadow-xl text-center">
            <img 
              src={qrImage} 
              alt="QR Code" 
              className="mx-auto rounded-2xl shadow-lg mb-4"
              style={{ maxWidth: '400px' }}
            />
            <Button
              onClick={downloadQR}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}