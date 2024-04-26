function openTab(evt, tabName) {
  // Hide all tab content
  let tabcontent = document.getElementsByClassName("tabcontent");
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Remove "active" class from all tabs
  let tablinks = document.getElementsByClassName("tablinks");
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab content
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";

  // Call specific JavaScript based on tab name
  if (tabName === "Tab1" || tabName === "Tab3") {
    // Run the code from bubble_chart.js
    loadBubbleChart();
  } else if (tabName === "Tab2") {
    // Run the code from anyBubble.js
    loadAnyBubble();
  }else if (tabName === "Tab4") {
    // Run the code from anyBubble.js
    loadanyNetwork();
  }
}

// Function to load the bubble chart for tabs 1 and 3
function loadBubbleChart() {
  // You can dynamically create a <script> tag and append it to the body
  let script = document.createElement("script");
  script.src = "/static/js/bubble_chart.js";
  script.onload = function() {
    // This function is called after the script is loaded
    // You can initialize your bubble chart here if the function is in bubble_chart.js
    initializeBubbleChart(); // Replace with actual initialization function
  };
  document.body.appendChild(script);
}

// Function to load the anyBubble chart for tabs 2 and 4
function loadAnyBubble() {
  let script = document.createElement("script");
  script.src = "/static/js/anyBubble.js";
  script.onload = function() {
    // This function is called after the script is loaded
    // You can initialize your anyBubble chart here if the function is in anyBubble.js
    // initializeAnyBubbleChart(); // Replace with actual initialization function
  };
  document.body.appendChild(script);
}

function loadanyNetwork() {
  let script = document.createElement("script");
  script.src = "/static/js/anyNetwork.js";
  script.onload = function() {
    // This function is called after the script is loaded
    // You can initialize your anyBubble chart here if the function is in anyBubble.js
    // initializeAnyBubbleChart(); // Replace with actual initialization function
  };
  document.body.appendChild(script);
}

// To initially open Tab 1
document.getElementById("defaultOpen").click();

// function openTab(evt, tabName) {
//   var i, tabcontent, tablinks;
//   tabcontent = document.getElementsByClassName("tabcontent");
//   for (i = 0; i < tabcontent.length; i++) {
//     tabcontent[i].style.display = "none";
//   }
//   tablinks = document.getElementsByClassName("tablinks");
//   for (i = 0; i < tablinks.length; i++) {
//     tablinks[i].className = tablinks[i].className.replace(" active", "");
//   }
//   document.getElementById(tabName).style.display = "block";
//   evt.currentTarget.className += " active";
// }

// document.getElementById("defaultOpen").click();
