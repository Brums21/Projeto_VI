import React from 'react';
import MiddleGraphic from './components/MiddleGraphic.js'
import RightGraphic from './components/RightGraphic.js';
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
          
          <div className="middle-right-section">
            <div className="middle-section">
              <MiddleGraphic />
            </div>
            <div className="right-section">
              <div className="graph-container" id="rightGraph">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
