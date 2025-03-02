import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Download, Share2, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeGeneratorProps {
  restaurantId?: string | number;
}

export function QRCodeGenerator({ restaurantId }: QRCodeGeneratorProps) {
  const [menuUrl, setMenuUrl] = useState<string>('');
  const [restaurantInfo, setRestaurantInfo] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const qrCodeRef = useRef<HTMLDivElement>(null); // Referência para o QR Code SVG

  useEffect(() => {
    async function fetchRestaurantInfo() {
      if (!restaurantId) {
        // Se não foi passado um ID, buscar o restaurante do usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        const { data: restaurant, error } = await supabase
          .from('restaurants')
          .select('id, name')
          .eq('owner_id', user?.id)
          .single();

        if (error || !restaurant) {
          toast({
            title: "Erro ao buscar informações do restaurante",
            description: error?.message || "Restaurante não encontrado",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        setRestaurantInfo({ name: restaurant.name });
        // Crie a URL do cardápio - ajuste isso para sua estrutura de URLs
        const menuPageUrl = `${window.location.origin}/menu/${restaurant.id}`;
        setMenuUrl(menuPageUrl);
      } else {
        // Se foi passado um ID, buscar informações desse restaurante específico
        const { data: restaurant, error } = await supabase
          .from('restaurants')
          .select('id, name')
          .eq('id', restaurantId)
          .single();

        if (error || !restaurant) {
          toast({
            title: "Erro ao buscar informações do restaurante",
            description: error?.message || "Restaurante não encontrado",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        setRestaurantInfo({ name: restaurant.name });
        // Crie a URL do cardápio
        const menuPageUrl = `${window.location.origin}/menu/${restaurantId}`;
        setMenuUrl(menuPageUrl);
      }

      setLoading(false);
    }

    fetchRestaurantInfo();
  }, [restaurantId, toast]);

  // Função para baixar o QR Code como imagem PNG
  const downloadQRCode = () => {
    const qrCodeElement = qrCodeRef.current;
    if (!qrCodeElement) return;

    // Criar um canvas para renderizar o QR Code
    const canvas = document.createElement('canvas');
    const size = 256; // Tamanho do QR Code
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Renderizar o QR Code no canvas
    const svgElement = qrCodeElement.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;

    img.onload = () => {
      context.drawImage(img, 0, 0, size, size);

      // Criar um novo canvas para adicionar padding e texto
      const padding = 20;
      const newCanvas = document.createElement('canvas');
      newCanvas.width = size + (padding * 2);
      newCanvas.height = size + (padding * 2) + 40; // Espaço extra para o texto

      const newContext = newCanvas.getContext('2d');
      if (!newContext) return;

      // Fundo branco
      newContext.fillStyle = '#FFFFFF';
      newContext.fillRect(0, 0, newCanvas.width, newCanvas.height);

      // Desenhar o QR Code no canvas com padding
      newContext.drawImage(canvas, padding, padding, size, size);

      // Adicionar o texto com o nome do restaurante
      if (restaurantInfo?.name) {
        newContext.font = 'bold 16px Arial';
        newContext.fillStyle = '#000000';
        newContext.textAlign = 'center';
        newContext.fillText(`Cardápio - ${restaurantInfo.name}`, newCanvas.width / 2, size + padding + 25);
      }

      // Converter para PNG e fazer download
      const dataUrl = newCanvas.toDataURL('image/png');
      const link = document.createElement('a');

      link.href = dataUrl;
      link.download = `qrcode-cardapio-${restaurantInfo?.name || 'restaurante'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "QR Code baixado com sucesso!",
      });
    };
  };

  // Função para copiar a URL para a área de transferência
  const copyUrl = () => {
    navigator.clipboard.writeText(menuUrl)
      .then(() => {
        toast({
          title: "URL do cardápio copiada!",
        });
      })
      .catch(() => {
        toast({
          title: "Erro ao copiar URL",
          variant: "destructive",
        });
      });
  };

  // Função para compartilhar (usando a Web Share API)
  const shareQRCode = () => {
    if (navigator.share) {
      navigator.share({
        title: `Cardápio - ${restaurantInfo?.name || 'Restaurante'}`,
        text: 'Acesse nosso cardápio digital!',
        url: menuUrl,
      })
        .then(() => {
          toast({
            title: "Compartilhado com sucesso!",
          });
        })
        .catch(() => {
          toast({
            title: "Erro ao compartilhar",
            variant: "destructive",
          });
        });
    } else {
      // Fallback para navegadores que não suportam Web Share API
      copyUrl();
      toast({
        title: "URL copiada para a área de transferência",
        description: "Compartilhe esta URL com seus clientes",
      });
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>QR Code do Cardápio</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div ref={qrCodeRef} className="bg-white p-4 rounded-lg shadow-sm">
          {/* QR Code visível */}
          <QRCodeSVG
            value={menuUrl}
            size={256}
            level="H" // Alta correção de erros
            includeMargin={true}
            className="mx-auto"
          />
        </div>

        <div className="text-sm text-center text-muted-foreground">
          <p>Este QR Code direciona para o cardápio digital do seu restaurante.</p>
          <p className="mt-2">URL: <span className="font-medium text-foreground">{menuUrl}</span></p>
        </div>
      </CardContent>

      <CardFooter className="flex justify-center space-x-2">
        <Button onClick={downloadQRCode} variant="default">
          <Download className="w-4 h-4 mr-2" />
          Baixar
        </Button>
        <Button onClick={shareQRCode} variant="outline">
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar
        </Button>
        <Button onClick={copyUrl} variant="outline">
          <Copy className="w-4 h-4 mr-2" />
          Copiar URL
        </Button>
      </CardFooter>
    </Card>
  );
}