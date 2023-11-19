import React, { useEffect } from 'react';
import * as d3 from 'd3';

function D3_Graphic({data}) {
  useEffect(() => {
    const leftDataMiddle = [10, 30, 45, 60, 20, 65, 35];
    const rightDataMiddle = [20, 55, 15, 75, 40, 30, 80];
    createGraph(data, leftDataMiddle, rightDataMiddle);

  }, []);

  function createGraph(containerId, left_data, right_data) {
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 380 - margin.left - margin.right;
    const height = 150 - margin.top - margin.bottom;

    const svg = d3.select(`#${containerId}`)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleLinear()
      .domain([0, left_data.length - 1])
      .range([0, width]);

    const yScaleLeft = d3.scaleLinear()
      .domain([0, d3.max(left_data)])
      .range([height, 0 - (d3.max(left_data) - d3.max(right_data))]);

    const yScaleRight = d3.scaleLinear()
      .domain([0, d3.max(right_data)])
      .range([height, 0]);

    const line = d3.line()
      .x((d, i) => xScale(i))
      .y(d => yScaleLeft(d));

    svg.append("path")
      .data([left_data])
      .attr("class", "line")
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "blue");

    svg.append("path")
      .data([right_data])
      .attr("class", "line")
      .attr("d", line)
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

  return null;
}

export default D3_Graphic;