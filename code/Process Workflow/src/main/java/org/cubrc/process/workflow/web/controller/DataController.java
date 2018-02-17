package org.cubrc.process.workflow.web.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.cubrc.process.workflow.data.RecordType;
import org.cubrc.process.workflow.web.data.converter.RecordTypeConverter;
import org.cubrc.process.workflow.web.worker.DataControllerWorker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import javax.servlet.http.HttpServletRequest;
import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URLEncoder;

/**
 * JSON-API-compliant backend for Ember Data.
 * <ul>
 * <li>Find: GET /data/{entity_type}/{entity_id}</li>
 * <li>Find all: GET /{entity_type}</li>
 * <li>Update: PATCH /{entity_type}/{entity_id}</li>
 * <li>Create: POST /{entity_type}</li>
 * <li>Delete: DELETE /{entity_type}/{entity_id}</li>
 * </ul>
 */
@Component
@Controller
@RequestMapping(value = "data")
public class DataController {
    private static final Logger log = LoggerFactory.getLogger(DataController.class);

    // todo move magic constants

    private final ObjectMapper objectMapper = new ObjectMapper();

    private DataControllerWorker worker;

    /**
     * Retrieve one entity.
     * <p>GET /data/{entity_type}/{entity_id}</p>
     *
     * @param id the ID of the entity
     * @return HTTP 200 with entity, or HTTP 404 with error object if not found
     */
    @RequestMapping(
        value = "{type}/{id}", method = RequestMethod.GET,
        produces = {"application/vnd.api+json", MediaType.APPLICATION_JSON_VALUE}
    )
    public ResponseEntity<JsonNode> find(@PathVariable final RecordType type, @PathVariable final String id) {
        JsonNode data = worker.find(type, id);

        // OK
        ObjectNode result = buildBaseResponseBody();
        result.set("data", data);

        // todo should this happen in the data transformer??
        if (data != null) {
            ObjectNode links = objectMapper.createObjectNode();
            links.put("self", buildSelfUrl(type, id));

            result.set("links", links);
        }

        log.debug("Response body for find:\n\n{}", result);

        log.debug("\n\nFull response: \n\n{}", ResponseEntity.ok(result));
        return ResponseEntity.ok(result);
    }

    /**
     * Retrieve all entities.
     * <p>GET /data/{entity_type}</p>
     *
     * @return HTTP 200 with entity list or empty list
     */
    @RequestMapping(
        value = "{type}", method = RequestMethod.GET,
        produces = {"application/vnd.api+json", MediaType.APPLICATION_JSON_VALUE}
    )
    public ResponseEntity<JsonNode> findAll(@PathVariable final RecordType type, @RequestParam(required = false) final String id) {
        // fixme hijacking temporarily since {type}/{id} is not OK with IRI as id
        if (id != null) {
            return find(type, id);
        }

        ArrayNode serialized = worker.findAll(type);

        // todo should this happen in the transformer??
        serialized.forEach(child -> {
            ObjectNode links = objectMapper.createObjectNode();
            links.put("self", buildSelfUrl(type, child.get("id").textValue()));

            ObjectNode objectChild = (ObjectNode) child;
            objectChild.set("links", links);
        });

        // OK
        ObjectNode result = buildBaseResponseBody();
        result.set("data", serialized);

        log.debug("Response body for findAll:\n\n{}", result);
        return ResponseEntity.ok(result);
    }

