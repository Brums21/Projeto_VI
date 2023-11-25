import React, { useState } from 'react';
import MiddleGraphic from './components/MiddleGraphic.js';
import Select from 'react-select';
import mapa from './images/map.png';
import './App.css';

function App() {
  const [selectedStation, setSelectedStation] = useState("5"); 

  const options_stations = [
    { value: '5', label: '5' },
    { value: '6', label: '6' },
    { value: '7', label: '7' },
  ];

  const handleStationChange = (selected) => {
    setSelectedStation(selected.value);
  };

  return (
    <div className="App">
      <div className="row">
        <div className="left-section">
          <img src={mapa} alt="Mapa Estações" />
        </div>
        <div className="overlay">
        <div className="station">
          <div style={{ marginBottom: "5%" }}>
            Station:
            <Select
              value={options_stations.find(opt => opt.value === selectedStation)}
              onChange={handleStationChange}
              options={options_stations}
            />
          </div>
        </div>
        <MiddleGraphic station={selectedStation}/>
        </div>
      </div>
    </div>
  );
}

export default App;
