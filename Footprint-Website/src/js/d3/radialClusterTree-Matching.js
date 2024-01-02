// Copied and adjusted from https://observablehq.com/@d3/radial-cluster/2?intent=fork

import {
  showDetails,
  showLabel,
  hideLabel,
} from './interactiveD3Functionalities.js';

function createRadialClusterTreeChartForMatching(data) {
  const height = 930; //screen.availHeight - 280;
  const width = 1590; //screen.availWidth * 0.8;
  const cx = width * 0.5;
  const cy = height * 0.5;
  const radius = Math.min(width, height) / 2 - 20;

  const tree = d3
    .cluster()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

  const root = tree(d3.hierarchy(data));

  const svg = d3
    .create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [-cx, -cy, width, height])
    .attr('style', 'width: auto; height: auto;')
    .call(
      // enables zoom and pann
      d3
        .zoom()
        .scaleExtent([0.5, 5])
        .on('zoom', e => {
          chartGroup.attr('transform', e.transform);
        })
    );

  // Group to hold all chart elements, paths, nodes and labels.
  const chartGroup = svg.append('g');

  // Append links
  chartGroup
    .append('g')
    .attr('fill', 'none')
    .attr('stroke', '#005ca2')
    .attr('stroke-opacity', 0.1)
    .attr('stroke-width', 2.5)
    .selectAll()
    .data(root.links())
    .join('path')
    .attr(
      'd',
      d3
        .linkRadial()
        .angle(d => d.x)
        .radius(d => d.y)
    )
    .attr('source', d => `${d.source.data.name}`)
    .attr('target', d => `${d.target.data.name}`);

  function colorPathToRoot(node, color) {
    let currentNode = node;
    while (currentNode.parent) {
      // While currentNode has a parent, select the currentNode and change the path stroke colour.
      chartGroup
        .selectAll('path')
        .filter(d => d.target === currentNode)
        .attr('stroke', color)
        .attr('stroke-opacity', 1);

      currentNode = currentNode.parent; // Move to the parent node
    }
  }

  root.descendants().forEach(node => {
    // loops through each childnode from the rootnode.
    if (parseInt(node.data.nodeValueFirstEntity) === 1) {
      colorPathToRoot(node, 'green');
    } else if (parseInt(node.data.nodeValueSecondEntity) === 1) {
      colorPathToRoot(node, 'orange');
    }
  });

  // check for match after the first above checks, is done since then the purple path is the last path to be drawed, ensuring it's always on top and visible.
  root.descendants().forEach(node => {
    // loops through each childnode from the rootnode.
    if (node.data.matched === 'Match') {
      colorPathToRoot(node, 'purple');
    }
  });
  // todo sommige paths overlayern elkaar, dus geel kan groen overlayen of andersom, bij zo'n overlay moet eigenlijk het path paars worden.

  // Append nodes
  chartGroup
    .append('g')
    .selectAll()
    .data(root.descendants())
    .join('circle')
    .attr(
      'transform',
      d => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`
    )
    .attr('fill', d => (d.children ? d.data.nodeColour : d.data.nodeColour))
    .attr('fill-opacity', d => (parseInt(d.data.showLabel) === 1 ? 1 : 0.1)) // using showLabel here might be a bit weird, but it tells me the node should be coloured aswell.
    .attr('id', d => `${d.data.id}`)
    .attr('class', d => `concept-${d.data.id}`)
    .attr('r', 2.5);

  // Append labels
  chartGroup
    .append('g')
    //.attr('stroke-linejoin', 'round')
    //.attr('stroke-width', 3)
    .selectAll()
    .data(root.descendants())
    .join('text')
    .attr(
      'transform',
      d =>
        `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0) rotate(${
          d.x >= Math.PI ? 180 : 0
        })`
    )
    .attr('font-family', 'Segoe UI')
    .attr('font-size', d => `${d.data.labelSize}`)
    .attr('dy', '0.31em')
    .attr('x', d => (d.x < Math.PI === !d.children ? 6 : -6))
    .attr('text-anchor', d => (d.x < Math.PI === !d.children ? 'start' : 'end'))
    //.attr('paint-order', 'stroke')
    //.attr('stroke', 'white')
    .attr('fill', 'white') // 'currentColor'
    .style('opacity', '0') //.style('opacity', d => `${d.data.showLabel}`)
    .attr('id', d => `label-${d.data.id}`)
    .text(d => d.data.name);

  // Enables the interacive functions when hovering over a circle/ node in the graph.
  chartGroup
    .selectAll('circle')
    .on('mouseover.details', showDetails)
    .on('mouseover.label', showLabel)
    .on('mouseout.label', hideLabel);

  const legendData = [
    { color: 'green', label: 'First entity', type: 'line' },
    { color: 'orange', label: 'Second entity', type: 'line' },
    { color: 'purple', label: 'Match', type: 'line' },
    { color: 'red', label: 'EO4GEO Concept', type: 'circle' },
  ];

  // Select the div or create a new one
  let legendDiv = d3.select(`#d3Legend`);

  // Create a new SVG for the legend
  const legendSvg = legendDiv
    .append('svg')
    .attr('width', 150)
    .attr('height', legendData.length * 25);

  // Add the legend items
  const legend = legendSvg
    .selectAll('.legend')
    .data(legendData)
    .enter()
    .append('g')
    .attr('class', 'legend')
    .attr('transform', (d, i) => `translate(10, ${i * 20})`);

  legend.each(function (d) {
    const legendItem = d3.select(this);
    if (d.type === 'circle') {
      legendItem
        .append('circle')
        .attr('cx', 7.5)
        .attr('cy', 10)
        .attr('r', 5)
        .style('fill', d.color);
    } else if (d.type === 'line') {
      legendItem
        .append('line')
        .attr('x1', 0)
        .attr('y1', 10)
        .attr('x2', 15)
        .attr('y2', 10)
        .style('stroke', d.color)
        .style('stroke-width', 2);
    }

    legendItem
      .append('text')
      .attr('x', 20)
      .attr('y', 12)
      .text(d.label)
      .style('font-size', '14px')
      .style('fill', d.color)
      .attr('alignment-baseline', 'middle');
  });

  document.getElementById('right-side').appendChild(svg.node());
}

export { createRadialClusterTreeChartForMatching };
