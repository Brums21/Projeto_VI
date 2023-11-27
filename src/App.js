import React, { useState, useEffect } from 'react';
import MiddleGraphic from './components/MiddleGraphic.js';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Card from 'react-bootstrap/Card';
import map from './images/map2.png'
import './App.css';
import * as d3 from 'd3'; 

function App() {
  const [selectedStation, setSelectedStation] = useState("5"); 
  const mapRef = React.createRef();

  useEffect(() => {
    const image = d3.select(mapRef.current);
    const svg = image
      .append('svg')
      .attr('width', '490px')
      .attr('height', '980px')
      .style('position', 'absolute')
      .style('top', 0)
      .style('left', 0)
      .style('z-index', 1);
  
    const buttonCoordinates = [
      { x: 445, y: 445, station: "5" },
      { x: 168, y: 418, station: "6" },
      { x: 115, y: 935, station: "7" },
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
        d3.select(this).select('circle').attr('r', 40);
      })
      .on('mouseout', function () {
        d3.select(this).select('circle').attr('r', 35);
      });
  
    buttons.append('circle')
      .attr('r', 35)
      .style('fill', 'black');
  
    buttons.append('text')
      .text(function (d) {
        return d.station;
      })
      .attr('font-size', '25px')
      .attr('text-anchor', 'middle')
      .attr('dy', 10)
      .style('fill', 'white')
      .style('pointer-events', 'none');

    lastClickedButton = buttons.filter(d => d.station === "5");
    lastClickedButton.select('circle').style('fill', 'green');
  }, []);
  
  return (
    <div className="App">
      <Navbar className = "navbar" bg="light" data-bs-theme="light">
        <Container>
          <Navbar.Brand href="">Visualization Information Project</Navbar.Brand>
        </Container>
      </Navbar>
        <Row>
          <Col xs={4} className="mx-auto d-flex justify-content-center">
            <div className="mx-auto">
              <Card style={{ width: '490px', marginLeft: '2%', marginTop: '1%', marginBottom: '1%'}}>
                <Card.Body>
                  <Card.Title>Stations</Card.Title>
                  <Card.Text>
                    There are three main stations for the colletion of road traffic data, each in one different location, provided by the circles on top of the image.  <br/>
                    Select a circle to view the visualization corresponding to that station.
                  </Card.Text>
                </Card.Body>
                <Card.Img style={{marginTop: '2%'}} variant="bottom" src={map} />
              </Card>
            </div>
          </Col>
          <Col xs={8} className="mx-auto d-flex justify-content-center">
            <div ref={mapRef} className='map' alt="Mapa Estações" />
            <div className="overlay">
              <MiddleGraphic station={selectedStation}/>
            </div>
          </Col>
        </Row>     
    </div>
  );
}

export default App;
