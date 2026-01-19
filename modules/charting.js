let combinedChart;

function initCombinedChart() {
  const container = d3.select('#combinedChart');
  const svg = container
    .html('') // Clear previous
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('viewBox', '0 0 100 100') // Square viewBox for consistent chart proportions
    .style('width', '100%')
    .style('height', '100%');
    
  // Add some basic chart elements to make it visible
  svg.append('rect')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('fill', '#0d1117')
    .attr('stroke', '#1e293b')
    .attr('stroke-width', 1);
    
  svg.append('text')
    .attr('x', '50%')
    .attr('y', '50%')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#94a3b8')
    .text('Chart Loading...');
    
  // Store reference to the chart for future updates
  combinedChart = svg;
}

// Export functions
export { initCombinedChart };