package org.cubrc.process.workflow.data.template;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.io.IOUtils;
import org.cubrc.process.workflow.data.RecordType;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;

public class RecordTemplateTest {
    private static final Logger log = LoggerFactory.getLogger(RecordTemplateTest.class);

    private static final String TEMPLATE_LOCATION = "templates/";

    private static ObjectMapper objectMapper;

    @BeforeClass
    public static void beforeClass() {
        objectMapper = new ObjectMapper();
    }

    @Test
    public void loadAgentTemplate() throws IOException {
        String content = loadJsonTemplateContent(RecordType.AGENT);
        RecordTemplate template = objectMapper.readValue(content.getBytes(), RecordTemplate.class);
        Assert.assertNotNull(template);

        // todo real checks
        log.info("template: {}", template);

        RecordTemplate template2 = objectMapper.readValue(content.getBytes(), RecordTemplate.class);
        Assert.assertEquals(template, template2);
    }

    private String loadJsonTemplateContent(RecordType type) throws IOException {
        String path = TEMPLATE_LOCATION + type.getType() + ".json";
        try (InputStream queryStream = ClassLoader.getSystemResourceAsStream(path)) {
            return IOUtils.toString(queryStream, Charset.defaultCharset());
        }
    }
}
