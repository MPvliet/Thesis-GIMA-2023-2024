import { getAllOrganisations } from './sparql/getAllOrganisations.js';
import { getAllExpertsFromOrganisation } from './sparql/getAllExpertsFromOrganisation.js';
import { getAllExpertiseFromExpert } from './sparql/getAllExpertiseFromExpert.js';
import { getAllMissingExpertiseFromExpert } from './sparql/getAllMissingExpertiseFromExpert.js';
import {
  addExpertiseAnnotation,
  deleteExpertiseAnnotation,
} from './sparql/AddOrDeleteExpertiseInKG.js';

// Fills the dropdownList with all available Organisations once the webpage is fully loaded
document.addEventListener(
  'DOMContentLoaded',
  populateOrganisationDropdown(await getAllOrganisations())
);

// Fills the HTML form with experts based on the chosen Organisation, and do that for both the delete list and the add form.
document
  .getElementById('dropdownOrganisations-Delete')
  .addEventListener('change', function () {
    populateExpertsDeleteDropDown(this.value);
  });

document
  .getElementById('dropdownOrganisations-Add')
  .addEventListener('change', function () {
    populateExpertsAddDropDown(this.value);
  });

// Fill the HTML form with concepts to chose from, based on the input from the chosen expert.
document
  .getElementById('dropdownExperts-Delete')
  .addEventListener('change', function () {
    populateConceptsDeleteDropDown(this.value);
  });

document
  .getElementById('dropdownExperts-Add')
  .addEventListener('change', function () {
    populateConceptsAddDropDown(this.value);
  });

// Processes what happens once you click Add
document
  .getElementById('submitButton-Add')
  .addEventListener('click', async event => {
    event.preventDefault(); // Without this the page refreshes once I click the submit button, but I want JS to process form input, not refresh.
  });

// Fills the Dropdown menu based on the information returned by the SPARQL query
function populateOrganisationDropdown(organisationList) {
  let options = '<option value="" disabled selected>Select</option>';
  for (const organisation of organisationList) {
    options += '<option>' + organisation + '</option>';
  }
  document.getElementById('dropdownOrganisations-Delete').innerHTML = options;
  document.getElementById('dropdownOrganisations-Add').innerHTML = options;
}

// Fills the dropdown menu based on the SPARQL Query
async function populateExpertsDeleteDropDown(organisation) {
  const expertList = await getAllExpertsFromOrganisation(organisation);
  let options = '<option value="" disabled selected>Select</option>';
  for (const expert of expertList) {
    options += '<option>' + expert + '</option>';
  }
  document.getElementById('dropdownExperts-Delete').innerHTML = options;
}

async function populateExpertsAddDropDown(organisation) {
  const expertList = await getAllExpertsFromOrganisation(organisation);
  let options = '<option value="" disabled selected>Select</option>';
  for (const expert of expertList) {
    options += '<option>' + expert + '</option>';
  }
  document.getElementById('dropdownExperts-Add').innerHTML = options;
}

async function populateConceptsDeleteDropDown(expert) {
  const conceptList = await getAllExpertiseFromExpert(expert);
  let options = '<option value="" disabled selected>Select</option>';
  for (const concept of conceptList) {
    options += '<option>' + concept + '</option>';
  }
  document.getElementById('dropdownConcepts-Delete').innerHTML = options;
}

async function populateConceptsAddDropDown(expert) {
  const conceptList = await getAllMissingExpertiseFromExpert(expert);
  let options = '<option value="" disabled selected>Select</option>';
  for (const concept of conceptList) {
    options += '<option>' + concept + '</option>';
  }
  document.getElementById('dropdownConcepts-Add').innerHTML = options;
}
