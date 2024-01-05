function createLegend(legendData, divID) {
  // Create a new SVG for the legend
  const legendSvg = d3
    .select(divID)
    .append('svg')
    .attr('width', 150)
    .attr('height', legendData.length * 50);

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
      .append('foreignObject')
      .attr('x', 20)
      .attr('y', 0)
      .attr('width', 100)
      .attr('height', 50)
      .append('xhtml:div')
      .style('font-size', '14px')
      .style('color', d.color)
      .html(d.label);
  });
}

export { createLegend };
