import requests, json, time, re, uuid
from rdflib import URIRef, Literal, BNode, Namespace, Dataset

# define ontologies that are used.
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

def main():
  start_time = time.time()
  session = requests.Session()
  importIndivudalExpertise()
  duration = time.time() - start_time
  print("Scripte duurde: ", duration, "seconds")

def importIndivudalExpertise():
  ds = Dataset()
  g = ds.graph(identifier=URIRef("https://bok.eo4geo.eu/applications"))

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

  with open('EO4GEO-BoK-Extraction\input\EO4GEOBOKDATA.json', 'r') as f:
    data = json.load(f)

  conceptDict = {}
  for eo4geoConcept in data:
    conceptDict[data[eo4geoConcept]['name']] = {
      'id': data[eo4geoConcept]['id']
    }
  
  #print(conceptDict)

  with open ('EO4GEO-BoK-Extraction\input\sampleDataFrame.json', 'r') as file:
    jsonSample = json.load(file)

  for expertise in jsonSample:
    doi = expertise['doi']
    concepts = expertise['concepts']

    organisationDict = {}
    for organisation in expertise['organisations']:
      organisationNumber = organisation[0]
      organisationDict[organisationNumber] = {
        'name': organisation[1:],
        'uri': str(uuid.uuid4())
      }
    
    authorOrgDict = {}
    for author in expertise['authors'].replace('and ','').split(', '):
      authorOrgNumber = author[-1]
      authorOrgDict[author[:-1]] = {
        'organisationName': organisationDict[authorOrgNumber]['name'],
        'organisationURI': organisationDict[authorOrgNumber]['uri'],
        'authorURI': str(uuid.uuid4()),
        'authorName': author[:-1]
      }
    
    doiURI = URIRef('{}'.format(doi))
    for concept in concepts:
      conceptURI = URIRef('{}{}'.format('https://bok.eo4geo.eu/', conceptDict[concept]['id']))
      

      #link document to EO4GEO concept
      g.add((conceptURI, boka.describedIn, doiURI))

      #create document class
      g.add((doiURI, rdf.type, bibo.Report))
      g.add((doiURI, bibo.doi, Literal(doi)))
      bNodeAuthorList = BNode('test')
      g.add((doiURI, bibo.authorList, bNodeAuthorList))
      g.add((bNodeAuthorList, rdf.type, rdf.List))
      

    #craeate Expert class and Organisation class
    for author in authorOrgDict:
      expertURI = URIRef('{}{}'.format('https://bok.eo4geo.eu/',authorOrgDict[author]['authorURI']))
      organisationURI = URIRef('{}{}'.format('https://bok.eo4geo.eu/',authorOrgDict[author]['organisationURI']))
      g.add((expertURI, rdf.type, boka.Expert))
      g.add((expertURI, foaf.name, Literal(authorOrgDict[author]['authorName'])))
      g.add((expertURI, rdfs.label, Literal(authorOrgDict[author]['authorName'])))
      g.add((expertURI, org.memberOf, organisationURI))
      g.add((expertURI, boka.authorOf, doiURI))
      for concept in concepts:
        conceptURI = URIRef('{}{}'.format('https://bok.eo4geo.eu/', conceptDict[concept]['id']))
        g.add((expertURI, boka.hasKnowledgeOf, conceptURI))
        g.add((conceptURI, boka.personWithKnowledge, expertURI))
      g.add((organisationURI, org.hasMember, expertURI))
      g.add((organisationURI, rdf.type, org.Organization))
      g.add((organisationURI, foaf.name, Literal(authorOrgDict[author]['organisationName'])))
      g.add((organisationURI, rdfs.label, Literal(authorOrgDict[author]['organisationName'])))

  g.serialize(destination="EO4GEO-BoK-Extraction\output\EO4GEO-KG-individual.trig", format="trig")

main()