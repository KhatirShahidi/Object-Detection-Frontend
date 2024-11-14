'use client';
import React, { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';

const Home: React.FC = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [useCameraMode, setUseCameraMode] = useState<boolean>(true);
  const [knownDistance, setKnownDistance] = useState<number>(30);
  const webcamRef = useRef<Webcam>(null);

  const videoConstraints = {
    facingMode: 'environment',
    width: { ideal: 1280 },
    height: { ideal: 720 },
  };

  // Capture image from the webcam
  const handleCapture = async (isCalibration: boolean) => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setPreviewUrl(imageSrc);
      const file = await fetch(imageSrc).then((res) => res.blob());
      const formData = new FormData();
      formData.append('file', file);

      if (isCalibration) {
        formData.append('known_distance', knownDistance.toString());
        const response = await fetch('/api/calibrate', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        setIsCalibrated(data.success);
        alert(data.success ? 'Calibration successful!' : 'Calibration failed.');
      } else {
        const response = await fetch('/api/measure', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        setDistance(data.distance);
      }
    }
  };

  return (
    <div className="container">
      <h1>{isCalibrated ? 'Measure Distance' : 'Calibrate Camera'}</h1>
      {useCameraMode && (
        <div style={{ textAlign: 'center' }}>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            style={{ width: '100%', borderRadius: '10px' }}
          />
          {!isCalibrated ? (
            <>
              <input
                type="number"
                value={knownDistance}
                onChange={(e) => setKnownDistance(Number(e.target.value))}
                placeholder="Known Distance (cm)"
                style={{ marginTop: '10px' }}
              />
              <button onClick={() => handleCapture(true)}>Calibrate</button>
            </>
          ) : (
            <button onClick={() => handleCapture(false)}>
              Measure Distance
            </button>
          )}
          {previewUrl && (
            <img src={previewUrl} alt="Captured" style={{ maxWidth: '100%' }} />
          )}
          {distance !== null && (
            <h2>Estimated Distance: {distance.toFixed(2)} cm</h2>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
