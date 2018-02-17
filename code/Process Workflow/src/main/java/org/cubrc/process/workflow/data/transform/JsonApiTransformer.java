package org.cubrc.process.workflow.data.transform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.TextNode;
import org.apache.commons.validator.routines.UrlValidator;
import org.apache.jena.query.QuerySolution;
import org.apache.jena.query.ResultSet;
import org.apache.jena.rdf.model.RDFNode;
import org.apache.jena.riot.system.IRIResolver;
import org.cubrc.process.workflow.data.RecordType;
import org.cubrc.process.workflow.data.RelationshipType;
import org.cubrc.process.workflow.data.template.RecordAttribute;
import org.cubrc.process.workflow.data.template.RecordGeneratedVariable;
import org.cubrc.process.workflow.data.template.RecordRelationship;
import org.cubrc.process.workflow.data.template.RecordTemplate;
import org.cubrc.process.workflow.data.template.RecordTemplateDataSection;
import org.cubrc.process.workflow.data.util.TemplateLoader;
import org.joda.time.DateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Converts between JSON-API representation and RDF graphs.
 * todo template validation with JSON schema
 */
public class JsonApiTransformer {
    private static final Logger log = LoggerFactory.getLogger(JsonApiTransformer.class);

    private final ObjectMapper objectMapper = new ObjectMapper();

    private RecordType recordType;
    private RecordTemplate recordTemplate;
    private String ontologyGraphIRI;

    private Map<String, String> nsToPrefix;

    public JsonApiTransformer(RecordType recordType, Map<String, String> namespaces, String ontologyGraphIRI) {
        this.recordType = recordType;
        this.nsToPrefix = namespaces;
        this.ontologyGraphIRI = ontologyGraphIRI;
        this.recordTemplate = TemplateLoader.load(recordType);
    }

