document.getElementById('submitButton').addEventListener('click', event => {
  event.preventDefault();
  const query = document.getElementById('queryText').value;
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
