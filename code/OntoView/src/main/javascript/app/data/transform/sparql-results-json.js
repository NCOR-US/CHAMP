import QueryGraph from 'ontoview/data/query-graph';
import { InstanceNode, LiteralNode } from 'ontoview/data/query-node';
import QueryEdge from 'ontoview/data/query-edge';
import { RelationshipApplication } from 'ontoview/data/query-application';

const isRdfType = function(result) {
    let predicate = result.predicate;
    return predicate.ns === 'rdf' && predicate.localName === 'type' ||
        predicate.value === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
};

export default function transform(entities, prefixes = {}) {
    let rootEntity = entities[0];
    let rootLabel = rootEntity.label;

    let query = QueryGraph.create({
        name: 'Entity browser query',
        description: 'Drilldown query for ' + rootLabel,
    });

    query.addPrefixes(prefixes);

    // reconstruct the first entity
    let chunks = rootLabel.split(':');
    let maybeNS = chunks[0];
    let rootNode;
    if (chunks.length >= 2 && Object.keys(prefixes).includes(maybeNS)) {
        let pkg = prefixes[maybeNS];
        // todo distinguish between class and instance
        rootNode = InstanceNode.create({
            iri: pkg + chunks[1]
        });
    } else {
        // strip lt and gt. todo this should be handled much better
        let x = rootLabel.length-1;
        if (rootLabel.charAt(0) === '<' && rootLabel.charAt(x) === '>') {
            rootLabel = rootLabel.substring(1, x);
        }
        rootNode = InstanceNode.create({iri: rootLabel});
    }

    // attach instance class if it exists
    let rootEntityResults = rootEntity.model.result;
    let maybeClass = rootEntityResults.filter(isRdfType).pop();
    if (maybeClass) {
        rootNode.set("instanceClass", maybeClass.object[0].value);
        rootNode.set('useClass', false);
    }

    if (!rootNode) {
        console.warn("no root...");
    }
    query.addNode(rootNode);

    let currentNode = rootNode;

    /* jshint loopfunc: true */
    for (let i = 0, ii = entities.length - 1; i < ii; i++) {
        let entity = entities[i].model;

        // extract data about the next node
        let nextEntity = entities[i+1];
        let nextEntityID = nextEntity.id;

        // todo rewrite
        let maybeResult = entity.result
            .map((r) => {
                let index = r.object
                    .map((ob) => ob.displayText === nextEntityID)
                    .indexOf(true);
                return [r, index];
            })
            .filter((pair) => pair[0].object
                .filter((ob) => ob.displayText === nextEntityID).length)
            .pop();
        if (maybeResult) {
            let object = maybeResult[0].object[maybeResult[1]];
            let predicate = maybeResult[0].predicate;

            let edge = QueryEdge.create({iri: predicate.value});

            // just try to add and squash if it's a duplicate
            try {
                query.addEdge(edge);
            } catch (e) {
                // get the existing one
                let targetEdge = query.get('edges').filter((ex) => ex.iri === edge.iri).pop();
                if (!targetEdge) {
                    console.warn(`can't find existing edge (${edge.iri})...`);
                } else {
                    edge = targetEdge;
                }
            }

            let nextNode;
            if (object.type === 'uri') {
                nextNode = InstanceNode.create({iri: object.value});

                // attach instance class if it exists
                let nextEntityResults = nextEntity.model.result;
                let maybeClass = nextEntityResults.filter(isRdfType).pop();
                if (maybeClass) {
                    nextNode.set("instanceClass", maybeClass.object[0].value);
                    nextNode.set('useClass', false);
                }
            }
            else if (object.type === 'literal') {
                nextNode = LiteralNode.create({value: object.value});
            }

            if (!nextNode) {
                console.warn("Couldn't create node for entity", entity);
            } else {
                query.addNode(nextNode);
                let bgp = RelationshipApplication.create({
                    source: currentNode.get("id"),
                    edge: edge.get('id'),
                    target: nextNode.get("id")
                });
                query.addApplication(bgp);
            }
            currentNode = nextNode;
        }
    }
    /* jshint loopfunc: false */

    // add limit
    query.setLimit(25);

    return query;
}
