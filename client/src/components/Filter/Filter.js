import "./Filter.css";

import { Sparklines, SparklinesLine } from "react-sparklines";
import { evaluateExpression } from "tevale";
import React, { Component } from "react";
import jsep from "jsep";

import classNames from "classnames";

import { WindowCircularProgress } from "..//WindowHelpers/WindowCenter";
import { useLiveFeatures, useCurrentSelection } from "../../hooks/DataHooks";
import { useWindowManager } from "../../hooks/WindowHooks";
import Debugger from "..//Debug/Debug";

class Filter extends Component {
    constructor(props) {
        super(props);

        this.state = {
            expr_input: "",
            expr_valid: true,
            expr_error: "",
            expr_tree: {},
            expr_masks: {},
            export_name: "Filter selection"
        };
        // bindings for event listeners
        this.handleExprChange = this.handleExprChange.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.exportSelection = this.exportSelection.bind(this);
        this.updateExportName = this.updateExportName.bind(this);

        // recursion-proofing bindings
        this.createExprString = this.createExprString.bind(this);
        this.createExprTree = this.createExprTree.bind(this);
    }

    /**
     * Lifecycle hook. Used here to initialize the jsep tree & get features
     */
    componentDidMount() {
        this.createExprTree(this.state.expr_input);
    }

    /**
     * Update selection name
     * @param {SyntheticEvent} event event from input
     */
    updateExportName(event) {
        this.setState({ export_name: event.target.value });
    }

    /**
     * Set the local state and kick off jsep
     * @param {SyntheticEvent} event from <input/>
     */
    handleExprChange(event) {
        this.setState({
            expr_input: event.target.value
        });
        this.createExprTree(event.target.value);
    }

    /**
     * Handle a keyup event, which an enter will execute the query
     * @param {SyntheticEvent} event keyUp event
     */
    handleKeyUp(event) {
        // bounce things that aren't enter events if it's a keyup
        if ("keyCode" in event && event.keyCode !== 13) return;

        // if the expression is valid, execute
        if (this.state.expr_valid) {
            this.evaluateAllExpressions(this.state.expr_tree);
            this.exportSelection();
        }
    }

    /**
     * Create the expression tree, using the local state
     * @param input value
     * @return an array of the logical expressions of that node downwards
     */
    createExprTree(input) {
        this.setState({
            expr_error: "",
            expr_valid: true
        });
        try {
            const tree = jsep(input);
            const idents = this.extractIdentifiers(tree);
            const invalid = this.findInvalidIdentifiers(
                idents,
                this.props.data.map(f => f.get("feature"))
            );
            if (invalid.length !== 0) {
                throw new Error(
                    `Unknown feature${invalid.length > 1 ? "s" : ""}: ${invalid.join(", ")}`
                );
            }

            this.setState({
                expr_tree: tree
            });
        } catch (e) {
            console.warn(e);
            this.setState({
                expr_error: e.message,
                expr_valid: false
            });
        }
    }

    /**
     * Render an expression tree to text
     * @param node root node of expr tree
     * @return text representation of node
     */
    createExprString(node) {
        /* jsep node types:
         *
         * COMPOUND = 'Compound'
         * IDENTIFIER = 'Identifier'
         * MEMBER_EXP = 'MemberExpression'
         * LITERAL = 'Literal'
         * THIS_EXP = 'ThisExpression'
         * CALL_EXP = 'CallExpression'
         * UNARY_EXP = 'UnaryExpression'
         * BINARY_EXP = 'BinaryExpression'
         * LOGICAL_EXP = 'LogicalExpression'
         * CONDITIONAL_EXP = 'ConditionalExpression'
         * ARRAY_EXP = 'ArrayExpression'
         */
        if (node.type === "Compound") {
            return node.body.map(this.createExprString).join(" ");
        } else if (node.type === "Identifier") {
            return node.name;
        } else if (node.type === "MemberExpression") {
            if (node.computed) {
                return `${node.object.name}[${this.createExprString(node.property)}]`;
            } else {
                return `${node.object.name}.${this.createExprString(node.property)}`;
            }
        } else if (node.type === "Literal") {
            return node.raw;
        } else if (node.type === "ThisExpression") {
            return "this";
        } else if (node.type === "CallExpression") {
            return (
                this.createExprString(node.callee) +
                "(" +
                node.arguments.map(this.createExprString).join(", ") +
                ")"
            );
        } else if (node.type === "UnaryExpression") {
            return node.operator + this.createExprString(node.argument);
        } else if (node.type === "LogicalExpression") {
            return `(${this.createExprString(node.left)} ${node.operator} ${this.createExprString(
                node.right
            )})`;
        } else if (node.type === "BinaryExpression") {
            return `(${this.createExprString(node.left)} ${node.operator} ${this.createExprString(
                node.right
            )})`;
        } else if (node.type === "ConditionalExpression") {
            return (
                "(" +
                this.createExprString(node.test) +
                " ? " +
                this.createExprString(node.consequent) +
                " : " +
                this.createExprString(node.alternate) +
                ")"
            );
        } else if (node.type === "ArrayExpression") {
            return "[" + node.elements.map(this.createExprString).join(", ") + "]";
        } else if (typeof node === "boolean") {
            return node ? "true" : "false";
        } else {
            console.warn(`unknown node type: ${node.type}`);
            return "???";
        }
    }

