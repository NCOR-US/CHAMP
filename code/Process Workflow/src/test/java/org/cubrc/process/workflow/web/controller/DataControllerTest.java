package org.cubrc.process.workflow.web.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.NullNode;
import org.cubrc.process.workflow.data.RecordType;
import org.cubrc.process.workflow.util.FixtureLoader;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:spring/data-controller-test-context.xml")
public class DataControllerTest {
    private static final Logger log = LoggerFactory.getLogger(DataControllerTest.class);

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private DataController mockDataController;

    @Test
    public void testFoundOneAgent() throws Exception {
        ResponseEntity<JsonNode> response = mockDataController.find(RecordType.AGENT, "urn:test:plans:JoeSmith");
        Assert.assertNotNull(response);
        Assert.assertEquals(HttpStatus.OK, response.getStatusCode());

        JsonNode body = response.getBody();
        Assert.assertNotNull(body);

        prettyPrint(body);
        // this works, but todo comparison test
    }

    @Test
    public void testFoundNoAgent() {
        ResponseEntity<JsonNode> response = mockDataController.find(RecordType.AGENT, "urn:test:plans:JohnSmith");
        Assert.assertNotNull(response);
        Assert.assertEquals(HttpStatus.OK, response.getStatusCode());

        JsonNode body = response.getBody();
        Assert.assertNotNull(body);
        Assert.assertTrue(body.get("data") instanceof NullNode);
    }

    @Test
    public void testFoundAllAgents() {
        ResponseEntity<JsonNode> response = mockDataController.findAll(RecordType.AGENT, null);
        Assert.assertNotNull(response);
        Assert.assertEquals(HttpStatus.OK, response.getStatusCode());

        JsonNode body = response.getBody();
        Assert.assertNotNull(body);

        prettyPrint(body);
        // this works, but todo comparison test
    }

    @Test
    public void testCreateNewAgent() throws Exception {
        // todo differentiate fixture from below test
        JsonNode json = FixtureLoader.loadFixtures(RecordType.AGENT).get(0);
        ResponseEntity<JsonNode> response = mockDataController.create(RecordType.AGENT, json);
        Assert.assertNotNull(response);
        Assert.assertEquals(HttpStatus.CREATED, response.getStatusCode());

        JsonNode body = response.getBody();
        Assert.assertNotNull(body);

        prettyPrint(body);
    }

    @Test
    public void testFailCreatingExistingAgent() throws Exception {
        ArrayNode fixtures = FixtureLoader.loadFixtures(RecordType.AGENT);

        JsonNode json = fixtures.get(0);
        ResponseEntity<JsonNode> response = mockDataController.create(RecordType.AGENT, json);
        Assert.assertNotNull(response);
        Assert.assertEquals(HttpStatus.CREATED, response.getStatusCode());

        response = mockDataController.create(RecordType.AGENT, json);
        Assert.assertNotNull(response);
        Assert.assertEquals(HttpStatus.CONFLICT, response.getStatusCode());

        JsonNode body = response.getBody();
        Assert.assertNotNull(body);
        Assert.assertNotNull(body.get("title"));
        Assert.assertNotNull(body.get("detail"));
        Assert.assertNotNull(body.get("source"));
        Assert.assertNotNull(body.get("source").get("pointer"));
        Assert.assertEquals("/data/id", body.get("source").get("pointer").textValue());
    }

    public void prettyPrint(JsonNode node) {
        try {
            String pretty = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(node);
            log.info("body: \n\n{}", pretty);
        } catch (JsonProcessingException e) {
            log.warn("Can't pretty print: {}: {}", e.getClass().getCanonicalName(), e.getMessage());
            log.info("body: \n\n{}", node);
        }
    }
}
