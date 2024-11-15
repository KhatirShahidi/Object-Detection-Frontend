'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const Home: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);

  // Load the model once on mount
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

  // Detect objects using requestAnimationFrame
  const detectObjects = useCallback(async () => {
    if (model && webcamRef.current?.video && canvasRef.current) {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && video.readyState === 4) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Perform object detection
        const predictions = await model.detect(video);

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw bounding boxes for detected objects
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
            y > 10 ? y - 5 : 10
          );
        });
      }

      // Use requestAnimationFrame for the next detection cycle
      requestAnimationFrame(detectObjects);
    }
  }, [model]);

  // Start object detecti
