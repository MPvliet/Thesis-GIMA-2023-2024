import requests

API_BASE_URL = 'https://api.crossref.org/works/'
session = requests.Session()

doi = '10.5194/agile-giss-4-18-2023'
url = API_BASE_URL + doi

response = session.get(url, headers={} ,params={}).json()['message']

doi = response['DOI']
authors = response['author']
title = response['title']

print(doi)
print(authors)
print(title)