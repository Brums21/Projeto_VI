import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import queryInfluxDB from './influx.js'; // Replace with the actual path
import { Accordion } from 'react-bootstrap';

function D3_Graphic({ data, station, meteorology, vehicle_type, date, graph_type}) {
  const [title, setTitle] = useState(null);

  let day_or_hour = "1d";

  const start_date = date[0].toLocaleDateString('en-CA')
  const end_date = date[1].toLocaleDateString('en-CA')

  const start_date_ = new Date(date[0]);
  const end_date_ = new Date(date[1]);

  const fetchData = async () => { 
    day_or_hour = "1d"
    if( (end_date_- start_date_) / (1000 * 60 * 60 * 24) < 2){
      day_or_hour = "1h"
    }
    else if ((end_date_- start_date_) / (1000 * 60 * 60 * 24) <= 4){
      day_or_hour = "3h"
    }
    console.log((start_date_ -  end_date_ ) / (1000 * 60 * 60 * 24))
    try {
      //first graph
      if (graph_type === "speed_meteorological"){
        setTitle("Relation between meteorological data and vehicle speed")

        const result1 = await queryInfluxDB(getMeteorologicalQuery())
        const result2 = await queryInfluxDB(cpms("average_speed", "mean"));  //avg speed
        const result3 = await queryInfluxDB(cpms("average_speed", "max"));  //maxAvgSpeed
        const result4 = await queryInfluxDB(cpms("average_speed", "min"));  //minAvgSpeed
        const result5 = await queryInfluxDB(cpms("maximum_speed", "max"));  //maxSpeed
        const result6 = await queryInfluxDB(cpms("minimum_speed", "min"));  //minSpeed

        createFirstGraph(data, result1, result2, result3, result4, result5, result6);
      }
      else if (graph_type === "inflow_meteorological"){ //DONE
        setTitle("Relation between meteorological data and vehicle inflow")
        const result1 = await queryInfluxDB(getMeteorologicalQuery());
        const result2 = await queryInfluxDB(cpms("totalCount", "count"));

        createSecondGraph(data, result2, result1);
      }
      else if (graph_type === "speed_traffic"){
        setTitle("Relation between vehicle speed and vehicle inflow")

        const result1 = await queryInfluxDB(cpms("totalCount", "count"));
        const result2 = await queryInfluxDB(cpms("average_speed", "mean"));  //avg speed
        const result3 = await queryInfluxDB(cpms("average_speed", "max"));  //maxAvgSpeed
        const result4 = await queryInfluxDB(cpms("average_speed", "min"));  //minAvgSpeed
        const result5 = await queryInfluxDB(cpms("maximum_speed", "max"));  //maxSpeed
        const result6 = await queryInfluxDB(cpms("minimum_speed", "min"));  //minSpeed
        createThirdGraph(data, result1, result2, result3, result4, result5, result6);
      }
    } catch (error) {
      console.error('Error querying InfluxDB:', error);
    }
  };

  //done and functional
  function getMeteorologicalQuery() {
    //this function is not dependent on stations, types of vehicles, only time period!
    if (meteorology === "temp_avg" || meteorology === "humidity_avg") {
      return 'from(bucket: "weather_recordings") '+
              '|> range(start: '+  start_date  +', stop:'+  end_date  +') '+
              '|> filter(fn: (r) => r["_measurement"] == "36713") '+
              '|> filter(fn: (r) => r["_field"] == "'+  meteorology  +'") '+
              '|> filter(fn: (r) => r["period"] == "Dados_10m") '+
              '|> filter(fn: (r) => r["height"] == "10m") '+
              '|> aggregateWindow(every: ' + day_or_hour + ', fn: mean, createEmpty: false) '+
              '|> yield(name: "mean")';
    }
    else{
      return 'from(bucket: "weather_recordings") '+
      '|> range(start: '+  start_date  +', stop:'+  end_date  +') '+
      '|> filter(fn: (r) => r["_measurement"] == "36713") '+
      '|> filter(fn: (r) => r["_field"] == "'+  meteorology  +'") '+
      '|> filter(fn: (r) => r["period"] == "Dados_10m") ' +
      '|> aggregateWindow(every: ' + day_or_hour + ', fn: mean, createEmpty: false) '+
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
  
    const margin = { top: 50, right: 100, bottom: 30, left: 80};
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
      .attr("x1", width+80)
      .attr("y1", 100)
      .attr("x2", width+90) 
      .attr("y2", 100)
      .style("stroke", "blue")
      .style("stroke-width", 1);
    
    svg.append("text")
      .attr("class", "axis-left")
      .attr("x", width+95)
      .attr("y", 100)
      .attr("dy", ".25em")
      .attr("font-size", "11px")
      .text("Number of vehicles");

    svg.append("line")
      .attr("x1", width+80)
      .attr("y1", 120)
      .attr("x2", width+90) 
      .attr("y2", 120)
      .style("stroke", "red")
      .style("stroke-width", 1);
    
    svg.append("text")
      .attr("class", "axis-left")
      .attr("x", width+95)
      .attr("y", 120)
      .attr("dy", ".25em")
      .attr("font-size", "11px")
      .text(texto);

    // legenda in axis
    svg.append("text")
      .attr("class", "axis-left")
      .attr("transform", "rotate(-90)" )
      .attr("text-anchor", "end")
      .attr("x", -10)
      .attr("y", -60)
      .attr("dy", ".2em")
      .text("Number of vehicles");
    
    svg.append("text")
      .attr("class", "axis-right")
      .attr("transform", "rotate(90)" )
      .attr("x", 20)
      .attr("y", -width-50)
      .attr("dy", ".2em")
      .text(texto);
    
    // end subtitles

    svg.append("path")
      .data([leftData])
      .attr("class", "line blue")
      .attr("d", lineLeft)
      .attr("fill", "none")
      .attr("stroke", "blue");

    svg.selectAll(".point-left")
      .data(leftData)
      .enter().append("circle")
      .attr("class", "point-left")
      .attr("cx", d => xScale(d["_time"]))
      .attr("cy", d => yScaleLeft(d["_value"]))
      .attr("r", 2)  
      .style("fill", "blue");

    svg.append("path")
      .data([rightData])
      .attr("class", "line red")
      .attr("d", lineRight)
      .attr("fill", "none")
      .attr("stroke", "red");

    svg.selectAll(".point-right")
      .data(rightData)
      .enter()
      .append("circle")
        .attr("class", "point-right")
        .attr("cx", d => xScale(d["_time"]))
        .attr("cy", d => yScaleRight(d["_value"]))
        .attr("r", 2) 
        .style("fill", "red");  

    svg.append("g")
      .attr("class", "axis-left")
      .call(d3.axisLeft(yScaleLeft));

    svg.append("g")
      .attr("class", "axis-right")
      .attr("transform", `translate(${width}, 0)`)
      .call(d3.axisRight(yScaleRight));

    console.log(day_or_hour)
    if (day_or_hour === "1h") {
      svg.append("g")
        .attr("class", "axis-bottom")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeHour.every(1)))
        .selectAll("text")  
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-65)" );
    } else if (day_or_hour === "3h") {
      svg.append("g")
        .attr("class", "axis-bottom")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeHour.every(3)))
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

    
    //tooltip rectangle
    const tooltip = svg.append("rect")
      .attr("x", width+80)
      .attr("y", 65)
      .attr("height", 70)
      .attr("width", 200) 
      .attr("font-weight", 700)
      .style("opacity", 0)
      .attr("stroke", "black")
      .attr("fill", "#dc7764");

    const tooltipTextTime = svg.append("text")
      .text("sometext")
      .attr("x", width + 85)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-weight", 500)
      .attr("font-size", "13px")
      .style("opacity", 0);

    const tooltipTextValueRight = svg.append("text")
      .text("sometext")
      .attr("x", width + 85)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-weight", 500)
      .attr("font-size", "13px")
      .style("opacity", 0);

    const tooltipTextValueLeft = svg.append("text")
      .text("sometext")
      .attr("x", width + 85)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-weight", 500)
      .attr("font-size", "13px")
      .style("opacity", 0);

    svg.selectAll(".point-right")
      .on("mouseover", function(event, d) {
        console.log(leftData)
        const foundObject = leftData.find(obj => obj["_time"].getTime() === d["_time"].getTime());

        tooltip.style("opacity", 0.8)
            .attr("x", d3.pointer(event)[0] + 10)
            .attr("y", d3.pointer(event)[1])
            .attr("fill", "#dc7764");

        if (day_or_hour === "1d"){
          tooltipTextTime.style("opacity", 1)
            .text("Time: " + d["_time"].getDate() + "/" + d["_time"].getMonth() + "/" + d["_time"].getFullYear())
            .attr("dy", "0em")
            .attr("x", d3.pointer(event)[0] + 15)
            .attr("y", d3.pointer(event)[1] + 15);
        }
        else {
          tooltipTextTime.style("opacity", 1)
            .text("Time: " + d["_time"].getDate() + "/" + d["_time"].getMonth() + "/" + d["_time"].getFullYear() + " " + d["_time"].getHours().toLocaleString('en-US', {minimumIntegerDigits: 2}) + ":00:00")
            .attr("dy", "0em")
            .attr("x", d3.pointer(event)[0] + 15)
            .attr("y", d3.pointer(event)[1] + 15)
        }
      
        tooltipTextValueRight.style("opacity", 1)
            .text(texto + ": " + d["_value"].toFixed(3))
            .attr("dy", "0em")
            .attr("x", d3.pointer(event)[0] + 15)
            .attr("y", d3.pointer(event)[1] + 35)
        
            
        tooltipTextValueLeft.style("opacity", 1)
            .text("Number of vehicles: " + foundObject["_value"].toLocaleString('hi-IN'))
            .attr("dy", "0em")
            .attr("x", d3.pointer(event)[0] + 15)
            .attr("y", d3.pointer(event)[1] + 55)
      })
      .on("mouseout", function(event, d) {
        tooltip.attr("x", width+80)
              .attr("y", 65)
              .style("opacity", 0);
        tooltipTextTime.attr("x", width+80)
          .attr("y", 65)
          .style("opacity", 0);
        tooltipTextValueLeft.attr("x", width+80)
          .attr("y", 65)
          .style("opacity", 0);
        tooltipTextValueRight.attr("x", width+80)
          .attr("y", 65)
          .style("opacity", 0);
      });

    svg.selectAll(".point-left")
      .on("mouseover", function(event, d) {
        console.log(leftData)
        const foundObject = rightData.find(obj => obj["_time"].getTime() === d["_time"].getTime());

        tooltip.style("opacity", 0.8)
            .attr("x", d3.pointer(event)[0] + 10)
            .attr("y", d3.pointer(event)[1])
            .attr("fill", "#377df0");

        if (day_or_hour === "1d"){
          tooltipTextTime.style("opacity", 1)
            .text("Time: " + d["_time"].getDate() + "/" + d["_time"].getMonth() + "/" + d["_time"].getFullYear())
            .attr("dy", "0em")
            .attr("x", d3.pointer(event)[0] + 15)
            .attr("y", d3.pointer(event)[1] + 15);
        }
        else {
          tooltipTextTime.style("opacity", 1)
            .text("Time: " + d["_time"].getDate() + "/" + d["_time"].getMonth() + "/" + d["_time"].getFullYear() + " " + d["_time"].getHours().toLocaleString('en-US', {minimumIntegerDigits: 2}) + ":00:00")
            .attr("dy", "0em")
            .attr("x", d3.pointer(event)[0] + 15)
            .attr("y", d3.pointer(event)[1] + 15)
        }

        tooltipTextValueRight.style("opacity", 1)
            .text(texto + ": " + foundObject["_value"].toFixed(3))
            .attr("dy", "0em")
            .attr("x", d3.pointer(event)[0] + 15)
            .attr("y", d3.pointer(event)[1] + 35)
        
            
        tooltipTextValueLeft.style("opacity", 1)
            .text("Number of vehicles: " + d["_value"].toLocaleString('hi-IN'))
            .attr("dy", "0em")
            .attr("x", d3.pointer(event)[0] + 15)
            .attr("y", d3.pointer(event)[1] + 55)
        
      })
      .on("mouseout", function(event, d) {
        tooltip.attr("x", width+80)
          .attr("y", 65)
          .style("opacity", 0);

        tooltipTextTime.attr("x", width+80)
          .attr("y", 65)
          .style("opacity", 0);

        tooltipTextValueLeft.attr("x", width+80)
          .attr("y", 65)
          .style("opacity", 0);

        tooltipTextValueRight.attr("x", width+80)
          .attr("y", 65)
          .style("opacity", 0);
      });
  }


  //done and functional
  function createFirstGraph(containerId, meteorologicalData, avgSpeed, maxAvgSpeed, minAvgSpeed, maxSpeed, minSpeed) {
  
    const margin = { top: 50, right: 100, bottom: 30, left: 80 };
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
    const timePadding = day_or_hour === "1h" ? 1 * 60 * 60 * 500 : day_or_hour === "3h" ? 4 * 60 * 60 * 500 : 24*60*60*500;
    const startTime = new Date(timeExtent[0].getTime() - timePadding - 50);
    const endTime = new Date(timeExtent[1].getTime() + timePadding + 50);

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

    svg.selectAll("verticalLines")
      .data(boxplotData)
      .enter()
      .append("line")
        .attr("x1", d => xScale(d._time))
        .attr("x2", d => xScale(d._time))
        .attr("y1", d => yScaleLeft(d.minSpeed))
        .attr("y2", d => yScaleLeft(d.maxSpeed))
        .attr("stroke", "black");

    let boxes = svg.selectAll("boxes")
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

    // subtitles

    // legenda in axis
    svg.append("text")
      .attr("class", "axis-left")
      .attr("transform", "rotate(-90)" )
      .attr("text-anchor", "end")
      .attr("x", -10)
      .attr("y", -50)
      .attr("dy", ".2em")
      .text("Vehicle Speed (km/h)");
    
    svg.append("text")
      .attr("class", "axis-right")
      .attr("transform", "rotate(90)" )
      .attr("x", 20)
      .attr("y", -width-50)
      .attr("dy", ".2em")
      .text(texto);

    // boxplot legenda
    svg.append("line")
      .attr("x1", width+85)
      .attr("y1", 105)
      .attr("x2", width+85) 
      .attr("y2", 95)
      .style("stroke", "black")
      .style("stroke-width", 1);
    
    svg.append("line")
      .attr("x1", width+85)
      .attr("y1", 55)
      .attr("x2", width+85) 
      .attr("y2", 65)
      .style("stroke", "black")
      .style("stroke-width", 1);

    svg.append("rect")
      .attr("x", width+80)
      .attr("y", 65)
      .attr("height", 30)
      .attr("width", 10) 
      .attr("stroke", "black")
      .attr("fill", "#69b3a2");
    
    svg.append("line")
      .attr("x1", width+80)
      .attr("y1", 80)
      .attr("x2", width+90) 
      .attr("y2", 80)
      .style("stroke", "black")
      .style("stroke-width", 1);

    svg.append("text")
      .attr("class", "axis-left")
      .attr("x", width+95)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-size", "11px")
      .text("Vehicle Speed");

    svg.append("line")
      .attr("x1", width+80)
      .attr("y1", 120)
      .attr("x2", width+90) 
      .attr("y2", 120)
      .style("stroke", "red")
      .style("stroke-width", 1);
    
    svg.append("text")
      .attr("class", "axis-left")
      .attr("x", width+95)
      .attr("y", 120)
      .attr("dy", ".25em")
      .attr("font-size", "11px")
      .text(texto);
    
    // end subtitles

    if (day_or_hour === "1h") {
      svg.append("g")
        .attr("class", "axis-bottom")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeHour.every(1)))
        .selectAll("text")  
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-65)" );
    } else if (day_or_hour === "3h") {
      svg.append("g")
        .attr("class", "axis-bottom")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeHour.every(3)))
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

    //tooltip rectangle
    const tooltip = svg.append("rect")
      .attr("x", width+80)
      .attr("y", 65)
      .attr("height", 145)
      .attr("width", 250) 
      .attr("font-weight", 700)
      .style("opacity", 0)
      .attr("stroke", "black")
      .attr("fill", "#65a4df");

    const tooltipTextTime = svg.append("text")
      .text("sometext")
      .attr("x", width + 85)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-weight", 500)
      .attr("font-size", "13px")
      .style("opacity", 0);

    const tooltipTextValueRight = svg.append("text")
      .text("sometext")
      .attr("x", width + 85)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-weight", 500)
      .attr("font-size", "13px")
      .style("opacity", 0);

    const tooltipTextValueLeft1 = svg.append("text")
      .text("sometext")
      .attr("x", width + 85)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-weight", 500)
      .attr("font-size", "13px")
      .style("opacity", 0);

    const tooltipTextValueLeft2 = svg.append("text")
      .text("sometext")
      .attr("x", width + 85)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-weight", 500)
      .attr("font-size", "13px")
      .style("opacity", 0);

    const tooltipTextValueLeft3 = svg.append("text")
      .text("sometext")
      .attr("x", width + 85)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-weight", 500)
      .attr("font-size", "13px")
      .style("opacity", 0);

    const tooltipTextValueLeft4 = svg.append("text")
      .text("sometext")
      .attr("x", width + 85)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-weight", 500)
      .attr("font-size", "13px")
      .style("opacity", 0);

    const tooltipTextValueLeft5 = svg.append("text")
      .text("sometext")
      .attr("x", width + 85)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-weight", 500)
      .attr("font-size", "13px")
      .style("opacity", 0);

    //on hover boxes:
    boxes.on("mouseover", function(event, d) {
      console.log("here")
      console.log(d)
      const foundObject = meteorologicalData.find(obj => obj["_time"].getTime() === d["_time"].getTime());
      tooltip.style("opacity", 1)
          .attr("x", d3.pointer(event)[0] + 10)
          .attr("y", d3.pointer(event)[1]);

      if (day_or_hour === "1d"){
        tooltipTextTime.style("opacity", 1)
          .text("Time: " + d["_time"].getDate() + "/" + d["_time"].getMonth() + "/" + d["_time"].getFullYear())
          .attr("dy", "0em")
          .attr("x", d3.pointer(event)[0] + 15)
          .attr("y", d3.pointer(event)[1] + 15);
      }
      else {
        tooltipTextTime.style("opacity", 1)
          .text("Time: " + d["_time"].getDate() + "/" + d["_time"].getMonth() + "/" + d["_time"].getFullYear() + " " + d["_time"].getHours().toLocaleString('en-US', {minimumIntegerDigits: 2}) + ":00:00")
          .attr("dy", "0em")
          .attr("x", d3.pointer(event)[0] + 15)
          .attr("y", d3.pointer(event)[1] + 15)
      }

      tooltipTextValueRight.style("opacity", 1)
          .text(texto + ": " + foundObject["_value"].toFixed(3))
          .attr("dy", "0em")
          .attr("x", d3.pointer(event)[0] + 15)
          .attr("y", d3.pointer(event)[1] + 35);
          
      tooltipTextValueLeft1.style("opacity", 1)
          .text("Average Speed: " + d["avgSpeed"].toFixed(3) + " km/h")
          .attr("dy", "0em")
          .attr("x", d3.pointer(event)[0] + 15)
          .attr("y", d3.pointer(event)[1] + 55);

      tooltipTextValueLeft2.style("opacity", 1)
          .text("Minimum Average Speed: " + d["minAvgSpeed"].toFixed(3) + " km/h")
          .attr("dy", "0em")
          .attr("x", d3.pointer(event)[0] + 15)
          .attr("y", d3.pointer(event)[1] + 75);

      tooltipTextValueLeft3.style("opacity", 1)
          .text("Maximum Average Speed: " + d["maxAvgSpeed"].toFixed(3) + " km/h")
          .attr("dy", "0em")
          .attr("x", d3.pointer(event)[0] + 15)
          .attr("y", d3.pointer(event)[1] + 95);

      tooltipTextValueLeft4.style("opacity", 1)
          .text("Maximum Speed: " + d["maxSpeed"].toFixed(3) + " km/h")
          .attr("dy", "0em")
          .attr("x", d3.pointer(event)[0] + 15)
          .attr("y", d3.pointer(event)[1] + 115);

      tooltipTextValueLeft5.style("opacity", 1)
          .text("Minimum Speed: " + d["minSpeed"].toFixed(3) + " km/h")
          .attr("dy", "0em")
          .attr("x", d3.pointer(event)[0] + 15)
          .attr("y", d3.pointer(event)[1] + 135);
    })
    .on("mouseout", function(event, d) {
      tooltip.attr("x", width+80)
        .attr("y", 65)
        .style("opacity", 0);
      tooltipTextValueRight.attr("x", width+80)
        .attr("y", 65)
        .style("opacity", 0);
      tooltipTextTime.attr("x", width+80)
        .attr("y", 65)
        .style("opacity", 0);
      tooltipTextValueLeft1.attr("x", width+80)
        .attr("y", 65)
        .style("opacity", 0);
      tooltipTextValueLeft2.attr("x", width+80)
        .attr("y", 65)
        .style("opacity", 0);
      tooltipTextValueLeft3.attr("x", width+80)
        .attr("y", 65)
        .style("opacity", 0);
      tooltipTextValueLeft4.attr("x", width+80)
        .attr("y", 65)
        .style("opacity", 0);
      tooltipTextValueLeft5.attr("x", width+80)
        .attr("y", 65)
        .style("opacity", 0);
    });
    
  }


  //done and functional
  function createThirdGraph(containerId, meteorologicalData, avgSpeed, maxAvgSpeed, minAvgSpeed, maxSpeed, minSpeed) {
  
    const margin = { top: 50, right: 100, bottom: 30, left: 80 };
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
    const timePadding = day_or_hour === "1h" ? 1 * 60 * 60 * 500 : day_or_hour === "3h" ? 4 * 60 * 60 * 500 : 24*60*60*500;
    const startTime = new Date(timeExtent[0].getTime() - timePadding);
    const endTime = new Date(timeExtent[1].getTime() + timePadding);

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
      .attr("stroke", "blue");

    svg.selectAll("verticalLines")
      .data(boxplotData)
      .enter()
      .append("line")
        .attr("x1", d => xScale(d._time))
        .attr("x2", d => xScale(d._time))
        .attr("y1", d => yScaleLeft(d.minSpeed))
        .attr("y2", d => yScaleLeft(d.maxSpeed))
        .attr("stroke", "black");

    let boxes = svg.selectAll("boxes")
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
    
    // subtitles

    // legenda in axis
    svg.append("text")
      .attr("class", "axis-left")
      .attr("transform", "rotate(-90)" )
      .attr("text-anchor", "end")
      .attr("x", -10)
      .attr("y", -50)
      .attr("dy", ".2em")
      .text("Vehicle Speed (km/h)");
    
    svg.append("text")
      .attr("class", "axis-right")
      .attr("transform", "rotate(90)" )
      .attr("x", 20)
      .attr("y", -width-60)
      .attr("dy", ".2em")
      .text("Number of vehicles");

    // boxplot legenda
    svg.append("line")
      .attr("x1", width+95)
      .attr("y1", 105)
      .attr("x2", width+95) 
      .attr("y2", 95)
      .style("stroke", "black")
      .style("stroke-width", 1);
    
    svg.append("line")
      .attr("x1", width+95)
      .attr("y1", 55)
      .attr("x2", width+95) 
      .attr("y2", 65)
      .style("stroke", "black")
      .style("stroke-width", 1);

    svg.append("rect")
      .attr("x", width+90)
      .attr("y", 65)
      .attr("height", 30)
      .attr("width", 10) 
      .attr("stroke", "black")
      .attr("fill", "#69b3a2");
    
    svg.append("line")
      .attr("x1", width+90)
      .attr("y1", 80)
      .attr("x2", width+100) 
      .attr("y2", 80)
      .style("stroke", "black")
      .style("stroke-width", 1);

    svg.append("text")
      .attr("class", "axis-left")
      .attr("x", width+105)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-size", "11px")
      .text("Vehicle Speed");

    svg.append("line")
      .attr("x1", width+90)
      .attr("y1", 120)
      .attr("x2", width+100) 
      .attr("y2", 120)
      .style("stroke", "red")
      .style("stroke-width", 1);
    
    svg.append("text")
      .attr("class", "axis-left")
      .attr("x", width+105)
      .attr("y", 120)
      .attr("dy", ".25em")
      .attr("font-size", "11px")
      .text("Number of vehicles");

    if (day_or_hour === "1h") {
      svg.append("g")
        .attr("class", "axis-bottom")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeHour.every(1)))
        .selectAll("text")  
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-65)" );
    } else if (day_or_hour === "3h") {
      svg.append("g")
        .attr("class", "axis-bottom")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(d3.timeHour.every(3)))
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

    //tooltip rectangle
    const tooltip = svg.append("rect")
      .attr("x", width+80)
      .attr("y", 65)
      .attr("height", 145)
      .attr("width", 250) 
      .attr("font-weight", 700)
      .style("opacity", 0)
      .attr("stroke", "black")
      .attr("fill", "#65a4df");

    const tooltipTextTime = svg.append("text")
      .text("sometext")
      .attr("x", width + 85)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-weight", 500)
      .attr("font-size", "13px")
      .style("opacity", 0);

    const tooltipTextValueRight = svg.append("text")
      .text("sometext")
      .attr("x", width + 85)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-weight", 500)
      .attr("font-size", "13px")
      .style("opacity", 0);

    const tooltipTextValueLeft1 = svg.append("text")
      .text("sometext")
      .attr("x", width + 85)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-weight", 500)
      .attr("font-size", "13px")
      .style("opacity", 0);

    const tooltipTextValueLeft2 = svg.append("text")
      .text("sometext")
      .attr("x", width + 85)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-weight", 500)
      .attr("font-size", "13px")
      .style("opacity", 0);

    const tooltipTextValueLeft3 = svg.append("text")
      .text("sometext")
      .attr("x", width + 85)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-weight", 500)
      .attr("font-size", "13px")
      .style("opacity", 0);

    const tooltipTextValueLeft4 = svg.append("text")
      .text("sometext")
      .attr("x", width + 85)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-weight", 500)
      .attr("font-size", "13px")
      .style("opacity", 0);

    const tooltipTextValueLeft5 = svg.append("text")
      .text("sometext")
      .attr("x", width + 85)
      .attr("y", 80)
      .attr("dy", ".25em")
      .attr("font-weight", 500)
      .attr("font-size", "13px")
      .style("opacity", 0);

    //on hover boxes:
    boxes.on("mouseover", function(event, d) {
      console.log("here")
      console.log(d)
      const foundObject = meteorologicalData.find(obj => obj["_time"].getTime() === d["_time"].getTime());
      tooltip.style("opacity", 1)
          .attr("x", d3.pointer(event)[0] + 10)
          .attr("y", d3.pointer(event)[1]);

      if (day_or_hour === "1d"){
        tooltipTextTime.style("opacity", 1)
          .text("Time: " + d["_time"].getDate() + "/" + d["_time"].getMonth() + "/" + d["_time"].getFullYear())
          .attr("dy", "0em")
          .attr("x", d3.pointer(event)[0] + 15)
          .attr("y", d3.pointer(event)[1] + 15);
      }
      else {
        tooltipTextTime.style("opacity", 1)
          .text("Time: " + d["_time"].getDate() + "/" + d["_time"].getMonth() + "/" + d["_time"].getFullYear() + " " + d["_time"].getHours().toLocaleString('en-US', {minimumIntegerDigits: 2}) + ":00:00")
          .attr("dy", "0em")
          .attr("x", d3.pointer(event)[0] + 15)
          .attr("y", d3.pointer(event)[1] + 15)
      }

      tooltipTextValueRight.style("opacity", 1)
          .text("Number of vehicles" + ": " + foundObject["_value"].toLocaleString('hi-IN'))
          .attr("dy", "0em")
          .attr("x", d3.pointer(event)[0] + 15)
          .attr("y", d3.pointer(event)[1] + 35);
          
      tooltipTextValueLeft1.style("opacity", 1)
          .text("Average Speed: " + d["avgSpeed"].toFixed(3) + " km/h")
          .attr("dy", "0em")
          .attr("x", d3.pointer(event)[0] + 15)
          .attr("y", d3.pointer(event)[1] + 55);

      tooltipTextValueLeft2.style("opacity", 1)
          .text("Minimum Average Speed: " + d["minAvgSpeed"].toFixed(3) + " km/h")
          .attr("dy", "0em")
          .attr("x", d3.pointer(event)[0] + 15)
          .attr("y", d3.pointer(event)[1] + 75);

      tooltipTextValueLeft3.style("opacity", 1)
          .text("Maximum Average Speed: " + d["maxAvgSpeed"].toFixed(3) + " km/h")
          .attr("dy", "0em")
          .attr("x", d3.pointer(event)[0] + 15)
          .attr("y", d3.pointer(event)[1] + 95);

      tooltipTextValueLeft4.style("opacity", 1)
          .text("Maximum Speed: " + d["maxSpeed"].toFixed(3) + " km/h")
          .attr("dy", "0em")
          .attr("x", d3.pointer(event)[0] + 15)
          .attr("y", d3.pointer(event)[1] + 115);

      tooltipTextValueLeft5.style("opacity", 1)
          .text("Minimum Speed: " + d["minSpeed"].toFixed(3) + " km/h")
          .attr("dy", "0em")
          .attr("x", d3.pointer(event)[0] + 15)
          .attr("y", d3.pointer(event)[1] + 135);
    })
    .on("mouseout", function(event, d) {
      tooltip.attr("x", width+80)
        .attr("y", 65)
        .style("opacity", 0);
      tooltipTextValueRight.attr("x", width+80)
        .attr("y", 65)
        .style("opacity", 0);
      tooltipTextTime.attr("x", width+80)
        .attr("y", 65)
        .style("opacity", 0);
      tooltipTextValueLeft1.attr("x", width+80)
        .attr("y", 65)
        .style("opacity", 0);
      tooltipTextValueLeft2.attr("x", width+80)
        .attr("y", 65)
        .style("opacity", 0);
      tooltipTextValueLeft3.attr("x", width+80)
        .attr("y", 65)
        .style("opacity", 0);
      tooltipTextValueLeft4.attr("x", width+80)
        .attr("y", 65)
        .style("opacity", 0);
      tooltipTextValueLeft5.attr("x", width+80)
        .attr("y", 65)
        .style("opacity", 0);
    });
  }

  function getContentBasedOnTitle(title) {
    switch (graph_type) {
      case 'speed_meteorological':
        return (
          <p>
            This graphic relates meteorologica data with vehicle velocity. The <font color="green">velocity parameters</font> are defined by the <font color="green">green boxplots</font>, and the <font color="red">meteorological data</font> is defined through the <font color="red">red line</font>.
            <br/><br/>
            These boxplots do not use the standart model where medians are used, and instead, use the maximum average, minimum average, standard average, standard maximum and standard minimum velocity values to fill the quartils, extremes and medians. 
            <br/><br/>
            Data is specific to the meteorological type, station and vehicle type selected, in the time period defined above.
            <br/><br/>
            When selecting a time range inferior to 4 days, the x-axis displayed will change from displaying data from each day, to displaying data three in three hours.
          </p>
        );
      case 'inflow_meteorological':
        return (
          <p>
            This graphic relates the vehiclee inflow data with meteorological data. Both the meteorological and inflow data are defined through the lines - <font color="red">red</font> for the <font color="red">metheorological data</font> and <font color="blue">blue</font> for the <font color="blue">inflow data</font>.
            <br/><br/>
            The inflow data contains the number of cars, near one station, which follow the same direction. Cars circulating in the oposite direction are categorized as <i>ouflow</i>.
            <br/><br/>
            Data is specific to the meteorological type, station and vehicle type selected, in the time period defined above.
            <br/><br/>
            When selecting a time range inferior to 4 days, the x-axis displayed will change from displaying data from each day, to displaying data three in three hours.
          </p>
        );
      case 'speed_traffic':
        return (
        <p>
          This graphic relates vehicle speed with inflow data. The <font color="green">velocity parameters</font> are defined by the <font color="green">green boxplots</font>, and the <font color="red">inflow data</font> is defined through the <font color="red">red line</font>.
          <br/><br/>
          These boxplots do not use the standart model where medians are used, and instead, use the maximum average, minimum average, standard average, standard maximum and standard minimum velocity values to fill the quartils, extremes and medians. 
          <br/><br/>
          Data is specific to station and vehicle type selected only, in the time period defined above.
          <br/><br/>
          When selecting a time range inferior to 4 days, the x-axis displayed will change from displaying data from each day, to displaying data three in three hours.
        </p>
        );
    }
  }

  
  useEffect(() => {
    console.log(title);
    fetchData();
  }, [station, meteorology, vehicle_type, date, graph_type]);

  return (
    <div>
      <div>
        <h4 className='titulo'>{title}</h4>
      </div>
      <div className="graph-container" id="middleGraph" style={{ marginLeft: '100px', justifyContent: "center"}}>  
      </div>
      <Accordion className="mx-auto" defaultActiveKey="0" style={{ width: '700px', justifyContent: "center"}}>
        <Accordion.Item eventKey="0">
          <Accordion.Header className="custom-header">About this grafic</Accordion.Header>
          <Accordion.Body>
            {getContentBasedOnTitle(title)}
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </div>
  );
}

export default D3_Graphic;