    /**
     * Builds a SPARQL UPDATE query with INSERT DATA from the provided record
     *
     * @param json the data record
     * @param graphIRI the IRI of the graph to insert into
     *
     * @return the query string
     */
    public String buildInsert(JsonNode json, String graphIRI) {
        if (graphIRI == null || graphIRI.isEmpty()) {
            throw new IllegalArgumentException("Must provide a graph name to insert into");
        }

        StringBuilder builder = buildPrefixes();
        builder.append("INSERT DATA {");
        builder.append(System.lineSeparator());
        builder.append("\tGRAPH <");
        builder.append(graphIRI);
        builder.append("> {");
        builder.append(System.lineSeparator());

        // normalize to array of records
        JsonNode record = json.get("data");

        // use the passed-in type, otherwise use the base class for the template
        String recordClass = recordTemplate.getTemplateBaseClass();
        JsonNode attributes = record.get("attributes");
        if (attributes != null) {
            JsonNode typeNode = attributes.get("type");
            if (typeNode != null) {
                String type = typeNode.textValue();
                if (type != null) {
                    if (isKnownPrefixed(type)) {
                        recordClass = type;
                    } else {
                        recordClass = "<" + type + ">";
                    }
                }
            }
        }

        log.debug("JSON: {}", record);

        // todo resolve namespace
        String id = "<" + record.get("id").textValue() + ">";
        String templateId = "?" + recordTemplate.getTemplateID();

        builder.append("\t\t");

        builder.append(id);
        builder.append(" rdf:type ");
        builder.append(recordClass);
        builder.append(" .");
        builder.append(System.lineSeparator());

        log.debug("resolving attributes:");
        List<RecordAttribute> templateAttributes = recordTemplate.getAttributes();
        JsonNode dataAttributes = record.get("attributes");
        Iterator<String> attributeNames = dataAttributes.fieldNames();
        while (attributeNames.hasNext()) {
            String attributeName = attributeNames.next();
            // processed this above
            if ("type".equals(attributeName)) {
                continue;
            }

            Map<String, String> lookup = new HashMap<>();
            lookup.put(templateId, id);

            JsonNode data = dataAttributes.get(attributeName);
            if (data == null || data instanceof NullNode) {
                log.debug("skipping null value for attribute {}", attributeName);
                continue;
            }
            else if (data instanceof TextNode && data.textValue().equals("")) {
                log.debug("skipping empty string for attribute {}");
                continue;
            }

            Optional<RecordAttribute> maybeMatch = templateAttributes.stream().filter(s -> attributeName.equals(s.getName())).findFirst();
            if (!maybeMatch.isPresent()) {
                log.warn("Non-matching attribute key: {} not in {} template", attributeName, recordType.getType());
                continue;
            }
            RecordAttribute template = maybeMatch.get();

            log.debug("----------------------------------------------------------------");
            log.debug("resolving attribute template for {}", attributeName);
            log.debug("data: {}\n", data);
            log.debug("template: {}", template);

            for (RecordGeneratedVariable generatedVariable : template.getGeneratedVariables()) {
                String toReplace = "?" + generatedVariable.getVariable();
                String replacement = "gen:" + generatedVariable.getBase() + "_" + UUID.randomUUID();
                log.trace("\treplacing attribute variable {} => {}", toReplace, replacement);
                lookup.put(toReplace, replacement);
            }

            for (String triple : template.getStructure()) {
                log.trace("\tlookup: {}", lookup);

                for (String lk : lookup.keySet()) {
                    String lookupRepresentation = lookup.get(lk);
                    log.trace("\treplacing {} => {}", lk, lookupRepresentation);
                    triple = triple.replace(lk, lookupRepresentation);
                }

                String representation = '\"' + data.asText() + '\"';
                triple = triple.replace("?"+attributeName, representation);

                log.debug("triple: {}", triple);
                builder.append("\t\t");
                builder.append(triple);
                builder.append(" .");
                builder.append(System.lineSeparator());
            }

            builder.append(System.lineSeparator());
        }

        log.debug("resolving relationships:");
        List<RecordRelationship> templateRelationships = recordTemplate.getRelationships();
        JsonNode dataRelationships = record.get("relationships");
        if (dataRelationships == null) {
            dataRelationships = objectMapper.createObjectNode();
        }

        Iterator<String> relationshipNames = dataRelationships.fieldNames();
        while (relationshipNames.hasNext()) {
            Map<String, String> lookup = new HashMap<>();
            lookup.put(templateId, id);

            String relationshipName = relationshipNames.next();
            JsonNode data = dataRelationships.get(relationshipName);
            Optional<? extends RecordTemplateDataSection> maybeMatch = templateRelationships.stream().filter(s -> relationshipName.equals(s.getName())).findFirst();
            if (!maybeMatch.isPresent()) {
                log.warn("Non-matching relationship key: {} not in {} template", relationshipName, recordType.getType());
                continue;
            }
            RecordTemplateDataSection template = maybeMatch.get();

            log.debug("----------------------------------------------------------------");
            log.debug("resolving relationship template for {}", relationshipName);
            log.debug("data: {}\n", data);
            log.debug("template: {}", template);

            for (RecordGeneratedVariable generatedVariable : template.getGeneratedVariables()) {
                String toReplace = "?" + generatedVariable.getVariable();
                String replacement = "gen:" + generatedVariable.getBase() + "_" + UUID.randomUUID();
                log.trace("\treplacing relationship variable {} => {}", toReplace, replacement);
                lookup.put(toReplace, replacement);
            }

            JsonNode tmp = data.get("data");
            ArrayNode relationshipData = objectMapper.createArrayNode();
            if (tmp instanceof ArrayNode) {
                relationshipData = (ArrayNode) tmp;
            } else {
                relationshipData.add(tmp);
            }

            for (int i = 0; i < relationshipData.size(); i++) {
                JsonNode datum = relationshipData.get(i);
                if (datum == null || datum instanceof NullNode) {
                    log.debug("skipping null value for relationship {}", relationshipName);
                    continue;
                }

                for (String triple : template.getStructure()) {
                    log.trace("\tlookup: {}", lookup);

                    for (String lk : lookup.keySet()) {
                        String lookupRepresentation = lookup.get(lk);
                        log.trace("\treplacing {} => {}", lk, lookupRepresentation);
                        triple = triple.replace(lk, lookupRepresentation);
                    }

                    // todo need IRI/data value handling
                    String representation = "<" + datum.get("id").textValue() + ">";
                    triple = triple.replace("?"+relationshipName, representation);

                    log.debug("triple: {}", triple);
                    builder.append("\t\t");
                    builder.append(triple);
                    builder.append(" .");
                    builder.append(System.lineSeparator());
                }

                builder.append(System.lineSeparator());
            }
        }

        builder.append("\t}");
        builder.append(System.lineSeparator());
        builder.append("}");
        builder.append(System.lineSeparator());

        return builder.toString();
    }

