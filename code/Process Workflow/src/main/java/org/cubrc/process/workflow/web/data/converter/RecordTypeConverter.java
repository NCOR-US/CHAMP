package org.cubrc.process.workflow.web.data.converter;

import org.cubrc.process.workflow.data.RecordType;

import java.beans.PropertyEditorSupport;

/**
 * Allows {@link org.cubrc.process.workflow.data.RecordType} to be used as a {@link org.springframework.web.bind.annotation.PathVariable}
 * in Spring controllers
 */
public class RecordTypeConverter extends PropertyEditorSupport {
    @Override
    public void setAsText(String text) throws IllegalArgumentException {
        setValue(RecordType.fromString(text));
    }
}
