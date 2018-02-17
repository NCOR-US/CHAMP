package org.cubrc.process.workflow.web.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import java.util.HashMap;
import java.util.Map;

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

    @RequestMapping(value = {"/"}, method = RequestMethod.GET)
    public String home() {
        return "/index.html";
    }

    @RequestMapping(value = {"/processes", "/processes/{name}"}, method = RequestMethod.GET)
    public String processes() {
        return "/index.html";
    }

    @RequestMapping(value = {"/inventory"}, method = RequestMethod.GET)
    public String inventory() {
        return "/index.html";
    }

    @RequestMapping(value = {"/query"}, method = RequestMethod.GET)
    public String query() {
        return "/index.html";
    }

    @RequestMapping(value = {"/data-input"}, method = RequestMethod.GET)
    public String dataInput() {
        return "/index.html";
    }

    @RequestMapping(value = {"/settings"}, method = RequestMethod.GET)
    public String settings() {
        return "/index.html";
    }

    // todo consider mapping Exception to index for rendered 404 page

    @RequestMapping(value = {"/app-info"}, method = RequestMethod.GET)
    public ResponseEntity appInfo() {
        Map<String, String> data = new HashMap<>();
        data.put("applicationName", applicationName);
        data.put("buildVersion", buildVersion);
        data.put("commit", commit);
        return ResponseEntity.ok(data);
    }
}
