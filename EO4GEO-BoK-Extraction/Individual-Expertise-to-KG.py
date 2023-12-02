import json, time, re, uuid, os
from rdflib import URIRef, Literal, BNode, Namespace, Dataset
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def main():
  start_time = time.time()
  parseIndividualExpertiseIntoRDF()
  duration = time.time() - start_time
  print("Scripte duurde: ", duration, "seconds")

def parseIndividualExpertiseIntoRDF():
  ds = Dataset()
  g = ds.graph(identifier=URIRef("https://bok.eo4geo.eu/applications"))

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

  with open ('EO4GEO-BoK-Extraction\input\sampleDataFrameInput.json', 'r') as file:
    jsonSample = file.read() #json.load(file)

  processed = processIndivudalExpertiseJson(jsonSample) #let openai parse the json in a better json structure
  
  for expertise in json.loads(processed):
    doi = expertise['doi']
    concepts = expertise['concepts']

    organisationDict = {}
    for organisation in expertise['organisations']:
      if not re.match(r'^-?\d+(\.\d+)?$', organisation[0]):
        organisationNumber = 1
        organisationDict[organisationNumber] = {
          'name': organisation,
          'uri': str(uuid.uuid4())
        }
      else:
        organisationNumber = organisation[0]
        organisationDict[organisationNumber] = {
          'name': organisation[1:],
          'uri': str(uuid.uuid4())
        }
    
    authorOrgDict = {}
    for author in expertise['authors']:
      if not re.match(r'^-?\d+(\.\d+)?$', author[-1]):
        authorOrgNumber = 1
        authorOrgDict[author] = {
          'organisationName': organisationDict[authorOrgNumber]['name'],
          'organisationURI': organisationDict[authorOrgNumber]['uri'],
          'authorURI': str(uuid.uuid4()),
          'authorName': author
        }
      else:
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

def processIndivudalExpertiseJson(jsonPrompt):
  client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
  )

  #jsonPrompt = '{"DOI": "https://doi.org/10.5194/agile-giss-4-18-2023", "Title": "Predicting Pedestrian Counts using Machine Learning Molly Asher1 , Yannick Oswald1 , and Nick Malleson1 1School of Geography , University of Leeds , UK Correspondence : Nick Malleson ( n.s.malleson @ leeds.ac.uk )","Concepts": ["Discovery over linked open data","Open data","Machine learning","Approaches to point, line, and area generalization","Publishing linked open data","Decision trees","Time","Information-as-data-interpretation"]}'

  expectedJSONResult = '[{"doi": "https://doi.org/10.5194/agile-giss-4-2-2023","authors": ["Reza Arabsheibani1","Ehsan Hamzei1","Kimia Amoozandeh1","Stephan Winter2","Martin Tomko1"],"organisations": ["1Department of Infrastructure Engineering, The University of Melbourne, Parkville, VIC 3010, Australia","2Second organisation name"],"concepts": ["Publishing linked open data","Discovery over linked open data"]}]'

  messages = [
    {"role": "system", "content": 'You can help me parse a single JSON I will provide, in the following JSON structure: `[{"doi": "","authors": [],"organisations": [],"concepts": []}] only return the json and you can keep the numbers before the organisation and behind each authorsname'},
    {"role": "user", "content": ' for example this json {"DOI": "https://doi.org/10.5194/agile-giss-4-18-2023","Title": "Predicting Pedestrian Counts using Machine Learning Reza Arabsheibani1 Ehsan Hamzei1 Kimia Amoozandeh1 Stephan Winter2 Martin Tomko1 1Department of Infrastructure Engineering, The University of Melbourne, Parkville, VIC 3010, Australia 2Second organisation name Correspondence : Nick Malleson ( n.s.malleson @ leeds.ac.uk )", "Concepts": ["Discovery over linked open data","Publishing linked open data"]}'},
    {"role": "assistant", "content": expectedJSONResult},
    {"role": "user", "content": jsonPrompt}
  ]

  response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=messages,
    temperature=1,
    max_tokens=256,
    top_p=1,
    frequency_penalty=0,
    presence_penalty=0
  )

  return response.choices[0].message.content

main()
