import json
from rdflib import Graph, URIRef, Literal, Namespace, BNode

# Load SRJ file
with open('EO4GEO-BoK-Extraction\input\exportGraphDB.srj', 'r', encoding='utf-8') as file:
  srj_data = json.load(file)

# Create a new RDFLib graph
g = Graph()

obok = Namespace('http://example.org/OBOK/')
boka = Namespace('http://example.org/BOKA/')
dce = Namespace('http://purl.org/dc/elements/1.1/')
org = Namespace('http://www.w3.org/ns/org#')
rdf = Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
bibo = Namespace('http://purl.org/ontology/bibo/')
foaf = Namespace('http://xmlns.com/foaf/0.1/')
rdfs = Namespace('http://www.w3.org/2000/01/rdf-schema#')
schema = Namespace('https://schema.org/')
dcterms = Namespace('http://purl.org/dc/terms/')
skos = Namespace('http://www.w3.org/2004/02/skos/core#')
eo4geo = Namespace('https://bok.eo4geo.eu/')

# bind ontologies, otherwise the prefixes are not correct. 
g.bind('obok', obok)
g.bind('boka', boka)
g.bind('dce', dce)
g.bind('org', org)
g.bind('rdf', rdf)
g.bind('bibo', bibo)
g.bind('foaf', foaf)
g.bind('rdfs', rdfs)
g.bind('schema', schema)
g.bind('dcterms', dcterms)
g.bind('skos', skos)
g.bind('eo4geo', eo4geo)

# Assuming srj_data is structured with 'results' containing 'bindings'
for binding in srj_data['results']['bindings']:
    s = URIRef(binding['s']['value'])  # Adjust these keys based on your SRJ structure
    p = URIRef(binding['p']['value'])
    if binding['o']['type'] == "uri":
      o = URIRef(binding['o']['value'])
    if binding['o']['type'] == 'bnode':
       o = URIRef(binding['o']['value'])
    else:    
      o = Literal(binding['o']['value'])

    g.add((s, p, o))

# Serialize in a readable format
g.serialize(destination='EO4GEO-BoK-Extraction\output\SPARQL_results_beatified.ttl', format='turtle')