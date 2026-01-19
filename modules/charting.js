let combinedChart;

function initCombinedChart() {
  try {
    // Check if d3 is available
    if (typeof d3 === 'undefined') {
      console.warn('D3 is not available');
      return null;
    }
    
    const container = d3.select('#combinedChart');
    if (container.empty()) {
      console.warn('Chart container #combinedChart not found');
      return null;
    }
    
    const svg = container
      .html('') // Clear previous
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('viewBox', '0 0 100 100') // Square viewBox for consistent chart proportions
      .style('width', '100%')
      .style('height', '100%');
      
    // Add some basic chart elements for demonstration
    svg.append('rect')
      .attr('x', 10)
      .attr('y', 10)
      .attr('width', 80)
      .attr('height', 80)
      .attr('fill', '#4CAF50');
      
    return svg;
  } catch (error) {
    console.error('Error initializing chart:', error);
    return null;
  }
}

// Export functions
export { initCombinedChart };