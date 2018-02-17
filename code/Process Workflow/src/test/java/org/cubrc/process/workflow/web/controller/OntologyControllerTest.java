package org.cubrc.process.workflow.web.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.cubrc.process.workflow.db.RdfDatabaseConnector;
import org.junit.BeforeClass;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;

public class OntologyControllerTest {
    private static final Logger log = LoggerFactory.getLogger(OntologyControllerTest.class);

    private static final ObjectMapper objectMapper = new ObjectMapper();

    private static OntologyController mockOntologyController;

    @BeforeClass
    public static void beforeClass() {
        String queryLocation = "http://localhost:3030/process-workflow/query";
        String updateLocation = "http://localhost:3030/process-workflow/update";

        mockOntologyController = new OntologyController();
        mockOntologyController.setDatabaseConnector(new RdfDatabaseConnector(queryLocation, updateLocation));

        objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
    }

    @Test
    public void testFindTestingProcesses() throws Exception {
        String namespace = "http://www.semanticweb.org/ontologies/TestingProcessOntology";
        String parentClass = "http://www.ontologyrepository.com/CommonCoreOntologies/Act";

        ObjectNode data = objectMapper.createObjectNode();
        data.put("ontologyIRI", namespace);
        data.put("parentClass", parentClass);
        data.put("deepSearch", true);

        ResponseEntity<JsonNode> classes = mockOntologyController.getClasses(data);

        JsonNode body = classes.getBody();
        log.info("classes:\n\n{}", objectMapper.writeValueAsString(body));
    }
}
