'use client';
import React, { useRef, useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import  NextImage from 'next/image';



export default function Home() {

  const [userImage, setUserImage] = useState<string | null>(null);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUserImage(reader.result as string);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const getCroppedImg = async (
    imageSrc: string,
    crop: Area
  ): Promise<string> => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;

    return new Promise((resolve, reject) => {
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = crop.width;
        canvas.height = crop.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context is not available.'));
          return;
        }

        ctx.drawImage(
          image,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          crop.width,
          crop.height
        );

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty.'));
            return;
          }

          const fileUrl = URL.createObjectURL(blob);
          resolve(fileUrl);
        }, 'image/png');
      };

      image.onerror = (err) => reject(err);
    });
  };

  const saveCroppedImage = useCallback(async () => {
    if (!userImage || !croppedArea) return;

    try {
      const cropped = await getCroppedImg(userImage, croppedArea);
      setCroppedImage(cropped);
      setIsCropping(false);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  }, [userImage, croppedArea]);

  const generateImage = (): void => {
    if (!canvasRef.current || !croppedImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseImage = new Image();
    baseImage.crossOrigin = 'anonymous'; // Handle cross-origin if needed
    baseImage.src = '/base-image.png'; // Ensure this path is correct

    baseImage.onload = () => {
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;
      ctx.drawImage(baseImage, 0, 0, baseImage.width, baseImage.height);

      const userImg = new Image();
      userImg.src = croppedImage;

      userImg.onload = () => {
        const x = 290;
        const y = 1075;
        const width = 2415;
        const height = 1349;

        ctx.drawImage(userImg, x, y, width, height);
        const finalImageUrl = canvas.toDataURL('image/png');
        setFinalImage(finalImageUrl);
      };

      userImg.onerror = (err) => {
        console.error('Error loading cropped image:', err);
      };
    };

    baseImage.onerror = (err) => {
      console.error('Error loading base image:', err);
    };
  };

  const downloadImage = (): void => {
    if (!finalImage) return;

    const link = document.createElement('a');
    link.href = finalImage;
    link.download = 'custom-image.png';
    link.click();
  };

  return (
    <main className='flex justify-center items-center min-h-screen bg-primary relative'>
      <div className="font-sans max-w-xl mx-auto p-6 bg-secondary text-primary text-center rounded-md shadow-2xl">
        <h1 className="text-3xl font-bold mb-4">Constitution to Home: Counter Point Community</h1>
        {
           !isCropping && !croppedImage ?  (
              <div className="">
                <NextImage height={3500} width={3000} alt='Base Image' src={'/base-image.png'} className='w-1/2 mx-auto h-auto' />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="p-2 border rounded-md mt-4 bg-white text-black"
                />
              </div>
            ) : null
          }


        {isCropping && userImage && (
          <div className="relative w-full h-96 border rounded-lg overflow-hidden mb-4">
            <Cropper
              image={userImage}
              crop={crop}
              zoom={zoom}
              aspect={1.79}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
            <button
              onClick={saveCroppedImage}
              className="absolute bottom-4 right-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg"
            >
              Save Cropped Image
            </button>
          </div>
        )}

        {croppedImage && !finalImage && (
          <div className="mt-4">
            <h3 className="text-xl mb-2">Cropped Image Preview</h3>
            <NextImage
              height={1349}
              width={2415}
              src={croppedImage}
              alt="Cropped Preview"
              className="w-full max-w-sm mx-auto rounded-lg shadow-lg mb-4"
            />
            <button
              onClick={generateImage}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg shadow-lg"
            >
              Generate Image
            </button>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

        {finalImage && (
          <div className="mt-6">
            <h3 className="text-xl mb-2">Final Image</h3>
            <NextImage
              height={3500}
              width={3000}
              src={finalImage}
              alt="Final Image"
              className="w-full rounded-lg shadow-lg mb-4"
            />
            <button
              onClick={downloadImage}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg"
            >
              Download Image
            </button>
          </div>
        )}
      </div>
    </main>

  );
}
