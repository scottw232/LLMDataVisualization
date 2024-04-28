function initializeBubbleChart() {
  fetch("/static/js/modified_movies_data.json")
    .then(response => response.json())
    .then(data => {
      console.log("RRRRRRRRRRRRRR", data);
      const dataYears = data.dataYears;
      const dataGenres = data.dataGenres;
      const dataOrigins = data.dataOrigins;

      let currentData = dataGenres;

      const svgWidth = 800;
      const svgHeight = 800;

      const svg1 = d3
        .select("#svg1")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

      console.log("SVG1", svg1);

      function createColorScale(data) {
        return d3
          .scaleOrdinal()
          .domain(data.map((d, i) => i))
          .range([
            "#f4cccc",
            "#fce5cd",
            "#fff2cc",
            "#d9ead3",
            "#d0e0e3",
            "#cfe2f3",
            "#d9d2e9",
            "#ead1dc"
          ]);
      }

      function drawBubbles(data) {
        const colorScale = createColorScale(data);

        const pack = d3
          .pack()
          .size([svgWidth, svgHeight])
          .padding(1.5);

        const root = d3.hierarchy({ children: data }).sum(d => d.frequency);

        const bubbles = pack(root)
          .leaves()
          .map((leaf, index) => ({
            x: leaf.x,
            y: leaf.y,
            r: leaf.r,
            keyword: leaf.data.keyword,
            frequency: leaf.data.frequency,
            color: colorScale(index)
          }));

        const circles = svg1.selectAll("circle").data(bubbles);

        circles.join(
          enter =>
            enter
              .append("circle")
              .attr("cx", d => d.x)
              .attr("cy", d => d.y)
              .attr("r", d => d.r)
              .attr("fill", d => d.color)
              .attr("stroke", "black"),
          update =>
            update
              .attr("cx", d => d.x)
              .attr("cy", d => d.y)
              .attr("r", d => d.r)
              .attr("fill", d => d.color)
              .attr("stroke", "black"),
          exit => exit.remove()
        );

        const texts = svg1.selectAll("text").data(bubbles);

        function truncateText(text, radius) {
          const maxTextLength = Math.floor(radius / 10);
          return text.length > maxTextLength
            ? text.substring(0, maxTextLength) + "..."
            : text;
        }

        texts.join(
          enter =>
            enter
              .append("text")
              .attr("x", d => d.x)
              .attr("y", d => d.y)
              .text(d => truncateText(d.keyword, d.r))
              .attr("text-anchor", "middle")
              .style("font-size", d => `${Math.max(d.r / 5, 20)}px`)
              .style("fill", "black")
              .style("pointer-events", "none")
              .style("visibility", d => (d.r > 20 ? "visible" : "hidden")),
          update =>
            update
              .attr("x", d => d.x)
              .attr("y", d => d.y)
              .text(d => truncateText(d.keyword, d.r))
              .style("font-size", d => `${Math.max(d.r / 5, 20)}px`)
              .style("visibility", d => (d.r > 20 ? "visible" : "hidden")),
          exit => exit.remove()
        );

        svg1
          .selectAll("circle")
          .on("mouseover", function(event, d) {
            tooltip
              .transition()
              .duration(200)
              .style("opacity", 0.9);
            tooltip
              .html(`${d.keyword}<br/>Frequency: ${d.frequency}`)
              .style("left", event.pageX + "px")
              .style("top", event.pageY - 28 + "px")
              .style("background", d.color)
              .style("border-color", "black")
              .style("font-size", "16px");
          })
          .on("mouseout", function() {
            tooltip
              .transition()
              .duration(500)
              .style("opacity", 0);
          });
      }

      drawBubbles(currentData);

      const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("text-align", "center")
        .style("width", "150px")
        .style("height", "40px")
        .style("padding", "2px")
        .style("font", "12px sans-serif")
        .style("background", "lightsteelblue")
        .style("border", "2px solid black")
        .style("border-radius", "8px")
        .style("pointer-events", "none")
        .style("opacity", 0);

      d3.select("#dataset-select").on("change", function(event) {
        const selectedValue = d3.select(this).property("value");
        if (selectedValue === "years") {
          currentData = dataYears;
        } else if (selectedValue === "keywords") {
          currentData = dataGenres;
        } else if (selectedValue === "origins") {
          currentData = dataOrigins;
        }
        drawBubbles(currentData);
      });

      drawBubbles(currentData);
    })
    .catch(error => {
      console.error("Error fetching the JSON data: ", error);
    });
}
////////////////////////////////////////////////////////////////////////
//Network Code:
var width = 1400;
var height = 1000;
var colors = [
  "#f4cccc",
  "#fce5cd",
  "#fff2cc",
  "#d9ead3",
  "#d0e0e3",
  "#cfe2f3",
  "#d9d2e9",
  "#ead1dc"
];
const svg2 = d3
  .select("#svg2")
  .attr("width", width)
  .attr("height", height);

