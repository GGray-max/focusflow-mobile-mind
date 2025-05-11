
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { motion } from 'framer-motion';

interface SpeechRecognitionProps {
  isActive: boolean;
  onSpeechResult: (transcript: string) => void;
  onCancel: () => void;
}

const SpeechRecognition: React.FC<SpeechRecognitionProps> = ({ isActive, onSpeechResult, onCancel }) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  
  useEffect(() => {
    if (isActive) {
      startSpeechRecognition();
    } else {
      stopSpeechRecognition();
    }
    
    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (error) {
          console.error('Error stopping recognition:', error);
        }
      }
    };
  }, [isActive]);
  
  const startSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // Create recognition object
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };
      
      recognitionInstance.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const transcriptText = result[0].transcript;
        
        setTranscript(transcriptText);
        
        if (result.isFinal) {
          setTimeout(() => {
            onSpeechResult(transcriptText);
          }, 500);
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        onCancel();
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
        if (transcript) {
          onSpeechResult(transcript);
        } else {
          onCancel();
        }
      };
      
      try {
        recognitionInstance.start();
        setRecognition(recognitionInstance);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        onCancel();
      }
    } else {
      console.error('Speech recognition not supported in this browser');
      onCancel();
      alert('Speech recognition is not supported in your browser.');
    }
  };
  
  const stopSpeechRecognition = () => {
    if (recognition) {
      try {
        recognition.stop();
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  };

  return (
    <Dialog open={isActive} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md text-center">
        <div className="flex flex-col items-center justify-center pt-6 pb-4">
          <motion.div
            animate={{
              scale: isListening ? [1, 1.2, 1] : 1,
              opacity: isListening ? [0.7, 1, 0.7] : 0.7,
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "loop"
            }}
            className="w-20 h-20 rounded-full bg-focus-100 flex items-center justify-center mb-4"
          >
            <Mic 
              size={40} 
              className={isListening ? "text-focus-500" : "text-gray-400"} 
            />
          </motion.div>
          
          <h3 className="text-lg font-medium mt-2">
            {isListening ? "Listening..." : "Processing..."}
          </h3>
          
          {transcript && (
            <div className="mt-4 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-md w-full">
              <p className="text-sm">"{transcript}"</p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button
            onClick={onCancel}
            variant="outline"
            className="w-full"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Add TypeScript interfaces for the global window object
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export default SpeechRecognition;
