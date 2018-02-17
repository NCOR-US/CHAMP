package org.cubrc.process.workflow.data.template;

import java.util.List;

public interface RecordTemplateDataSection {
    String getName();
    List<String> getStructure();
    List<RecordGeneratedVariable> getGeneratedVariables();
}
