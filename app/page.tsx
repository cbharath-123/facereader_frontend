'use client';

import { useRef, useState } from 'react';
import Webcam from 'react-webcam';

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setEmotion(null);
      setError(null);
    }
  };

  const analyzeEmotion = async () => {
    if (!capturedImage) return;

    setLoading(true);
    setError(null);

    try {
      // Convert base64 to Blob
      const base64Data = capturedImage.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      // Send to backend
      const formData = new FormData();
      formData.append('image', blob, 'photo.jpg');

      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze emotion');
      }

      const data = await response.json();
      setEmotion(data.emotion);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Emotion Face Reader
        </h1>

        <div className="space-y-6">
          {/* Webcam or Captured Image */}
          <div className="flex justify-center">
            {!capturedImage ? (
              <div className="border-4 border-gray-300 rounded-lg overflow-hidden">
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full max-w-md"
                  videoConstraints={{
                    width: 640,
                    height: 480,
                    facingMode: 'user',
                  }}
                />
              </div>
            ) : (
              <div className="border-4 border-indigo-300 rounded-lg overflow-hidden">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full max-w-md"
                />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-4">
            {!capturedImage ? (
              <button
                onClick={capturePhoto}
                className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
              >
                📸 Capture Photo
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setEmotion(null);
                    setError(null);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105"
                >
                  🔄 Retake
                </button>
                <button
                  onClick={analyzeEmotion}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? '⏳ Analyzing...' : '🔍 Analyze'}
                </button>
              </>
            )}
          </div>

          {/* Results */}
          {loading && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
              <p className="mt-4 text-gray-600 font-medium">Analyzing emotion...</p>
            </div>
          )}

          {emotion && !loading && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 text-center">
              <p className="text-gray-700 font-medium mb-2">Detected Emotion:</p>
              <p className="text-5xl font-bold text-green-700">{emotion}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 text-center">
              <p className="text-red-700 font-medium">❌ {error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
