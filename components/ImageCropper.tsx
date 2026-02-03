"use client";
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/utils/canvasUtils";
import { BiZoomIn, BiZoomOut, BiCheck, BiX } from "react-icons/bi";

interface ImageCropperProps {
  imageSrc: string;
  aspect: number; // 가로세로 비율 (1:1 or 3:1)
  cropShape: 'rect' | 'round'; // 사각형 or 원형
  onCropComplete: (croppedBlob: Blob) => void;
  onClose: () => void;
}

export default function ImageCropper({ imageSrc, aspect, cropShape, onCropComplete, onClose }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = (crop: { x: number; y: number }) => setCrop(crop);
  const onZoomChange = (zoom: number) => setZoom(zoom);

  const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedBlob);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{ position: 'relative', width: '90%', height: '60%', backgroundColor: '#333', borderRadius: '16px', overflow: 'hidden', maxWidth: '600px' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          cropShape={cropShape}
          showGrid={true}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteHandler}
        />
      </div>

      {/* 컨트롤 패널 */}
      <div style={{ marginTop: '20px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
          <BiZoomOut />
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1, cursor: 'pointer' }}
          />
          <BiZoomIn />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <button onClick={onClose} style={{ padding: '10px 24px', borderRadius: '30px', border: 'none', background: '#555', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <BiX size={20}/> 취소
          </button>
          <button onClick={handleSave} style={{ padding: '10px 24px', borderRadius: '30px', border: 'none', background: '#1d9bf0', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <BiCheck size={20} /> 적용하기
          </button>
        </div>
      </div>
    </div>
  );
}