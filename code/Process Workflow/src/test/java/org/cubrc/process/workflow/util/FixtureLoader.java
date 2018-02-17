package org.cubrc.process.workflow.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.apache.commons.io.IOUtils;
import org.cubrc.process.workflow.data.RecordType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.FileInputStream;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

public class FixtureLoader {
    private static final Logger log = LoggerFactory.getLogger(FixtureLoader.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    protected FixtureLoader() {}

    public static ArrayNode loadFixtures(RecordType type) {
        String dirPath = "src/test/resources/fixtures/" + type.getType();
        ArrayNode result = objectMapper.createArrayNode();
        try {
            ClassLoader classLoader = FixtureLoader.class.getClassLoader();
            URL resource = classLoader.getResource("fixtures/" + type.getType());

            List<JsonNode> collected = Files.list(Paths.get(resource.toURI()))
                .filter(path -> path.toString().contains(".json"))
                .map(path -> loadJson(path.toString()))
                .collect(Collectors.toList());
            result.addAll(collected);
        } catch (Exception e) {
            log.error("Could not load " + type + " fixtures at "+ dirPath, e);
        }
        return result;
    }

    public static JsonNode loadJson(String path) {
        try (InputStream queryStream = new FileInputStream(path)) {
            String fixture = IOUtils.toString(queryStream, Charset.defaultCharset());
            return objectMapper.readTree(fixture);
        } catch (Exception e) {
            log.error("Exception while loading fixture at path {}", path);
            log.error("", e);
            return null;
        }
    }
}
