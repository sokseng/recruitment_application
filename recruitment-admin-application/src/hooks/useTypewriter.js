import { useEffect, useState } from 'react';

function useTypewriter(text, speed = 120, pause = 1000) {
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout;

    if (!isDeleting && displayed.length < text.length) {
      timeout = setTimeout(() => {
        setDisplayed(text.slice(0, displayed.length + 1));
      }, speed);
    } else if (isDeleting && displayed.length > 0) {
      timeout = setTimeout(() => {
        setDisplayed(text.slice(0, displayed.length - 1));
      }, speed / 2);
    } else {
      timeout = setTimeout(() => {
        setIsDeleting(!isDeleting);
      }, pause);
    }

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, text, speed, pause]);

  return displayed;
}

export default useTypewriter;