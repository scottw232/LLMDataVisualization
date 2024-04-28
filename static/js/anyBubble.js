document.getElementById("upload-form").onsubmit = function(e) {
  e.preventDefault();
  var formData = new FormData(this);
  fetch("/upload", {
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

      var selectHTML = "<select id='column-dropdown'>";
      data.forEach(function(column) {
        selectHTML += "<option value='" + column + "'>" + column + "</option>";
      });
      selectHTML += "</select>";

      document.getElementById("column-selection").innerHTML = selectHTML;

      document.getElementById("create-chart").disabled = false;
    })
    .catch(error => console.error("Error:", error));
};

document.getElementById("create-chart").addEventListener("click", function() {
  //console.log("Button clicked, creating chart.");
  var selectedColumn = document.getElementById("column-dropdown").value;
  fetch("/get-data", {
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

      console.log(data); 
      drawBubbles(data);
    })
    .catch(error => console.error("Error fetching chart data:", error));
});

document.getElementById("create-chart").disabled = true;

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

var tip = d3
  .tip()
  .attr("class", "d3-tip")
  .html(function(d) {
    console.log("Data point:", d);
    return "Keyword: " + d.keyword + "<br>Frequency: " + d.frequency; 
  });

// Main function
function drawBubbles(data) {
  console.log("Data received in drawBubbles:", data);
  const svgWidth = 1000;
  const svgHeight = 600;
  const svg3 = d3
    .select("#svg3")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

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

  console.log("Bubbles processed:", bubbles);

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

  const circles = svg3.selectAll("circle").data(bubbles, d => d.keyword);
  circles.join(
    enter =>
      enter
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.r)
        .attr("fill", d => d.color)
        .attr("stroke", "black"),
    update => update,
    exit => exit.remove()
  );

  // Similarly for the texts
  const texts = svg3.selectAll("text").data(bubbles, d => d.keyword);

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

  svg3
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

  drawBubbles(currentData);
}

