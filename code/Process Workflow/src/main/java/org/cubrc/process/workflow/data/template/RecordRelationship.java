package org.cubrc.process.workflow.data.template;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.cubrc.process.workflow.data.RecordType;
import org.cubrc.process.workflow.data.RelationshipType;

import java.util.ArrayList;
import java.util.List;

/**
 * A relationship within a {@link RecordTemplate}.
 */
public class RecordRelationship implements RecordTemplateDataSection {
    @JsonProperty("type")
    @JsonPropertyDescription("The type of record that this relationship connects to.")
    private RecordType type;

    @JsonProperty("name")
    @JsonPropertyDescription("The name of the relationship.")
    private String name;

    @JsonProperty("linkType")
    @JsonPropertyDescription("The type of relationship")
    private RelationshipType linkType;

    @JsonProperty("structure")
    @JsonPropertyDescription("A list of basic graph pattern strings describing the structure of the relationship.")
    private List<String> structure;

    @JsonProperty("generate")
    @JsonPropertyDescription("A list of variables to generate, and their configurations.")
    private List<RecordGeneratedVariable> generatedVariables;

    public RecordRelationship() {
        structure = new ArrayList<>();
        generatedVariables = new ArrayList<>();
    }

    public RecordType getType() {
        return type;
    }

    public void setType(RecordType type) {
        this.type = type;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public RelationshipType getLinkType() {
        return linkType;
    }

    public void setLinkType(RelationshipType linkType) {
        this.linkType = linkType;
    }

    public List<String> getStructure() {
        return structure;
    }

    public void setStructure(List<String> structure) {
        this.structure = structure;
    }

    public List<RecordGeneratedVariable> getGeneratedVariables() {
        return generatedVariables;
    }

    public void setGeneratedVariables(List<RecordGeneratedVariable> generatedVariables) {
        this.generatedVariables = generatedVariables;
    }

    @Override
    public String toString() {
        return "RecordRelationship{" +
            "type=" + type +
            ", name='" + name + '\'' +
            ", structure=" + structure +
            ", generatedVariables=" + generatedVariables +
            '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;

        if (o == null || getClass() != o.getClass()) return false;

        RecordRelationship that = (RecordRelationship) o;

        return new EqualsBuilder()
            .append(type, that.type)
            .append(name, that.name)
            .append(structure, that.structure)
            .append(generatedVariables, that.generatedVariables)
            .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
            .append(type)
            .append(name)
            .append(structure)
            .append(generatedVariables)
            .toHashCode();
    }
}
