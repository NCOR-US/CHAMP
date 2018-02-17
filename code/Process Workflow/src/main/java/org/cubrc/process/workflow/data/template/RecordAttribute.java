package org.cubrc.process.workflow.data.template;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import java.util.ArrayList;
import java.util.List;

/**
 * An attribute within a {@link RecordTemplate}.
 */
// todo remove implements
public class RecordAttribute implements RecordTemplateDataSection {
    @JsonProperty("name")
    @JsonPropertyDescription("The name of the attribute.")
    private String name;

    @JsonProperty("structure")
    @JsonPropertyDescription("A list of basic graph pattern strings describing the structure of the relationship.")
    private List<String> structure;

    @JsonProperty("generate")
    @JsonPropertyDescription("A list of variables to generate, and their configurations.")
    private List<RecordGeneratedVariable> generatedVariables;

    public RecordAttribute() {
        structure = new ArrayList<>();
        generatedVariables = new ArrayList<>();
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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
        return "RecordAttribute{" +
            "name='" + name + '\'' +
            ", structure=" + structure +
            ", generatedVariables=" + generatedVariables +
            '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;

        if (o == null || getClass() != o.getClass()) return false;

        RecordAttribute that = (RecordAttribute) o;

        return new EqualsBuilder()
            .append(name, that.name)
            .append(structure, that.structure)
            .append(generatedVariables, that.generatedVariables)
            .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
            .append(name)
            .append(structure)
            .append(generatedVariables)
            .toHashCode();
    }
}
