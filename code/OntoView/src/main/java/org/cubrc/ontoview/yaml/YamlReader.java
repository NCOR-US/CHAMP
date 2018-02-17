package org.cubrc.ontoview.yaml;

import org.yaml.snakeyaml.Yaml;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

public class YamlReader {
    private static Yaml yaml;

    static {
        yaml = new Yaml();
    }

    public static <T> T readFromFile(String location, Class<T> type) throws IOException {
        byte[] bytes = Files.readAllBytes(Paths.get(location));
        return yaml.loadAs(new String(bytes), type);
    }
}
