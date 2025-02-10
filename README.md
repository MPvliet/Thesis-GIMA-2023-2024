# Introducing knowledge footprints: Enhancing knowledge graph data retrieval with visualisations for improved geoscience collaboration 

This repository contains all data and scripts used for my master's thesis. For the two-year joint-degree Master of Science programme Geographical Information Management and Applications (GIMA). (Utrecht University / Delft University of Technology / University of Twente / Wageningen University & Research)

The thesis presents how the already existing relational nature of describing BoK concepts in the EO4GEO BoK can be transformed to a RDF graph dataset following an upper ontology for describing bodies of knowledge. In addition, this graph dataset is then semi-automatically enriched with expertise annotations, which are created by extracting EO4GEO concepts from research papers by natural language processing tools (Levering the results of this thesis: https://github.com/UpekshaIndeewari/geotec_thesis_EO4GEO). 

For combining and storing expertise annotations, GEO BoK content and the semantics defined in the ontologies for bodies of knowledge (OBOK) and applications (BOKA), the GEO knowledge graph was created. And became the source for two new applications; a tool for generating knowledge footprints and a tool for knowledge footprint matching.

This study further shows how visualisations can be leveraged and how they provide extra context in knowledge graph data retrieval through question and answering through visualisations. These visualisations are called knowledge footprints. They are created for the purpose of representing, promoting and retrieving someone’s expertise. This study introduces a user-evaluated website that combines the EO4GEO knowledge graph, SPARQL, JavaScript and the D3.js library to interactively create these knowledge footprints. This website can be seen [here.](https://mpvliet.github.io/)

## Repository Structure
```
📂 Thesis-GIMA-2023-2024/
├── 📂 EO4GEO-BoK-Extraction/  # Contains various python script to download EO4GEO BoK content, transform the EO4GEO BoK to RDF triples and a script that transforms expertise annotations to RDF triples. 
├── 📂 Footprint-Website/      # The root folder from the created website, containing various JavaScript scripts, HTML and CSS.
├── 📂 Ontology-Development/   # Contains both ontologies (OBOK and BOKA) in the turtle format.
```

