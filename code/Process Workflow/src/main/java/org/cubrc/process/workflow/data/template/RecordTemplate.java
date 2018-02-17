package org.cubrc.process.workflow.data.template;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.cubrc.process.workflow.data.RecordType;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * A JSON template supporting conversion from RDF to JSON and reverse.
 */
public class RecordTemplate {
    @JsonProperty("type")
    @JsonPropertyDescription("The type of record.")
    private RecordType type;

    @JsonProperty("id")
    @JsonPropertyDescription("The variable which holds the ID of this record.")
    private String idVariable;

    @JsonProperty("iriBase")
    @JsonPropertyDescription("The base string of the IRI")
    private String iriBase;

    @JsonProperty("baseClass")
    @JsonPropertyDescription("The base class of this record.")
    private String baseClass;

    @JsonProperty("attributes")
    @JsonPropertyDescription("List of attributes which are parts of this record.")
    private List<RecordAttribute> attributes;

    @JsonProperty("relationships")
    @JsonPropertyDescription("List of relationships which this record holds.")
    private List<RecordRelationship> relationships;

    public RecordType getType() {
        return type;
    }

    public void setType(RecordType type) {
        this.type = type;
    }

    public String getTemplateID() {
        return idVariable;
    }

    public void setTemplateID(String idVariable) {
        this.idVariable = idVariable;
    }

    public String getIriBase() {
        return iriBase;
    }

    public void setIriBase(String iriBase) {
        this.iriBase = iriBase;
    }

    public String getTemplateBaseClass() {
        return baseClass;
    }

    public void setTemplateBaseClass(String baseClass) {
        this.baseClass = baseClass;
    }

    public List<RecordAttribute> getAttributes() {
        return attributes;
    }

    public Set<String> getAttributeNames() {
        return attributes.stream().map(RecordAttribute::getName).collect(Collectors.toSet());
    }

    public void setAttributes(List<RecordAttribute> attributes) {
        this.attributes = attributes;
    }

    public RecordRelationship getRelationship(String name) {
        List<RecordRelationship> collected = relationships.stream().filter(r -> name.equals(r.getName())).collect(Collectors.toList());
        return collected.get(0);
    }

    public List<RecordRelationship> getRelationships() {
        return relationships;
    }

    public Set<String> getRelationshipNames() {
        return relationships.stream().map(RecordRelationship::getName).collect(Collectors.toSet());
    }

    public void setRelationships(List<RecordRelationship> relationships) {
        this.relationships = relationships;
    }

    @Override
    public String toString() {
        return "RecordTemplate{" +
            "type=" + type +
            ", idVariable='" + idVariable + '\'' +
            ", baseClass='" + baseClass + '\'' +
            ", attributes=" + attributes +
            ", relationships=" + relationships +
            '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;

        if (o == null || getClass() != o.getClass()) return false;

        RecordTemplate that = (RecordTemplate) o;

        return new EqualsBuilder()
            .append(type, that.type)
            .append(idVariable, that.idVariable)
            .append(baseClass, that.baseClass)
            .append(attributes, that.attributes)
            .append(relationships, that.relationships)
            .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
            .append(type)
            .append(idVariable)
            .append(baseClass)
            .append(attributes)
            .append(relationships)
            .toHashCode();
    }
}
