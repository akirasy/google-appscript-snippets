/**
 * Fetch xml data from OpenStreetMap.
 * @param {Number} osmId The OSM element ID.
 */
function fetchOsmXmlById(osmId) {
  let url = 'https://www.openstreetmap.org/api/0.6/way/' + osmId.toString() + '/full';
  let osmXml = UrlFetchApp.fetch(url).getContentText();
  return osmXml
}

/**
 * Get OpenStreetMap object name.
 * @param {Xml} osmXml The OSM file as text.
 */
function getOsmXmlName(osmXml) {
  // Parse xml data from osm
  let document = XmlService.parse(osmXml);
  let root = document.getRootElement();

  // Search for xml name
  let tags = root.getChild('way').getChildren('tag');
  let name;
  tags.forEach(tag => {
    if (tag.getAttribute('k').getValue() == 'name') {
      name = tag.getAttribute('v').getValue();
    }
  })
  return name
}

/**
 * Craft WKT POLYGON element from OpenStreetMap using its web API. Make sure the OpenStreetMap element is of POLYGON type.
 * @param {Xml} osmXml The OSM file as text.
 */
function osmPolygonToWkt(osmXml) {
  // Parse xml data from osm
  let document = XmlService.parse(osmXml);
  let root = document.getRootElement();
  
  // Collect latitude & longitude nodes into dictionary object
  let nodeDict = new Object();
  let nodes = root.getChildren('node');
  nodes.forEach(node => {
    let nodeId = node.getAttribute('id').getValue();
    let latitude = node.getAttribute('lat').getValue();
    let longitude = node.getAttribute('lon').getValue();
    nodeDict[nodeId] = { latitude:latitude, longitude:longitude };
  })

  // Craft WKT element in correct order
  let wktElement = 'POLYGON ((';
  let nodeWayNd = root.getChild('way').getChildren('nd');
  nodeWayNd.forEach(way => {
    let ref = way.getAttribute('ref').getValue();  
    wktElement += nodeDict[ref].longitude + ' ' + nodeDict[ref].latitude + ', ';
  })
  wktElement = wktElement.slice(0, -2);
  wktElement += '))';

  return wktElement
}
