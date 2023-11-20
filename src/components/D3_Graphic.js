import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import InfluxComponent from './InfluxComponent';
import queryInfluxDB from './influx.js'; // Replace with the actual path

function D3_Graphic({ data }) {
  const [queryResult1, setQueryResult1] = useState(null);
  const [queryResult2, setQueryResult2] = useState(null);

  const dynamicQuery1 =
    'import "experimental/aggregate" from(bucket: "processed_cpms") |> range(start: 2023-10-22, stop: 2023-11-19) |> filter(fn: (r) => r["_measurement"] == "5") |> filter(fn: (r) => r["_field"] == "totalCount") |> filter(fn: (r) => r["direction"] == "inflow") |> filter(fn: (r) => r["object_class"] == "2")  |> aggregateWindow(every: 1d, fn: sum, createEmpty: true)  |> yield(name: "mean")';

  const dynamicQuery2 =
    'from(bucket: "weather_recordings") |> range(start: 2023-10-22, stop: 2023-11-19) |> filter(fn: (r) => r["_measurement"] == "36713") |> filter(fn: (r) => r["_field"] == "temp_max") |> filter(fn: (r) => r["period"] == "Dados_60m") |> filter(fn: (r) => r["height"] == "10m") |> aggregateWindow(every: 1d, fn: mean, createEmpty: false) |> yield(name: "mean")';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result1 = await queryInfluxDB(dynamicQuery1);
        setQueryResult1(result1);

        const result2 = await queryInfluxDB(dynamicQuery2);
        setQueryResult2(result2);
      } catch (error) {
        console.error('Error querying InfluxDB:', error);
      }
    };

    fetchData();
  }, [dynamicQuery1, dynamicQuery2]);

  useEffect(() => {
    if (queryResult1 && queryResult2) {
      updateGraph(data, queryResult1, queryResult2);
    }
  }, [queryResult1, queryResult2, data]);

  function updateGraph(data, result1, result2) {

    console.log(result1, result2);
    createGraph(data, result1, result2);
  }

  function createGraph(containerId, leftData, rightData) {
    leftData = leftData[0];
    rightData = rightData[0];
  
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 380 - margin.left - margin.right;
    const height = 160 - margin.top - margin.bottom;
  
    const svg = d3.select(`#${containerId}`)
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
      .attr("class", "line")
      .attr("d", lineLeft)
      .attr("fill", "none")
      .attr("stroke", "blue");
  
    svg.append("path")
      .data([rightData])
      .attr("class", "line")
      .attr("d", lineRight)
      .attr("fill", "none")
      .attr("stroke", "red");
  
    svg.append("g")
      .call(d3.axisLeft(yScaleLeft));
  
    svg.append("g")
      .attr("transform", `translate(${width}, 0)`)
      .call(d3.axisRight(yScaleRight));
  
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale));
  } 

  return null
}

export default D3_Graphic;
