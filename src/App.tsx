import { useState, useEffect } from 'react';
import EuropeMap from './EuropeMap';
import WelcomePopup from './components/WelcomePopup';
import './App.css';

function App() {
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    // Vérifier si c'est la première visite
    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      setShowWelcome(true);
      localStorage.setItem('hasVisited', 'true');
    }
  }, []);

  const handleClose = () => {
    setShowWelcome(false);
  };

  return (
    <>
      <EuropeMap />
      <WelcomePopup 
        open={showWelcome} 
        onClose={handleClose}
      />
    </>
  );
}

export default App;