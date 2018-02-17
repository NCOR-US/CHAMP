package org.cubrc.process.workflow.mock;

import org.apache.jena.query.Dataset;
import org.apache.jena.query.QueryExecution;
import org.apache.jena.query.QueryExecutionFactory;
import org.apache.jena.query.ReadWrite;
import org.apache.jena.query.ResultSetCloseable;
import org.apache.jena.query.ResultSetFactory;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.tdb.TDBFactory;
import org.apache.jena.update.UpdateAction;
import org.apache.jena.update.UpdateFactory;
import org.apache.jena.update.UpdateRequest;
import org.cubrc.process.workflow.db.DatabaseConnector;
import org.cubrc.process.workflow.web.config.ProcessWorkflowConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.FileInputStream;
import java.io.InputStream;

/**
 * Mock in-memory TDB database.
 */
@Component
public class DatabaseMock implements DatabaseConnector {
    private static final Logger log = LoggerFactory.getLogger(DatabaseMock.class);

    @Autowired
    private ProcessWorkflowConfig config;
    private Dataset memoryDb;

    public void init() {
        memoryDb = TDBFactory.createDataset();

        memoryDb.begin(ReadWrite.WRITE);
        memoryDb.addNamedModel(config.getDataGraph(), ModelFactory.createDefaultModel());
        memoryDb.addNamedModel(config.getOntologyGraph(), ModelFactory.createDefaultModel());
        memoryDb.commit();
        memoryDb.end();
    }

    @Override
    public ResultSetCloseable select(String query) {
        log.trace("select:\n\n{}", query);
        memoryDb.begin(ReadWrite.READ);
        QueryExecution execution = QueryExecutionFactory.create(query, memoryDb);
        ResultSetCloseable rs = ResultSetFactory.closeableResultSet(execution);
        memoryDb.commit();
        memoryDb.end();
        return rs;
    }

    @Override
    public void insert(String update) {
        log.trace("insert:\n\n{}", update);
        update(update);
    }

    @Override
    public void delete(String update) {
        log.trace("delete:\n\n{}", update);
        update(update);
    }

    private void update(String update) {
        UpdateRequest request = UpdateFactory.create();
        request.add(update);
        memoryDb.begin(ReadWrite.WRITE);
        UpdateAction.execute(request, memoryDb);
        memoryDb.commit();
        memoryDb.end();
    }

    public void addOntology(String fileLocation) {
        Model ontology;
        if (fileLocation.endsWith("owl")) {
            ontology = ModelFactory.createDefaultModel();
            try (InputStream stream = new FileInputStream(fileLocation)) {
                ontology.read(stream, null, "RDF/XML");
            } catch (Exception e) {
                log.error("Couldn't read OWL ontology from location " + fileLocation, e);
            }
        } else {
            ontology = ModelFactory.createDefaultModel();
            try (InputStream stream = new FileInputStream(fileLocation)) {
                ontology.read(stream, null, "TTL");
            } catch (Exception e) {
                log.error("Couldn't read TTL ontology from location " + fileLocation, e);
            }
        }
        memoryDb.begin(ReadWrite.WRITE);
        Model ontologyContainer = memoryDb.getNamedModel(config.getOntologyGraph());
        ontologyContainer.add(ontology);
        memoryDb.commit();
        memoryDb.end();
    }
}
