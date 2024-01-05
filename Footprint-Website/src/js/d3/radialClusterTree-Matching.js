// Copied and adjusted from https://observablehq.com/@d3/radial-cluster/2?intent=fork
import { createLegend } from './addD3Legend.js';
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
    { color: 'red', label: 'Knowledge of EO4GEO Concept', type: 'circle' },
  ];

  // calls the createLegend function and creates a legend.
  createLegend(legendData, `#d3Legend`);

  document.getElementById('right-side').appendChild(svg.node());
}

export { createRadialClusterTreeChartForMatching };
