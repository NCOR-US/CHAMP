import QueryGraph from 'ontoview/data/query-graph';

import {
  AdHocNode,
  ClassNode,
  InstanceNode,
  LiteralNode
} from 'ontoview/data/query-node';
import QueryEdge from 'ontoview/data/query-edge';
import QueryAggregate from 'ontoview/data/query-aggregate';
import {
    RelationshipApplication, CreateNodeApplication, FilterApplication,
    StartOptionalApplication, EndOptionalApplication
} from 'ontoview/data/query-application';
import { OrderConstraint } from 'ontoview/data/query-constraint';
import { AggregateFunctions, Functions } from 'ontoview/data/query-function';

const FixtureFactory = {
    createFixture() {
        const fixture = QueryGraph.create({name: 'Untitled'});

        // build fixture

        fixture.set('name', 'Target Query');
        fixture.set('description', 'Tests all query components.');

        // PREFIX ero: <http://www.ontologylibrary.mil/CommonCore/Upper/ExtendedRelationOntology#>
        // PREFIX info: <http://www.ontologylibrary.mil/CommonCore/Mid/InformationEntityOntology#>
        // PREFIX af_maint: <http://www.ontologylibrary.mil/CommonCore/Domain/AirForceAircraftMaintenanceOntology#>
        // PREFIX ro: <http://www.obofoundry.org/ro/ro.owl#>
        // PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        fixture.addPrefixes({
            rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            ero: 'http://www.ontologylibrary.mil/CommonCore/Upper/ExtendedRelationOntology#',
            info: 'http://www.ontologylibrary.mil/CommonCore/Mid/InformationEntityOntology#',
            af_maint: 'http://www.ontologylibrary.mil/CommonCore/Domain/AirForceAircraftMaintenanceOntology#',
            ro: 'http://www.obofoundry.org/ro/ro.owl#',
            xsd: 'http://www.w3.org/2001/XMLSchema#'
        });

        // select ?aircraft (SUM(?stasis_hrs_dec) as ?total)
        // console.log("handling select line below");

        // where {
        //     af_maint:C-5_Fleet ro:has_part ?aircraft .
        let c5fleet = ClassNode.create({
            iri: 'http://www.ontologylibrary.mil/CommonCore/Domain/AirForceAircraftMaintenanceOntology#C-5_Fleet'
        });
        let aircraft = InstanceNode.create({
            variable: 'aircraft',
            iri: 'http://localhost:8080/SerialNumber_7000000456'
        });
        aircraft.useVariable();

        let has_part = QueryEdge.create({iri: 'http://www.obofoundry.org/ro/ro.owl#has_part'});
        fixture.addNode(c5fleet);
        fixture.addNode(aircraft);
        fixture.addEdge(has_part);
        fixture.addApplication(RelationshipApplication.create({
            source: c5fleet.get('id'),
            edge: has_part.get('id'),
            target: aircraft.get('id')
        }));

        //     ?aircraft ro:participates_in ?stasis .
        let stasis = InstanceNode.create({
            variable: 'stasis',
            iri: 'http://localhost:8080/StasisOfCapability_1718338407',
            instanceClass: 'http://www.ontologylibrary.mil/CommonCore/Domain/AirForceAircraftMaintenanceOntology#StasisOfNonMissionCapable'
        });
        stasis.useVariable();

        let participates_in = QueryEdge.create({iri: 'http://www.obofoundry.org/ro/ro.owl#participates_in'});
        fixture.addNode(stasis);
        fixture.addEdge(participates_in);
        fixture.addApplication(RelationshipApplication.create({
            source: aircraft.get('id'),
            edge: participates_in.get('id'),
            target: stasis.get('id')
        }));

        //     BIND(str(?stasis) as ?stasisstr) .
        let stasisstr = AdHocNode.create({
            variable: 'stasisstr',
            expr: Functions.RDF.STR.create({args: ['?stasis']})
        });
        fixture.addNode(stasisstr);
        fixture.addApplication(CreateNodeApplication.create({target: stasisstr.get('id')}));

        //     FILTER regex(?stasisstr, "Stasis", "i") .
        let stasisFilter = Functions.String.REGEX.create({args: ['?stasisstr', '"Stasis"', '"i"']});
        stasisstr.addFilter(stasisFilter);
        fixture.addApplication(FilterApplication.create({target: stasisstr.get('id'), filter: stasisFilter.get('id')}));

        //     BIND(IRI(replace(?stasisstr, "StasisOfCapability", "StasisDurationHrsToken")) as ?replacement) .
        let replaceFn = Functions.String.REPLACE.create({
            args: ['?stasisstr', '"StasisOfCapability"', '"StasisDurationHrsToken"']
        });
        let replacement = AdHocNode.create({
            variable: 'replacement',
            expr: Functions.RDF.IRI.create({args: [replaceFn]})
        });
        fixture.addNode(replacement);
        fixture.addApplication(CreateNodeApplication.create({target: replacement.get('id')}));

        //     ?stasis ero:occurs_on ?temporal_int .
        let temporal_int = InstanceNode.create({
            variable: 'temporal_int',
            iri: 'http://localhost:8080/TimeInterval_2015-12-17_06-05'
        });
        temporal_int.useVariable();

        let occurs_on = QueryEdge.create({
            iri: 'http://www.ontologylibrary.mil/CommonCore/Upper/ExtendedRelationOntology#occurs_on'
        });
        fixture.addNode(temporal_int);
        fixture.addEdge(occurs_on);
        fixture.addApplication(RelationshipApplication.create({
            source: stasis.get('id'),
            edge: occurs_on.get('id'),
            target: temporal_int.get('id')
        }));

        //     ?temporal_int info:designated_by ?temp_int_id .
        let temp_int_id = InstanceNode.create({
            variable: 'temp_int_id',
            iri: 'http://localhost:8080/StasisDurationMeasurement1234567890'
        });
        temp_int_id.useVariable();

        let designated_by = QueryEdge.create({
            iri: 'http://www.ontologylibrary.mil/CommonCore/Mid/InformationEntityOntology#designated_by'
        });
        fixture.addNode(temp_int_id);
        fixture.addEdge(designated_by);
        fixture.addApplication(RelationshipApplication.create({
            source: temporal_int.get('id'),
            edge: designated_by.get('id'),
            target: temp_int_id.get('id')
        }));

        // testing
        fixture.addApplication(StartOptionalApplication.create({link: '456'}));

        //     ?temp_int_id ero:inheres_in ?replacement .
        let inheres_in = QueryEdge.create({
            iri: 'http://www.ontologylibrary.mil/CommonCore/Upper/ExtendedRelationOntology#inheres_in'
        });
        fixture.addEdge(inheres_in);
        fixture.addApplication(RelationshipApplication.create({
            source: temp_int_id.get('id'),
            edge: inheres_in.get('id'),
            target: replacement.get('id')
        }));

        //     ?replacement info:has_integer_value ?stasis_hrs .
        let stasis_hrs = LiteralNode.create({
            variable: 'stasis_hrs',
            value: 12
        });
        stasis_hrs.useVariable();

        let has_integer_value = QueryEdge.create({
            iri: 'http://www.ontologylibrary.mil/CommonCore/Mid/InformationEntityOntology#has_integer_value'
        });
        fixture.addNode(stasis_hrs);
        fixture.addEdge(has_integer_value);
        fixture.addApplication(RelationshipApplication.create({
            source: replacement.get('id'),
            edge: has_integer_value.get('id'),
            target: stasis_hrs.get('id')
        }));

        //     BIND(xsd:decimal(?stasis_hrs) as ?stasis_hrs_dec) .
        let stasis_hrs_dec = AdHocNode.create({
            variable: 'stasis_hrs_dec',
            expr: Functions.Constructor['DEC'].create({args: ['?stasis_hrs']}) // (UnaryFunction)CastFunction.create({type: 'xsd:decimal', arg1: 'stasis_hrs'})
        });
        fixture.addNode(stasis_hrs_dec);
        fixture.addApplication(CreateNodeApplication.create({target: stasis_hrs_dec.get('id')}));

        // }
        // group by ?aircraft
        let totalAircraft = QueryAggregate.create({
            target: 'total',
            groups: ['aircraft'],
            expr: AggregateFunctions.SUM.create({args: ['?stasis_hrs_dec']}) // (UnaryFunction)SumFunction.create({arg1: 'stasis_hrs_total', target: 'dec'})
        });
        fixture.addAggregate(totalAircraft);

        // order by desc(?total)
        fixture.addOrder(OrderConstraint.create({src: totalAircraft.get('id'), type: 'desc'}));

        // limit 25
        fixture.setLimit(25);

        // (projections from above)
        fixture.addProjection('aircraft');

        // temporary optional stuff
        fixture.addApplication(StartOptionalApplication.create({link: '123'}));
        fixture.addApplication(RelationshipApplication.create({
            source: replacement.get('id'),
            edge: has_integer_value.get('id'),
            target: stasis_hrs.get('id')
        }));
        fixture.addApplication(EndOptionalApplication.create({link: '123'}));

        // testing
        fixture.addApplication(EndOptionalApplication.create({link: '456'}));

        return {
            fixture,
            expectedQueryString: 'PREFIX ero: <http://www.ontologylibrary.mil/CommonCore/Upper/ExtendedRelationOntology#>' +
            '\nPREFIX info: <http://www.ontologylibrary.mil/CommonCore/Mid/InformationEntityOntology#>' +
            '\nPREFIX af_maint: <http://www.ontologylibrary.mil/CommonCore/Domain/AirForceAircraftMaintenanceOntology#>' +
            '\nPREFIX ro: <http://www.obofoundry.org/ro/ro.owl#>' +
            '\nPREFIX xsd: <http://www.w3.org/2001/XMLSchema#>' +
            '\nSELECT ?aircraft (SUM(?stasis_hrs_dec) as ?total)' +
            '\nWHERE {' +
            '\n\taf_maint:C-5_Fleet ro:has_part ?aircraft .' +
            '\n\t?aircraft ro:participates_in ?stasis .' +
            '\n\t?stasis rdf:type af_maint:StasisOfNonMissionCapable .' +
            '\n\tBIND(str(?stasis) as ?stasisstr) .' +
            '\n\tFILTER REGEX(?stasisstr, "Stasis", "i") .' +
            '\n\tBIND(IRI(replace(?stasisstr, "StasisOfCapability", "StasisDurationHrsToken")) as ?replacement) .' +
            '\n\t?stasis ero:occurs_on ?temporal_int .' +
            '\n\t?temporal_int info:designated_by ?temp_int_id .' +
            '\n\t?temp_int_id ero:inheres_in ?replacement .' +
            '\n\t?replacement info:has_integer_value ?stasis_hrs .' +
            '\n\tBIND(xsd:decimal(?stasis_hrs) as ?stasis_hrs_dec) .' +
            '\n}' +
            '\nGROUP BY ?aircraft' +
            '\nORDER BY desc(?total)' +
            '\nLIMIT 25' +
            '\n'
        };
    }
};

export default FixtureFactory;
