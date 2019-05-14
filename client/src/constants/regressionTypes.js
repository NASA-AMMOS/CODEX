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


export const REGRESSION_TYPES = {
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
}


/*
    Creates a list of objects that are used to create the forms for ranges 
*/
function createRange(min, max, stepSize, type) {

    let minObj = {
                    type: type,
                    name: "min",
                    label: "Min parameter label",
                    default: min,
                    min: min,
                    max: max,
                    helperText: min + " or higher"
    };

    let maxObj = {
                    type: type,
                    name: "max",
                    label: "Max parameter label",
                    default: 100,
                    min: min,
                    max: max,
                    helperText: "Up to 100"
    };

    let stepSizeObj = {
                    type: type,
                    name: "step",
                    label: "Step size",
                    default: stepSize,
                    min: min,
                    max: max,
                    helperText: "Between " + min + " and " + max
    };

    return [minObj, maxObj, stepSizeObj];
}

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
            ].concat(createRange(1, 10000, 1, "int"))
        }
    ],
    [AdaBoostRegressor]: [
        {
            name: "n_estimators",
            mode: "range",
            subParams: [].concat(createRange(1, 1000, 1, "int"))
        }
    ],
    [BaggingRegressor]:[
        {
            name: "n_estimators",
            mode: "range",
            subParams: [].concat(createRange(1, 1000, 1, "int"))
        }
    ],
    [BayesianRidge]:[
        {
            name: "n_estimators",
            mode: "range",
            subParams: [].concat(createRange(1, 1000, 1, "int"))
        }
    ],
    [CCA]:[
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(createRange(1, 1000, 1, "int"))
        }
    ],
    [DecisionTreeRegressor]:[
        {
            name: "max_depth",
            mode: "range",
            subParams: [].concat(createRange(1, 1000, 1, "int"))
        }
    ],
    [ElasticNet]:[
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(createRange(-1, 10000, 1, "int"))
        }
    ],
    [ElasticNetCV]:[
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(createRange(-1, 10000, 1, "int"))
        }
    ],
    [ExtraTreeRegressor]:[
        {
            name: "max_features",
            mode: "range",
            subParams: [].concat(createRange(1, 1000, 1, "int"))
        }
    ],
    [ExtraTreesRegressor]:[
        {
            name: "max_features",
            mode: "range",
            subParams: [].concat(createRange(1, 1000, 1, "int"))
        }
    ],
    [GaussianProcessRegressor]:[
        {
            name: "n_restarts_optimizer",
            mode: "range",
            subParams: [].concat(createRange(1, 1000, 1, "int"))
        }
    ],
    [GradientBoostingRegressor]:[
        {
            name: "max_depth",
            mode: "range",
            subParams: [].concat(createRange(1, 1000, 1, "int"))
        }
    ],
    [HuberRegressor]:[
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(createRange(1, 1000, 1, "int"))
        }
    ],
    [KNeighborsRegressor]:[
        {
            name: "n_neighbors",
            mode: "range",
            subParams: [].concat(createRange(1, 1000, 1, "int"))
        }
    ],
}

