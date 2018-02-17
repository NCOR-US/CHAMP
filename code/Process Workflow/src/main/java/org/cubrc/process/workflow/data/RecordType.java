package org.cubrc.process.workflow.data;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Types of data that a {@link org.cubrc.process.workflow.data.transform.JsonApiTransformer} recognizes.
 */
public enum RecordType {
    AGENT_SPEC("agent-specs"),
    ARTIFACT_SPEC("artifact-specs"),
    TEST_VALUE_BEARER_SPEC("test-value-bearer-specs"),
    SUB_PROCESS_SPEC("sub-process-specs"),

    MANUFACTURER_LOT("manufacturer-lots"),
    PRODUCTION_RUN("production-runs"),

    AGENT("agents"),
    ARTIFACT("artifacts"),
    TEST_VALUE_BEARER("test-value-bearers"),
    PROCESS("processes"),
    SUB_PROCESS("sub-processes");

    private String type;

    RecordType(String type) {
        this.type = type;
    }

    @JsonValue
    public String getType() {
        return type;
    }

    @JsonCreator
    public static RecordType fromString(String type) throws IllegalArgumentException {
        for (RecordType rt : RecordType.values()) {
            if (rt.getType().equals(type)) {
                return rt;
            }
        }

        throw new IllegalArgumentException("No enum constant for String value " + type);
    }
}
