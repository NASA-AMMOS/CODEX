import { LARGER_OR_EQUAL_TO_ZERO, LARGER_THAN_ZERO } from "./classificationRegressionTypes";
import * as constantHelpers from "./constantHelpers";

export const CLASSIFICATION_ALGO = "classification";
export const REGRESSION_ALGO = "regression";

export const NUM_OF_FEATURES = "NUM_OF_FEATURES";
export const NUM_OF_FEATURES_MINUS_ONE = "NUM_OF_FEATURES_MINUS_ONE";

export const CLASSIFICATION_WINDOW = "CLASSIFICATION_WINDOW";
export const CLASSIFICATION_LOADING_WINDOW = "CLASSIFICATION_LOADING_WINDOW";
export const CLASSIFICATION_RESULTS_WINDOW = "CLASSIFICATION_RESULTS_WINDOW";

export const REGRESSION_WINDOW = "REGRESSION_WINDOW";
export const REGRESSION_RESULTS_WINDOW = "REGRESSION_RESULTS_WINDOW";

export const ARDRegression = "ARDRegression";
export const AdaBoostRegressor = "AdaBoostRegressor";
export const BaggingRegressor = "BaggingRegressor";
export const BayesianRidge = "BayesianRidge";
export const CCA = "CCA";
export const DecisionTreeRegressor = "DecisionTreeRegressor";
export const ElasticNet = "ElasticNet";
export const ElasticNetCV = "ElasticNetCV";
export const ExtraTreeRegressor = "ExtraTreeRegressor";
export const ExtraTreesRegressor = "ExtraTreesRegressor";
export const GaussianProcessRegressor = "GaussianProcessRegressor";
export const GaussianBoostingRegressor = "GaussianBoostingRegressor";
export const GradientBoostingRegressor = "GradientBoostingRegressor";
export const HuberRegressor = "HuberRegressor";
export const KNeighborsRegressor = "KNeighborsRegressor";
export const KernelRidge = "KernelRidge";
export const Lars = "Lars";
export const LarsCV = "LarsCV";
export const Lasso = "Lasso";
export const LassoCV = "LassoCV";
export const LassoLars = "LassoLars";
export const LassoLarsCV = "LassoLarsCV";
export const LassoLarsIC = "LassoLarsIC";
export const LinearRegression = "LinearRegression";
export const LinearSVR = "LinearSVR";
export const MLPRegressor = "MLPRegressor";
export const MultiTaskElasticNet = "MultiTaskElasticNet";
export const MultiTaskElasticNetCV = "MultiTaskElasticNetCV";
export const MultiTaskLasso = "MultiTaskLasso";
export const MultiTaskLassoCV = "MultiTaskLassoCV";
export const NuSVR = "NuSVR";
export const OrthogonalMatchingPursuit = "OrthogonalMatchingPursuit";
export const OrthogonalMatchingPursuitCV = "OrthogonalMatchingPursuitCV";
export const PLSCanonical = "PLSCanonical";
export const PLSRegression = "PLSRegression";
export const PassiveAggressiveRegressor = "PassiveAggressiveRegressor";
export const RANSACRegressor = "RANSACRegressor";
export const RadiusNeighborsRegressor = "RadiusNeighborsRegressor";
export const RandomForestRegressor = "RandomForestRegressor";
export const Ridge = "Ridge";
export const RidgeCV = "RidgeCV";
export const SGDRegressor = "SVDRegressor";
export const SVR = "SVR";
export const TheilSenRegressor = "TheilSenRegressor";
export const TransformedTargetRegressor = "TransformedTargetRegressor";

let lowerBetter = function(a, b) {
    //lower is better
    let sub = a - b;
    if (sub > 0) return -1;
    else if (sub == 0) return 0;
    else return 1;
};

let higherBetter = function(a, b) {
    //higher is better
    let sub = a - b;
    if (sub > 0) return 1;
    else if (sub == 0) return 0;
    else return -1;
};

let absHigherBetter = function(a, b) {
    //higher is better
    let sub = Math.abs(a) - Math.abs(b);
    if (sub > 0) return 1;
    else if (sub == 0) return 0;
    else return -1;
};
/*
    For some of the scoring methods lower is better, higher is 
    better, or closer to zero is better. These act as comparison functions
    to be used when doing something like selecting the best algorithm 
    out of a set of algorithms.
    The function returns -1 if a is worse then b, 0 if they are the same, 
    or 1 if a is better than b
*/
export const REGRESSION_SCORING_FUNCTIONS = {
    explained_variance: higherBetter,
    max_error: lowerBetter,
    neg_mean_absolute_error: lowerBetter,
    neg_mean_squared_error: lowerBetter,
    neg_mean_squared_log_error: lowerBetter,
    neg_median_absolute_error: lowerBetter,
    r2: absHigherBetter
};

