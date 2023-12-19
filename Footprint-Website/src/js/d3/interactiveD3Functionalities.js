import { genericSPARQLQuery } from '../../../src/js/sparql/genericSPARQLQuery.js';

// Functions to show and hide label text
function showLabel() {
  d3.selectAll(`#label-${this.id}`).style('opacity', 1).attr('font-size', 20);
}

function hideLabel() {
  d3.selectAll(`#label-${this.id}`).style('opacity', 0).attr('font-size', 0);
}

async function showDetails() {
  const detailQuery = `
  PREFIX obok: <http://example.org/OBOK/>
  PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
  PREFIX dcterms: <http://purl.org/dc/terms/>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
  PREFIX boka: <http://example.org/BOKA/>
  PREFIX org: <http://www.w3.org/ns/org#>

  SELECT ?description ?fullConceptName (GROUP_CONCAT(DISTINCT ?expertName; SEPARATOR = " || ") AS ?expertList) (GROUP_CONCAT(DISTINCT ?organisationName; SEPARATOR = " || ") AS ?organisationList) WHERE {
    ?concept rdf:type obok:Concept;
      rdfs:label ?fullConceptName;
      dcterms:description ?description.
    OPTIONAL {
      ?concept boka:personWithKnowledge ?expert.
      ?expert rdfs:label ?expertName ;
               org:memberOf ?organisation .
      ?organisation rdfs:label ?organisationName .
    }
    FILTER(CONTAINS(str(?concept),"${this.id}"))
  }
  GROUP BY ?fullConceptName ?description
  `;
  const sparqlResponse = await genericSPARQLQuery(detailQuery);

  const description = sparqlResponse.results.bindings[0].description.value;
  const fullConceptName =
    sparqlResponse.results.bindings[0].fullConceptName.value;

  const expertList =
    sparqlResponse.results.bindings[0].expertList.value.split(' || ');

  let expertHtmlList = '<ul>';
  expertList.forEach(expert => {
    expertHtmlList += `<li>${expert}</li>`;
  });
  expertHtmlList += '</ul>';

  const organisationList =
    sparqlResponse.results.bindings[0].organisationList.value.split(' || ');

  let organisationHtmlList = '<ul>';
  organisationList.forEach(organisation => {
    organisationHtmlList += `<li>${organisation}</li>`;
  });
  organisationHtmlList += '</ul>';

  let detailsHtml = `<h2>${fullConceptName}</h2>
  <h4>People with knowledge of this concept:</h4>
  ${expertHtmlList}
  <h4>Organisations with knowledge of this concept:</h4>
  ${organisationHtmlList}
  <h4>Description:</h4>
  <p>${description}</p>
  `;
  document.getElementById('detailsSection').innerHTML = detailsHtml;
}

export { showDetails, showLabel, hideLabel };
