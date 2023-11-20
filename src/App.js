import React from 'react';
import MiddleGraphic from './components/MiddleGraphic.js'
import RightGraphic from './components/RightGraphic.js';
import InfluxComponent from './components/InfluxComponent.js';
import mapa from './images/map.png';
import './App.css';


function App() {
  const dynamicQuery =  'from(bucket: "weather_recordings") |> range(start: -5m) |> filter(fn: (r) => r._measurement == "36713")';

  return (
    <div className="App">
    
      <div className="row">
        <div className="left-section">
          <img src={mapa} alt="Mapa Estações" />
        </div>
        <div className="middle-section">
          <MiddleGraphic />
        </div> 
       
        <div className ="right-section">
          <div className="graph-container" id="rightGraph">
             {/* <RightGraphic />*/}
           
          </div>
        </div> 
      </div> 
    </div>
  );
}

export default App;
