// Copied and adjusted from https://observablehq.com/@d3/radial-cluster/2?intent=fork
import { createLegend } from './addD3Legend.js';
import { radialClusterOuterDoughnut } from './radialClusterTree-outerDoughnut.js';
import {
  showDetails,
  showLabel,
  hideLabel,
} from './interactiveD3Functionalities.js';

function createRadialClusterTreeChart(data) {
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
    if (parseInt(node.data.showLabel) === 1) {
      colorPathToRoot(node, 'green');
    }
  });

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
    .style('opacity', d => `${d.data.showLabel}`)
    .attr('id', d => `label-${d.data.id}`)
    .text(d => d.data.name);

  // Enables the interacive functions when hovering over a circle/ node in the graph.
  chartGroup
    .selectAll('circle')
    .on('mouseover.details', showDetails)
    .on('mouseover.label', showLabel)
    .on('mouseout.label', hideLabel);

  const legendData = [
    { color: 'green', label: 'Knowledge path', type: 'line', rowHeight: 0 },
    {
      color: '#ffd966',
      label: 'EO4GEO Concepts',
      type: 'circle',
      rowHeight: 20,
    },
    {
      color: 'red',
      label: 'Knowledge of EO4GEO Concept',
      type: 'circle',
      rowHeight: 40,
    },
    {
      color: '#4288B5',
      label: '[AM] Analytical Methods',
      type: 'rect',
      rowHeight: 80,
    },
    {
      color: '#54AAAF',
      label: '[CF] Conceptual Foundations',
      type: 'rect',
      rowHeight: 100,
    },
    {
      color: '#77C6A6',
      label: '[CV] Cartography and Visualization',
      type: 'rect',
      rowHeight: 125,
    },
    {
      color: '#9FD9A3',
      label: '[DA] Design and Setup of Geographic Information Systems',
      type: 'rect',
      rowHeight: 165,
    },
    {
      color: '#C5E89F',
      label: '[DM] Data Modeling, Storage and Exploitation',
      type: 'rect',
      rowHeight: 215,
    },
    {
      color: '#E3F4A2',
      label: '[GC] Geocomputation',
      type: 'rect',
      rowHeight: 245,
    },
    {
      color: '#F6FAAE',
      label: '[GD] Geospatial Data',
      type: 'rect',
      rowHeight: 265,
    },
    {
      color: '#FDF3AA',
      label: '[GS] GI and Society',
      type: 'rect',
      rowHeight: 285,
    },
    {
      color: '#FEE090',
      label: '[IP] Image Processing and Analysis',
      type: 'rect',
      rowHeight: 305,
    },
    {
      color: '#FDC475',
      label: '[OI] Organizational and Institutional Aspects',
      type: 'rect',
      rowHeight: 335,
    },
    {
      color: '#FBA25E',
      label: '[PP] Physical Principles',
      type: 'rect',
      rowHeight: 365,
    },
    {
      color: '#F47D4D',
      label: '[PS] Platforms, Sensors and Digital Imagery',
      type: 'rect',
      rowHeight: 385,
    },
    {
      color: '#E75B49',
      label: '[TA] Thematic and Application Domains',
      type: 'rect',
      rowHeight: 415,
    },
    {
      color: '#D13C4B',
      label: '[WB] Web-based GI',
      type: 'rect',
      rowHeight: 445,
    },
  ];

  // calls the createLegend function and creates a legend.
  createLegend(legendData, `#d3Legend`);

  // Creates the outerDoughnut d3 chart
  radialClusterOuterDoughnut(root, radius, chartGroup);

  document.getElementById('right-side').appendChild(svg.node());
}

export { createRadialClusterTreeChart };
