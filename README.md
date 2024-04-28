
# LLM-Inspired Visualization Tool
Link to Visualization tool: https://llmdatavisualization.azurewebsites.net/

## Overview

This visualization tool leverages a substantial dataset to simulate the data processing capabilities of Large Language Models (LLMs). Using 34,886 movie plots from Kaggle, encompassing a wide range of global cinemas since 1901, we utilize D3.js to create dynamic and informative visualizations.

## Features

- **Bubble Charts**: Visualize the weight LLMs might assign to words based on their frequency in specific genres, such as drama and comedy.
- **Neural Network Visualization**: Nodes represent words, and links show their associations, illustrating potential word importance and relational frequency, which aids in predicting concept proximity.
- **Data Focus**: Initially targets American films in English since 2008 to maintain clarity by reducing node count, demonstrating a focused approach contrasting with typical LLM analysis of broader datasets.
- **Interactivity and Scalability**: Users can upload their own datasets to observe variations in LLM interpretation, enhancing the tool's utility and educational value.
- **Hosted Solution**: Deployed on Microsoft Azure for ease of access and seamless user experience.

## Purpose

This project aims to provide insights into how LLMs might interpret and prioritize information by visualizing relationships and word significance within extensive textual data. It serves as both an educational tool and a research aid, showcasing the impact of dataset characteristics on LLM outputs.
