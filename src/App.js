import React from 'react';
import Main from './components/d3_scripts';
import InfluxComponent from './components/InfluxComponent';
import mapa from './images/map.png';
import './App.css';

function App() {
  const dynamicQuery =  'from(bucket: "weather_recordings") |> range(start: -5m) |> filter(fn: (r) => r._measurement == "36713")';

  return (
    <div className="App">
    <Main />
    <body>
      <div class="left-section">
      <img src={mapa} alt="Mapa Estações" />
      </div>
      <div class="middle-section">
        <div class="graph-container" id="middleGraph">
          
        </div>
      </div>
      <div class="right-section">
        <div class="graph-container" id="rightGraph">
          
        </div>
      </div>
    <InfluxComponent query={dynamicQuery}/> 
    <h1>Index</h1>
    </body>
    </div>
  );
}

export default App;
