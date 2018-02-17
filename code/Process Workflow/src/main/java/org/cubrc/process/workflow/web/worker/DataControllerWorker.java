package org.cubrc.process.workflow.web.worker;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.jena.query.ResultSetCloseable;
import org.cubrc.process.workflow.data.RecordType;
import org.cubrc.process.workflow.data.transform.JsonApiTransformer;
import org.cubrc.process.workflow.data.transform.JsonApiTransformerFactory;
import org.cubrc.process.workflow.db.DatabaseConnector;
import org.cubrc.process.workflow.web.config.ProcessWorkflowConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

public class DataControllerWorker {
    private static final Logger log = LoggerFactory.getLogger(DataControllerWorker.class);

    private final ObjectMapper objectMapper = new ObjectMapper();

    private DatabaseConnector databaseConnector;
    private ProcessWorkflowConfig config;
    private JsonApiTransformerFactory transformerFactory;

    public DataControllerWorker() {

    }
    
    public JsonNode find(final RecordType type, String id) {
        JsonApiTransformer transformer = transformerFactory.getInstance(type);
        String queryString = transformer.buildSelect(config.getDataGraph(), id);

        log.debug("query: \n\n{}", queryString);

        ResultSetCloseable resultSet = databaseConnector.select(queryString);
        ArrayNode serialized = transformer.serialize(resultSet, id);
        resultSet.close();

        ObjectNode data;

        int size = serialized.size();
        if (size >= 1) {
            if (size > 1) {
                log.warn("Expected one result, got {}", size);
            }

            data = (ObjectNode) serialized.get(0);

            // todo see AgentTransformer#serialize todo comment for id
            data.put("id", id);
        } else {
            data = null;    // no results is returned as null
        }

        return data;
    }

    public ArrayNode findAll(final RecordType type) {
        JsonApiTransformer transformer = transformerFactory.getInstance(type);
        String queryString = transformer.buildSelect(config.getDataGraph());

        log.debug("query: \n\n{}", queryString);

        ResultSetCloseable resultSet = databaseConnector.select(queryString);
        ArrayNode result = transformer.serialize(resultSet);

        resultSet.close();
        return result;
    }

    public JsonNode create(final RecordType type, final JsonNode record) {
        // todo do we handle adding relationships immediately, or later? probably during deserialization

        JsonApiTransformer transformer = transformerFactory.getInstance(type);
        String insertQuery = transformer.buildInsert(record, config.getDataGraph());
        databaseConnector.insert(insertQuery);

        // get back from the database and reserialize
        String queryString = transformer.buildSelect(config.getDataGraph(), record.get("data").get("id").textValue());
        ResultSetCloseable resultSet = databaseConnector.select(queryString);

        ArrayNode reserialized = transformer.serialize(resultSet, record.get("data").get("id").textValue());
        resultSet.close();
        if (reserialized.size() != 1) {
            // todo new exception for this case
            throw new RuntimeException("Couldn't retrieve record after serialization");
        }

        ObjectNode result = (ObjectNode) reserialized.get(0);
        result.put("type", type.getType());
        result.set("id", record.get("data").get("id"));

        return result;
    }

    public JsonNode update(final RecordType type, final JsonNode oldRecord, final JsonNode newRecord) {
        JsonApiTransformer transformer = transformerFactory.getInstance(type);
        ObjectNode recordDiff = transformer.getRecordDiff((ObjectNode) oldRecord, (ObjectNode) (newRecord.get("data")));

        if (recordDiff.get("attributes").size() == 0 && recordDiff.get("relationships").size() == 0) {
            // nothing to update
            return null;
        }

        String diffUpdate = transformer.buildRecordDiffUpdate(recordDiff, config.getDeltaGraph());
        databaseConnector.insert(diffUpdate);

        // remove the old record
        String id = oldRecord.get("id").textValue();
        String deleteQuery = transformer.buildDelete(id, config.getDataGraph());
        databaseConnector.delete(deleteQuery);

        // insert the new record
        return create(type, newRecord);
    }

    public void delete(final RecordType type, final String id) {
        JsonApiTransformer transformer = transformerFactory.getInstance(type);
        // select first
        String selectQuery = transformer.buildSelect(config.getDataGraph(), id);
        ResultSetCloseable selected = databaseConnector.select(selectQuery);
        ArrayNode serialized = transformer.serialize(selected, id);
        if (serialized.size() == 0) {
            // nothing to delete?
            log.warn("Cannot delete {} record with id {}: does not exist", type.getType(), id);
            return;
        }

        JsonNode record = serialized.get(0);
        // todo this needs to be addressed in the transformer, or some API
        ObjectNode wrapper = objectMapper.createObjectNode();
        wrapper.set("data", record);

        // todo need to add a timestamp to the deletion
        String dInsert = transformer.buildInsert(wrapper, config.getDeletedRecordGraph());
        databaseConnector.insert(dInsert);

        String deleteQuery = transformer.buildDelete(id, config.getDataGraph());

        log.debug("delete query: {}", deleteQuery);
        databaseConnector.delete(deleteQuery);
    }

    @Autowired
    public void setConfig(ProcessWorkflowConfig config) {
        this.config = config;
    }

    @Autowired
    public void setTransformerFactory(JsonApiTransformerFactory transformerFactory) {
        this.transformerFactory = transformerFactory;
    }

    @Autowired
    public void setDatabaseConnector(DatabaseConnector databaseConnector) {
        this.databaseConnector = databaseConnector;
    }
}