    /**
     * Build a SELECT query for records in the given graph
     *
     * @param graphIRI the IRI of the graph to query
     *
     * @return the query string
     */
    public String buildSelect(String graphIRI) {
        return buildSelect(graphIRI, null);
    }

    /**
     * Build a SELECT query for the record with the given ID, in the given graph
     *
     * @param id the ID of the record
     * @param graphIRI the IRI of the graph to query
     *
     * @return the query string
     */
    public String buildSelect(String graphIRI, String id) {
        if (graphIRI == null || graphIRI.isEmpty()) {
            throw new IllegalArgumentException("Must provide a graph name to select from");
        }

        String templateID = "?" + recordTemplate.getTemplateID();

        StringBuilder builder = buildPrefixes();
        builder.append("SELECT *");
        builder.append(System.lineSeparator());
        builder.append("FROM <");
        builder.append(ontologyGraphIRI);
        builder.append(">");
        builder.append(System.lineSeparator());
        builder.append("FROM <");
        builder.append(graphIRI);
        builder.append(">");
        builder.append(System.lineSeparator());
        builder.append("\tWHERE {");
        builder.append(System.lineSeparator());

        // add rdf:type
        builder.append("\t\t");
        builder.append(templateID);
        builder.append(" rdf:type ?type .");
        builder.append(System.lineSeparator());

        if (id == null) {
            builder.append("\t\t?type rdfs:subClassOf* ");
            builder.append(recordTemplate.getTemplateBaseClass());
            builder.append(" .");
            builder.append(System.lineSeparator());
        }
        builder.append(System.lineSeparator());

        builder.append(buildGuts(true));

        builder.append("\t");
        builder.append("}");
        builder.append(System.lineSeparator());

        String result = builder.toString();

        if (id != null) {
            result = result.replace(templateID, "<" + id + ">");
        }

        return result;
    }

    public String buildDelete(String id, String graphIRI) {
        if (graphIRI == null || graphIRI.isEmpty()) {
            throw new IllegalArgumentException("Must provide a graph name to delete from");
        }

        StringBuilder builder = buildPrefixes();

        builder.append("WITH <");
        builder.append(graphIRI);
        builder.append(">");
        builder.append(System.lineSeparator());
        builder.append("DELETE {");
        builder.append(System.lineSeparator());

        // add rdf:type
        builder.append("\t\t");
        builder.append("<");
        builder.append(id);
        builder.append(">");
        builder.append(" rdf:type ?type .");
        builder.append(System.lineSeparator());
        builder.append(System.lineSeparator());

        builder.append(buildGuts(false));

        builder.append("\t");
        builder.append("}");
        builder.append(System.lineSeparator());

        builder.append("USING <");
        builder.append(graphIRI);
        builder.append(">");
        builder.append(System.lineSeparator());
        builder.append("USING <");
        builder.append(ontologyGraphIRI);
        builder.append(">");
        builder.append(System.lineSeparator());

        builder.append("WHERE {");
        builder.append(System.lineSeparator());

        builder.append("\t\t");
        builder.append("<");
        builder.append(id);
        builder.append(">");
        builder.append(" rdf:type ?type .");
        builder.append(System.lineSeparator());
        builder.append("\t\t?type rdfs:subClassOf* ");
        builder.append(recordTemplate.getTemplateBaseClass());
        builder.append(" .");
        builder.append(System.lineSeparator());
        builder.append(System.lineSeparator());

        builder.append(buildGuts(true));

        builder.append("\t");
        builder.append("}");
        builder.append(System.lineSeparator());

        return builder.toString().replace("?" + recordTemplate.getTemplateID(), "<" + id + ">");
    }

    private StringBuilder buildGuts(boolean includeOptional) {
        StringBuilder builder = new StringBuilder();

        // for each property in the template, add an optional
        ArrayList<RecordTemplateDataSection> allSections = new ArrayList<>();
        allSections.addAll(recordTemplate.getAttributes());
        allSections.addAll(recordTemplate.getRelationships());
        for (RecordTemplateDataSection attribute : allSections) {
            if (includeOptional) {
                builder.append("\t\t");
                builder.append("OPTIONAL {");
                builder.append(System.lineSeparator());
            }

            for (String line : attribute.getStructure()) {
                if (includeOptional) {
                    builder.append("\t\t\t");
                } else {
                    builder.append("\t\t");
                }
                builder.append(line);
                builder.append(" .");
                builder.append(System.lineSeparator());
            }

            if (includeOptional) {
                builder.append("\t\t");
                builder.append("}");
                builder.append(System.lineSeparator());
            }
            builder.append(System.lineSeparator());
        }

        return builder;
    }

