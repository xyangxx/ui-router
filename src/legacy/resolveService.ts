/** @module ng1 */ /** */
import { StateObject, PathNode, ResolveContext, Obj, mapObj, resolvablesBuilder } from "@uirouter/core";
import * as angular from "angular";

/**
 * Implementation of the legacy `$resolve` service for angular 1.
 */
var $resolve = {
  /**
   * Asynchronously injects a resolve block.
   *
   * This emulates most of the behavior of the ui-router 0.2.x $resolve.resolve() service API.
   *
  * ### Not bundled by default
   *
   * This API is no longer not part of the standard `angular-ui-router` bundle.
   * For users of the prebuilt bundles, add the `release/resolveService.min.js` UMD bundle.
   * For bundlers (webpack, browserify, etc), add `angular-ui-router/lib/legacy/resolveService`.
   *
   * ---
   *
   * Given an object `invocables`, where keys are strings and values are injectable functions,
   * injects each function, and waits for the resulting promise to resolve.
   * When all resulting promises are resolved, returns the results as an object.
   *
   * #### Example:
   * ```js
   * let invocables = {
   *   foo: [ '$http', ($http) =>
   *            $http.get('/api/foo').then(resp => resp.data) ],
   *   bar: [ 'foo', '$http', (foo, $http) =>
   *            $http.get('/api/bar/' + foo.barId).then(resp => resp.data) ]
   * }
   * $resolve.resolve(invocables)
   *     .then(results => console.log(results.foo, results.bar))
   * // Logs foo and bar:
   * // { id: 123, barId: 456, fooData: 'foo data' }
   * // { id: 456, barData: 'bar data' }
   * ```
   *
   * @param invocables an object which looks like an [[StateDeclaration.resolve]] object; keys are resolve names and values are injectable functions
   * @param locals key/value pre-resolved data (locals)
   * @param parent a promise for a "parent resolve"
   */
  resolve: (invocables: { [key: string]: Function }, locals = {}, parent?: Promise<any>) => {
    let parentNode = new PathNode(new StateObject(<any> { params: {}, resolvables: [] }));
    let node = new PathNode(new StateObject(<any> { params: {}, resolvables: [] }));
    let context = new ResolveContext([parentNode, node]);

    context.addResolvables(resolvablesBuilder(<any> { resolve: invocables }), node.state);

    const resolveData = (parentLocals: Obj) => {
      const rewrap = (_locals: Obj) => resolvablesBuilder(<any> { resolve: mapObj(_locals, local => () => local) });
      context.addResolvables(rewrap(parentLocals), parentNode.state);
      context.addResolvables(rewrap(locals), node.state);

      const tuples2ObjR = (acc: Obj, tuple: { token: any, value: any }) => {
        acc[tuple.token] = tuple.value;
        return acc;
      };
      return context.resolvePath().then(results => results.reduce(tuples2ObjR, {}));
    };

    return parent ? parent.then(resolveData) : resolveData({});
  }
};

/** @hidden */
export const resolveFactory = () => $resolve;

// The old $resolve service
angular.module('ui.router').factory('$resolve', <any> resolveFactory);
