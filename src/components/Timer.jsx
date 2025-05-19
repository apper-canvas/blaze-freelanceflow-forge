import { useState, useEffect } from 'react';
import { Play, Pause, StopCircle, X } from 'lucide-react';

function Timer({ isRunning, startTime, onStart, onStop, onCancel }) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timer, setTimer] = useState(null);

  // Format time for display (HH:MM:SS)
  const formatTime = (time) => {
    const hours = Math.floor(time / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((time % 3600) / 60).toString().padStart(2, '0');
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // Start the timer
  const startTimer = () => {
    if (onStart) onStart();
  };

  // Stop the timer
  const stopTimer = () => {
    if (onStop) onStop();
  };

  // Cancel the timer
  const cancelTimer = () => {
    if (onCancel) onCancel();
  };

  // Handle timer updates
  useEffect(() => {
    if (isRunning && startTime) {
      const updateTimer = () => {
        const now = new Date();
        const start = new Date(startTime);
        const diff = Math.floor((now - start) / 1000);
        setElapsedTime(diff);
      };

      // Initial update
      updateTimer();
      
      // Set interval to update timer every second
      const intervalId = setInterval(updateTimer, 1000);
      setTimer(intervalId);

      return () => clearInterval(intervalId);
    } else {
      if (timer) {
        clearInterval(timer);
        setTimer(null);
      }
      setElapsedTime(0);
    }
  }, [isRunning, startTime]);

  return (
    <div className="flex flex-col bg-surface-100 dark:bg-surface-700 rounded-lg p-4">
      <div className="text-2xl font-mono text-center mb-4">
        {formatTime(elapsedTime)}
      </div>
      <div className="flex justify-center space-x-2">
        {!isRunning ? (
          <button onClick={startTimer} className="btn-primary py-1 px-3">
            <Play className="w-4 h-4 mr-1" /> Start
          </button>
        ) : (
          <>
            <button onClick={stopTimer} className="btn-primary py-1 px-3">
              <StopCircle className="w-4 h-4 mr-1" /> Stop & Save
            </button>
            <button onClick={cancelTimer} className="btn-outline py-1 px-3">
              <X className="w-4 h-4 mr-1" /> Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Timer;