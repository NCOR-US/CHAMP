package org.cubrc.process.workflow.db;

import org.apache.jena.query.ResultSetCloseable;

public interface DatabaseConnector {
    ResultSetCloseable select(String query);
    void insert(String update);
    void delete(String query);
}
