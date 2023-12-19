// Copied and adjusted from https://observablehq.com/@d3/force-directed-tree?intent=fork

function createForceDirectedTree(data) {
  const height = 930; //screen.availHeight - 280;
  const width = 1590; //screen.availWidth * 0.8;

  // Compute the graph and start the force simulation.
  const root = d3.hierarchy(data);
  const links = root.links();
  const nodes = root.descendants();

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      'link',
      d3
        .forceLink(links)
        .id(d => d.id)
        .distance(0)
        .strength(1)
    )
    .force('charge', d3.forceManyBody().strength(-50))
    .force('x', d3.forceX())
    .force('y', d3.forceY());

  // Create the container SVG.
  const svg = d3
    .create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [-width / 2, -height / 2, width, height])
    .attr('style', 'max-width: 100%; height: auto;')
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

  // Append links.
  const link = chartGroup
    .append('g')
    .attr('stroke', '#005ca2')
    .attr('stroke-opacity', 0.4)
    .selectAll('line')
    .data(links)
    .join('line');

  // Append nodes.
  const node = chartGroup
    .append('g')
    .attr('fill', '#fff')
    // .attr('stroke', '#000')
    // .attr('stroke-width', 1.5)
    .selectAll('circle')
    .data(nodes)
    .join('circle')
    .attr('fill', d => (d.children ? d.data.nodeColour : d.data.nodeColour))
    //.attr('stroke', d => (d.children ? null : '#fff'))
    .attr('r', 3.5)
    .call(drag(simulation));

  node.append('title').text(d => d.data.name);

  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node.attr('cx', d => d.x).attr('cy', d => d.y);
  });

  //invalidation.then(() => simulation.stop());
  document.getElementById('right-side').appendChild(svg.node());
}

const drag = simulation => {
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3
    .drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
};

export { createForceDirectedTree };
