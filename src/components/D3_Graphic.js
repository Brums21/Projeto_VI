import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import queryInfluxDB from './influx.js'; // Replace with the actual path

function D3_Graphic({ data, station, meteorology, vehicle_type, date}) {
  const [queryResult1, setQueryResult1] = useState(null);
  const [queryResult2, setQueryResult2] = useState(null);

  console.log(station)
  console.log(vehicle_type)
  console.log(date)
  const start_date = date[0].toLocaleDateString('en-CA')
  const end_date = date[1].toLocaleDateString('en-CA')
  console.log(start_date)
  console.log(end_date)
  const dynamicQuery1 = //inflow
    'import "experimental/aggregate" from(bucket: "processed_cpms") '+
    '|> range(start: '+  start_date  +', stop:'+  end_date  +') '+
    '|> filter(fn: (r) => r["_measurement"] == "' + station + '") '+
    '|> filter(fn: (r) => r["_field"] == "totalCount") '+
    '|> filter(fn: (r) => r["direction"] == "inflow") '+
    '|> filter(fn: (r) => r["object_class"] == "' + vehicle_type + '") '+
    '|> aggregateWindow(every: 1d, fn: sum, createEmpty: true) '+
    '|> yield(name: "mean")';

    const fetchData = async () => {
      try {
        const result1 = await queryInfluxDB(dynamicQuery1);
        setQueryResult1(result1);
  
        const result2 = await queryInfluxDB(getRightQuery());
        setQueryResult2(result2);
      } catch (error) {
        console.error('Error querying InfluxDB:', error);
      }
    };
  
    useEffect(() => {
      if (queryResult1 && queryResult2) {
        updateGraph(data, queryResult1, queryResult2);
      }
    }, [queryResult1, queryResult2, data]);
  
    function getRightQuery() {
      //this function is not dependent on stations, types of vehicles, only time period!
      console.log(meteorology)
      if (meteorology === "temp_avg") {
        return 'from(bucket: "weather_recordings") '+
                '|> range(start: '+  start_date  +', stop:'+  end_date  +') '+
                '|> filter(fn: (r) => r["_measurement"] == "36713") '+
                '|> filter(fn: (r) => r["_field"] == "temp_avg") '+
                '|> filter(fn: (r) => r["period"] == "Dados_10m") '+
                '|> filter(fn: (r) => r["height"] == "10m") '+
                '|> aggregateWindow(every: 1d, fn: mean, createEmpty: false) '+
                '|> yield(name: "mean")';
      }
      if (meteorology === "radiance"){
        return 'from(bucket: "weather_recordings") '+
              '|> range(start: '+  start_date  +', stop:'+  end_date  +') '+
              '|> filter(fn: (r) => r["_measurement"] == "36713")'+
              '|> filter(fn: (r) => r["_field"] == "radiance") '+
              '|> filter(fn: (r) => r["period"] == "Dados_10m") '+
              '|> aggregateWindow(every: 1h, fn: mean, createEmpty: false) '+
              '|> yield(name: "mean")';
      }
      if (meteorology === "precipitation"){
        return 'from(bucket: "weather_recordings") '+
              '|> range(start: '+  start_date  +', stop:'+  end_date  +') '+
              '|> filter(fn: (r) => r["_measurement"] == "36713")'+
              '|> filter(fn: (r) => r["_field"] == "precepitation") '+
              '|> filter(fn: (r) => r["period"] == "Dados_10m") '+
              '|> aggregateWindow(every: 1h, fn: mean, createEmpty: false) '+
              '|> yield(name: "mean")';
      }
      if (meteorology === "humidity_avg"){
        return 'from(bucket: "weather_recordings") '+
              '|> range(start: '+  start_date  +', stop:'+  end_date  +') '+
              '|> filter(fn: (r) => r["_measurement"] == "36713")'+
              '|> filter(fn: (r) => r["_field"] == "humidity_avg") '+
              '|> filter(fn: (r) => r["height"] == "10m") '+
              '|> filter(fn: (r) => r["period"] == "Dados_10m") '+
              '|> aggregateWindow(every: 1h, fn: mean, createEmpty: false) '+
              '|> yield(name: "mean")';
      }
    }
  
    function updateGraph(data, result1, result2) {
      console.log(result1, result2);
      createGraph(data, result1, result2);
    }

    function createGraph(containerId, leftData, rightData) {
      leftData = leftData[0];
      rightData = rightData[0];
    
      const margin = { top: 20, right: 20, bottom: 30, left: 40 };
      const width = 800 - margin.left - margin.right;
      const height = 250 - margin.top - margin.bottom;
    
      // Select the existing SVG if it exists
      let svg = d3.select(`#${containerId} svg`);
    
      // If the SVG exists, update its content instead of removing
      if (!svg.empty()) {
        // Update data and scales
        const xScale = d3.scaleLinear()
          .domain([0, leftData.length - 1])
          .range([0, width]);
    
        const yScaleLeft = d3.scaleLinear()
          .domain([0, d3.max(leftData, d => d["_value"])])
          .range([height, 0 - (d3.max(rightData, d => d["_value"]))]);
    
        const yScaleRight = d3.scaleLinear()
          .domain([0, d3.max(rightData, d => d["_value"])])
          .range([height, 0]);
    
        const lineLeft = d3.line()
          .x((d, i) => xScale(i))
          .y(d => yScaleLeft(d["_value"]));
    
        const lineRight = d3.line()
          .x((d, i) => xScale(i))
          .y(d => yScaleRight(d["_value"]));
    
        // Update existing paths
        svg.select(".line.blue")
          .data([leftData])
          .attr("d", lineLeft);
    
        svg.select(".line.red")
          .data([rightData])
          .attr("d", lineRight);
    
        // Update axes
        svg.select(".axis-left")
          .call(d3.axisLeft(yScaleLeft));
    
        svg.select(".axis-right")
          .attr("transform", `translate(${width}, 0)`)
          .call(d3.axisRight(yScaleRight));
    
        svg.select(".axis-bottom")
          .attr("transform", `translate(0, ${height})`)
          .call(d3.axisBottom(xScale));
      } else {
        // If the SVG does not exist, create a new one
        svg = d3.select(`#${containerId}`)
          .append("svg")
          .attr("width", "100%")
          .attr("height", "100%")
          .append("g")
          .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
        const xScale = d3.scaleLinear()
          .domain([0, leftData.length - 1])
          .range([0, width]);
    
        const yScaleLeft = d3.scaleLinear()
          .domain([0, d3.max(leftData, d => d["_value"])])
          .range([height, 0 - (d3.max(rightData, d => d["_value"]))]);
    
        const yScaleRight = d3.scaleLinear()
          .domain([0, d3.max(rightData, d => d["_value"])])
          .range([height, 0]);
    
        const lineLeft = d3.line()
          .x((d, i) => xScale(i))
          .y(d => yScaleLeft(d["_value"]));
    
        const lineRight = d3.line()
          .x((d, i) => xScale(i))
          .y(d => yScaleRight(d["_value"]));
    
        svg.append("path")
          .data([leftData])
          .attr("class", "line blue")
          .attr("d", lineLeft)
          .attr("fill", "none")
          .attr("stroke", "blue");
    
        svg.append("path")
          .data([rightData])
          .attr("class", "line red")
          .attr("d", lineRight)
          .attr("fill", "none")
          .attr("stroke", "red");
    
        svg.append("g")
          .attr("class", "axis-left")
          .call(d3.axisLeft(yScaleLeft));
    
        svg.append("g")
          .attr("class", "axis-right")
          .attr("transform", `translate(${width}, 0)`)
          .call(d3.axisRight(yScaleRight));
    
        svg.append("g")
          .attr("class", "axis-bottom")
          .attr("transform", `translate(0, ${height})`)
          .call(d3.axisBottom(xScale));
      }
    }
    

  const handleClick = () => {
    fetchData();
  };

  return (
    <div>
      <button style={{marginBottom:"2%"}} onClick={handleClick}>Submit</button>
    </div>
  );
}

export default D3_Graphic;