    /**
     * Serialize the RDF result set into JSON-API. No side-loaded data is included. <br>
     * This generates objects that would be the values of "data" properties.
     *
     * @param resultSet the result set
     * @return JSON-API data
     */
    public ArrayNode serialize(ResultSet resultSet) {
        return serialize(resultSet, null);
    }

    public ArrayNode serialize(ResultSet resultSet, String id) {
        List<String> propertyNamesList = recordTemplate.getAttributes().stream().map(RecordTemplateDataSection::getName).collect(Collectors.toList());
        List<String> relationshipNamesList = recordTemplate.getRelationships().stream().map(RecordTemplateDataSection::getName).collect(Collectors.toList());

        ArrayNode listOfSolutions = objectMapper.createArrayNode();
        Map<String, ObjectNode> solutionLookup = new HashMap<>();

        while (resultSet.hasNext()) {
            log.trace("result set:");
            QuerySolution solution = resultSet.nextSolution();

            ObjectNode attributes = objectMapper.createObjectNode();
            ObjectNode relationships = objectMapper.createObjectNode();

            // String id = null;

            // get the solution names set
            Iterator<String> nameIterator = solution.varNames();
            Set<String> names = new HashSet<>();
            while (nameIterator.hasNext()) {
                names.add(nameIterator.next());
            }

            // get the ID, if it exists in the dataset
            if (!names.contains("id") && !names.contains(recordTemplate.getTemplateID())) {
                log.debug("No id in result set! Type: {}", recordType.getType());
            } else {
                RDFNode idNode = solution.get("id");
                if (idNode == null) {
                    idNode = solution.get(recordTemplate.getTemplateID());
                    names.remove(recordTemplate.getTemplateID());
                } else {
                    names.remove("id");
                }
                id = idNode.toString();
                log.trace("\tid: {}", id);
            }

            // assemble the other stuff
            for (String name : names) {
                RDFNode solutionNode = solution.get(name);
                String representation = solutionNode.toString();
                log.trace("\tvar: {} => {}", name, solutionNode);

                // get the type
                if (name.equals("type")) {
                    RDFNode typeNode = solution.get("type");
                    attributes.put("type", typeNode.toString());
                }

                else if (propertyNamesList.contains(name)) {
                    attributes.put(name, representation);
                }

                else if (relationshipNamesList.contains(name)) {
                    RecordRelationship relationship = recordTemplate.getRelationship(name);
                    RecordType type = relationship.getType();
                    RelationshipType linkType = relationship.getLinkType();
                    ObjectNode datum = objectMapper.createObjectNode();
                    datum.put("type", type.getType());
                    datum.put("id", representation);

                    relationships.set(name, makeRelationshipNode(type.getType(), linkType, representation));
                }
            }

            // if we haven't seen this ID before, just add it to the lookup
            if (!solutionLookup.containsKey(id)) {
                ObjectNode root = createRootObject();

                root.set("attributes", attributes);
                root.set("relationships", relationships);

                solutionLookup.put(id, root);
            }

            // if it's an already seen id, we have to coalesce record relationships (attributes are always single values). todo revisit!!!
            // todo check attributes for safety?
            else {
                ObjectNode seenNode = solutionLookup.get(id);
                ObjectNode seenRelationships = (ObjectNode) seenNode.get("relationships");
                for (RecordRelationship relationship : recordTemplate.getRelationships()) {
                    if (relationship.getLinkType().equals(RelationshipType.BELONGS_TO)) {
                        // should only be one. if it's different, there is an issue

                    } else {
                        // combine lists
                        JsonNode seenRelsByNameTmp = seenRelationships.get(relationship.getName());
                        ObjectNode seenRelsByName;
                        if (seenRelsByNameTmp == null) {
                            seenRelsByName = objectMapper.createObjectNode();
                            seenRelsByName.set("data", objectMapper.createArrayNode());
                        } else {
                            seenRelsByName = (ObjectNode) seenRelsByNameTmp;
                        }

                        JsonNode newRelsByNameTmp = relationships.get(relationship.getName());
                        ObjectNode newRelsByName;
                        if (newRelsByNameTmp == null) {
                            newRelsByName = objectMapper.createObjectNode();
                            newRelsByName.set("data", objectMapper.createArrayNode());
                        } else {
                            newRelsByName = (ObjectNode) newRelsByNameTmp;
                        }

                        ArrayNode relDataNode = (ArrayNode) seenRelsByName.get("data");
                        ArrayNode newRelationships = (ArrayNode) newRelsByName.get("data");

                        Set<String> seenRelsIds = new HashSet<>();
                        relDataNode.forEach(child -> seenRelsIds.add(child.get("id").textValue()));

                        newRelationships.forEach(child -> {
                            if (!seenRelsIds.contains(child.get("id").textValue())) {
                                relDataNode.add(child);
                            }
                        });
                    }
                }
            }
        }

        // convert to list
        for (String key : solutionLookup.keySet()) {
            ObjectNode solution = solutionLookup.get(key);
            solution.put("id", key);

            String expandedIdBase = expandNamespace(recordTemplate.getIriBase());

            if (key.startsWith(expandedIdBase)) {
                listOfSolutions.add(solution);
            } else {
                log.trace("{}: throwing away {}", recordType, id);
            }
        }

        return listOfSolutions;
    }

