import * as constantHelpers from "constants/constantHelpers";

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

export const REGRESSION_TYPES = [
    ARDRegression,
    AdaBoostRegressor,
    BaggingRegressor,
    BayesianRidge,
    CCA,
    DecisionTreeRegressor,
    ElasticNet,
    ElasticNetCV,
    ExtraTreeRegressor,
    ExtraTreesRegressor,
    GaussianProcessRegressor,
    GradientBoostingRegressor,
    HuberRegressor,
    KNeighborsRegressor,
    KernelRidge,
    Lars,
    LarsCV,
    Lasso,
    LassoCV,
    LassoLars,
    LassoLarsCV,
    LassoLarsIC,
    LinearRegression,
    LinearSVR,
    MLPRegressor,
    MultiTaskElasticNet,
    MultiTaskElasticNetCV,
    MultiTaskLasso,
    MultiTaskLassoCV,
    NuSVR,
    OrthogonalMatchingPursuit,
    OrthogonalMatchingPursuitCV,
    PLSCanonical,
    PLSRegression,
    PassiveAggressiveRegressor,
    RANSACRegressor,
    RadiusNeighborsRegressor,
    RandomForestRegressor,
    Ridge,
    RidgeCV,
    SGDRegressor,
    SVR,
    TheilSenRegressor,
    TransformedTargetRegressor
];

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
            subParams: [
                /*  
                    You could put other subParams in here. 
                    There may be a better way to do this, but
                    this just reduced alot of code
                */
            ].concat(constantHelpers.createRange(1, 10000, 1, "int"))
        }
    ],
    [AdaBoostRegressor]: [
        {
            name: "n_estimators",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
        }
    ],
    [BaggingRegressor]: [
        {
            name: "n_estimators",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
        }
    ],
    [BayesianRidge]: [
        {
            name: "n_estimators",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
        }
    ],
    [CCA]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
        }
    ],
    [DecisionTreeRegressor]: [
        {
            name: "max_depth",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
        }
    ],
    [ElasticNet]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(-1, 10000, 1, "int"))
        }
    ],
    [ElasticNetCV]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(-1, 10000, 1, "int"))
        }
    ],
    [ExtraTreeRegressor]: [
        {
            name: "max_features",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
        }
    ],
    [ExtraTreesRegressor]: [
        {
            name: "max_features",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
        }
    ],
    [GaussianProcessRegressor]: [
        {
            name: "n_restarts_optimizer",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
        }
    ],
    [GradientBoostingRegressor]: [
        {
            name: "max_depth",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
        }
    ],
    [HuberRegressor]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
        }
    ],
    [KNeighborsRegressor]: [
        {
            name: "n_neighbors",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
        }
    ],
    [KernelRidge]: [
        {
            name: "degree",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 10, 1, "int"))
        }
    ],
    [Lars]: [
        {
            name: "eps",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 100, 1, "float"))
        }
    ],
    [Lasso]: [
        {
            name: "alpha",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 100, 1, "float"))
        }
    ],
    [LassoLars]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 10000, 1, "int"))
        }
    ],
    [LassoLarsIC]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 10000, 1, "int"))
        }
    ],
    [LinearRegression]: [
        {
            name: "n_jobss",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(-1, 8, 1, "int"))
        }
    ],
    [LinearSVR]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 10000, 1, "int"))
        }
    ],
    [MLPRegressor]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 10000, 1, "int"))
        }
    ],
    [MultiTaskElasticNet]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 10000, 1, "int"))
        }
    ],
    [MultiTaskLasso]: [
        {
            name: "n_neighbors",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 10000, 1, "int"))
        }
    ],
    [NuSVR]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(-1, 10000, 1, "int"))
        }
    ],
    [OrthogonalMatchingPursuit]: [
        {
            name: "n_nonzero_coefs",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
        }
    ],
    [PLSCanonical]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(-1, 10000, 1, "int"))
        }
    ],
    [PLSRegression]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(-1, 10000, 1, "int"))
        }
    ],
    [PassiveAggressiveRegressor]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(-1, 10000, 1, "int"))
        }
    ],
    //everything past here is wrong becasue the api docs are not updated
    //i might just go in and look at them at some point
    [RANSACRegressor]: [
        {
            name: "n_neighbors",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
        }
    ],
    [RadiusNeighborsRegressor]: [
        {
            name: "n_neighbors",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
        }
    ],
    [RandomForestRegressor]: [
        {
            name: "n_neighbors",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
        }
    ],
    [Ridge]: [
        {
            name: "n_neighbors",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
        }
    ],
    [SGDRegressor]: [
        {
            name: "n_neighbors",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
        }
    ],
    [TheilSenRegressor]: [
        {
            name: "n_neighbors",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
        }
    ],
    [TransformedTargetRegressor]: [
        {
            name: "n_neighbors",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 1000, 1, "int"))
        }
    ]
};
