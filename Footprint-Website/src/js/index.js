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
  console.log(indivudalSparqlQuery);
  console.log(organisationalQuery);
  let query;
  if (
    document.getElementById('typeOfFootprintDropDown').value === 'Individual'
  ) {
    query = indivudalSparqlQuery;
  } else {
    query = organisationalQuery;
  }

  const apiRequestURL = `http://localhost:7200/repositories/EO4GEOKG?query=${encodeURIComponent(
    query
  )}`;

  fetch(apiRequestURL, {
    method: 'GET',
    headers: {
      Accept: 'application/sparql-results+json',
      Origin: 'localhost:7200',
    },
  })
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
  console.log(footprintType);
  console.log(list);
  console.log(typeof list);
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
