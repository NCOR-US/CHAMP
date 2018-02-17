package org.cubrc.process.workflow.web.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.commons.io.IOUtils;
import org.apache.jena.query.ParameterizedSparqlString;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.ResultSet;
import org.apache.jena.query.ResultSetCloseable;
import org.apache.jena.rdf.model.Literal;
import org.apache.jena.rdf.model.RDFNode;
import org.cubrc.process.workflow.db.DatabaseConnector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

import java.io.InputStream;
import java.nio.charset.Charset;
import java.util.List;

@Component
@Controller
@RequestMapping(value = "ontologies")
public class OntologyController {
    private static final Logger log = LoggerFactory.getLogger(OntologyController.class);

    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final String ONTOLOGY_GRAPH_IRI = "http://ontoview.cubrc.org/ontologies";

    private DatabaseConnector databaseConnector;
    private String ontologyQueryString;
    private String unitsOfMeasureQueryString;

    public OntologyController() {
        ontologyQueryString = loadQuery("/sparql/ontology_classes.sparql");
        unitsOfMeasureQueryString = loadQuery("/sparql/units_of_measure.sparql");
    }

    @RequestMapping(
        value = "classes", method = RequestMethod.POST,
        produces = {MediaType.APPLICATION_JSON_VALUE}
    )
    public ResponseEntity<JsonNode> getClasses(@RequestBody JsonNode content) {
        String ontologyIRI = "";
        String parentClass = "http://www.w3.org/2002/07/owl#Thing";
        boolean deepSearch = false;

        if (content != null) {
            JsonNode iriNode = content.get("ontologyIRI");
            if (iriNode != null && iriNode.isTextual()) {
                ontologyIRI = iriNode.textValue();
            }

            JsonNode parentNode = content.get("parentClass");
            if (parentNode != null && parentNode.isTextual()) {
                parentClass = parentNode.textValue();
            }

            JsonNode deepSearchNode = content.get("deepSearch");
            if (deepSearchNode != null && deepSearchNode.isBoolean()) {
                deepSearch = deepSearchNode.booleanValue();
            }
        }

        log.debug("Serving request:\n\n\tontology IRI: {}\n\tparent class: {}\n\tdeep search? {}\n", ontologyIRI, parentClass, deepSearch);

        ParameterizedSparqlString paramQuery = new ParameterizedSparqlString(ontologyQueryString);

        paramQuery.setIri("graph", ONTOLOGY_GRAPH_IRI);
        paramQuery.setLiteral("namespace", ontologyIRI);
        paramQuery.setIri("parentClass", parentClass);

        String query = paramQuery.toString();
        String replacement = (deepSearch ? "*" : "");
        query = query.replace("${deepSearch}", replacement);

        ResultSetCloseable selected = databaseConnector.select(query);
        ArrayNode response = convertRdfJson(selected);
        selected.close();

        log.debug("Request served.");
        return ResponseEntity.ok(createJsonApiResponse("classes", response));
    }

    @RequestMapping(
        value = "units-of-measure", method = RequestMethod.GET,
        produces = {MediaType.APPLICATION_JSON_VALUE}
    )
    public ResponseEntity<JsonNode> getUnitsOfMeasure() {
        ResultSetCloseable selected = databaseConnector.select(unitsOfMeasureQueryString);
        ArrayNode response = convertRdfJson(selected);
        selected.close();

        return ResponseEntity.ok(createJsonApiResponse("units-of-measure", response));
    }

    @Autowired
    public void setDatabaseConnector(DatabaseConnector databaseConnector) {
        this.databaseConnector = databaseConnector;
    }

    private ObjectNode createJsonApiResponse(String type, JsonNode data) {
        ObjectNode result = objectMapper.createObjectNode();

        result.put("type", type);
        result.set("data", data);

        return result;
    }

    private String loadQuery(String path) {
        try (InputStream queryStream = OntologyController.class.getResourceAsStream(path)) {
            return IOUtils.toString(queryStream, Charset.defaultCharset());
        } catch (Exception e) {
            log.error("Could not load the ontology query at path {}", path);
            throw new RuntimeException(e);
        }
    }

    private ArrayNode convertRdfJson(ResultSetCloseable selected) {
        ArrayNode response = objectMapper.createArrayNode();
        List<String> resultVars = selected.getResultVars();

        while (selected.hasNext()) {
            ObjectNode node = objectMapper.createObjectNode();
            QuerySolution querySolution = selected.next();
            for (String var : resultVars) {
                RDFNode rdfNode = querySolution.get(var);
                if (rdfNode == null) {
                    node.set(var, null);
                } else if (rdfNode instanceof Literal) {
                    node.put(var, ((Literal) rdfNode).getString());
                } else {
                    node.put(var, rdfNode.toString());
                }
            }
            response.add(node);
        }

        return response;
    }
}
