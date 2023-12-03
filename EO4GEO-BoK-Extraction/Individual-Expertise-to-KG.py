import json, time, re, uuid, os
from rdflib import URIRef, Literal, BNode, Namespace, Dataset
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def main():
  start_time = time.time()
  #processAllInputJSON()
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

  # creates a dictionary including the concept notatation and the full name. The full name is received from the NLP ouptut. But needs to be matched with the notation ex. WB4 
  conceptDict = {} 
  for eo4geoConcept in data:
    conceptDict[data[eo4geoConcept]['name']] = {
      'id': data[eo4geoConcept]['id']
    }

  # opens 
  with open ('EO4GEO-BoK-Extraction\input\IndividualExpertise.json', 'r') as file:
    indivudalExpertise = json.load(file)
  
  uniqueOrganisationDict = {}
  uniqueAuthorDict = {}

  #Create uniqueAuthorDict with all necessarily information to make RDF triples
  for expertise in indivudalExpertise:
    for author in expertise['authors']:
      if re.match(r'^-?\d+(\.\d+)?$', author[-1]):
        authorOrgNumber = author[-1]
        if author[:-1] not in uniqueAuthorDict:
          uniqueAuthorDict[author[:-1]] = {
            'authorName': author[:-1],
            'authorURI': str(uuid.uuid4()),
            'worksAt': []
          }

        for organisation in expertise['organisations']:
          if organisation.startswith(authorOrgNumber):
            uniqueAuthorDict[author[:-1]]['worksAt'].append({'organisationName': organisation[1:]})
          if re.match(r'^-?\d+(\.\d+)?$', organisation[0]):
            if organisation[0] not in uniqueOrganisationDict:
              uniqueOrganisationDict[organisation[1:]] = {
                'organisationName': organisation[1:],
                'organisationURI': str(uuid.uuid4())
              }

    for author in uniqueAuthorDict:
      for orgDict in uniqueAuthorDict[author]['worksAt']:
        if orgDict['organisationName'] in uniqueOrganisationDict:
          orgDict['organisationURI'] = uniqueOrganisationDict[orgDict['organisationName']]['organisationURI']
    
  print(uniqueAuthorDict)
  doi = expertise['doi']
  concepts = expertise['concepts']

  doiURI = URIRef('{}'.format(doi))
  for concept in concepts:
    conceptURI = URIRef('{}{}'.format('https://bok.eo4geo.eu/', conceptDict[concept]['id']))

    #link document to EO4GEO concept
    g.add((conceptURI, boka.describedIn, doiURI))

    #create document class
    g.add((doiURI, rdf.type, bibo.Report))
    g.add((doiURI, bibo.doi, Literal(doi)))
    

  #create Expert class and Organisation class
  for author in uniqueAuthorDict:
    expertURI = URIRef('{}{}'.format('https://bok.eo4geo.eu/',uniqueAuthorDict[author]['authorURI']))
    g.add((expertURI, rdf.type, boka.Expert))
    g.add((expertURI, foaf.name, Literal(uniqueAuthorDict[author]['authorName'])))
    g.add((expertURI, rdfs.label, Literal(uniqueAuthorDict[author]['authorName'])))
    g.add((expertURI, boka.authorOf, doiURI))


    for organisation in uniqueAuthorDict[author]['worksAt']:
      organisationURI = URIRef('{}{}'.format('https://bok.eo4geo.eu/',organisation['organisationURI']))
      g.add((organisationURI, rdf.type, org.Organization))
      g.add((expertURI, org.memberOf, organisationURI))
      g.add((organisationURI, org.hasMember, expertURI))
      g.add((organisationURI, foaf.name, Literal(organisation['organisationName'])))
      g.add((organisationURI, rdfs.label, Literal(organisation['organisationName'])))


    for concept in concepts:
      conceptURI = URIRef('{}{}'.format('https://bok.eo4geo.eu/', conceptDict[concept]['id']))
      g.add((expertURI, boka.hasKnowledgeOf, conceptURI))
      g.add((conceptURI, boka.personWithKnowledge, expertURI))

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
    {"role": "user", "content": '{}'.format(jsonPrompt)}
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


def mergeToTotalExpertiseFile(newParsesdData):
  with open('EO4GEO-BoK-Extraction\input\IndividualExpertise.json', 'r') as file:
    existingData = json.load(file)
  
  existingData.extend(newParsesdData)

  with open('EO4GEO-BoK-Extraction\input\IndividualExpertise.json', 'w') as file:
    json.dump(existingData, file)

def processAllInputJSON():
  indivudalExpertiseFolder = 'EO4GEO-BoK-Extraction\input\Individual-Expertise'
  for file in os.listdir(indivudalExpertiseFolder):
    file_path = os.path.join(indivudalExpertiseFolder, file)
    if os.path.isfile(file_path):
      with open (file_path, 'r') as file:
        jsonAsText = file.read()
      parsedData = processIndivudalExpertiseJson(json.loads(jsonAsText)) #let openai parse the json in a better json structure
      newJson = json.loads(parsedData)
      mergeToTotalExpertiseFile(newJson)

main()