    /**
     * Get all identifiers
     * @param node root node
     * @return {array} of identifier nodes
     */
    extractIdentifiers(root) {
        const recursive = node => {
            let out = [];
            if (node.type === "Identifier") {
                out.push(node.name);
            }

            if ("left" in node) {
                out = out.concat(this.extractIdentifiers(node.left));
            }
            if ("right" in node) {
                out = out.concat(this.extractIdentifiers(node.right));
            }
            if ("body" in node) {
                out = out.concat(node.body.map(recursive));
            }

            return out;
        };

        // get all identifiers
        const idents = recursive(root);

        // we need to de-duplicate the array
        const seen = {};
        return idents.filter(i => (seen.hasOwnProperty(i) ? false : (seen[i] = true)));
    }

    /**
     * Extract all the logical expressions from the expression tree, with
     * compound expressions on top and atoms on the bottom
     *
     * @param node tree node to start from
     */
    extractLogicalExpressions(node) {
        // basic tree recursion
        let out = [];
        if (
            node.type === "LogicalExpression" ||
            node.type === "BinaryExpression" ||
            node.type === "Identifier"
        ) {
            out.push(node);
        }
        if (typeof node !== "object") return out;
        if ("left" in node) {
            out = out.concat(this.extractLogicalExpressions(node.left));
        }
        if ("right" in node) {
            out = out.concat(this.extractLogicalExpressions(node.right));
        }

        return out;
    }

    /**
     * Returns an array of identifiers that aren't selected features
     * @param {array} identifiers identifiers from tree
     * @param {array} selected selected identifiers
     * @returns {array} array of invalid identifiers
     */
    findInvalidIdentifiers(identifiers, selected) {
        // O(n * m)
        return identifiers.filter(el => !selected.includes(el));
    }

    /**
     * Create a list of all logical expressions (as strings)
     * @param tree tree to analyze
     * @return an array of logical expressions, sorted by tree depth (highest first)
     */
    createExprRows(tree) {
        const exprs = this.extractLogicalExpressions(tree);
        // get unique strings
        return exprs.map(this.createExprString).reduce((acc, exp, idx, arr) => {
            if (!acc.includes(exp)) {
                acc.push(exp);
            }
            return acc;
        }, []);
    }

    /**
     * Create bindings for an identifier
     * @param {string} expression expression name
     * @return {array} array mask
     */
    evaluateExpression(expression) {
        /* Explanation of what's going on:
         * basically, we're 1) creating an expression tree, then 2) figuring out
         * how long our result array is supposed to be while generating an obj
         * with pointers to the data columns, then 3) creating an output array
         * and finally 4) mapping against tevale, autocreating bindings
         */
        // create tree and extract identifiers
        const tree = jsep(expression);
        const identifiers = this.extractIdentifiers(tree);

        // create object of columns, and find the total length (kinda hacky)
        const cols = {};
        let total_length = 0;
        for (let ident of identifiers) {
            cols[ident] = this.props.data
                .find(f => f.get("feature") === ident)
                .get("data")
                .toJS();
            total_length = cols[ident].length; // immutable js size
        }

        // helper to create bindings
        const create_binding = i => {
            const out = {};
            for (let key of identifiers) {
                out[key] = cols[key][i];
            }
            return out;
        };

        return new Array(total_length)
            .fill(false) // apparently you can't iterate over something until you fill it
            .map((v, i) => evaluateExpression(expression, create_binding(i)));
    }

