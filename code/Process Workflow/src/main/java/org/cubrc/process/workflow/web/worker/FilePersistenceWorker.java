package org.cubrc.process.workflow.web.worker;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ArrayNode;
import org.cubrc.process.workflow.data.RecordType;
import org.joda.time.DateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Temporary worker which uses file IO for record persistence.
 */
public class FilePersistenceWorker extends DataControllerWorker {
    private static final Logger log = LoggerFactory.getLogger(FilePersistenceWorker.class);

    private final Object fileSystemLock = new Object();

    private ObjectMapper objectMapper;
    private String pathBase;
    private String sessionTime;

    public FilePersistenceWorker(String workingDirectory) {
        objectMapper = new ObjectMapper();
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        pathBase = workingDirectory;
        sessionTime = DateTime.now().toString("yy-MM-dd-HHmmss");

        for (RecordType type : RecordType.values()) {
            String dirName = buildDirectoryName(type);
            try {
                Files.createDirectories(Paths.get(dirName));
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }

    @Override
    public JsonNode find(final RecordType type, String id) {
        synchronized (fileSystemLock) {
            log.debug("find: {} {}", type, id);
            String fileName = buildFileName(type, id);
            Path filePath = Paths.get(fileName);

            if (!Files.exists(filePath)) {
                return null;
            }

            try (InputStream inputStream = Files.newInputStream(filePath)) {
                return objectMapper.readTree(inputStream);
            } catch (Exception e) {
                log.warn("find exception", e);
                return null;
            }
        }
    }

    @Override
    public ArrayNode findAll(RecordType type) {
        synchronized (fileSystemLock) {
            String dirName = buildDirectoryName(type);
            Path dirPath = Paths.get(dirName);
            ArrayNode result = objectMapper.createArrayNode();
            try {
                Files.list(dirPath)
                    .forEach(path -> result.add(safeReadTree(path).get("data")));
            } catch (Exception e) {
                log.warn("findAll exception", e);
                return objectMapper.createArrayNode();
            }

            return result;
        }
    }

    @Override
    public JsonNode create(RecordType type, JsonNode record) {
        synchronized (fileSystemLock) {
            log.debug("create: {} {}", type, safeWriteValueAsString(record));
            String fileName = buildFileName(type, record);
            Path filePath = Paths.get(fileName);
            try {
                Path dirPath = Paths.get(buildDirectoryName(type));
                if (!Files.exists(dirPath)) {
                    Files.createDirectories(dirPath);
                }

                if (!Files.exists(filePath)) {
                    Files.createDirectories(dirPath);
                    Files.createFile(filePath);
                }
                writeRecordToFile(filePath, record);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }

            return record.get("data");
        }
    }

    @Override
    public JsonNode update(RecordType type, JsonNode oldRecord, JsonNode newRecord) {
        synchronized (fileSystemLock) {
            return null;
        }
    }

    @Override
    public void delete(RecordType type, String id) {
        synchronized (fileSystemLock) {
            String fileName = buildFileName(type, id);
            Path filePath = Paths.get(fileName);

            try {
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }

    private String buildFileName(RecordType type, JsonNode record) {
        String id = record.get("data").get("id").textValue();
        return buildFileName(type, id);
    }

    private String buildFileName(RecordType type, String id) {
        // String cleanedID = id.replace('/', '_').replace(":", "-");
        String toRemove = "http://process-workflow.cubrc.org/generated/";
        String cleanedID = id.replace(toRemove, "");

        return buildDirectoryName(type) + '/' + cleanedID + ".json";
    }

    private String buildDirectoryName(RecordType type) {
        return pathBase + '/' + sessionTime + '/' + type.getType();
    }

    private void writeRecordToFile(Path filePath, JsonNode record) {
        try (OutputStream outputStream = Files.newOutputStream(filePath)) {
            objectMapper.writeValue(outputStream, record);
        } catch (Exception e) {
            log.warn("Couldn't write record to file", e);
        }
    }

    private JsonNode safeReadTree(Path path) {
        try {
            return objectMapper.readTree(path.toFile());
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private String safeWriteValueAsString(JsonNode node) {
        try {
            return objectMapper.writeValueAsString(node);
        } catch (Exception e) {
            return "";
        }
    }
}
