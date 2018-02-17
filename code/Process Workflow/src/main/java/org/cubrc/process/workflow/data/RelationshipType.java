package org.cubrc.process.workflow.data;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum RelationshipType {
    BELONGS_TO("belongsTo"),
    HAS_MANY("hasMany");

    private String type;

    RelationshipType(String type) {
        this.type = type;
    }

    @JsonValue
    public String getType() {
        return type;
    }

    @JsonCreator
    public static RelationshipType fromString(String type) throws IllegalArgumentException {
        for (RelationshipType rt : RelationshipType.values()) {
            if (rt.getType().equals(type)) {
                return rt;
            }
        }

        throw new IllegalArgumentException("No enum constant for String value " + type);
    }
}
