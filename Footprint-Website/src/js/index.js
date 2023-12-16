document.getElementById('submitButton').addEventListener('click', event => {
  event.preventDefault();
  let indivudalSparqlQuery = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX boka: <http://example.org/BOKA/>

select ?expertName ?conceptName 
where { 
	?expertURI rdf:type boka:Expert ;
            foaf:name ?expertName ;
            boka:hasKnowledgeOf ?conceptURI.
    ?conceptURI rdfs:label ?conceptName .
    filter(CONTAINS(str(?expertName), "${
      document.getElementById('dropdownFootprintEntity').value
    }"))
}`;
  let organisationalQuery = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX obok: <http://example.org/OBOK/>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX org: <http://www.w3.org/ns/org#>
  PREFIX boka: <http://example.org/BOKA/>
  
  select DISTINCT ?conceptName where {
    ?organisationURI rdf:type org:Organization;
                     rdfs:label ?organisationName ;
                     org:hasMember ?membersOfOrganisationURI .
    ?membersOfOrganisationURI boka:hasKnowledgeOf ?ExpertiseConceptURI.
    ?ExpertiseConceptURI rdfs:label ?conceptName .
    FILTER(CONTAINS(STR(?organisationName), "${
      document.getElementById('dropdownFootprintEntity').value
    }"))}`;
  let query;
  if (
    document.getElementById('typeOfFootprintDropDown').value === 'Individual'
  ) {
    query = indivudalSparqlQuery;
  } else {
    query = organisationalQuery;
  }

  fetch(
    `http://localhost:7200/repositories/EO4GEOKG?query=${encodeURIComponent(
      query
    )}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/sparql-results+json',
        Origin: 'localhost:7200',
      },
    }
  )
    .then(response => {
      return response.json();
    })
    .then(data => {
      document.getElementById('right-side').innerText = JSON.stringify(
        data,
        null,
        '\t'
      );
    })
    .catch(error => {
      console.error('Fetch error:', error);
      document.getElementById('right-side').innerText =
        'Error: ' + error.message;
    });
});

function fillOrganisationAndPersonList(footprintType, list) {
  if (footprintType.length == 0) {
    document.getElementById('dropdownFootprintEntity').innerHTML =
      '<option></option>';
  } else {
    var options = '';
    for (var entity of list) {
      options += '<option>' + entity + '</option>';
    }
    document.getElementById('dropdownFootprintEntity').innerHTML = options;
  }
}

async function getAllExperts() {
  const query = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX boka: <http://example.org/BOKA/>
  
  select ?expertName 
  where { 
    ?expertURI rdf:type boka:Expert ;
              foaf:name ?expertName ;
  }`;
  const apiRequestURL = `http://localhost:7200/repositories/EO4GEOKG?query=${encodeURIComponent(
    query
  )}`;

  try {
    const response = await fetch(apiRequestURL, {
      method: 'GET',
      headers: {
        Accept: 'application/sparql-results+json',
        Origin: 'localhost:7200',
      },
    });
    const data = await response.json();

    const expertList = data['results']['bindings'].map(
      expert => expert.expertName.value
    );
    return expertList.sort();
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
}

async function getAllOrganisations() {
  const query = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX org: <http://www.w3.org/ns/org#>
  
  select ?organisationName 
  where { 
    ?orgURI rdf:type org:Organization ;
              foaf:name ?organisationName ;
  }`;
  const apiRequestURL = `http://localhost:7200/repositories/EO4GEOKG?query=${encodeURIComponent(
    query
  )}`;

  try {
    const response = await fetch(apiRequestURL, {
      method: 'GET',
      headers: {
        Accept: 'application/sparql-results+json',
        Origin: 'localhost:7200',
      },
    });
    const data = await response.json();

    const organisationList = data['results']['bindings'].map(
      organisation => organisation.organisationName.value
    );
    return organisationList.sort();
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
}

async function createEntityDropDownList(footprintType) {
  if (footprintType === 'Individual') {
    try {
      const expertList = await getAllExperts();
      fillOrganisationAndPersonList(footprintType, expertList);
    } catch (error) {
      console.error('Error:', error);
    }
  } else {
    try {
      const organisationList = await getAllOrganisations();
      fillOrganisationAndPersonList(footprintType, organisationList);
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

async function genericSPARQLQuery(query) {
  try {
    const response = await fetch(
      `http://localhost:7200/repositories/EO4GEOKG?query=${encodeURIComponent(
        query
      )}`,
      {
        method: 'GET',
        headers: { Accept: 'application/sparql-results+json' },
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

function transformSPARQLtoD3HierarchieData(json) {
  const nodes = new Map();

  // function to iteratively create nodes
  const addChild = (
    parent,
    parentId,
    child,
    childId,
    nodeColour,
    showLabel
  ) => {
    if (child !== null) {
      if (!nodes.has(child)) {
        nodes.set(child, {
          name: child,
          id: childId,
          nodeColour: nodeColour,
          showLabel: showLabel,
        });
      }
    }

    if (!nodes.has(parent)) {
      nodes.set(parent, {
        name: parent,
        id: parentId,
        nodeColour: nodeColour,
        showLabel: showLabel,
        children: [],
      });
    }

    if (child !== null) {
      const parentNode = nodes.get(parent);
      if (!parentNode.children) {
        parentNode.children = [];
      }
      parentNode.children.push(nodes.get(child));
    }
  };

  // Fill the map with the conceptNames and ChildNames from the sparql json output.
  json.results.bindings.forEach(item => {
    const parent = item.conceptName.value;
    const parentId = item.conceptID.value;
    const nodeColour = item.nodeColour.value;
    const showLabel = item.showLabel.value;
    const child = item.childName ? item.childName.value : null; // not all concepts have childs.
    const childId = item.childID ? item.childID.value : null;

    addChild(parent, parentId, child, childId, nodeColour, showLabel);
  });
  // Creates an array from all nodes.values and then find the root node, through looping through this list. The rootnode is the node that has no parent. and thus is no child for any node in this list. // For the EO4GEO BoK this is always 'GIST'.
  const rootNode = Array.from(nodes.values()).find(
    node =>
      !json.results.bindings.some(
        binding => binding.childName && binding.childName.value === node.name
      )
  );
  console.log(rootNode);
  return rootNode;
}

function createRadialClusterTreeChart(data) {
  const width = 1780;
  const height = width;
  const cx = width * 0.5;
  const cy = height * 0.5;
  const radius = Math.min(width, height) / 2 - 190;

  const tree = d3
    .cluster()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

  const root = tree(d3.hierarchy(data));

  const svg = d3
    .create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [-cx, -cy, width, height])
    .attr('style', 'width: 100%; height: auto; font: 10px sans-serif;')
    .call(
      // enables zoom and pann
      d3
        .zoom()
        .scaleExtent([0.5, 5])
        .on('zoom', e => {
          chartGroup.attr('transform', e.transform);
        })
    );

  // Group to hold all chart elements, paths, nodes and labels.
  const chartGroup = svg.append('g');

  // Append links
  chartGroup
    .append('g')
    .attr('fill', 'none')
    .attr('stroke', '#005ca2')
    .attr('stroke-opacity', 0.4)
    .attr('stroke-width', 1.5)
    .selectAll()
    .data(root.links())
    .join('path')
    .attr(
      'd',
      d3
        .linkRadial()
        .angle(d => d.x)
        .radius(d => d.y)
    );

  // Append nodes
  chartGroup
    .append('g')
    .selectAll()
    .data(root.descendants())
    .join('circle')
    .attr(
      'transform',
      d => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`
    )
    .attr('fill', d => (d.children ? d.data.nodeColour : d.data.nodeColour))
    .attr('id', d => `${d.data.id}`)
    .attr('r', 3.5);

  // Append labels
  chartGroup
    .append('g')
    .attr('stroke-linejoin', 'round')
    .attr('stroke-width', 3)
    .selectAll()
    .data(root.descendants())
    .join('text')
    .attr(
      'transform',
      d =>
        `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0) rotate(${
          d.x >= Math.PI ? 180 : 0
        })`
    )
    .attr('font-family', 'Segoe UI')
    .attr('font-size', 10)
    .attr('dy', '0.31em')
    .attr('x', d => (d.x < Math.PI === !d.children ? 6 : -6))
    .attr('text-anchor', d => (d.x < Math.PI === !d.children ? 'start' : 'end'))
    .attr('paint-order', 'stroke')
    .attr('stroke', 'white')
    .attr('fill', 'currentColor')
    .style('opacity', d => `${d.data.showLabel}`)
    .attr('id', d => `label-${d.data.id}`)
    .text(d => d.data.id);

  // Functions to show and hide label text
  function showLabel(d) {
    d3.selectAll(`#label-${this.id}`).style('opacity', 1).attr('font-size', 20);
  }

  function hideLabel(d) {
    d3.selectAll(`#label-${this.id}`).style('opacity', 0).attr('font-size', 10);
  }

  chartGroup
    .selectAll('circle')
    .on('mouseover', showLabel)
    .on('mouseout', hideLabel);

  document.getElementById('right-side').appendChild(svg.node());
}