    /**
     * Create the full mask list
     * @param {node} root root node of tree
     */
    evaluateAllExpressions(root) {
        const subtrees = this.createExprRows(root);
        const masks = {};

        for (let tree of subtrees) {
            try {
                masks[tree.trim()] = this.evaluateExpression(tree);
            } catch (e) {
                masks[tree.trim()] = null;
                throw e;
            }
        }

        this.setState({ expr_masks: masks });

        this.forceUpdate();
    }

    /**
     * Export selection from filter
     *
     */
    exportSelection() {
        let selection = this.evaluateExpression(this.state.expr_input).reduce((acc, val, idx) => {
            if (val) {
                acc.push(idx);
            }
            return acc;
        }, []);
        this.props.selectionCreate(selection);
    }

    /**
     * Render the expression
     */
    render() {
        const available_features = this.props.data.map(f => f.get("feature")).toJS();

        const create_heat_row = (expr, coverage) => {
            // helper to add the points into a heatmap so as not to overwhelm the sparkline chart
            const bucket_count = 25;
            const bucketize = expr => {
                const bucket_size = Math.ceil(this.state.expr_masks[expr].length / bucket_count);

                return this.state.expr_masks[expr].reduce((acc, val, idx) => {
                    if (0 === idx % bucket_size) {
                        acc.push(0);
                    }
                    acc[acc.length - 1] += val ? 1 : 0;

                    return acc;
                }, []);
            };

            return (
                <tr key={expr}>
                    <td style={{ width: "50%" }}>{expr /*.replace(/ /g, '\xa0')*/}</td>
                    <td style={{ width: "50%" }}>
                        {this.state.expr_masks[expr] === null ||
                        this.state.expr_masks[expr] === undefined ? (
                            this.state.expr_masks[expr] === null ? (
                                <span>evaluation failed</span>
                            ) : (
                                <span>did not evaluate</span>
                            )
                        ) : (
                            <Sparklines height={15} data={bucketize(expr)}>
                                <SparklinesLine color="blue" />
                            </Sparklines>
                        )}
                    </td>
                </tr>
            );
        };
        //this.state.expr_masks[expr].reduce((a, v) => a + (v ? 1 : 0), 0)

        return (
            <div className="Filter">
                <div
                    className={classNames({
                        Filter__expr: true,
                        "Filter__expr--valid": this.state.expr_valid
                    })}
                >
                    <input
                        type="text"
                        onChange={this.handleExprChange}
                        onKeyUp={this.handleKeyUp}
                        value={this.state.expr_input}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        placeholder="Type your expression here..."
                    />
                    <span className="Filter__expr-features">
                        available features: {available_features.join(", ")}
                    </span>
                    <span className="Filter__expr-msg">{this.state.expr_error}</span>
                </div>
                <div className="Filter__heatmap">
                    <table style={{ width: "100%" }}>
                        <thead>
                            <tr>
                                <th>Expression</th>
                                <th>Coverage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.createExprRows(this.state.expr_tree).map(create_heat_row)}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

// connect to our store
const mapStateToProps = state => {
    const domain = state.data;
    return {
        selectedFeatures: domain.get("selected_features")
    };
};
const mapDispatchToProps = dispatch => ({
    selectionCreate: () => {} //(name, mask) => dispatch(selectionCreate(name, mask))
});

export { Filter };

export default props => {
    const win = useWindowManager(props, {
        resizable: false,
        title: "Filter",

        minSize: {
            width: 500,
            height: 100
        }
    });

    const data = useLiveFeatures();
    const [selection, createSelection] = useCurrentSelection();

    if (data === null) {
        return <WindowCircularProgress />;
    }

    return <Filter data={data} selectionCreate={createSelection} />;

    return <Debugger />;
    /*return (
        <DataWrapper>
            <WrappedFilter/>
        </DataWrapper>
    );*/
};
