import React, { useState, useEffect } from 'react';
import MiddleGraphic from './components/MiddleGraphic.js';
import './App.css';
import * as d3 from 'd3'; 

function App() {
  const [selectedStation, setSelectedStation] = useState("5"); 
  const mapRef = React.createRef();

  useEffect(() => {
    const image = d3.select(mapRef.current);
    const svg = image
      .append('svg')
      .attr('width', '471px')
      .attr('height', '695px')
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
  
    const buttons = svg.selectAll('g')
      .data(buttonCoordinates)
      .enter()
      .append('g')
      .attr('transform', function (d) {
        return `translate(${d.x},${d.y})`;
      })
      .on('click', function (event, d) {
        setSelectedStation(d.station);
  
        if (lastClickedButton) {
          lastClickedButton
            .select('circle')
            .style('fill', 'black');
        }
  
        d3.select(this)
          .select('circle')
          .transition()
          .duration(10)
          .style('fill', 'green') 
  
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

    lastClickedButton = buttons.filter(d => d.station === "5");
    lastClickedButton.select('circle').style('fill', 'green');
  }, []);
  
  return (
    <div className="App">
      <div className="row">
        <div className="left-section">
          <div ref={mapRef} className='map'  alt="Mapa Estações" />
        </div>
        <div className="overlay">
          <MiddleGraphic station={selectedStation}/>
        </div>
      </div>
    </div>
  );
}

export default App;