    /**
     * Create an entity.
     * <p>POST /data/{entity_type}</p>
     *
     * @return HTTP 201, HTTP 409 if it already exists (todo determine if this is needed)
     */
    @RequestMapping(
        value = "{type}", method = RequestMethod.POST,
        consumes = {"application/vnd.api+json", MediaType.APPLICATION_JSON_VALUE},
        produces = {"application/vnd.api+json", MediaType.APPLICATION_JSON_VALUE}
    )
    public ResponseEntity<JsonNode> create(@PathVariable final RecordType type, @RequestBody final JsonNode content) {
        // todo is this required, or can we generate an IRI?
        if (!content.get("data").hasNonNull("id")) {
            return ResponseEntity.unprocessableEntity().body(buildMissingIdentifierResponseBody());
        }

        // make sure not exists already
        JsonNode jsonNode = worker.find(type, content.get("data").get("id").textValue());
        if (jsonNode != null) {
            log.debug("json: {}", jsonNode);

            ObjectNode rootError = objectMapper.createObjectNode();
            rootError.put("title", "Record Already Exists");
            rootError.put("detail", "Cannot create a record with the same ID as a record that already exists");

            ObjectNode sourceNode = objectMapper.createObjectNode();
            sourceNode.put("pointer", "/data/id");
            rootError.set("source", sourceNode);

            return ResponseEntity.status(HttpStatus.CONFLICT).body(rootError);
        }

        // pass to worker
        JsonNode created;
        try {
            created = worker.create(type, content);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(buildExceptionResponseBody(e));
        }


        // todo should this happen in the data transformer??
        ObjectNode links = objectMapper.createObjectNode();
        links.put("self", buildSelfUrl(type, created.get("id").textValue()));

        // wrap
        ObjectNode result = buildBaseResponseBody();
        result.set("data", created);
        result.set("links", links);

        // build URL
        URI location = URI.create(created.get("id").textValue());

        log.debug("Response body for create:\n\n{}", result);

        // OK
        return ResponseEntity.created(location).body(result);
    }

    /**
     * Update one entity.
     * <p>PATCH /data/{entity_type}/{entity_id}</p>
     *
     * @param id the ID of the entity
     * @return HTTP 200, HTTP 204 if no change (?) or HTTP 404 with error object if not found
     */
    @RequestMapping(
        value = "{type}/{id}", method = RequestMethod.PATCH,
        consumes = {"application/vnd.api+json", MediaType.APPLICATION_JSON_VALUE},
        produces = {"application/vnd.api+json", MediaType.APPLICATION_JSON_VALUE}
    )
    public ResponseEntity<JsonNode> update(@PathVariable final RecordType type, @PathVariable final String id, @RequestBody final JsonNode change) {
        // make sure exists already
        JsonNode existing = worker.find(type, id);
        if (existing == null) {
            // todo JSON-API body
            return ResponseEntity.notFound().build();
        }

        // pass to worker
        JsonNode updated = worker.update(type, existing, change);
        if (updated == null) {
            return ResponseEntity.noContent().build();
        }

        // wrap
        ObjectNode result = buildBaseResponseBody();
        result.set("data", updated);

        log.debug("Response body for update:\n\n{}", result);

        return ResponseEntity.ok(result);
    }

    @RequestMapping(
        value = "{type}", method = { RequestMethod.PUT, RequestMethod.PATCH },
        consumes = {"application/vnd.api+json", MediaType.APPLICATION_JSON_VALUE},
        produces = {"application/vnd.api+json", MediaType.APPLICATION_JSON_VALUE}
    )
    public ResponseEntity<JsonNode> updateFromPayloadOnly(@PathVariable final RecordType type, @RequestBody final JsonNode content) {
        JsonNode dataNode = content.get("data");
        if (dataNode == null) {
            return ResponseEntity.unprocessableEntity().body(buildMissingIdentifierResponseBody());
        }

        JsonNode idNode = dataNode.get("id");
        if (idNode == null) {
            return ResponseEntity.unprocessableEntity().body(buildMissingIdentifierResponseBody());
        }

        String id = idNode.textValue();
        if (id == null) {
            return ResponseEntity.unprocessableEntity().body(buildMissingIdentifierResponseBody());
        }

        return update(type, id, content);
    }

