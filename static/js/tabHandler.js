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
    loadBubbleChart();
  } else if (tabName === "Tab2") {
    loadAnyBubble();
  }else if (tabName === "Tab4") {
    loadanyNetwork();
  }
}

function loadBubbleChart() {
  let script = document.createElement("script");
  script.src = "/static/js/bubble_chart.js";
  script.onload = function() {
    initializeBubbleChart(); 
  };
  document.body.appendChild(script);
}

function loadAnyBubble() {
  let script = document.createElement("script");
  script.src = "/static/js/anyBubble.js";
  script.onload = function() {
  };
  document.body.appendChild(script);
}

function loadanyNetwork() {
  let script = document.createElement("script");
  script.src = "/static/js/anyNetwork.js";
  script.onload = function() {
  };
  document.body.appendChild(script);
}

// To initially open Tab 1
document.getElementById("defaultOpen").click();