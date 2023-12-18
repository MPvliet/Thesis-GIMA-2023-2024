import { createRadialClusterTreeChart } from './d3/radialClusterTree.js';
import { createRadialTidyTreeChart } from './d3/radialTidyTree.js';
import { transformSPARQLtoD3Hierarchie } from './d3/sparqlToD3Hierarchie.js';

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

const hierarchicalQuery = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
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

const hierarchicalQueryWithFullLabels = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX obok: <http://example.org/OBOK/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX eo4geo: <https://bok.eo4geo.eu/>

SELECT ?concept ?conceptName ?conceptID ?childName ?nodeColour ?showLabel  WHERE {
    {
        ?concept rdf:type obok:KnowledgeArea ;
                 rdfs:label ?conceptName ;
                 skos:notation ?conceptID;
                 skos:narrower ?child .
    	?child skos:notation ?childName ;
        skos:notation ?childID.
    }
    UNION
    {
        ?concept rdf:type obok:Concept ;
                 skos:notation ?conceptName ;
                 skos:notation ?conceptID;
                 skos:narrower ?child .
        ?child rdfs:label ?childName ;
        skos:notation ?childID.
        FILTER(?concept = eo4geo:GIST)
    }
    UNION
    {
        ?concept rdf:type obok:Concept .
        FILTER NOT EXISTS { ?concept rdf:type obok:KnowledgeArea . }
        
        ?concept skos:notation ?conceptName ;
                 skos:notation ?conceptID;
                 skos:narrower ?child .
        ?child skos:notation ?childName ;
        skos:notation ?childID.
        FILTER(?concept != eo4geo:GIST)
    }
    BIND ("#f0cd02" AS ?nodeColour) 
    BIND (1 as ?showLabel)
    #FILTER(CONTAINS(str(?concept), "GIST"))
}
`;

genericSPARQLQuery(hierarchicalQuery)
  .then(responseJson => transformSPARQLtoD3Hierarchie(responseJson))
  .then(data => createRadialTidyTreeChart(data))
  .catch(error => {
    console.error('Error creating D3 visualisation: ', error);
    document.getElementById('right-side').innerText =
      'Error creating D3 visualisation: ' + error.message;
  });
