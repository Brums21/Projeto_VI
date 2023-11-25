import React, { useState, useEffect } from 'react';
import MiddleGraphic from './components/MiddleGraphic.js';
import Select from 'react-select';
import mapa from './images/map2.png';
import './App.css';
import * as d3 from 'd3'; 

function App() {
  const [selectedStation, setSelectedStation] = useState("5"); 
  const mapRef = React.createRef();
  const options_stations = [
    { value: '5', label: '5' },
    { value: '6', label: '6' },
    { value: '7', label: '7' },
  ];

  const handleStationChange = (selected) => {
    setSelectedStation(selected.value);
  };

  useEffect(() => {
    const image = d3.select(mapRef.current);
    const svg = image
      .append('svg')
      .attr('width', '35%')
      .attr('height', '100%')
      .style('position', 'absolute')
      .style('top', 0)
      .style('left', 0)
      .style('z-index', 1);
  
    const buttonCoordinates = [
      { x: 415, y: 182, station: "5" },
      { x: 148, y: 160, station: "6" },
      { x: 100, y: 656, station: "7" },
    ];
  
    let lastClickedButton = null;
  
    // Draw buttons
    const buttons = svg.selectAll('g')
      .data(buttonCoordinates)
      .enter()
      .append('g')
      .attr('transform', function (d) {
        return `translate(${d.x},${d.y})`;
      })
      .on('click', function (event, d) {
        setSelectedStation(d.station);
  
        // Reset the style for the last clicked button (if any)
        if (lastClickedButton) {
          lastClickedButton
            .select('circle')
            .style('fill', 'black');
        }
  
        // Apply the effect to the clicked button
        d3.select(this)
          .select('circle')
          .transition()
          .duration(10)
          .style('fill', 'grey') 
  
        // Update the last clicked button reference
        lastClickedButton = d3.select(this);
      })
      .on('mouseover', function () {
        d3.select(this).select('circle').attr('r', 35);
      })
      .on('mouseout', function () {
        d3.select(this).select('circle').attr('r', 30);
      });
  
    buttons.append('circle')
      .attr('r', 30)
      .style('fill', 'black');
  
    buttons.append('text')
      .text(function (d) {
        return d.station;
      })
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .style('fill', 'white')
      .style('pointer-events', 'none');
  
  }, []);
  

  return (
    <div className="App">
      <div className="row">
        <div className="left-section">
          <div ref={mapRef} className='map'  alt="Mapa Estações" />
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