function createRadialTidyTreeChart(data) {
  const width = 1780;
  const height = width;
  const cx = width * 0.5; // adjust as needed to fit
  const cy = height * 0.5; // adjust as needed to fit
  const radius = Math.min(width, height) / 2 - 90;

  // Create a radial tree layout. The layout’s first dimension (x)
  // is the angle, while the second (y) is the radius.
  const tree = d3
    .tree()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

  // Sort the tree and apply the layout.
  const root = tree(
    d3.hierarchy(data).sort((a, b) => d3.ascending(a.data.name, b.data.name))
  );

  // Creates the SVG container.
  const svg = d3
    .create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [-cx, -cy, width, height])
    .attr('style', 'width: 100%; height: auto; font: 10px sans-serif;');

  // Append links.
  svg
    .append('g')
    .attr('fill', 'none')
    .attr('stroke', '#005ca2')
    .attr('stroke-opacity', 0.4)
    .attr('stroke-width', 1.5)
    .selectAll()
    .data(root.links())
    .join('path')
    .attr(
      'd',
      d3
        .linkRadial()
        .angle(d => d.x)
        .radius(d => d.y)
    );

  // Append nodes.
  svg
    .append('g')
    .selectAll()
    .data(root.descendants())
    .join('circle')
    .attr(
      'transform',
      d => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`
    )
    .attr('fill', d => (d.children ? d.data.nodeColour : d.data.nodeColour))
    .attr('r', 2.5);

  // Append labels.
  svg
    .append('g')
    .attr('stroke-linejoin', 'round')
    .attr('stroke-width', 3)
    .selectAll()
    .data(root.descendants())
    .join('text')
    .attr(
      'transform',
      d =>
        `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0) rotate(${
          d.x >= Math.PI ? 180 : 0
        })`
    )
    //.attr('font-family', 'sans-serif')
    .attr('dy', '0.31em')
    .attr('x', d => (d.x < Math.PI === !d.children ? 6 : -6))
    .attr('text-anchor', d => (d.x < Math.PI === !d.children ? 'start' : 'end'))
    .attr('paint-order', 'stroke')
    .attr('stroke', 'white')
    .attr('fill', 'currentColor')
    .text(d => d.data.id);

  document.getElementById('right-side').appendChild(svg.node());
}

hierarchicalQuery = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX org: <http://www.w3.org/ns/org#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX boka: <http://example.org/BOKA/>
PREFIX obok: <http://example.org/OBOK/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?conceptName ?childName ?conceptID ?childID ?nodeColour ?showLabel
WHERE {
  {
    ?concept rdf:type obok:Concept;
             rdfs:label ?conceptName;
             skos:notation ?conceptID.

    OPTIONAL { ?concept skos:narrower ?child.
               ?child rdfs:label ?childName;
                      skos:notation ?childID. }

    FILTER NOT EXISTS {
      ?organisationURI rdf:type org:Organization;
                       rdfs:label ?organisationName;
                       org:hasMember ?membersOfOrganisationURI;
                       FILTER(CONTAINS(STR(?organisationName), "University of Twente")).
      ?membersOfOrganisationURI boka:hasKnowledgeOf ?OrgConcept.
      FILTER(?concept = ?OrgConcept)
    }
    BIND ("#f0cd02" AS ?nodeColour)
        BIND (0 as ?showLabel)
  }
  UNION
  {
    ?concept rdf:type obok:Concept;
             rdfs:label ?conceptName;
             skos:notation ?conceptID.

    OPTIONAL { ?concept skos:narrower ?child.
               ?child rdfs:label ?childName;
                      skos:notation ?childID. }

    FILTER EXISTS {
      ?organisationURI rdf:type org:Organization;
                       rdfs:label ?organisationName;
                       org:hasMember ?membersOfOrganisationURI;
                       FILTER(CONTAINS(STR(?organisationName), "University of Twente")).
      ?membersOfOrganisationURI boka:hasKnowledgeOf ?OrgConcept.
      FILTER(?concept = ?OrgConcept)
    }
    BIND ("#f03502" AS ?nodeColour)
        BIND (1 as ?showLabel)
  }
} ORDER BY (?nodeColour)
`;

