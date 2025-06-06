'use client';
import React, { useRef, useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import  NextImage from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';



export default function Home() {

  const [userName, setUserName] = useState<string>('');
  const [showInput, setShowInput] = useState<boolean>(false);
  const [userNameError, setUserNameError] = useState<boolean>(false);
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

              // Circular clipping
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        crop.width / 2,
        crop.height / 2,
        crop.width / 2,
        0,
        Math.PI * 2
      );
      ctx.closePath();
      ctx.clip();

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
    baseImage.crossOrigin = 'anonymous';
    baseImage.src = '/base-image-1.png';
  
    baseImage.onload = () => {
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;
      ctx.drawImage(baseImage, 0, 0, baseImage.width, baseImage.height);
  
      const userImg = new Image();
      userImg.src = croppedImage;
  
      userImg.onload = () => {
        const x = 1028;
        const y = 587;
        const width = 676;
        const height = 677;
  
        // Clip into a circle before drawing the user image
        ctx.save(); // Save the current context state
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI * 2); // Circle clip
        ctx.closePath();
        ctx.clip(); // Apply the clipping path
  
        ctx.drawImage(userImg, x, y, width, height);
        ctx.restore(); // Restore the original context so clipping doesn't affect other drawings

        if (userName) {
          const boxX = 1084;
          const boxY = 1344;
          const boxWidth = 566;
          const boxHeight = 64;
          const fontSize = 52;
          const font = `bold ${fontSize}px sans-serif`;
        
          // 🟦 Draw the box (optional: set color)
          ctx.fillStyle = '#49301E'; // Box background color, change as needed
          ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        
          // 🖊️ Draw the centered text
          ctx.font = font;
          ctx.fillStyle = '#FFF'; // Text color
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
        
          // Trim to 15 characters max
          let text = userName.length > 15 ? userName.slice(0, 15) : userName;
        
          // Further trim if it doesn't fit the box width
          while (ctx.measureText(text).width > boxWidth && text.length > 0) {
            text = text.slice(0, -1);
          }
        
          const textX = boxX + boxWidth / 2;
          const textY = boxY + boxHeight / 2;
        
          ctx.fillText(text, textX, textY);
        }
        
  
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
        <h1 className="text-3xl font-bold mb-4">MSF Delhi <strong>MUSLIMAH</strong> Fest</h1>
        {
          !showInput ? (
            <div>
              <NextImage height={3500} width={3000} alt='Base Image' src={'/base-image-1.png'} className='w-1/2 mx-auto h-auto' />
              <Input
                type="text"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => {
                  const value = e.target.value;
                  setUserName(value);
                  setUserNameError(value.length > 15);
                }}
                className="p-2 my-4 border rounded-md bg-primary-foreground text-black"
              />
              <Button onClick={() => setShowInput(true)} disabled={!userName || userNameError} className='w-full max-w-96' variant="default">Create</Button>
              {
                userNameError &&
                <p className='text-red-600 font-sm'>Name must be less than 15 characters</p>
              }
            </div>
          ) : !isCropping && !croppedImage ?  (
            <div className="">
              <NextImage height={3500} width={3000} alt='Base Image' src={'/base-image-1.png'} className='w-1/2 mx-auto h-auto' />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="p-2 border rounded-md mt-4 bg-white text-black"
              />
            </div>
          ): null
          }
        {/* {
           !isCropping && !croppedImage ?  (
              <div className="">
                <NextImage height={3500} width={3000} alt='Base Image' src={'/base-image-1.png'} className='w-1/2 mx-auto h-auto' />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="p-2 border rounded-md mt-4 bg-white text-black"
                />
              </div>
            ) : null
          } */}


        {isCropping && userImage && (
          <div className="relative w-full h-96 border rounded-lg overflow-hidden mb-4">
            <Cropper
              image={userImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
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
