package org.cubrc.ontoview.yaml;

import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.Yaml;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class YamlWriter {
    private static Yaml yaml;

    static {
        DumperOptions options = new DumperOptions();
        options.setPrettyFlow(true);
        options.setDefaultFlowStyle(DumperOptions.FlowStyle.BLOCK);
        yaml = new Yaml(options);
    }

    public static String dump(Object data) {
        return yaml.dumpAsMap(data);
    }

    public static void writeToFile(Object data, String location) throws IOException {
        Path path = Paths.get(location);
        Files.createDirectories(path.getParent());
        if (!Files.exists(path)) {
            Files.createFile(path);
        }
        String result = dump(data);
        Files.write(Paths.get(location), result.getBytes());
    }
}
