import { QrCodeIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import jsQR from "jsqr";
import type { MenuItem } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

interface TableOrderProps {
  onClose: () => void;
  tableToken?: string;
  cart: MenuItem[];
  restaurantId?: number;
  customerName?: string;
}

export const TableOrder = ({ onClose, tableToken, cart, restaurantId, customerName }: TableOrderProps) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const sendOrderToAdmin = async (
    tableToken: string | undefined,
    cart: MenuItem[],
    restaurantId?: number,
    customerName?: string
  ) => {
    if (!tableToken) {
      setErrorMessage("Token da mesa não encontrado.");
      return;
    }

    if (!restaurantId) {
      setErrorMessage("ID do restaurante não encontrado.");
      return;
    }

    try {
      const itemsJson = JSON.stringify(cart);

      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            table_token: tableToken,
            items: itemsJson,
            status: 'pending',
            restaurant_id: restaurantId,
            customer_name: customerName,
          },
        ])
        .select();

      if (error) {
        console.error("Erro ao enviar pedido:", error);
        setErrorMessage(`Erro ao enviar o pedido: ${error.message}`);
        return;
      }

      if (data) {
        console.log("Pedido enviado com sucesso:", data);
        setErrorMessage(null);
        onClose();
      }
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      setErrorMessage("Erro ao enviar o pedido. Tente novamente.");
    }
  };

  const handleScanQRCode = async () => {
    try {
      // Verifica se o customerName está presente
      if (!customerName) {
        alert("Nome do cliente não foi informado.");
        return;
      }

      // Verifica se o navegador suporta a API getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Seu navegador não suporta acesso à câmera.");
      }

      // Solicita acesso à câmera de forma mais simples, preferindo a traseira se disponível
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        // Define o estado da câmera como ativa
        setCameraActive(true);
        setErrorMessage(null);

        // Exibe o vídeo da câmera em um elemento <video>
        const videoElement = document.createElement("video");
        videoElement.srcObject = stream;
        videoElement.autoplay = true;
        videoElement.playsInline = true; // Importante para iOS
        
        // Configurar estilo do vídeo para manter proporções e ficar dentro do container
        videoElement.style.maxWidth = "100%";
        videoElement.style.maxHeight = "100%";
        videoElement.style.objectFit = "contain";

        // Adiciona o vídeo ao modal
        const cameraContainer = document.getElementById("camera-container");
        if (cameraContainer) {
          cameraContainer.innerHTML = "";
          cameraContainer.appendChild(videoElement);
        }

        // Cria um canvas para processar os frames do vídeo
        const canvasElement = document.createElement("canvas");
        const canvasContext = canvasElement.getContext("2d");

        // Função para verificar o QR Code em cada frame
        const checkQRCode = () => {
          if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
            canvasElement.height = videoElement.videoHeight;
            canvasElement.width = videoElement.videoWidth;

            // Desenha o frame atual do vídeo no canvas
            canvasContext?.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

            // Obtém os dados da imagem do canvas
            const imageData = canvasContext?.getImageData(0, 0, canvasElement.width, canvasElement.height);

            if (imageData) {
              // Usa a biblioteca jsQR para decodificar o QR Code
              const code = jsQR(imageData.data, imageData.width, imageData.height);

              // Se um QR Code for encontrado
              if (code) {
                console.log("Código QR encontrado:", code.data);

                // Para a câmera quando encontrar o QR code
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());

                // Enviar o pedido para o painel administrativo
                sendOrderToAdmin(tableToken, cart, restaurantId, customerName);

                // Para de verificar os frames
                return;
              }
            }
          }

          // Continua verificando os frames
          requestAnimationFrame(checkQRCode);
        };

        // Inicia a verificação do QR Code quando o vídeo estiver pronto
        videoElement.addEventListener("loadeddata", checkQRCode);
      } catch (error: any) {
        console.error("Erro de acesso à câmera:", error);
        if (error.name === 'NotAllowedError') {
          setErrorMessage("Acesso à câmera negado. Por favor, permita o acesso nas configurações do navegador.");
        } else if (error.name === 'NotFoundError') {
          setErrorMessage("Nenhuma câmera encontrada no dispositivo.");
        } else {
          setErrorMessage(`Erro ao acessar a câmera: ${error.message}`);
        }
        throw error; // Propaga o erro para o catch externo
      }
    } catch (error) {
      console.error("Erro geral na função handleScanQRCode:", error);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50"
      onClick={handleOutsideClick}
    >
      <div className="bg-white w-full max-w-md rounded-t-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Precisamos Confirmar Sua Mesa</h2>
            <p className="text-sm text-gray-600">
              Permita acesso à câmera para rescanear o Código QR da sua mesa.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Nome do cliente: {customerName || "Não informado"}
            </p>
          </div>

          <div className="ml-4">
            <img
              src="/scaneie.png"
              alt="Scaneie o QR Code"
              className="w-32 h-32 object-contain"
            />
          </div>
        </div>

        <div 
          id="camera-container" 
          className="mb-4 bg-gray-100 rounded overflow-hidden flex items-center justify-center"
          style={{ height: '180px' }}
        >
          {cameraActive ? (
            <p className="text-sm text-gray-600 text-center absolute z-10 bg-white bg-opacity-70 px-2 py-1 rounded">
              Aponte a câmera para o código QR da mesa.
            </p>
          ) : (
            <p className="text-sm text-gray-600 text-center">
              Clique no botão abaixo para ativar a câmera.
            </p>
          )}
        </div>

        {errorMessage && (
          <p className="text-sm text-red-600 text-center mb-4">{errorMessage}</p>
        )}

        <Button
          className="w-full flex items-center justify-center"
          style={{ 
            backgroundColor: 'var(--text)', 
            color: 'var(--background)' 
          }}
          onClick={handleScanQRCode}
        >
          <QrCodeIcon className="w-5 h-5 mr-2" />
          Escanear Código QR
        </Button>
        
        <Button
          className="w-full mt-2 text-sm"
          variant="outline"
          onClick={() => {
            if (tableToken && cart.length > 0 && restaurantId) {
              sendOrderToAdmin(tableToken, cart, restaurantId, customerName);
            } else {
              setErrorMessage("Não é possível enviar o pedido sem o token da mesa.");
            }
          }}
        >
          Continuar sem escanear
        </Button>
      </div>
    </div>
  );
};