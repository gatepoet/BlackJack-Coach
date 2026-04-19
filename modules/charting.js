// Module: charting - D3-based deck visualization (combined pie/suit charts)
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { state, suits } from './state.js';

let combinedChart = null;

export function initCombinedChart() {
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

  // Dynamic dimensions based on square aspect
  let size = 100; // Square side
  const updateDimensions = () => {
    const rect = container.node().getBoundingClientRect();
    const chartSize = Math.min(rect.width, rect.height); // Scale to fit smaller dim
    size = Math.max(chartSize, 80); // Min size for visibility
    const viewBoxStr = `0 0 ${size} ${size}`;
    svg.attr('viewBox', viewBoxStr);
    if (combinedChart) {
      // Re-render if already initialized
      updateCombinedChart(combinedChart.rankTotals || state.rankOrder.map(r => 32), combinedChart.suitTotals || {spades:104,clubs:104,hearts:104,diamonds:104}, state.rankOrder, ['spades','clubs','hearts','diamonds']);
    }
  };

  // Initial call
  setTimeout(updateDimensions, 0); // Defer to after DOM

  // Resize observer for true responsiveness
  if (window.ResizeObserver) {
    new ResizeObserver(updateDimensions).observe(container.node());
  } else {
    window.addEventListener('resize', updateDimensions);
  }

  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = (size / 2) * 0.8; // Use 80% of half-size for outer (larger chart)
  const innerRadiusBase = outerRadius * 0.5; // Adjusted for better visibility in square

  // Color scales
  const rankColors = ['#ef4444','#f97316','#facc15','#a3e635','#22c55e','#14b8a6','#3b82f6','#8b5cf6','#ec4899','#6366f1','#1e40af','#dc2626','#991b1b'];
  const suitColors = ['#000', '#006400', '#dc2626', '#00008b'];
  const suitSymbols = ['♠', '♣', '♥', '♦'];

  // Generators
  const pie = d3.pie().sort(null);
  const arc = d3.arc();

  // Tooltip setup
  const tooltip = d3.select('body').append('div')
    .attr('class', 'd3-tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('background', 'rgba(0,0,0,0.8)')
    .style('color', 'white')
    .style('padding', '5px 8px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('z-index', '1000')
    .style('display', 'none');

  // Center group (responsive)
  const centerGroup = svg.append('g')
    .attr('transform', `translate(${centerX}, ${centerY})`);

  function showTooltip(event, d, label, value) {
    tooltip.html(`${label}: ${value}`)
    .style('left', (event.pageX + 10) + 'px')
    .style('top', (event.pageY - 28) + 'px');
    tooltip.style('display', 'block')
    tooltip.transition().duration(200).style('opacity', .9);
  }

  function hideTooltip() {
    tooltip.transition().duration(500).style('opacity', 0);
    tooltip.style('display', 'none');
  }

  // Draw outer ring: Ranks
  const outerGroup = centerGroup.append('g');
  const initialRankData = state.rankOrder.map(r => 32);
  const outerPieData = pie(initialRankData);
  const outerPaths = outerGroup.selectAll('.rank-path')
    .data(outerPieData)
    .enter()
    .append('path')
    .attr('class', 'rank-path')
    .attr('fill', (d, i) => rankColors[i])
    .attr('d', d => arc.innerRadius(innerRadiusBase).outerRadius(outerRadius)(d))
    .on('mouseover', function(event, d) { showTooltip(event, d, state.rankOrder[d.index], d.data); })
    .on('mouseout', hideTooltip);

  // Outer labels (adjusted font for space)
  const outerLabels = outerGroup.selectAll('.rank-label')
    .data(outerPieData)
    .enter()
    .append('text')
    .attr('class', 'rank-label')
    .attr('text-anchor', 'middle')
    .attr('font-size', Math.min(8, size / 12) + 'px') // Responsive font based on size
    .attr('fill', '#eee')
    .attr('dy', '.35em')
    .attr('transform', d => {
      const pos = arc.innerRadius(innerRadiusBase * 0.8).outerRadius(outerRadius * 0.9).centroid(d);
      return `translate(${pos[0]}, ${pos[1]})`;
    })
    .text(d => d.data.toString());

  // Draw inner ring: Suits
  const innerGroup = centerGroup.append('g');
  const initialSuitData = [104, 104, 104, 104];
  const innerPieData = pie(initialSuitData);
  const innerPaths = innerGroup.selectAll('.suit-path')
    .data(innerPieData)
    .enter()
    .append('path')
    .attr('class', 'suit-path')
    .attr('fill', (d, i) => suitColors[i])
    .attr('d', d => arc.innerRadius(0).outerRadius(innerRadiusBase)(d))
    .on('mouseover', function(event, d) { showTooltip(event, d, suitSymbols[d.index], d.data); })
    .on('mouseout', hideTooltip);

  // Inner labels
  const innerLabels = innerGroup.selectAll('.suit-label')
    .data(innerPieData)
    .enter()
    .append('text')
    .attr('class', 'suit-label')
    .attr('text-anchor', 'middle')
    .attr('font-size', Math.min(14, size / 6) + 'px') // Responsive
    .attr('fill', '#fff')
    .attr('dy', '.35em')
    .attr('transform', d => {
      const pos = arc.innerRadius(0).outerRadius(innerRadiusBase).centroid(d);
      return `translate(${pos[0]}, ${pos[1]})`;
    })
    .text(d => suitSymbols[d.index]);

  // Store with initial data for resize re-render
  combinedChart = { 
    svg, container, centerGroup, outerGroup, innerGroup, outerRadius, innerRadiusBase, 
    pie, arc, rankColors, suitColors, suitSymbols, tooltip,
    outerPaths, outerLabels, innerPaths, innerLabels, showTooltip, hideTooltip,
    rankTotals: initialRankData, suitTotals: {spades:104, clubs:104, hearts:104, diamonds:104}
  };
}

export function updateCombinedChart(rankTotals, suitTotals) {
  if (!combinedChart) return;

  const { 
    container, centerGroup, outerGroup, innerGroup, pie, arc, rankColors, suitColors, suitSymbols, 
    outerPaths, outerLabels, innerPaths, innerLabels,
    showTooltip, hideTooltip, svg 
  } = combinedChart;

  // Update stored data
  combinedChart.rankTotals = rankTotals;
  combinedChart.suitTotals = suitTotals;

  // Re-compute dimensions and radii (for resize)
  const rect = container.node().getBoundingClientRect();
  const chartSize = Math.min(rect.width, rect.height);
  const size = Math.max(chartSize, 80);
  const viewBoxStr = `0 0 ${size} ${size}`;
  svg.attr('viewBox', viewBoxStr);
  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = (size / 2) * 0.8;
  const innerRadiusBase = outerRadius * 0.5;
  combinedChart.outerRadius = outerRadius;
  combinedChart.innerRadiusBase = innerRadiusBase;
  centerGroup.attr('transform', `translate(${centerX}, ${centerY})`);

  // Update outer ring
  const outerPieData = pie(rankTotals);
  outerPaths.data(outerPieData)
    .attr('fill', (d, i) => rankColors[i % rankColors.length])
    .attr('d', d => arc.innerRadius(innerRadiusBase).outerRadius(outerRadius)(d))
    .on('mouseover', function(event, d) { showTooltip(event, d, state.rankOrder[d.index], d.data); })
    .on('mouseout', hideTooltip);

  outerLabels.data(outerPieData)
    .attr('font-size', Math.min(8, size / 12) + 'px')
    .attr('transform', d => {
      const pos = arc.innerRadius(innerRadiusBase * 0.8).outerRadius(outerRadius * 0.9).centroid(d);
      return `translate(${pos[0]}, ${pos[1]})`;
    })
    .text(d => d.data.toString());

  // Update inner ring
  const suitOrder = ['spades', 'clubs', 'hearts', 'diamonds'];
  const suitData = suitOrder.map(s => suitTotals[s]);
  const innerPieData = pie(suitData);
  innerPaths.data(innerPieData)
    .attr('fill', (d, i) => suitColors[i])
    .attr('d', d => arc.innerRadius(0).outerRadius(innerRadiusBase)(d))
    .on('mouseover', function(event, d) { showTooltip(event, d, suitSymbols[d.index], d.data); })
    .on('mouseout', hideTooltip);

  innerLabels.data(innerPieData)
    .attr('font-size', Math.min(14, size / 6) + 'px')
    .attr('transform', d => {
      const pos = arc.innerRadius(0).outerRadius(innerRadiusBase).centroid(d);
      return `translate(${pos[0]}, ${pos[1]})`;
    })
    .text(d => suitSymbols[d.index]);
}
