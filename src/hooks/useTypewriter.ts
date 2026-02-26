import { useState, useEffect, useRef } from 'react';

interface UseTypewriterOptions {
  texts: string[];
  typeSpeed?: number;
  deleteSpeed?: number;
  pauseDuration?: number;
}

export function useTypewriter({ texts, typeSpeed = 60, deleteSpeed = 30, pauseDuration = 2500 }: UseTypewriterOptions) {
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const currentFullText = texts[textIndex];

    if (!isDeleting) {
      if (displayText.length < currentFullText.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        }, typeSpeed);
      } else {
        timeoutRef.current = setTimeout(() => setIsDeleting(true), pauseDuration);
      }
    } else {
      if (displayText.length > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, deleteSpeed);
      } else {
        setIsDeleting(false);
        setTextIndex((prev) => (prev + 1) % texts.length);
      }
    }

    return () => clearTimeout(timeoutRef.current);
  }, [displayText, isDeleting, textIndex, texts, typeSpeed, deleteSpeed, pauseDuration]);

  return { displayText, textIndex };
}