    /**
     * Delete one entity.
     * <p>DELETE /data/{entity_type}/{entity_id}</p>
     *
     * @param id the ID of the entity
     * @return HTTP 200, HTTP 204 if no change (?) or HTTP 404 with error object if not found
     */
    @RequestMapping(
        value = "{type}/{id}", method = RequestMethod.DELETE,
        consumes = {"application/vnd.api+json", MediaType.APPLICATION_JSON_VALUE},
        produces = {"application/vnd.api+json", MediaType.APPLICATION_JSON_VALUE}
    )
    public ResponseEntity<JsonNode> delete(@PathVariable final RecordType type, @PathVariable final String id) {
        // make sure exists already
        JsonNode json = worker.find(type, id);
        if (json == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(buildMissingRecordResponseBody(id));
        }

        // pass to worker
        try {
            worker.delete(type, id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Exception while deleting a record", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(buildExceptionResponseBody(e));
        }
    }

    @RequestMapping(
        value = "{type}", method = RequestMethod.DELETE,
        consumes = {"application/vnd.api+json", MediaType.APPLICATION_JSON_VALUE},
        produces = {"application/vnd.api+json", MediaType.APPLICATION_JSON_VALUE}
    )
    public ResponseEntity<JsonNode> deleteWithPayload(@PathVariable final RecordType type, @RequestBody final JsonNode content) {
        JsonNode dataNode = content.get("data");
        if (dataNode == null) {
            return ResponseEntity.unprocessableEntity().body(buildMissingIdentifierResponseBody());
        }

        JsonNode idNode = dataNode.get("id");
        if (idNode == null) {
            return ResponseEntity.unprocessableEntity().body(buildMissingIdentifierResponseBody());
        }

        String id = idNode.textValue();
        if (id == null) {
            return ResponseEntity.unprocessableEntity().body(buildMissingIdentifierResponseBody());
        }

        return delete(type, id);
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

    private ObjectNode buildBaseResponseBody() {
        ObjectNode root = objectMapper.createObjectNode();
        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("version", "0.1.0");

        root.set("meta", meta);

        return root;
    }

    private String buildSelfUrl(RecordType type, String id) {
        // could also do the following:
        /*
            ServletUriComponentsBuilder builder = ServletUriComponentsBuilder.fromCurrentRequestUri();
            builder.scheme("https");
            builder.replaceQueryParam("someBoolean", false);
            URI newUri = builder.build().toUri();
         */
        // HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        //
        // return request.getRequestURL().toString() + "?" + id;

        // todo
        try {
            return "http://localhost:9090/process-workflow/data/" + type.getType() + "/" + URLEncoder.encode(id, "utf-8");
        } catch (UnsupportedEncodingException e) {
            log.error("Cannot encode a record self URL", e);
            return null;
        }
    }

    private JsonNode buildMissingIdentifierResponseBody() {
        ObjectNode rootError = objectMapper.createObjectNode();
        rootError.put("title", "Missing Record ID");
        rootError.put("detail", "The record must have an ID in order to process it");

        ObjectNode sourceNode = objectMapper.createObjectNode();
        sourceNode.put("pointer", "/data/id");
        rootError.set("source", sourceNode);

        return rootError;
    }

    private JsonNode buildMissingRecordResponseBody(String id) {
        ObjectNode rootError = objectMapper.createObjectNode();
        rootError.put("title", "Record Not Found");
        rootError.put("detail", "Cannot find a record with the id " + id);

        return rootError;
    }

    private JsonNode buildExceptionResponseBody(Exception e) {
        ObjectNode rootError = objectMapper.createObjectNode();
        rootError.put("title", "Server Error");
        rootError.put("detail", "An unexpected error has occurred");

        ObjectNode errorMeta = objectMapper.createObjectNode();
        errorMeta.put("exception", e.getClass().getCanonicalName());
        errorMeta.put("trace", ExceptionUtils.getStackTrace(e));
        errorMeta.put("message", ExceptionUtils.getMessage(e));
        errorMeta.put("rootCauseMessage", ExceptionUtils.getRootCauseMessage(e));
        rootError.set("meta", errorMeta);

        return rootError;
    }

    // wired from context XML
    public void setWorker(DataControllerWorker worker) {
        this.worker = worker;

        log.info("Data controller worker initialized: {}", worker.getClass().getCanonicalName());
    }
}