export const REGRESSION_PARAMS = {
    [ARDRegression]: [
        {
            name: "n_iter",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 10000,
                    defaultMax: 300,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [AdaBoostRegressor]: [
        {
            name: "n_estimators",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 1000,
                    defaultMax: 50,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [BaggingRegressor]: [
        {
            name: "n_estimators",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 1000,
                    defaultMax: 10,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [BayesianRidge]: [
        {
            name: "n_estimators",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 1000,
                    defaultMax: 300,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [CCA]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 1000,
                    defaultMax: 500,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [DecisionTreeRegressor]: [
        {
            name: "max_depth",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: null,
                    max: 1000,
                    defaultMax: null,
                    stepSize: 1,
                    type: "int",
                    allowNull: true
                })
            )
        }
    ],
    [ElasticNet]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: -1,
                    defaultMin: -1,
                    max: 10000,
                    defaultMax: -1,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [ElasticNetCV]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: -1,
                    defaultMin: -1,
                    max: 10000,
                    defaultMax: -1,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [ExtraTreeRegressor]: [
        {
            name: "max_features",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: NUM_OF_FEATURES,
                    defaultMax: NUM_OF_FEATURES,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [ExtraTreesRegressor]: [
        {
            name: "max_features",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: NUM_OF_FEATURES,
                    defaultMax: NUM_OF_FEATURES,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [GaussianProcessRegressor]: [
        {
            name: "n_restarts_optimizer",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 0,
                    defaultMin: 0,
                    max: LARGER_OR_EQUAL_TO_ZERO,
                    defaultMax: 0,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [GradientBoostingRegressor]: [
        {
            name: "max_depth",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 0,
                    max: 1000,
                    defaultMax: 3,
                    stepSize: 1,
                    type: "int",
                    allowNull: true
                })
            )
        }
    ],
    [HuberRegressor]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 10000,
                    defaultMax: 100,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [KNeighborsRegressor]: [
        {
            name: "n_neighbors",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 1000,
                    defaultMax: 5,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [KernelRidge]: [
        {
            name: "degree",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 10,
                    defaultMax: 3,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [Lars]: [
        {
            name: "eps",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 0,
                    defaultMin: 0,
                    max: 100,
                    defaultMax: 1,
                    stepSize: 1,
                    type: "float"
                })
            )
        }
    ],
    [Lasso]: [
        {
            name: "alpha",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 0,
                    max: 100,
                    defaultMax: 1,
                    stepSize: 1,
                    type: "float"
                })
            )
        }
    ],
    [LassoLars]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 10000,
                    defaultMax: 100,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [LassoLarsIC]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 10000,
                    defaultMax: 100,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [LinearRegression]: [
        {
            name: "n_jobss",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: -1,
                    defaultMin: -1,
                    max: 8,
                    defaultMax: 1,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [LinearSVR]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 10000,
                    defaultMax: 1000,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [MLPRegressor]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 10000,
                    defaultMax: 200,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [MultiTaskElasticNet]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 10000,
                    defaultMax: 100,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [MultiTaskLasso]: [
        {
            name: "n_neighbors",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 10000,
                    defaultMax: 100,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [NuSVR]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: -1,
                    defaultMin: -1,
                    max: 10000,
                    defaultMax: -1,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [OrthogonalMatchingPursuit]: [
        {
            name: "n_nonzero_coefs",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: null,
                    max: LARGER_THAN_ZERO,
                    defaultMax: null,
                    stepSize: 1,
                    type: "int",
                    allowNull: true
                })
            )
        }
    ],
    [PLSCanonical]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: -1,
                    defaultMin: -1,
                    max: 10000,
                    defaultMax: 500,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [PLSRegression]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: -1,
                    defaultMin: -1,
                    max: 10000,
                    defaultMax: 500,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [PassiveAggressiveRegressor]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: -1,
                    defaultMin: -1,
                    max: 10000,
                    defaultMax: 1000,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ]
    // [RANSACRegressor]: [
    //     {
    //         name: "n_neighbors",
    //         mode: "range",
    //         subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
    //     }
    // ],
    // [RadiusNeighborsRegressor]: [
    //     {
    //         name: "n_neighbors",
    //         mode: "range",
    //         subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
    //     }
    // ],
    // [RandomForestRegressor]: [
    //     {
    //         name: "n_neighbors",
    //         mode: "range",
    //         subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
    //     }
    // ],
    // [Ridge]: [
    //     {
    //         name: "n_neighbors",
    //         mode: "range",
    //         subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
    //     }
    // ],
    // [SGDRegressor]: [
    //     {
    //         name: "n_neighbors",
    //         mode: "range",
    //         subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
    //     }
    // ],
    // [TheilSenRegressor]: [
    //     {
    //         name: "n_neighbors",
    //         mode: "range",
    //         subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
    //     }
    // ],
    // [TransformedTargetRegressor]: [
    //     {
    //         name: "n_neighbors",
    //         mode: "range",
    //         subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
    //     }
    // ]
};
