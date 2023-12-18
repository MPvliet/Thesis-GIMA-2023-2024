import { createRadialClusterTreeChart } from './d3/radialClusterTree.js';
import { createRadialTidyTreeChart } from './d3/radialTidyTree.js';
import { transformSPARQLtoD3Hierarchie } from './d3/sparqlToD3Hierarchie.js';
import { genericSPARQLQuery } from './sparql/genericSPARQLQuery.js';

// Fills the form based on type of footprint input.
document
  .getElementById('typeOfFootprintDropDown')
  .addEventListener('change', function () {
    createEntityDropDownList(this.value);
  });

// Processes what happens once you click submit
document
  .getElementById('submitButton')
  .addEventListener('click', async event => {
    event.preventDefault(); // Without this the page refreshes once I click the submit button, but I want JS to process form input.
    let query;
    if (
      document.getElementById('typeOfFootprintDropDown').value === 'Individual'
    ) {
      query = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
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
    } else {
      query = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
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
                             FILTER(CONTAINS(STR(?organisationName), "${
                               document.getElementById(
                                 'dropdownFootprintEntity'
                               ).value
                             }")).
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
                             FILTER(CONTAINS(STR(?organisationName), "${
                               document.getElementById(
                                 'dropdownFootprintEntity'
                               ).value
                             }")).
            ?membersOfOrganisationURI boka:hasKnowledgeOf ?OrgConcept.
            FILTER(?concept = ?OrgConcept)
          }
          BIND ("#f03502" AS ?nodeColour)
              BIND (1 as ?showLabel)
        }
      } ORDER BY (?nodeColour)
      `;
    }

    // Defines the function belonging to each visualisationType
    const visualisationFunction = {
      'Radial-Cluster-Tree': createRadialClusterTreeChart,
      'Radial-Tidy-Tree': createRadialTidyTreeChart,
    };

    let visualisationType = document.getElementById(
      'typeOfVisualisationDropDown'
    ).value;

    try {
      genericSPARQLQuery(query)
        .then(responseJson => transformSPARQLtoD3Hierarchie(responseJson))
        .then(data => {
          visualisationFunction[visualisationType](data);
        });
    } catch (error) {
      console.error('Error creating D3 visualisation: ', error);
      document.getElementById('right-side').innerText =
        'Error creating D3 visualisation: ' + error.message;
    }
  });

async function getAllExperts() {
  const query = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX boka: <http://example.org/BOKA/>
  
  select ?expertName 
  where { 
    ?expertURI rdf:type boka:Expert ;
              foaf:name ?expertName ;
  }`;

  try {
    const data = await genericSPARQLQuery(query);
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

  try {
    const data = await genericSPARQLQuery(query);
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
