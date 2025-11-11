import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientSideSocialImageGenerator({ property, building, developer }) {
  const canvasRef = useRef(null);

  const formatPrice = () => {
    if (!property.price) return "Price on Request";
    
    if (property.price_unit === "crores") {
      if (property.price < 1) {
        const lakhs = property.price * 100;
        return `₹${lakhs} ${lakhs === 1 ? 'Lakh' : 'Lakhs'}`;
      }
      return `₹${property.price} Cr`;
    }
    
    if (property.price >= 100) {
      const crores = (property.price / 100).toFixed(2);
      return `₹${crores} Cr`;
    }
    return `₹${property.price} ${property.price === 1 ? 'Lakh' : 'Lakhs'}`;
  };

  const generateImage = async () => {
    const loadingToast = toast.loading('🎨 Generating social image...');
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
      gradient.addColorStop(0, '#f3e8ff');
      gradient.addColorStop(0.5, '#ffffff');
      gradient.addColorStop(1, '#dbeafe');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1200, 630);

      // Decorative circles
      ctx.fillStyle = 'rgba(168, 85, 247, 0.1)';
      ctx.beginPath();
      ctx.arc(1000, 100, 200, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.beginPath();
      ctx.arc(200, 500, 250, 0, Math.PI * 2);
      ctx.fill();

      // Main card background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;
      ctx.roundRect(80, 80, 1040, 470, 30);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Logo area (top-left)
      ctx.fillStyle = '#7c3aed';
      ctx.roundRect(100, 100, 60, 60, 15);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px system-ui';
      ctx.fillText('⚡', 115, 145);

      // Brand text
      ctx.fillStyle = '#7c3aed';
      ctx.font = 'bold 28px system-ui';
      ctx.fillText('PropAI Live', 180, 135);

      // Listing type badge (top-right)
      if (property.listing_type) {
        ctx.fillStyle = '#7c3aed';
        ctx.roundRect(980, 100, 120, 40, 10);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(property.listing_type, 1040, 127);
        ctx.textAlign = 'left';
      }

      // Property Title
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 42px system-ui';
      const title = property.ai_title || `${property.bhk} in ${property.location}`;
      const maxTitleWidth = 1000;
      let fontSize = 42;
      ctx.font = `bold ${fontSize}px system-ui`;
      while (ctx.measureText(title).width > maxTitleWidth && fontSize > 28) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px system-ui`;
      }
      wrapText(ctx, title, 100, 200, maxTitleWidth, fontSize + 10);

      // Location
      let yPos = 200 + Math.ceil(title.length / 60) * (fontSize + 10) + 20;
      ctx.fillStyle = '#7c3aed';
      ctx.font = '24px system-ui';
      ctx.fillText('📍', 100, yPos);
      ctx.fillStyle = '#475569';
      ctx.font = '22px system-ui';
      const location = property.pocket ? `${property.pocket}, ${property.location}` : property.location;
      ctx.fillText(location, 140, yPos);

      // Building name if available
      if (building?.name || property.building_name) {
        yPos += 35;
        ctx.fillStyle = '#6366f1';
        ctx.font = '20px system-ui';
        ctx.fillText('🏢', 100, yPos);
        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 20px system-ui';
        const buildingName = building?.name || property.building_name;
        ctx.fillText(buildingName, 140, yPos);
        
        if (developer?.name) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '18px system-ui';
          ctx.fillText(`by ${developer.name}`, 140 + ctx.measureText(buildingName).width + 10, yPos);
        }
      }

      // Price - Big and bold
      yPos += 70;
      ctx.fillStyle = '#7c3aed';
      ctx.font = 'bold 72px system-ui';
      ctx.fillText(formatPrice(), 100, yPos);

      // Property details boxes
      yPos += 60;
      const boxWidth = 180;
      const boxHeight = 100;
      const boxSpacing = 20;

      // BHK Box
      drawInfoBox(ctx, 100, yPos, boxWidth, boxHeight, '🏠', property.bhk || 'N/A', 'Configuration');

      // Area Box
      if (property.carpet_area) {
        drawInfoBox(ctx, 100 + boxWidth + boxSpacing, yPos, boxWidth, boxHeight, '📐', property.carpet_area, 'sq.ft Carpet');
      }

      // Furnishing Box
      if (property.furnishing) {
        drawInfoBox(ctx, 100 + (boxWidth + boxSpacing) * 2, yPos, boxWidth, boxHeight, '🪑', property.furnishing, 'Furnishing');
      }

      // Footer
      ctx.fillStyle = 'rgba(124, 58, 237, 0.1)';
      ctx.fillRect(80, 555, 1040, 70);
      
      ctx.fillStyle = '#7c3aed';
      ctx.font = 'bold 24px system-ui';
      ctx.fillText('📱 Visit propai.live', 100, 600);
      
      ctx.fillStyle = '#64748b';
      ctx.font = '18px system-ui';
      ctx.fillText('AI-Powered Mumbai Real Estate Intelligence', 420, 600);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `propai-${property.custom_id || property.id}-social.png`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.dismiss(loadingToast);
        toast.success('✅ Image Downloaded!', {
          description: 'Share it on social media'
        });
      }, 'image/png');

    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to generate image', {
        description: error.message
      });
    }
  };

  // Helper function to wrap text
  const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  };

  // Helper to draw info boxes
  const drawInfoBox = (ctx, x, y, width, height, icon, value, label) => {
    ctx.fillStyle = 'rgba(124, 58, 237, 0.08)';
    ctx.roundRect(x, y, width, height, 15);
    ctx.fill();

    ctx.font = '32px system-ui';
    ctx.fillText(icon, x + 15, y + 45);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 24px system-ui';
    ctx.fillText(value.length > 12 ? value.substring(0, 12) : value, x + 15, y + 75);

    ctx.fillStyle = '#64748b';
    ctx.font = '14px system-ui';
    ctx.fillText(label, x + 15, y + 92);
  };

  return (
    <Button
      onClick={generateImage}
      size="sm"
      variant="outline"
      className="gap-2 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:border-purple-300 text-purple-700"
    >
      <Download className="w-4 h-4" />
      Download Social Image
    </Button>
  );
}