'use client';
import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Webcam from 'react-webcam';
import '@tensorflow/tfjs';

const cocoSsd = dynamic(() => import('@tensorflow-models/coco-ssd'), {
  ssr: false,
});

const Home: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    'environment',
  );

  // Load the model
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
        setIsModelLoaded(true);
        console.log('Model loaded.');
      } catch (error) {
        console.error('Error loading model:', error);
      }
    };

    loadModel();
  }, []);

  // Detect objects continuously on the video stream
  const detectObjects = async () => {
    if (model && webcamRef.current?.video && canvasRef.current) {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && video.readyState === 4) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const predictions = await model.detect(video);

        // Clear previous drawings
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        predictions.forEach((prediction) => {
          const [x, y, width, height] = prediction.bbox;
          ctx.beginPath();
          ctx.rect(x, y, width, height);
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'green';
          ctx.fillStyle = 'green';
          ctx.stroke();
          ctx.fillText(
            `${prediction.class} - ${(prediction.score * 100).toFixed(2)}%`,
            x,
            y > 10 ? y - 5 : 10,
          );
        });
      }
    }
  };

  // Continuously detect objects
  useEffect(() => {
    const interval = setInterval(() => {
      detectObjects();
    }, 100); // Detect every 100ms

    return () => clearInterval(interval);
  }, [model]);

  // Toggle between front and rear cameras
  const handleCameraSwitch = () => {
    setFacingMode((prevMode) => (prevMode === 'user' ? 'environment' : 'user'));
  };

  // Video constraints for the webcam
  const videoConstraints = {
    facingMode: facingMode,
  };

  return (
    <div className="container">
      <h1>Real-Time Object Detection</h1>

      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Webcam Feed */}
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          style={{ width: '100%', borderRadius: '10px' }}
        />

        {/* Canvas for Drawing Bounding Boxes */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
            width: '100%',
            height: '100%',
          }}
        />
      </div>

      <button onClick={handleCameraSwitch} style={{ marginTop: '20px' }}>
        Switch Camera ({facingMode === 'user' ? 'Front' : 'Rear'})
      </button>

      {!isModelLoaded && <p>Loading model...</p>}
    </div>
  );
};

export default Home;
