console.log("In anyNetwork")
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
  
        var selectHTML = "<select id='column-dropdown2'>";
        data.forEach(function(column) {
          selectHTML += "<option value='" + column + "'>" + column + "</option>";
        });
        selectHTML += "</select>";
  
        // Set the innerHTML of the column-selection2 div with the new dropdown HTML
        document.getElementById("column-selection2").innerHTML = selectHTML;
  
        // Re-enable the create chart button
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
  
        // Assuming createBubbleChart is a defined function
        console.log(data); // Add this to log your data
        drawBubbles(data);
      })
      .catch(error => console.error("Error fetching chart data:", error));
  });
  
  // Initially, disable the create chart button until data is loaded
  document.getElementById("create-chart").disabled = true;
  // This function assumes 'data' is the JSON object from your 'frequencies.json' file.
  
  // Define the tooltip outside of the drawBubbles function to avoid duplicates
  
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
      // Make sure to use 'event' and 'd' to access the event and data
      console.log("Data point:", d);
      return "Keyword: " + d.keyword + "<br>Frequency: " + d.frequency; // Adjust this line based on your data structure
    });
  
  // Use only one drawBubbles function
  function drawBubbles(data) {
    console.log("Data received in drawBubbles:", data);
    const svgWidth = 1000;
    const svgHeight = 600;
    const svg4 = d3
      .select("#svg4")
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
  
    // Join operation in D3 v6 replaces the enter() and exit() pattern
    const circles = svg4.selectAll("circle").data(bubbles, d => d.keyword);
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
    const texts = svg4.selectAll("text").data(bubbles, d => d.keyword);
  
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
  
    svg4
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
