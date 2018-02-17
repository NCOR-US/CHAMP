package org.cubrc.ontoview.web.controller;

import org.apache.commons.io.IOUtils;
import org.cubrc.ontoview.yaml.YamlReader;
import org.cubrc.ontoview.yaml.YamlWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@Controller
public class HomeController {
    private static final Logger log = LoggerFactory.getLogger(HomeController.class);

    @Value("${application.name}")
    private String applicationName;

    @Value("${build.version}")
    private String buildVersion;

    @Value("${commit.id}")
    private String commit;

    // autowired below
    private OntoViewConfig config;

    private OntoViewConfig userOverrides;

    @RequestMapping(value = {"/"}, method = RequestMethod.GET)
    public String home() {
        return "/index.html";
    }

    @RequestMapping(value = {"/settings"}, method = RequestMethod.GET)
    public String settings() {
        return "/index.html";
    }

    @RequestMapping(value = {"/query/build"}, method = RequestMethod.GET)
    public String queryBuilder() {
        return "/index.html";
    }

    @RequestMapping(value = {"/result/{iri}"}, method = RequestMethod.GET)
    public String searchResult(@PathVariable String iri) {
        log.debug("Navigating to search result for IRI {}", iri);
        return "/index.html";
    }

    @RequestMapping(value = {"/ontology-tree"}, method = RequestMethod.GET)
    public String ontologyTree() {
        return "/index.html";
    }

    @RequestMapping(value = {"/app-info"}, method = RequestMethod.GET)
    public ResponseEntity appInfo() {
        Map<String, String> data = new HashMap<>();
        data.put("applicationName", applicationName);
        data.put("buildVersion", buildVersion);
        data.put("commit", commit);
        return ResponseEntity.ok(data);
    }

    @RequestMapping(value = {"/config"}, method = RequestMethod.GET)
    public ResponseEntity config() {
        String overridesLocation = config.getOverridesLocation();
        log.debug("Retrieving settings from {}", overridesLocation);
        try {
            userOverrides = YamlReader.readFromFile(overridesLocation, OntoViewConfig.class);
            log.debug("Merged overrides from {}", overridesLocation);
            return ResponseEntity.ok(OntoViewConfig.merge(config, userOverrides));
        } catch (NoSuchFileException e) {
            // pass
            log.debug("No overrides to load from {}", overridesLocation);
            return ResponseEntity.ok(config);
        } catch (IOException e) {
            // todo do we hand back something to the client with the old config saying we can't read overrides?
            String error = "Cannot read config from location " + overridesLocation;
            log.error(error, e);
            String responseError = error + ": " + e.getClass().getCanonicalName() + " " + e.getLocalizedMessage();
            return ResponseEntity.status(500).body(responseError);
        }
    }

    @RequestMapping(value = {"/config"}, method = RequestMethod.DELETE)
    public ResponseEntity restoreDefaults() {
        String overridesLocation = config.getOverridesLocation();
        try {
            log.debug("Deleting user configuration at {}", overridesLocation);
            if (Files.deleteIfExists(Paths.get(overridesLocation))) {
                config();
                return ResponseEntity.noContent().build();
            } else {
                return ResponseEntity.status(HttpStatus.NOT_MODIFIED).build();
            }
        } catch (Exception e) {
            log.error("Could not remove user configuration file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @RequestMapping(value = {"/config"}, method = RequestMethod.POST, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity saveConfig(@RequestBody OntoViewConfig inboundConfig) {
        userOverrides = inboundConfig;
        OntoViewConfig merged = OntoViewConfig.merge(config, userOverrides);
        String overridesLocation = config.getOverridesLocation();
        try {
            YamlWriter.writeToFile(merged, overridesLocation);
            return ResponseEntity.ok().build();
        } catch (IOException e) {
            String error = "Cannot write config overrides to location " + overridesLocation;
            log.error(error, e);
            String responseError = error + ": " + e.getClass().getCanonicalName() + " " + e.getLocalizedMessage();
            return ResponseEntity.status(500).body(responseError);
        }
    }

    @RequestMapping(value = {"/function-reference"}, method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity sparqlFunctionReference() {
        try(InputStream stream = Thread.currentThread().getContextClassLoader().getResourceAsStream("sparql-reference.json")) {
            List<String> strings = IOUtils.readLines(stream, Charset.defaultCharset());
            return ResponseEntity.ok(strings.parallelStream().collect(Collectors.joining()));
        } catch (IOException e) {
            log.info("Can't open JSON function reference", e);
            return ResponseEntity.notFound().build();
        }
    }

    @Autowired
    public void setConfig(OntoViewConfig config) {
        this.config = config;
    }
}
