package org.cubrc.process.workflow.data.transform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.jena.query.ResultSetCloseable;
import org.cubrc.process.workflow.data.RecordType;
import org.cubrc.process.workflow.mock.DatabaseMock;
import org.cubrc.process.workflow.util.FixtureLoader;
import org.cubrc.process.workflow.web.config.ProcessWorkflowConfig;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "classpath:spring/json-api-transformer-test-context.xml")
public class JsonApiTransformerTest {
    private static final Logger log = LoggerFactory.getLogger(JsonApiTransformerTest.class);

    private static ObjectMapper objectMapper;

    private JsonApiTransformerFactory factory;
    private ProcessWorkflowConfig config;
    private DatabaseMock mockDB;

    @BeforeClass
    public static void beforeClass() {
        objectMapper = new ObjectMapper();
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
    }

    @Test
    public void testSerializeArtifactsFromFullDB() throws Exception {
        // load all fixtures into DB
        Map<RecordType, ArrayNode> fixtureMap = new HashMap<>();

        for (RecordType type : RecordType.values()) {
            // JsonApiTransformer transformer = new JsonApiTransformer(type);
            JsonApiTransformer transformer = factory.getInstance(type);
            ArrayNode fixtures = FixtureLoader.loadFixtures(type);
            for (JsonNode fixture : fixtures) {
                String sparqlInsert = transformer.buildInsert(fixture, config.getDataGraph());
                mockDB.insert(sparqlInsert);
            }
            fixtureMap.put(type, fixtures);
        }

        // select all artifacts
        List<AssertionError> failedAssertions = new ArrayList<>();
        for (RecordType type : RecordType.values()) {
            log.info("Testing type {}", type);
            JsonApiTransformer artifactTransformer = factory.getInstance(type);
            String selectQuery = artifactTransformer.buildSelect(config.getDataGraph());
            ResultSetCloseable selected = mockDB.select(selectQuery);
            ArrayNode serialized = artifactTransformer.serialize(selected);
            selected.close();

            // ensure there isn't crossover
            ArrayNode fixtures = fixtureMap.get(type);
            try {
                Assert.assertEquals("Fixture length should be the same", fixtures.size(), serialized.size());
            } catch (AssertionError e) {
                log.error("Assertion error", e);
                failedAssertions.add(e);
            }
        }

        Assert.assertEquals("Failed assertions", 0, failedAssertions.size());
    }

    @Test
    public void testReserialize() throws Exception {
        RecordType type = RecordType.SUB_PROCESS_SPEC;
        JsonApiTransformer transformer = factory.getInstance(type);

        // load record
        ArrayNode fixtures = FixtureLoader.loadFixtures(type);
        JsonNode fixture = fixtures.get(1);

        // insert into dummy db
        String sparqlInsert = transformer.buildInsert(fixture, config.getDataGraph());
        log.debug("Insert query:\n\n{}", sparqlInsert);
        mockDB.insert(sparqlInsert);

        // select out
        String id = fixture.get("data").get("id").textValue();
        String selectQuery = transformer.buildSelect(config.getDataGraph(), id);
        log.debug("Select query:\n\n{}", selectQuery);
        ResultSetCloseable selected = mockDB.select(selectQuery);

        // reserialize
        ArrayNode reserialized = transformer.serialize(selected, id);

        // compare
        Assert.assertEquals("Reserialized size should be 1", 1, reserialized.size());

        assertRecordsEqual((ObjectNode) (fixture.get("data")), (ObjectNode) reserialized.get(0));
    }

    private void assertRecordsEqual(ObjectNode expected, ObjectNode actual) {
        // attributes
        JsonNode expectedAttributes = expected.get("attributes");
        Set<String> expectedAttrNames = getPropertyNames(expectedAttributes);

        JsonNode actualAttributes = actual.get("attributes");
        Set<String> actualAttrNames = getPropertyNames(actualAttributes);

        // compare expected names vs actual?

        Set<String> attributeNames = new HashSet<>();
        attributeNames.addAll(expectedAttrNames);
        attributeNames.addAll(actualAttrNames);

        for (String name : attributeNames) {
            JsonNode expectedAttr = expectedAttributes.get(name);
            JsonNode actualAttr = actualAttributes.get(name);

            if (expectedAttr == null || expectedAttr.isNull()) {
                boolean actualIsNull = actualAttr == null || actualAttr.isNull();
                Assert.assertTrue("Attribute '" + name + "' should match if null", actualIsNull);
            } else {
                Assert.assertEquals("Attribute '" + name + "' should match", expectedAttr.textValue(), actualAttr.textValue());
            }
        }

        // relationships
        JsonNode expectedRelationships = expected.get("relationships");
        Set<String> expectedRelNames = getPropertyNames(expectedRelationships);

        JsonNode actualRelationships = actual.get("relationships");
        Set<String> actualRelNames = getPropertyNames(actualRelationships);

        Set<String> relNames = new HashSet<>();
        relNames.addAll(expectedRelNames);
        relNames.addAll(actualRelNames);

        for (String name : relNames) {
            JsonNode expectedRel = expectedRelationships.get(name);
            JsonNode actualRel = actualRelationships.get(name);

            if (expectedRel == null || expectedRel.isNull()) {
                boolean actualIsNull = actualRel == null || actualRel.isNull();
                Assert.assertTrue("Relationship '" + name + "' should match if null", actualIsNull);
            } else {
                JsonNode expectedRelData = expectedRel.get("data");
                JsonNode actualRelData = actualRel.get("data");

                if (expectedRelData instanceof ObjectNode) {
                    Assert.assertTrue("Expected relationship '" + name + "' is an object", actualRelData instanceof ObjectNode);
                }
                else if (expectedRelData instanceof ArrayNode) {
                    Assert.assertTrue("Expected relationship '" + name + "' is an array", actualRelData instanceof ArrayNode);
                }
                else {
                    log.warn("Unhandled expected relationship type: {}", expectedRelData.getClass().getCanonicalName());
                }

                Assert.assertEquals("Relationship '" + name + "' should match", expectedRelData, actualRelData);
            }
        }
    }

    private Set<String> getPropertyNames(JsonNode node) {
        Iterator<String> expectedNamesIter = node.fieldNames();
        Set<String> names = new HashSet<>();
        while (expectedNamesIter.hasNext()) {
            names.add(expectedNamesIter.next());
        }

        return names;
    }

    private void loadOntologies() {
        ClassLoader classLoader = JsonApiTransformerTest.class.getClassLoader();
        URI ontologiesRoot;
        try {
            ontologiesRoot = classLoader.getResource("ontologies").toURI();
            List<Path> ontRootPaths = Files.list(Paths.get(ontologiesRoot)).collect(Collectors.toList());
            for (Path path : ontRootPaths) {
                List<Path> ontPaths = Files.list(path).collect(Collectors.toList());
                for (Path ontPath : ontPaths) {
                    mockDB.addOntology(ontPath.toString());
                }
            }
        } catch (Exception e) {
            log.error("Couldn't load ontologies", e);
        }
    }

    @Autowired
    public void setMockDB(DatabaseMock mockDB) {
        this.mockDB = mockDB;
        loadOntologies();
    }

    @Autowired
    public void setConfig(ProcessWorkflowConfig config) {
        this.config = config;
    }

    @Autowired
    public void setFactory(JsonApiTransformerFactory factory) {
        this.factory = factory;
    }
}
