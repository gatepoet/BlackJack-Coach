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
}

// Export functions
module.exports = { initCombinedChart };