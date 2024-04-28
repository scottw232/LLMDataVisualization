var width = 1400;
var height = 800;
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
const svg4 = d3
  .select("#svg4")
  .attr("width", width)
  .attr("height", height);

globalData = null

document.getElementById("upload-form2").onsubmit = function(e) {
  e.preventDefault();
  var formData = new FormData(this);
  fetch("/upload_network", {
    method: "POST",
    body: formData
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Server responded with status: " + response.status);
      }
      return response.json();
    })
    .then(data => {
      if (data.error) {
        console.error("Error:", data.error);
        return;
      }

      console.log("THIS Data: ." , data)

      var selectHTML = "<select id='column-dropdown2'>";
      data.forEach(function(column) {
        selectHTML += "<option value='" + column + "'>" + column + "</option>";
      });
      selectHTML += "</select>";

      document.getElementById("column-selection2").innerHTML = selectHTML;

      document.getElementById("create_network").disabled = false;
    })
    .catch(error => console.error("Error:", error));
};

  
  document.getElementById("create_network").addEventListener("click", function() {
    //console.log("Button clicked, creating chart.");
    var selectedColumn = document.getElementById("column-dropdown2").value;
    fetch("/create_network", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ column: selectedColumn })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error("Server responded with status: " + response.status);
        }
        return response.json();
      })
      .then(data => {
        if (data.error) {
          console.error("Error:", data.error);
          return;
        }
  
        console.log("In create network: ",data); 
        validateData(data.nodes, data.links);
        globalData = data
        renderNetworkGraph(globalData);
      })
      .catch(error => console.error("Error fetching chart data:", error));
  });
  
  document.getElementById("create-chart2").disabled = true;

  function validateData(nodes, links) {
    let nodeIds = new Set(nodes.map(node => node.id));
    nodes.forEach(node => {
      if (!node.frequency) {
        console.error("Node without frequency:", node);
      }
    });
    links.forEach(link => {
      if (!nodeIds.has(link.source) || !nodeIds.has(link.target)) {
        console.error("Link with invalid node:", link);
      }
    });
  }
  
  function renderNetworkGraph(globalData) {
    clearNetworkGraph();
  function createColorScale(globalData) {
    return d3
      .scaleOrdinal()
      .domain(globalData.map((d, i) => i))
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


function clearNetworkGraph() {
  d3.select("#svg4")
    .selectAll("*")
    .remove();
}

function resetHighlight() {
  node.style("opacity", 1);
  link.style("stroke-opacity", 0.6);
  label.style("opacity", 1);
  d3.select("#detailsPanel2").style("display", "none");
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

  let nodeDetailsBody = d3.select("#nodeDetails2").html("");
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

  d3.select("#detailsPanel2").style("display", "block");
}
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


  var nodes = globalData.nodes;
  var links = globalData.links;

  var tooltip = d3.select("#tooltip2");

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
      d3.forceCollide(d => Math.min(10, d.frequency * 2) + 10)
    )
    .force("x", d3.forceX(width).strength(0.1))
    .force("y", d3.forceY(height).strength(0.1));

  var link = svg4
    .selectAll(".link")
    .data(links)
    .enter()
    .append("line")
    .attr("class", "link")
    .style("stroke-width", function(d) {
      return Math.min(d.weight, 25) ;
    });

  var node = svg4
    .selectAll(".node")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("class", "node")
    .attr("r", d => 50) 
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

  svg4.on("click", resetHighlight);

  var label = svg4
    .selectAll(".label")
    .data(nodes)
    .enter()
    .append("text")
    .attr("class", "label")
    .text(d => d.id);

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

  document.getElementById("resetButton2").addEventListener("click", function() {
    if (globalData) { 
      nodes.forEach(function(d) {
        d.fx = null;
        d.fy = null;
      });
      clearNetworkGraph();
      renderNetworkGraph(globalData);
    } else {
      console.log("No data available to reset.");
    }
  });

}

//On Click
d3.select("#svg4").on("click", function() {
  d3.selectAll("#svg4 .node").style("opacity", 1);
  d3.selectAll("#svg4 .link").style("opacity", 0.6);
  d3.selectAll("#svg4 .label").style("opacity", 1);
  d3.select("#detailsPanel2").style("display", "none");
});
  




  