    private boolean attrsEquivalent(JsonNode lhs, JsonNode rhs) {
        if (!nodeExists(lhs) && !nodeExists(rhs)) {
            return true;
        }

        if (!nodeExists(lhs) || !nodeExists(rhs)) {
            return false;
        }

        String ls = lhs.asText();
        String rs = rhs.asText();

        return ls.equals(rs);
    }

    private boolean relsEquivalent(JsonNode lhs, JsonNode rhs) {
        if (!nodeExists(lhs) && !nodeExists(rhs)) {
            return true;
        }

        if (!nodeExists(lhs) || !nodeExists(rhs)) {
            return false;
        }

        if (lhs instanceof ArrayNode && rhs instanceof ArrayNode) {
            // have to treat as a set, and do a full replacement of the set

            ArrayNode left = (ArrayNode) lhs;
            ArrayNode right = (ArrayNode) rhs;
            Set<String> leftIDs = new HashSet<>();
            Set<String> rightIDs = new HashSet<>();
            left.forEach(node -> leftIDs.add(node.get("id").textValue()));
            right.forEach(node -> rightIDs.add(node.get("id").textValue()));

            return leftIDs.equals(rightIDs);
        } else {
            return lhs.get("id").equals(rhs.get("id"));
        }

    }

    public ObjectNode getRecordDiff(ObjectNode oldRecord, ObjectNode newRecord) {
        ObjectNode rootContainer = objectMapper.createObjectNode();
        rootContainer.set("id", oldRecord.get("id"));
        ArrayNode attrDiffContainer = objectMapper.createArrayNode();

        // for each property in the new record, check its counterpart in the old
        JsonNode oldAttrs = oldRecord.get("attributes");
        JsonNode newAttrs = newRecord.get("attributes");

        Iterator<String> attrNames = newAttrs.fieldNames();
        while (attrNames.hasNext()) {
            String name = attrNames.next();
            if (!recordTemplate.getAttributeNames().contains(name)) {
                log.warn("attribute {} in new record is not present in the record template", name);
                continue;
            }

            JsonNode oldAttr = oldAttrs.get(name);
            JsonNode newAttr = newAttrs.get(name);

            if (!attrsEquivalent(oldAttr, newAttr)) {
                attrDiffContainer.add(buildDiff(name, oldAttr, newAttr));
            }
        }

        rootContainer.set("attributes", attrDiffContainer);

        // repeat for relationships
        ArrayNode relDiffContainer = objectMapper.createArrayNode();

        JsonNode oldRels = oldRecord.get("relationships");
        JsonNode newRels = newRecord.get("relationships");

        Iterator<String> relNames = newRels.fieldNames();
        while (relNames.hasNext()) {
            String name = relNames.next();
            if (!recordTemplate.getRelationshipNames().contains(name)) {
                log.warn("relationship {} in new record is not present in the record template", name);
                continue;
            }

            JsonNode newRel = newRels.get(name);
            JsonNode newRelData = newRel.get("data");

            JsonNode oldRel = oldRels.get(name);
            JsonNode oldRelData = NullNode.getInstance();
            if (nodeExists(oldRel)) {
                oldRelData = oldRel.get("data");
            }

            if (!relsEquivalent(oldRelData, newRelData)) {
                relDiffContainer.add(buildDiff(name, oldRelData, newRelData));
            }
        }

        rootContainer.set("relationships", relDiffContainer);

        return rootContainer;
    }

