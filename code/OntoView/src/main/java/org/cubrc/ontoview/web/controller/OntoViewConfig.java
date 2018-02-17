package org.cubrc.ontoview.web.controller;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@EnableConfigurationProperties
@ConfigurationProperties(prefix="OntoView")
public class OntoViewConfig {
    @JsonIgnore
    private String overridesLocation;

    private String queryLocation;
    private String ontologyGraph;
    private String dataGraph;
    private List<QueryNamespace> queryNamespaces;

    public String getOverridesLocation() {
        return overridesLocation;
    }

    public void setOverridesLocation(String overridesLocation) {
        this.overridesLocation = overridesLocation;
    }

    public String getQueryLocation() {
        return queryLocation;
    }

    public void setQueryLocation(String queryLocation) {
        this.queryLocation = queryLocation;
    }

    public List<QueryNamespace> getQueryNamespaces() {
        return queryNamespaces;
    }

    public void setQueryNamespaces(List<QueryNamespace> queryNamespaces) {
        this.queryNamespaces = queryNamespaces;
    }

    public String getOntologyGraph() {
        return ontologyGraph;
    }

    public void setOntologyGraph(String ontologyGraph) {
        this.ontologyGraph = ontologyGraph;
    }

    public String getDataGraph() {
        return dataGraph;
    }

    public void setDataGraph(String dataGraph) {
        this.dataGraph = dataGraph;
    }

    // could have a smarter merge for namespaces
    // todo consider sending defaults with overrides
    public void merge(OntoViewConfig other) {
        if (other.getOntologyGraph() != null) {
            ontologyGraph = other.getOntologyGraph();
        }

        if (other.getQueryLocation() != null) {
            queryLocation = other.getQueryLocation();
        }

        if (other.getQueryNamespaces() != null) {
            queryNamespaces = other.getQueryNamespaces();
        }

        if (other.getDataGraph() != null) {
            dataGraph = other.getDataGraph();
        }
    }

    /**
     * Creates a new instance with the supplied base properties overridden by the supplied overrides.
     */
    public static OntoViewConfig merge(OntoViewConfig base, OntoViewConfig overrides) {
        OntoViewConfig merged = new OntoViewConfig();
        merged.merge(base);
        merged.merge(overrides);

        return merged;
    }

    public static class QueryNamespace {
        private String prefix;
        private String ns;

        public String getPrefix() {
            return prefix;
        }

        public void setPrefix(String prefix) {
            this.prefix = prefix;
        }

        public String getNs() {
            return ns;
        }

        public void setNs(String ns) {
            this.ns = ns;
        }
    }
}
