package org.cubrc.process.workflow.data.template;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Strategy types for generating a {@link RecordGeneratedVariable}.
 */
public enum VariableGenerateStrategy {
    RANDOM("random");

    private String type;

    VariableGenerateStrategy(String type) {
        this.type = type;
    }

    @JsonValue
    public String getType() {
        return type;
    }

    @JsonCreator
    public static VariableGenerateStrategy fromString(String type) throws IllegalArgumentException {
        for (VariableGenerateStrategy s : VariableGenerateStrategy.values()) {
            if (s.getType().equals(type)) {
                return s;
            }
        }

        throw new IllegalArgumentException("No enum constant for String value " + type);
    }
}