loadNetworkData("all");

function loadNetworkData(genre) {
  var jsonFile = "/static/js/" + genre.toLowerCase() + "_movie_plots.json";
  d3.json(jsonFile).then(function(data) {
    clearNetworkGraph();
    renderNetworkGraph(data);
    svg2.selectAll(".link").style("stroke-width", calculateStrokeWidth);
  });
}

document
  .getElementById("genreSelector")
  .addEventListener("change", function(event) {
    loadNetworkData(event.target.value);
  });

document.getElementById("resetButton").addEventListener("click", function() {
  clearNetworkGraph();

  var currentGenre = document.getElementById("genreSelector").value;

  loadNetworkData(currentGenre);
});

function loadNetworkData(genre) {
  var jsonFile = "/static/js/" + genre.toLowerCase() + "_movie_plots.json";
  d3.json(jsonFile).then(function(data) {
    clearNetworkGraph();
    renderNetworkGraph(data);
  });
}

function clearNetworkGraph() {
  d3.select("#svg2")
    .selectAll("*")
    .remove();
}

function renderNetworkGraph(data) {
  var nodes = data.nodes;
  var links = data.links;

  var tooltip = d3.select("#tooltip");

  nodes.forEach((node, index) => {
    node.color = colors[index % colors.length];
  });

  var simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id(d => d.id)
        .distance(400)
        .strength(0.08)
    )
    .force("charge", d3.forceManyBody().strength(-600))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force(
      "collide",
      d3.forceCollide(d => Math.max(10, d.frequency * 2) + 10)
    )
    .force("x", d3.forceX(width).strength(0.1))
    .force("y", d3.forceY(height).strength(0.1));

  var link = svg2
    .selectAll(".link")
    .data(links)
    .enter()
    .append("line")
    .attr("class", "link")
    .style("stroke-width", calculateStrokeWidth);

  var node = svg2
    .selectAll(".node")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("class", "node")
    .attr("r", d => 42)
    .style("fill", d => d.color)
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html("Keyword: " + d.id + "<br/>Frequency: " + d.frequency)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 10 + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0))
    .call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    )
    .on("dblclick", function(event, d) {
      d.fx = null;
      d.fy = null;
      simulation.alphaTarget(0.3).restart();
    });

  node.on("click", function(event, d) {
    highlightConnected(d);
    event.stopPropagation();
  });

  svg2.on("click", resetHighlight);

  var label = svg2
    .selectAll(".label")
    .data(nodes)
    .enter()
    .append("text")
    .attr("class", "label")
    .text(d => d.id);

  function resetHighlight() {
    node.style("opacity", 1);
    link.style("stroke-opacity", 0.6);
    label.style("opacity", 1);
    d3.select("#detailsPanel").style("display", "none");
  }

  function highlightConnected(d) {
    node.style("opacity", 0.1);
    link.style("stroke-opacity", 0.1);
    label.style("opacity", 0.1);

    link
      .filter(link_d => link_d.source === d || link_d.target === d)
      .style("stroke-opacity", 1)
      .each(link_d => {
        node
          .filter(
            node_d => node_d === link_d.source || node_d === link_d.target
          )
          .style("opacity", 1);
        label
          .filter(
            label_d => label_d === link_d.source || label_d === link_d.target
          )
          .style("opacity", 1);
      });

    let nodeDetailsBody = d3.select("#nodeDetails").html("");
    nodeDetailsBody
      .append("tr")
      .html(`<td colspan="3"><strong>${d.id} (${d.frequency})</strong></td>`);

    let connectedLinks = links.filter(
      link_d => link_d.source === d || link_d.target === d
    );
    connectedLinks.forEach(link_d => {
      let connectedNode = link_d.source === d ? link_d.target : link_d.source;
      nodeDetailsBody
        .append("tr")
        .html(
          `<td>${d.id} (${d.frequency})</td><td>${connectedNode.id} (${connectedNode.frequency})</td><td>${link_d.weight}</td>`
        );
    });

    d3.select("#detailsPanel").style("display", "block");
  }

  link
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html("Weight: " + d.weight)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 10 + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node.attr("cx", d => d.x).attr("cy", d => d.y);

    label.attr("x", d => d.x).attr("y", d => d.y + 5);
  });

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
    //d.fx = null;
    //d.fy = null;
  }
  function calculateStrokeWidth(d) {
    var currentGenre = document.getElementById("genreSelector").value;
    return currentGenre === "All"
      ? Math.min(Math.max(2, d.weight * 0.05), 10)
      : Math.min(Math.max(2, d.weight / 2), 10);
  }
}

//On Click
d3.select("#svg2").on("click", function() {
  d3.selectAll("#svg2 .node").style("opacity", 1);
  d3.selectAll("#svg2 .link").style("opacity", 0.6);
  d3.selectAll("#svg2 .label").style("opacity", 1);
  d3.select("#detailsPanel").style("display", "none");
});
/////////////////////////////////////////////////////////////////////
