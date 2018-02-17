package org.cubrc.process.workflow.db;

import org.apache.jena.query.QueryExecution;
import org.apache.jena.query.QueryExecutionFactory;
import org.apache.jena.query.ResultSetCloseable;
import org.apache.jena.query.ResultSetFactory;
import org.apache.jena.update.UpdateExecutionFactory;
import org.apache.jena.update.UpdateFactory;
import org.apache.jena.update.UpdateProcessor;
import org.apache.jena.update.UpdateRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
* Query interface for remote RDF databases
 */
public class RdfDatabaseConnector implements DatabaseConnector {
    private static final Logger log = LoggerFactory.getLogger(RdfDatabaseConnector.class);

    private String queryLocation;
    private String updateLocation;

    public RdfDatabaseConnector(String queryLocation, String updateLocation) {
        this.queryLocation = queryLocation;
        this.updateLocation = updateLocation;
    }

    @Override
    public synchronized ResultSetCloseable select(String query) {
        log.trace("select:\n\n{}", query);

        QueryExecution execution = QueryExecutionFactory.sparqlService(queryLocation, query);
        return ResultSetFactory.closeableResultSet(execution);
    }

    @Override
    public synchronized void insert(String update) {
        log.trace("insert:\n\n{}", update);

        UpdateRequest request = UpdateFactory.create();
        request.add(update);

        UpdateProcessor processor = UpdateExecutionFactory.createRemote(request, updateLocation);
        processor.execute();
    }

    @Override
    public synchronized void delete(String update) {
        log.trace("delete:\n\n{}", update);

        UpdateRequest request = UpdateFactory.create();
        request.add(update);

        UpdateProcessor processor = UpdateExecutionFactory.createRemote(request, updateLocation);
        processor.execute();
    }
}
