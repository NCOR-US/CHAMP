package org.cubrc.process.workflow.data.transform;

import org.cubrc.process.workflow.data.RecordType;
import org.cubrc.process.workflow.web.config.ProcessWorkflowConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class JsonApiTransformerFactory {
    private ProcessWorkflowConfig config;

    private Map<String, String> namespaces;

    public JsonApiTransformerFactory() {
        namespaces = new HashMap<>();
    }

    public JsonApiTransformer getInstance(RecordType type) {
        return new JsonApiTransformer(type, namespaces, config.getOntologyGraph());
    }

    @Autowired
    public void setConfig(ProcessWorkflowConfig config) {
        this.config = config;
        this.namespaces = new HashMap<>();
        for (ProcessWorkflowConfig.QueryNamespace qn : config.getQueryNamespaces()) {
            this.namespaces.put(qn.getPrefix(), qn.getNs());
        }
    }
}
