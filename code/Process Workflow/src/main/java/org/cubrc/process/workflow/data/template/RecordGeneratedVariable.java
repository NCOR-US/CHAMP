package org.cubrc.process.workflow.data.template;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

/**
 * A generated variable within a {@link RecordAttribute} or {@link RecordRelationship}.
 */
public class RecordGeneratedVariable {
    @JsonProperty("variable")
    @JsonPropertyDescription("The type of record that this relationship connects to.")
    private String variable;

    @JsonProperty("strategy")
    @JsonPropertyDescription("The IRI generation strategy.")
    private VariableGenerateStrategy strategy;

    @JsonProperty("base")
    @JsonPropertyDescription("The string base of the generated IRI.")
    private String base;

    public String getVariable() {
        return variable;
    }

    public void setVariable(String variable) {
        this.variable = variable;
    }

    public VariableGenerateStrategy getStrategy() {
        return strategy;
    }

    public void setStrategy(VariableGenerateStrategy strategy) {
        this.strategy = strategy;
    }

    public String getBase() {
        return base;
    }

    public void setBase(String base) {
        this.base = base;
    }

    @Override
    public String toString() {
        return "RecordGeneratedVariable{" +
            "variable='" + variable + '\'' +
            ", strategy=" + strategy +
            ", base='" + base + '\'' +
            '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;

        if (o == null || getClass() != o.getClass()) return false;

        RecordGeneratedVariable that = (RecordGeneratedVariable) o;

        return new EqualsBuilder()
            .append(variable, that.variable)
            .append(strategy, that.strategy)
            .append(base, that.base)
            .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
            .append(variable)
            .append(strategy)
            .append(base)
            .toHashCode();
    }
}
