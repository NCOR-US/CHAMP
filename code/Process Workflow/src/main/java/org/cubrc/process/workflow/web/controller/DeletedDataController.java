package org.cubrc.process.workflow.web.controller;

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
import org.cubrc.process.workflow.web.data.converter.RecordTypeConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import javax.servlet.http.HttpServletRequest;

@Component
@Controller
@RequestMapping(value = "deleted")
public class DeletedDataController {
    private final ObjectMapper objectMapper = new ObjectMapper();

    private DatabaseConnector databaseConnector;
    private ProcessWorkflowConfig config;
    private JsonApiTransformerFactory transformerFactory;

    @RequestMapping(
        value = "{type}/{id}", method = RequestMethod.GET,
        produces = {MediaType.APPLICATION_JSON_VALUE}
    )
    public ResponseEntity<JsonNode> find(@PathVariable final RecordType type, @PathVariable final String id) {
        JsonApiTransformer transformer = transformerFactory.getInstance(type);
        String query = transformer.buildSelect(config.getDeletedRecordGraph(), id);

        ResultSetCloseable selected = databaseConnector.select(query);
        ArrayNode serialized = transformer.serialize(selected, id);
        selected.close();

        if (serialized.size() > 0) {
            return ResponseEntity.ok(serialized.get(0));
        } else {
            return ResponseEntity.notFound().build();
        }

    }

    @RequestMapping(
        value = "{type}", method = RequestMethod.GET,
        produces = {MediaType.APPLICATION_JSON_VALUE}
    )
    public ResponseEntity<JsonNode> findAll(@PathVariable final RecordType type) {
        JsonApiTransformer transformer = transformerFactory.getInstance(type);
        String query = transformer.buildSelect(config.getDeletedRecordGraph());

        ResultSetCloseable selected = databaseConnector.select(query);
        ArrayNode serialized = transformer.serialize(selected);
        selected.close();

        return ResponseEntity.ok(serialized);
    }

    // spring
    public void setDatabaseConnector(DatabaseConnector databaseConnector) {
        this.databaseConnector = databaseConnector;
    }

    @Autowired
    public void setConfig(ProcessWorkflowConfig config) {
        this.config = config;
    }

    @Autowired
    public void setTransformerFactory(JsonApiTransformerFactory transformerFactory) {
        this.transformerFactory = transformerFactory;
    }

    /**
     * Allows string values if {@link RecordType} to be used in path variables
     */
    @InitBinder
    public void initBinder(WebDataBinder dataBinder) {
        dataBinder.registerCustomEditor(RecordType.class, new RecordTypeConverter());
    }

    /**
     * Allows the controller to ignore bad path variable values for type
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity handleBadTypeEnum(HttpServletRequest request, Exception e) {
        ObjectNode rootError = objectMapper.createObjectNode();
        rootError.put("title", "Invalid Record Type");
        rootError.put("detail", "No record type for URL: " + request.getRequestURL());

        return ResponseEntity.notFound().build();
    }
}
