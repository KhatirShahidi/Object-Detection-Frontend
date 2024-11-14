'use client';
import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';

const Home: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState<string>('');
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  const [useCameraMode, setUseCameraMode] = useState<boolean>(false);
  const [cameraPermission, setCameraPermission] = useState<
    'granted' | 'denied' | 'prompt' | null
  >(null);
  const webcamRef = useRef<Webcam>(null);

  // Check for camera permissions
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then((permissionStatus) => {
          setCameraPermission(permissionStatus.state);
          permissionStatus.onchange = () => {
            setCameraPermission(permissionStatus.state);
          };
        })
        .catch((error) => console.error('Error checking permissions:', error));
    }
  }, []);

  // Request camera access if permission is not already granted
  const requestCameraAccess = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission('granted');
    } catch (error) {
      setCameraPermission('denied');
      console.error('Camera access denied:', error);
    }
  };

  // Handle file selection and create a preview
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Capture image from the webcam
  const handleCapture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setPreviewUrl(imageSrc);
    }
  };

  // Video constraints for `react-webcam`
  const videoConstraints = {
    facingMode: 'environment', // Use rear camera if available
    width: { ideal: 1280 },
    height: { ideal: 720 },
  };

  return (
    <div className="container">
      <h1>{isCalibrated ? 'Measure Distance' : 'Calibrate Camera'}</h1>

      {/* Toggle between camera and file upload mode */}
      <button
        onClick={() => setUseCameraMode(!useCameraMode)}
        className="toggle-button"
      >
        {useCameraMode ? 'Use File Upload' : 'Use Camera'}
      </button>

      {/* Camera Mode */}
      {useCameraMode && (
        <>
          {cameraPermission === 'denied' && (
            <p style={{ color: 'red' }}>
              Camera access is denied. Please enable camera permissions in your
              browser settings.
            </p>
          )}
          {cameraPermission === 'prompt' && (
            <button onClick={requestCameraAccess} className="request-button">
              Allow Camera Access
            </button>
          )}
          {cameraPermission === 'granted' && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                style={{ width: '100%', borderRadius: '10px' }}
              />
              <button onClick={handleCapture} style={{ marginTop: '20px' }}>
                Capture Image
              </button>
              {previewUrl && (
                <div>
                  <h2>Preview:</h2>
                  <img
                    src={previewUrl}
                    alt="Captured"
                    style={{ maxWidth: '100%' }}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* File Upload Mode */}
      {!useCameraMode && (
        <>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ marginTop: '20px' }}
          />
          {previewUrl && (
            <div>
              <img
                src={previewUrl}
                alt="Selected"
                style={{ maxWidth: '100%' }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