    private ObjectNode buildDiff(String name, JsonNode from, JsonNode to) {
        ObjectNode diff = objectMapper.createObjectNode();
        diff.put("name", name);
        diff.set("from", from);
        diff.set("to", to);

        return diff;
    }

    public String buildRecordDiffUpdate(ObjectNode diff, String graphIRI) {
        if (graphIRI == null || graphIRI.isEmpty()) {
            throw new IllegalArgumentException("Must provide a graph name to insert into");
        }

        StringBuilder builder = buildPrefixes();
        builder.append("INSERT DATA {");
        builder.append(System.lineSeparator());
        builder.append("\tGRAPH <");
        builder.append(graphIRI);
        builder.append("> {");
        builder.append(System.lineSeparator());

        String id = diff.get("id").textValue();
        JsonNode attributes = diff.get("attributes");
        attributes.fieldNames().forEachRemaining(name -> {
            JsonNode attribute = attributes.get(name);
            appendDiff(builder, id, attribute.get("from").textValue(), attribute.get("to").textValue());
        });

        JsonNode relationships = diff.get("relationships");
        relationships.fieldNames().forEachRemaining(name -> {
            JsonNode relationship = relationships.get(name);
            appendDiff(builder, id, relationship.get("from").get("id").textValue(), relationship.get("to").get("id").textValue());
        });

        builder.append("\t}");
        builder.append(System.lineSeparator());
        builder.append("}");
        builder.append(System.lineSeparator());

        return builder.toString();
    }

    private void appendDiff(StringBuilder builder, String id, String oldValue, String newValue) {
        builder.append(id);
        builder.append(" gen:has_past_value ");
        builder.append(oldValue);
        builder.append(" .");
        builder.append(System.lineSeparator());
        builder.append(id);
        builder.append(" gen:has_future_value ");
        builder.append(newValue);
        builder.append(" .");
        builder.append(System.lineSeparator());

        builder.append(id);
        builder.append(" gen:edited_at ");
        builder.append(DateTime.now().toString());
    }

    private ObjectNode createRootObject() {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("type", recordType.getType());

        return root;
    }

    private JsonNode makeRelationshipNode(String type, RelationshipType linkType, String representation) {
        ObjectNode result = objectMapper.createObjectNode();

        ObjectNode datum = objectMapper.createObjectNode();
        ArrayNode data = objectMapper.createArrayNode();

        datum.put("type", type);
        datum.put("id", representation);
        data.add(datum);

        // todo temporary fix. relationship resolution needs to be reworked
        if (linkType.equals(RelationshipType.HAS_MANY)) {
            result.set("data", data);
        } else {
            result.set("data", datum);
        }

        return result;
    }

    private boolean nodeExists(JsonNode node) {
        return node != null && !(node instanceof NullNode);
    }

    private boolean isKnownPrefixed(String iri) {
        for (String key : nsToPrefix.keySet()) {
            if (!"".equals(key) && iri.startsWith(key)) {
                return true;
            }
        }

        return false;
    }

    private boolean isValidIRI(String iri) {
        // need to accept URNs as well as IRI

        Pattern urnPattern = Pattern.compile("^urn:[a-z0-9][a-z0-9-]{0,31}:([a-z0-9()+,\\-.:=@;$_!*']|%[0-9a-f]{2})+$", Pattern.CASE_INSENSITIVE);

        String[] schemes = {"http", "https"};
        UrlValidator urlValidator = new UrlValidator(schemes);

        return urnPattern.matcher(iri).matches() || IRIResolver.checkIRI(iri) || urlValidator.isValid(iri);
    }

    private String expandNamespace(String iri) {
        for (String key : nsToPrefix.keySet()) {
            String prefix = key + ":";
            if (iri.startsWith(prefix)) {
                return iri.replace(prefix, nsToPrefix.get(key));
            }
        }

        return iri;
    }

    public StringBuilder buildPrefixes() {
        StringBuilder builder = new StringBuilder();
        for (String key : nsToPrefix.keySet()) {
            builder.append("prefix ");
            builder.append(key);
            builder.append(": <");
            builder.append(nsToPrefix.get(key));
            builder.append(">");
            builder.append(System.lineSeparator());
        }

        builder.append(System.lineSeparator());

        return builder;
    }
}
