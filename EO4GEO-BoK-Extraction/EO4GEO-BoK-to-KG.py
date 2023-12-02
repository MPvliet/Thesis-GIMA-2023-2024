import requests, json, time, re, uuid
from rdflib import URIRef, Literal, BNode, Namespace, Dataset

API_Base_URL = "https://eo4geo-bok.firebaseio.com/current/concepts/.json"

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
    extractEo4geoJson(session)
    serializeIntoRDF()
    duration = time.time() - start_time
    print("Scripte duurde: ", duration, "seconds")

def getRequest(session, url, headers, params): #Handels all GET requests
    try:
        response = session.get(url, headers=headers ,params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e: 
        print("Error during API call:", e)
        print("Error during this url:", url)
        return None

def extractEo4geoJson(session):
  eo4geoBokData = getRequest(session, API_Base_URL, {}, {})
  eo4geoBokDescriptions = getRequest(session, "https://eo4geo-uji-backup2-default-rtdb.europe-west1.firebasedatabase.app/v7.json", {}, {})  

  mergeJSON(eo4geoBokData, eo4geoBokDescriptions['concepts'])

def mergeJSON(eo4geoConcepts, eo4geoDescriptions):
  descriptionDict = {item["code"]: item for item in eo4geoDescriptions}

  for key in eo4geoConcepts.keys():
    if key in descriptionDict:
       eo4geoConcepts[key].update(descriptionDict[key])

  with open('EO4GEO-BoK-Extraction\input\EO4GEOBOKDATA.json', 'w') as f:
     json.dump(eo4geoConcepts, f)  

def serializeIntoRDF():
  ds = Dataset()
  g = ds.graph(identifier=URIRef("https://bok.eo4geo.eu/concepts")) # create RDF graph

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
  
  bodyOfKnowledgeURI = URIRef('{}'.format("https://bok.eo4geo.eu/"))

  # BodyOfKnowledgeClass - OBOK
  g.add((bodyOfKnowledgeURI, rdf.type, obok.BodyOfKnowledge))
  g.add((bodyOfKnowledgeURI, rdfs.seeAlso, Literal('https://bok.eo4geo.eu/')))
  g.add((bodyOfKnowledgeURI, rdfs.label, Literal('EO4GEO BoK')))
  g.add((bodyOfKnowledgeURI, dcterms.description, Literal('A Body of Knowledge that describes the Geographic Information and Earth Observation domain.')))
  g.add((bodyOfKnowledgeURI, schema.dateModified, Literal('08/11/2023')))
  g.add((bodyOfKnowledgeURI, schema.version, Literal('V7')))

  # create uniqueSkillDict met concepten en bloomslevel
  uniqueSkillDict = retrieveSkillsInformation(data)
  knowledgeAreaList = ['AM', 'CF', 'CV', 'DA', 'DM', 'GC', 'GD', 'AM', 'CF', 'CV', 'DA', 'DM', 'GC', 'GD', 'GS', 'OI', 'WB', 'PP', 'PS', 'IP', 'TA', 'GS', 'IP', 'OI', 'PP', 'PS', 'TA', 'WB']
  for concept in data:
    #if 'WB' in concept:
      conceptURI = URIRef('{}{}'.format('https://bok.eo4geo.eu/',data[concept]['id']))
      
      # Concept class - OBOK
      g.add((conceptURI, rdf.type, obok.Concept))
      conceptLabel = "[" + data[concept]['id'] +"] " + data[concept]['name']
      g.add((conceptURI, rdfs.label, Literal(conceptLabel)))
      g.add((conceptURI, skos.notation, Literal(data[concept]['id'])))
      g.add((conceptURI, dcterms.description, Literal(data[concept]['description'])))
      if 'selfAssesment' in data[concept]:
        match = re.search(r'<p>(.*?)<\/p>', data[concept]['selfAssesment'])
        if match:
          selfAssesmentLiteral = match.group(1)
          g.add((conceptURI, obok.conceptStatus, Literal(selfAssesmentLiteral)))
      g.add((conceptURI, rdfs.isDefinedBy, bodyOfKnowledgeURI))

      if concept[0:2] in knowledgeAreaList and concept not in knowledgeAreaList:
        g.add((conceptURI, skos.inScheme, URIRef('{}{}'.format('https://bok.eo4geo.eu/',concept[0:2]))))

      # subrelations between classes
      for relation in data[concept]['relations']:
        conceptURI_source = URIRef('{}{}'.format('https://bok.eo4geo.eu/',relation['source']))
        conceptURI_target = URIRef('{}{}'.format('https://bok.eo4geo.eu/',relation['target']))
        if relation['name'] == 'is subconcept of':
          #print(relation['source'] + "  " + relation['target'])
          if relation['target'] in knowledgeAreaList: # bepaald topconcept in conceptScheme. == eerste level subconcept van een knowledge area
            g.add((conceptURI_source, skos.topConceptOf, conceptURI_target))
          else:
            g.add((conceptURI_source, obok.isSubconceptOf, conceptURI_target))
          if relation['target'] == 'GIST': # bepalen van de main KnowledgeArea classes.
            g.add((conceptURI_source, rdf.type, obok.KnowledgeArea))
            g.add((bodyOfKnowledgeURI, obok.hasKnowledgeArea, conceptURI_source))
        elif relation['name'] == 'is similar to':
          g.add((conceptURI_source, obok.isSimilarTo, conceptURI_target))
        elif relation['name'] == 'is prerequisite of':
          g.add((conceptURI_source, obok.isPreRequisiteOf, conceptURI_target))
        elif relation['name'] == '(proposed relation)':
          g.add((conceptURI_source, obok.isProposedRelationWith, conceptURI_target))
        else:
          print(relation['name'])
      

      # Contributor class
      if 'contributors' in data[concept]:
        for contributor in data[concept]['contributors']:
          if contributor['url'] != ' ':
            contributorURI = URIRef('{}'.format(contributor['url']))
          else: # When no URL is known make en example.org uri with their name
            contributorURI = URIRef('{}{}'.format('http:example.org/' ,contributor['name'].replace(' ','')))
          g.add((contributorURI, rdf.type, obok.Contributor))
          g.add((contributorURI, obok.hasContributed, conceptURI))
          g.add((conceptURI, obok.contributedBy, contributorURI))
          g.add((contributorURI, foaf.name, Literal(contributor['name'])))
          g.add((contributorURI, rdfs.label, Literal(contributor['name'])))
          if contributor['description'] != ' ':
            g.add((contributorURI, dcterms.description, Literal(contributor['description'])))
        
      if 'references' in data[concept]:
        for reference in data[concept]['references']:
          if reference['url'] != ' ':
            referenceURI = URIRef('{}'.format(reference['url']))
          else:
            referenceURI = URIRef('{}'.format('ReferenceHasNoURL'))
          g.add((referenceURI, rdf.type, bibo.Document))
          g.add((conceptURI, obok.hasRecommendedMaterial, referenceURI))
          #TODO evt de reference verrijken met info via de CROSSREF API?
      
      if 'skills' in data[concept]:
        for skill in data[concept]['skills']:
          skillURI = URIRef('{}{}'.format('https://bok.eo4geo.eu/',uniqueSkillDict[skill]['id']))
          g.add((skillURI, rdf.type, obok.Skill))
          g.add((skillURI, obok.hasBloomsLevel, Literal(uniqueSkillDict[skill]['bloom_level'])))
          g.add((skillURI, dcterms.description, Literal(uniqueSkillDict[skill]['description'])))
          for concept_skill in uniqueSkillDict[skill]['concepts']:
            isSkillForConceptURI = URIRef('{}{}'.format('https://bok.eo4geo.eu/',concept_skill))
            g.add((skillURI, obok.isSkillFor, isSkillForConceptURI))
            g.add((isSkillForConceptURI, obok.hasSkill, skillURI))

          
      

  # Write to turtle file.
  # g.serialize(destination="EO4GEO-BoK-Extraction\output\EO4GEO-KG.ttl", format='turtle')
  # Write to TriG
  g.serialize(destination="EO4GEO-BoK-Extraction\output\EO4GEO-KG.trig", format="trig")

  # Write to JsonLD file
  # context = {
  #   'obok': 'http://example.org/OBOK/',
  #   'boka': 'http://example.org/BOKA/',
  #   'dce': 'http://purl.org/dc/elements/1.1/',
  #   'org': 'http://www.w3.org/ns/org#',
  #   'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  #   'bibo': 'http://purl.org/ontology/bibo/',
  #   'foaf': 'http://xmlns.com/foaf/0.1/',
  #   'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
  #   'schema': 'https://schema.org/',
  #   'dcterms': 'http://purl.org/dc/terms/',
  #   'skos': 'http://www.w3.org/2004/02/skos/core#',
  #   'eo4geo': 'https://bok.eo4geo.eu/'
  # }
  # g.serialize(destination="EO4GEO-BoK-Extraction\output\EO4GEO-KG.json", format='json-ld', context=context)


def returnHighestBloomLevel(skill):
  #define all keywords from each bloomsLevel. Copied from: https://repositori.uji.es/xmlui/bitstream/handle/10234/201034/Stelmaszczuk-Gorska_2020_Body.pdf?sequence=1&isAllowed=y figure 4
  bloomLevel1 = ['choose', 'define', 'find','identify', 'list', 'locate', 'name', 'recognize', 'relate', 'remember', 'select', 'state', 'write']

  bloomLevel2 = ['cite', 'classify', 'compare', 'contrast', 'deliver', 'demonstrate', 'discuss', 'estimate', 'explain', 'illustrate', 'indicate', 'interpret', 'outline', 'relate', 'report', 'review', 'understand']

  bloomLevel3 = ['apply', 'build', 'calculate', 'choose', 'classify', 'construct', 'correlate', 'demonstrate', 'develop', 'identify', 'illustrate', 'implement', 'interpret', 'model', 'organise', 'perform', 'plan', 'relate', 'represent', 'select', 'solve', 'teach', 'use']

  bloomLevel4 = ['analyse', 'arrange', 'choose', 'classify', 'compare', 'differentiate', 'distinguish', 'examine', 'find', 'install', 'list', 'order', 'prioritize', 'query', 'research', 'select']

  bloomLevel5 = ['assess', 'check', 'choose', 'compare', 'decide', 'defend', 'determine', 'estimate', 'evaluate', 'explain', 'interpret', 'judge', 'justify', 'measure', 'prioritize', 'recommend', 'select', 'test', 'validate']

  bloomLevel6 = ['add to', 'build', 'change', 'choose', 'combine', 'compile', 'construct', 'convert', 'create', 'design', 'develop', 'devise', 'discuss', 'estimate', 'manage', 'model', 'modify', 'plan', 'process', 'produce', 'propose', 'revise', 'solve', 'test', 'transform']
  
  words = skill.lower().split() # creates a list off all words in the skill
  bloomLevels = []
  for word in words:
    if word in bloomLevel1:
      bloomLevels.append(1)
    if word in bloomLevel2:
      bloomLevels.append(2)
    if word in bloomLevel3:
      bloomLevels.append(3)
    if word in bloomLevel4:
      bloomLevels.append(4)
    if word in bloomLevel5:
      bloomLevels.append(5)
    if word in bloomLevel6:
      bloomLevels.append(6)

  if len(bloomLevels) == 0:
    return 'Unknown'
  else:
    return sorted(set(bloomLevels),reverse=True)[0]
  
def retrieveSkillsInformation(data):
  uniqueSkills = {}

  for concept in data:
    if 'skills' in data[concept]:
      for skill in data[concept]['skills']:
        if skill not in uniqueSkills: 
          uniqueSkills[skill] = {
            'id': str(uuid.uuid4()),
            'description': skill,
            'bloom_level': returnHighestBloomLevel(skill),
            'concepts': []
          }
        uniqueSkills[skill]['concepts'].append(concept)
            
  return uniqueSkills

main()