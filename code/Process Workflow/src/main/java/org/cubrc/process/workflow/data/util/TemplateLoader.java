package org.cubrc.process.workflow.data.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.io.IOUtils;
import org.cubrc.process.workflow.data.RecordType;
import org.cubrc.process.workflow.data.template.RecordTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.InputStream;
import java.nio.charset.Charset;

public class TemplateLoader {
    private static final Logger log = LoggerFactory.getLogger(TemplateLoader.class);

    private static final ObjectMapper objectMapper = new ObjectMapper();

    private TemplateLoader() {}

    public static RecordTemplate load(RecordType recordType) {
        String path = "/templates/" + recordType.getType() + ".json";

        try (InputStream queryStream = TemplateLoader.class.getResourceAsStream(path)) {
            String content = IOUtils.toString(queryStream, Charset.defaultCharset());
            return objectMapper.readValue(content.getBytes(), RecordTemplate.class);
        } catch (NullPointerException e) {
            // resource could not be found
            log.error("Could not find the {} template at the path {}", recordType.getType(), path);
            throw e;
        } catch (Exception e) {
            // resource could not be loaded
            log.error("Could not load the {} template at the path {}", recordType.getType(), path);
            throw new RuntimeException(e);
        }
    }
}
