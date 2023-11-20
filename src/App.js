import React from 'react';
import MiddleGraphic from './components/MiddleGraphic.js'
import StationComponent from './components/StationComponent.js';
import mapa from './images/map.png';
import './App.css';

function App() {
  return (
    <div className="App">
      <div className="row">
        <div className="left-section">
          <img src={mapa} alt="Mapa Estações" />
        </div>
        <div className="overlay">
          <StationComponent />
           
          <MiddleGraphic />

        </div>
      </div>
    </div>
  );
}

export default App;