hierarchicalQueryWithFullLabels = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX obok: <http://example.org/OBOK/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX eo4geo: <https://bok.eo4geo.eu/>

SELECT ?concept ?conceptName ?childName WHERE {
    {
        ?concept rdf:type obok:KnowledgeArea ;
                 rdfs:label ?conceptName ;
                 skos:narrower ?child .
    	?child skos:notation ?childName .
    }
    UNION
    {
        ?concept rdf:type obok:Concept ;
                 skos:notation ?conceptName ;
                 skos:narrower ?child .
        ?child rdfs:label ?childName .
        FILTER(?concept = eo4geo:GIST)
    }
    UNION
    {
        ?concept rdf:type obok:Concept .
        FILTER NOT EXISTS { ?concept rdf:type obok:KnowledgeArea . }
        
        ?concept skos:notation ?conceptName ;
                 skos:narrower ?child .
        ?child skos:notation ?childName .
        FILTER(?concept != eo4geo:GIST)
    }
    #FILTER(CONTAINS(str(?concept), "GIST"))
}
`;

genericSPARQLQuery(hierarchicalQuery)
  .then(responseJson => transformSPARQLtoD3HierarchieData(responseJson))
  .then(data => createRadialClusterTreeChart(data)) //createRadialClusterTreeChart(data))
  .catch(error => {
    console.error('Error creating D3 visualisation: ', error);
    document.getElementById('right-side').innerText =
      'Error creating D3 visualisation: ' + error.message;
  });
