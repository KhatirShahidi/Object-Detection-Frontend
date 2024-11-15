'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import imageCompression from 'browser-image-compression';

interface ApiResponse {
  success: boolean;
  distance?: number;
}

// OverlayFrame Component
const OverlayFrame: React.FC = () => <div className="overlay-frame"></div>;

// Available resolutions
const resolutions = [
  { label: '720p', width: 1280, height: 720 },
  { label: '1080p', width: 1920, height: 1080 },
];

// Localization messages
const messages = {
  en: {
    calibrate: 'Calibrate Camera',
    measure: 'Measure Distance',
    calibrationInstruction:
      'Please place the cigarette box exactly 30 cm from the camera and fit it into the green box.',
    measurementInstruction:
      'Fit the cigarette box within the frame to measure distance.',
    processing: 'Processing...',
    calibrationSuccess: 'Calibration successful!',
    calibrationFailure: 'Calibration failed. Please try again.',
    measurementFailure:
      'Failed to measure distance. Please ensure the box is within the frame.',
    retry: 'Retry',
  },
  // Add other languages here
};

const Home: React.FC = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const webcamRef = useRef<Webcam>(null);
const [focalLength, setFocalLength] = useState<number | null>(null);

  const [resolution, setResolution] = useState(resolutions[0]);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null); // Start with null

  

  // Update dimensions on client side after mount
  useEffect(() => {
    const updateDimensions = () => {
      if (window.innerWidth > window.innerHeight) {
        setDimensions({ width: resolution.width, height: resolution.height });
      } else {
        setDimensions({ width: resolution.height, height: resolution.width });
      }
    };

    updateDimensions(); // Set dimensions on mount
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, [resolution]);

  const videoConstraints = dimensions
    ? {
        facingMode: 'environment',
        width: { ideal: dimensions.width },
        height: { ideal: dimensions.height },
      }
    : {}; // Empty object if dimensions are not set

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  // Upload captured image to the backend
  const uploadImage = useCallback(
    async (file: Blob, isCalibration: boolean, focalLength?: number) => {
      const formData = new FormData();
      formData.append('file', file);
      if (!isCalibration && focalLength) {
        formData.append('focal_length', focalLength.toString());
      }

      try {
        const endpoint = isCalibration ? '/api/calibrate' : '/api/measure';
        const response = await fetch(`${backendUrl}${endpoint}`, {
          method: 'POST',
          body: formData,
        });

        const data: ApiResponse = await response.json();

        if (isCalibration && data.success) {
          setIsCalibrated(true);
          alert(messages.en.calibrationSuccess);
        } else if (isCalibration) {
          alert(messages.en.calibrationFailure);
        } else if (!isCalibration && data.distance !== undefined) {
          setDistance(data.distance);
        } else if (!isCalibration) {
          setErrorMessage(messages.en.measurementFailure);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        setErrorMessage('Failed to upload image. Please try again.');
      }
    },
    [backendUrl],
  );


  // Capture image from the webcam and upload it
  const handleCapture = useCallback(
    async (isCalibration: boolean) => {
      if (webcamRef.current) {
        setIsLoading(true);
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          setPreviewUrl(imageSrc);
          const blob = await fetch(imageSrc).then((res) => res.blob());

          const file = new File([blob], 'captured-image.jpg', {
            type: blob.type,
          });

          // Compress the image
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1280,
            useWebWorker: true,
          });

          await uploadImage(
            compressedFile,
            isCalibration,
            isCalibrated && focalLength != null ? focalLength : undefined,
          );
        }
        setIsLoading(false);
      }
    },
    [webcamRef, uploadImage, isCalibrated, focalLength],
  );


  return (
    <div className="container">
      <h1>{isCalibrated ? messages.en.measure : messages.en.calibrate}</h1>

      {/* Only render the webcam after dimensions are set to avoid hydration mismatch */}
      {dimensions && (
        <div className="webcam-frame">
          {/* Webcam Feed */}
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            style={{ width: '100%', borderRadius: '10px' }}
          />
          {/* Overlay Frame */}
          <OverlayFrame />
        </div>
      )}

      {/* Resolution Selector */}
      <div>
        <label htmlFor="resolution-select">Resolution: </label>
        <select
          id="resolution-select"
          value={resolution.label}
          onChange={(e) => {
            const selected = resolutions.find(
              (res) => res.label === e.target.value,
            );
            if (selected) setResolution(selected);
          }}
        >
          {resolutions.map((res) => (
            <option key={res.label} value={res.label}>
              {res.label}
            </option>
          ))}
        </select>
      </div>

      {!isCalibrated ? (
        <>
          <p>{messages.en.calibrationInstruction}</p>
          <button onClick={() => handleCapture(true)}>
            {messages.en.calibrate}
          </button>
        </>
      ) : (
        <>
          <p>{messages.en.measurementInstruction}</p>
          <button onClick={() => handleCapture(false)}>
            {messages.en.measure}
          </button>
        </>
      )}

      {isLoading && <p>{messages.en.processing}</p>}

      {errorMessage && (
        <>
          <p style={{ color: 'red' }}>{errorMessage}</p>
          <button
            onClick={() => {
              setErrorMessage(null);
              handleCapture(!isCalibrated);
            }}
          >
            {messages.en.retry}
          </button>
        </>
      )}

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Captured preview"
          style={{ maxWidth: '100%', marginTop: '20px' }}
        />
      )}

      {distance !== null && (
        <h2>Estimated Distance: {distance.toFixed(2)} cm</h2>
      )}
    </div>
  );
};

export default Home;
