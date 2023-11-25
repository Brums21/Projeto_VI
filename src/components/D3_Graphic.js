import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import queryInfluxDB from './influx.js'; // Replace with the actual path

function D3_Graphic({ data, station, meteorology, vehicle_type, date, graph_type}) {
  const [queryResult1, setQueryResult1] = useState(null);
  const [queryResult2, setQueryResult2] = useState(null);
  const [queryResult3, setQueryResult3] = useState(null);
  const [queryResult4, setQueryResult4] = useState(null);
  const [queryResult5, setQueryResult5] = useState(null);
  const [queryResult6, setQueryResult6] = useState(null);

  let day_or_hour = "1d"

  const start_date = date[0].toLocaleDateString('en-CA')
  const end_date = date[1].toLocaleDateString('en-CA')

  const numberOfDays = Math.round((date[1] - date[0]) / (24 * 60 * 60 * 1000));
  if (numberOfDays<=2){
    day_or_hour = "1h"  //TODO: not functional yet 
  }

  const fetchData = async () => {
    try {
      //first graph
      if (graph_type === "speed_meteorological"){
        console.log(2)
        const result1 = await queryInfluxDB(getMeteorologicalQuery());
        setQueryResult1(result1);

        const result2 = await queryInfluxDB(cpms("average_speed", "mean"));  //avg speed
        setQueryResult2(result2);

        const result3 = await queryInfluxDB(cpms("average_speed", "max"));  //maxAvgSpeed
        setQueryResult3(result3);

        const result4 = await queryInfluxDB(cpms("average_speed", "min"));  //minAvgSpeed
        setQueryResult4(result4);

        const result5 = await queryInfluxDB(cpms("maximum_speed", "max"));  //maxSpeed
        setQueryResult5(result5);

        const result6 = await queryInfluxDB(cpms("minimum_speed", "min"));  //minSpeed
        setQueryResult6(result6);

        createFirstGraph(data, result1, result2, result3, result4, result5, result6);
      }
      else if (graph_type === "inflow_meteorological"){ //DONE
        const result1 = await queryInfluxDB(getMeteorologicalQuery());
        setQueryResult1(result1);

        const result2 = await queryInfluxDB(cpms("totalCount", "count"));
        setQueryResult2(result2);

        createSecondGraph(data, result2, result1);
      }
      else if (graph_type === "speed_traffic"){
        const result1 = await queryInfluxDB(cpms("totalCount", "count"));
        setQueryResult1(result1);

        const result2 = await queryInfluxDB(cpms("average_speed", "mean"));  //avg speed
        setQueryResult2(result2);

        const result3 = await queryInfluxDB(cpms("average_speed", "max"));  //maxAvgSpeed
        setQueryResult3(result3);

        const result4 = await queryInfluxDB(cpms("average_speed", "min"));  //minAvgSpeed
        setQueryResult4(result4);

        const result5 = await queryInfluxDB(cpms("maximum_speed", "max"));  //maxSpeed
        setQueryResult5(result5);

        const result6 = await queryInfluxDB(cpms("minimum_speed", "min"));  //minSpeed
        setQueryResult6(result6);

        createThirdGraph(data, result1, result2, result3, result4, result5, result6);
      }
    } catch (error) {
      console.error('Error querying InfluxDB:', error);
    }
  };


  //done and functional
  function getMeteorologicalQuery() {
    //this function is not dependent on stations, types of vehicles, only time period!
    console.log(meteorology)
    if (meteorology === "temp_avg" || meteorology === "humidity_avg") {
      return 'from(bucket: "weather_recordings") '+
              '|> range(start: '+  start_date  +', stop:'+  end_date  +') '+
              '|> filter(fn: (r) => r["_measurement"] == "36713") '+
              '|> filter(fn: (r) => r["_field"] == "'+  meteorology  +'") '+
              '|> filter(fn: (r) => r["period"] == "Dados_10m") '+
              '|> filter(fn: (r) => r["height"] == "10m") '+
              '|> aggregateWindow(every: 1d, fn: mean, createEmpty: false) '+
              '|> yield(name: "mean")';
    }
    else{
      return 'from(bucket: "weather_recordings") '+
      '|> range(start: '+  start_date  +', stop:'+  end_date  +') '+
      '|> filter(fn: (r) => r["_measurement"] == "36713") '+
      '|> filter(fn: (r) => r["_field"] == "'+  meteorology  +'") '+
      '|> filter(fn: (r) => r["period"] == "Dados_10m") ' +
      '|> aggregateWindow(every: 1d, fn: mean, createEmpty: false) '+
      '|> yield(name: "mean")';
    }
  
  }

  //done and functional
  function cpms(field, fn){ //field -  totalCount, average_speed, maximum_speed, minimum_speed; fn - min, max, mean
    return 'from(bucket: "processed_cpms")' +
      '|> range(start: '+  start_date  +', stop: '+  end_date  +')'+
      '|> filter(fn: (r) => r["_measurement"] == "' + station + '")'+
      '|> filter(fn: (r) => r["_field"] == "' + field + '")'+
      '|> filter(fn: (r) => r["direction"] == "inflow")'+
      '|> filter(fn: (r) => r["object_class"] == "' + vehicle_type + '")'+
      '|> aggregateWindow(every: ' + day_or_hour + ', fn: '+ fn +', createEmpty: false)'+
      '|> yield(name: "' + fn +'")'
  }

  //done and functional
  function createSecondGraph(containerId, leftData, rightData) {
    leftData = leftData[0];
    rightData = rightData[0];
  
    const margin = { top: 50, right: 100, bottom: 30, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    let svg = d3.select(`#${containerId} svg`);
  
    if (!svg.empty()) { svg.remove(); } //if there is already an svg, delete it 1st, and only then populate another one
    
    svg = d3.select(`#${containerId}`)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    let minYValueleft = d3.min(leftData, d => d["_value"]);
    let minYValueright = d3.min(rightData, d => d["_value"]);
    let maxYValueleft = d3.max(leftData, d => d["_value"]);
    let maxYValueright = d3.max(rightData, d => d["_value"]);

    const xScale = d3.scaleTime()
      .domain(d3.extent(leftData, d => d["_time"]))
      .range([0, width]);

    const yScaleLeft = d3.scaleLinear()
      .domain([minYValueleft - minYValueleft * 0.1, maxYValueleft + maxYValueleft * 0.1])
      .range([height, 0]);

    const yScaleRight = d3.scaleLinear()
      .domain([minYValueright - minYValueright * 0.1, maxYValueright + maxYValueright * 0.1])
      .range([height, 0]);

    const lineLeft = d3.line()
      .x(d => xScale(d["_time"]))
      .y(d => yScaleLeft(d["_value"]));

    const lineRight = d3.line()
      .x(d => xScale(d["_time"]))
      .y(d => yScaleRight(d["_value"]));

    let texto = "";
    if (meteorology === "temp_avg"){
      texto = "Temperature (ºC)"
    }
    else if (meteorology === "radiance"){
      texto = "Radiance (W/m2-sr)"
    }
    else if (meteorology === "precepitation"){
      texto = "Precipitation (mm)"
    }
    else if (meteorology === "humidity_avg"){
      texto = "Humidity (%)"
    }

    // subtitles
    svg.append("line")
      .attr("x1", width+50)
      .attr("y1", 100)
      .attr("x2", width+60) 
      .attr("y2", 100)
      .style("stroke", "blue")
      .style("stroke-width", 1);
    
    svg.append("text")
      .attr("class", "axis-left")
      .attr("x", width+65)
      .attr("y", 100)
      .attr("dy", ".25em")
      .attr("font-size", "11px")
      .text("Number of vehicles");

    svg.append("line")
      .attr("x1", width+50)
      .attr("y1", 120)
      .attr("x2", width+60) 
      .attr("y2", 120)
      .style("stroke", "red")
      .style("stroke-width", 1);
    
    svg.append("text")
      .attr("class", "axis-left")
      .attr("x", width+65)
      .attr("y", 120)
      .attr("dy", ".25em")
      .attr("font-size", "11px")
      .text(texto);

    // legenda in axis
    svg.append("text")
      .attr("class", "axis-left")
      .attr("text-anchor", "end")
      .attr("x", 70)
      .attr("y", -13)
      .attr("dy", ".2em")
      .text("Number of vehicles");
    
    svg.append("text")
      .attr("class", "axis-right")
      .attr("x", width)
      .attr("y", -13)
      .attr("dy", ".2em")
      .text(texto);
    
    // end subtitles

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

    if (rightData.length>= 20) {
      svg.append("g")
        .attr("class", "axis-bottom")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeDay.every(1)))
        .selectAll("text")  
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-65)" );
    }
    else {
      svg.append("g")
        .attr("class", "axis-bottom")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeDay.every(1)));
    }
    
  }

  //done and functional
  function createFirstGraph(containerId, meteorologicalData, avgSpeed, maxAvgSpeed, minAvgSpeed, maxSpeed, minSpeed) {
  
    const margin = { top: 50, right: 100, bottom: 30, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    let svg = d3.select(`#${containerId} svg`);
  
    if (!svg.empty()) { svg.remove(); } //if there is already an svg, delete it 1st, and only then populate another one
    
    meteorologicalData = meteorologicalData[0]
    avgSpeed = avgSpeed[0]
    maxAvgSpeed = maxAvgSpeed[0]
    minAvgSpeed = minAvgSpeed[0]
    maxSpeed = maxSpeed[0]
    minSpeed = minSpeed[0]

    const boxplotData = avgSpeed.map((value, index) => {
        return {
          avgSpeed: avgSpeed[index]["_value"]*0.036,
          maxAvgSpeed: maxAvgSpeed[index]["_value"]*0.036,
          minAvgSpeed: minAvgSpeed[index]["_value"]*0.036,
          maxSpeed: maxSpeed[index]["_value"]*0.036,
          minSpeed: minSpeed[index]["_value"]*0.036,
          _time: avgSpeed[index]["_time"]
        };
    });

    const timeExtent = d3.extent(meteorologicalData, d => d["_time"]);
    const timePadding = 24*60*60*500; 
    const startTime = new Date(timeExtent[0].getTime() - timePadding);
    const endTime = new Date(timeExtent[1].getTime() + timePadding);

    console.log("boxplot data", boxplotData);

    svg = d3.select(`#${containerId}`)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    let minYValueright = d3.min(meteorologicalData, d => d["_value"]);
    let maxYValueright = d3.max(meteorologicalData, d => d["_value"]);
    let minYValueleft = d3.min(boxplotData, d => d.minSpeed);
    let maxYValueleft = d3.max(boxplotData, d => d.maxSpeed);

    const width_box = 20;

    const xScale = d3.scaleTime()
      .domain([startTime, endTime])
      .range([0, width]);

    const yScaleRight = d3.scaleLinear()
      .domain([minYValueright - minYValueright * 0.1, maxYValueright + maxYValueright * 0.1])
      .range([height, 0]);

    const yScaleLeft = d3.scaleLinear()
      .domain([minYValueleft - minYValueleft * 0.1, maxYValueleft + maxYValueleft * 0.1])
      .range([height, 0]);

    const lineRight = d3.line()
      .x(d => xScale(d["_time"]))
      .y(d => yScaleRight(d["_value"]));

    const lineLeft = d3.line()
      .x(d => xScale(d["_time"]))
      .y(d => yScaleLeft(d["_value"]));

    svg.append("path")
      .data([avgSpeed])
      .attr("class", "line blue")
      .attr("d", lineLeft)
      .attr("fill", "none")
      .attr("stroke", "blue");    //TODO: check why this isnt working

    svg.selectAll("verticalLines")
      .data(boxplotData)
      .enter()
      .append("line")
        .attr("x1", d => xScale(d._time))
        .attr("x2", d => xScale(d._time))
        .attr("y1", d => yScaleLeft(d.minSpeed))
        .attr("y2", d => yScaleLeft(d.maxSpeed))
        .attr("stroke", "black");

    svg.selectAll("boxes")
      .data(boxplotData)
      .enter()
      .append("rect")
        .attr("x", d => xScale(d._time) - width_box/2)
        .attr("y", d => yScaleLeft(d.maxAvgSpeed))
        .attr("height", d => yScaleLeft(d.minAvgSpeed) - yScaleLeft(d.maxAvgSpeed))
        .attr("width", width_box) 
        .attr("stroke", "black")
        .attr("fill", "#69b3a2");

    svg.selectAll("medianLines")
      .data(boxplotData)
      .enter()
      .append("line")
        .attr("x1", d => xScale(d._time) - width_box/2) 
        .attr("x2", d => xScale(d._time) + width_box/2) 
        .attr("y1", d => yScaleLeft(d.avgSpeed))
        .attr("y2", d => yScaleLeft(d.avgSpeed))
        .attr("stroke", "black");

    svg.append("path")
      .data([meteorologicalData])
      .attr("class", "line red")
      .attr("d", lineRight)
      .attr("fill", "none")
      .attr("stroke", "red");

    svg.append("g")
      .attr("class", "axis-right")
      .attr("transform", `translate(${width}, 0)`)
      .call(d3.axisRight(yScaleRight));

    svg.append("g")
      .attr("class", "axis-left")
      .call(d3.axisLeft(yScaleLeft));
      
    let texto = "";
    if (meteorology === "temp_avg"){
      texto = "Temperature (ºC)"
    }
    else if (meteorology === "radiance"){
      texto = "Radiance (W/m2-sr)"
    }
    else if (meteorology === "precepitation"){
      texto = "Precipitation (mm)"
    }
    else if (meteorology === "humidity_avg"){
      texto = "Humidity (%)"
    }

    // boxplot legenda
    svg.append("line")
      .attr("x1", width+55)
      .attr("y1", 105)
      .attr("x2", width+55) 
      .attr("y2", 95)
      .style("stroke", "black")
      .style("stroke-width", 1);
    
    svg.append("line")
      .attr("x1", width+55)
      .attr("y1", 55)
      .attr("x2", width+55) 
      .attr("y2", 65)
      .style("stroke", "black")
      .style("stroke-width", 1);

    svg.append("rect")
      .attr("x", width+50)
      .attr("y", 65)
      .attr("height", 30)
      .attr("width", 10) 
      .attr("stroke", "black")
      .attr("fill", "#69b3a2");
    
    svg.append("line")
      .attr("x1", width+60)
      .attr("y1", 80)
      .attr("x2", width+50) 
      .attr("y2", 80)
      .style("stroke", "black")
      .style("stroke-width", 1);

    svg.append("text")
      .attr("class", "axis-left")
      .attr("x", width+68)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-size", "11px")
      .text("Vehicle Speed");

    //line legenda
    svg.append("line")
      .attr("x1", width+50)
      .attr("y1", 120)
      .attr("x2", width+60) 
      .attr("y2", 120)
      .style("stroke", "red")
      .style("stroke-width", 1);

    svg.append("text")
      .attr("class", "axis-left")
      .attr("x", width+65)
      .attr("y", 120)
      .attr("dy", ".25em")
      .attr("font-size", "11px")
      .text(texto);
    
    // legenda in axis
    svg.append("text")
      .attr("class", "axis-left")  
      .attr("x", -30)
      .attr("y", -13)
      .attr("dy", ".2em")
      .text("Vehicle speed (km/h)");

    svg.append("text")
      .attr("class", "axis-right")
      .attr("x", width)
      .attr("y", -13)
      .attr("dy", ".2em")
      .text(texto);
    
    // end subtitles

    if (meteorologicalData.length>= 20) {
      svg.append("g")
        .attr("class", "axis-bottom")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeDay.every(1)))
        .selectAll("text")  
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-65)" );
    }
    else {
      svg.append("g")
        .attr("class", "axis-bottom")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeDay.every(1)));
    }

  }

  //done and functional
  function createThirdGraph(containerId, meteorologicalData, avgSpeed, maxAvgSpeed, minAvgSpeed, maxSpeed, minSpeed) {
    const margin = { top: 50, right: 100, bottom: 30, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    let svg = d3.select(`#${containerId} svg`);
  
    if (!svg.empty()) { svg.remove(); } //if there is already an svg, delete it 1st, and only then populate another one
    
    meteorologicalData = meteorologicalData[0]
    avgSpeed = avgSpeed[0]
    maxAvgSpeed = maxAvgSpeed[0]
    minAvgSpeed = minAvgSpeed[0]
    maxSpeed = maxSpeed[0]
    minSpeed = minSpeed[0]

    const boxplotData = avgSpeed.map((value, index) => {
        return {
          avgSpeed: avgSpeed[index]["_value"]*0.036,
          maxAvgSpeed: maxAvgSpeed[index]["_value"]*0.036,
          minAvgSpeed: minAvgSpeed[index]["_value"]*0.036,
          maxSpeed: maxSpeed[index]["_value"]*0.036,
          minSpeed: minSpeed[index]["_value"]*0.036,
          _time: avgSpeed[index]["_time"]
        };
    });

    const timeExtent = d3.extent(meteorologicalData, d => d["_time"]);
    const timePadding = 24*60*60*500; 
    const startTime = new Date(timeExtent[0].getTime() - timePadding);
    const endTime = new Date(timeExtent[1].getTime() + timePadding);

    console.log("boxplot data", boxplotData);

    svg = d3.select(`#${containerId}`)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    let minYValueright = d3.min(meteorologicalData, d => d["_value"]);
    let maxYValueright = d3.max(meteorologicalData, d => d["_value"]);
    let minYValueleft = d3.min(boxplotData, d => d.minSpeed);
    let maxYValueleft = d3.max(boxplotData, d => d.maxSpeed);

    const width_box = 20;

    const xScale = d3.scaleTime()
      .domain([startTime, endTime])
      .range([0, width]);

    const yScaleRight = d3.scaleLinear()
      .domain([minYValueright - minYValueright * 0.1, maxYValueright + maxYValueright * 0.1])
      .range([height, 0]);

    const yScaleLeft = d3.scaleLinear()
      .domain([minYValueleft - minYValueleft * 0.1, maxYValueleft + maxYValueleft * 0.1])
      .range([height, 0]);

    const lineRight = d3.line()
      .x(d => xScale(d["_time"]))
      .y(d => yScaleRight(d["_value"]));

    const lineLeft = d3.line()
      .x(d => xScale(d["_time"]))
      .y(d => yScaleLeft(d["_value"]));

    svg.append("path")
      .data([avgSpeed])
      .attr("class", "line blue")
      .attr("d", lineLeft)
      .attr("fill", "none")
      .attr("stroke", "blue");    //TODO: check why this isnt working

    svg.selectAll("verticalLines")
      .data(boxplotData)
      .enter()
      .append("line")
        .attr("x1", d => xScale(d._time))
        .attr("x2", d => xScale(d._time))
        .attr("y1", d => yScaleLeft(d.minSpeed))
        .attr("y2", d => yScaleLeft(d.maxSpeed))
        .attr("stroke", "black");

    svg.selectAll("boxes")
      .data(boxplotData)
      .enter()
      .append("rect")
        .attr("x", d => xScale(d._time) - width_box/2)
        .attr("y", d => yScaleLeft(d.maxAvgSpeed))
        .attr("height", d => yScaleLeft(d.minAvgSpeed) - yScaleLeft(d.maxAvgSpeed))
        .attr("width", width_box) 
        .attr("stroke", "black")
        .attr("fill", "#69b3a2");

    svg.selectAll("medianLines")
      .data(boxplotData)
      .enter()
      .append("line")
        .attr("x1", d => xScale(d._time) - width_box/2) 
        .attr("x2", d => xScale(d._time) + width_box/2) 
        .attr("y1", d => yScaleLeft(d.avgSpeed))
        .attr("y2", d => yScaleLeft(d.avgSpeed))
        .attr("stroke", "black");

    svg.append("path")
      .data([meteorologicalData])
      .attr("class", "line red")
      .attr("d", lineRight)
      .attr("fill", "none")
      .attr("stroke", "red");

    svg.append("g")
      .attr("class", "axis-right")
      .attr("transform", `translate(${width}, 0)`)
      .call(d3.axisRight(yScaleRight));

    svg.append("g")
      .attr("class", "axis-left")
      .call(d3.axisLeft(yScaleLeft));
    
    // boxplot legenda
    svg.append("line")
      .attr("x1", width+55)
      .attr("y1", 105)
      .attr("x2", width+55) 
      .attr("y2", 95)
      .style("stroke", "black")
      .style("stroke-width", 1);
    
    svg.append("line")
      .attr("x1", width+55)
      .attr("y1", 55)
      .attr("x2", width+55) 
      .attr("y2", 65)
      .style("stroke", "black")
      .style("stroke-width", 1);

    svg.append("rect")
      .attr("x", width+50)
      .attr("y", 65)
      .attr("height", 30)
      .attr("width", 10) 
      .attr("stroke", "black")
      .attr("fill", "#69b3a2");
    
    svg.append("line")
      .attr("x1", width+60)
      .attr("y1", 80)
      .attr("x2", width+50) 
      .attr("y2", 80)
      .style("stroke", "black")
      .style("stroke-width", 1);

    svg.append("text")
      .attr("class", "axis-left")
      .attr("x", width+68)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-size", "11px")
      .text("Vehicle Speed");

    //line legenda
    svg.append("line")
      .attr("x1", width+50)
      .attr("y1", 120)
      .attr("x2", width+60) 
      .attr("y2", 120)
      .style("stroke", "red")
      .style("stroke-width", 1);

    svg.append("text")
      .attr("class", "axis-left")
      .attr("x", width+65)
      .attr("y", 120)
      .attr("dy", ".25em")
      .attr("font-size", "11px")
      .text("Number of vehicles");
    
    // in axis legenda
    svg.append("text")
      .attr("class", "axis-left")  
      .attr("x", -30)
      .attr("y", -13)
      .attr("dy", ".2em")
      .text("Vehicle speed (km/h)");

    svg.append("text")
      .attr("class", "axis-right")  
      .attr("x", width-50)
      .attr("y", -13)
      .attr("dy", ".2em")
      .text("Number of vehicles");
    
    // end subtitles
    

    if (meteorologicalData.length>= 20) {
      svg.append("g")
        .attr("class", "axis-bottom")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeDay.every(1)))
        .selectAll("text")  
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-65)" );
    }
    else {
      svg.append("g")
        .attr("class", "axis-bottom")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeDay.every(1)));
    }
    
  }
  
  useEffect(() => {
    fetchData();
  }, [station, meteorology, vehicle_type, date, graph_type]);

  return (
    <div>
      Put title here!
    </div>
  );
}

export default D3_Graphic;
