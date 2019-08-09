import * as constantHelpers from "constants/constantHelpers";

export const CLASSIFICATION_WINDOW = "CLASSIFICATION_WINDOW";
export const CLASSIFICATION_LOADING_WINDOW = "CLASSIFICATION_LOADING_WINDOW";
export const CLASSIFICATION_RESULTS_WINDOW = "CLASSIFICATION_RESULTS_WINDOW";

export const NUM_OF_FEATURES = "number of features";

export const AdaBoostClassifier = "AdaBoostClassifier";
export const BaggingClassifier = "BaggingClassifier";
export const BayesianGaussianMixture = "BayesianGaussianMixture";
export const BernoulliNB = "BernoulliNB";
export const CalibratedClassifierCV = "CalibratedClassifierCV";
export const ComplementNB = "ComplementNB";
export const DecisionTreeClassifier = "DecisionTreeClassifier";
export const ExtraTreesClassifier = "ExtraTreesClassifier";
export const ExtraTreeClassifier = "ExtraTreeClassifier";
export const GaussianMixture = "GaussianMixture";
export const GaussianNB = "GaussianNB";
export const GaussianProcessClassifier = "GaussianProcessClassifier";
export const GradientBoostingClassifier = "GradientBoostingClassifier";
export const KNeighborsClassifier = "KNeighborsClassifier";
export const LabelPropagation = "LabelPropagation";
export const LabelSpreading = "LabelSpreading";
export const LinearDiscriminantAnalysis = "LinearDiscriminantAnalysis";
export const LogisticRegression = "LogisticRegression";
export const LogisticRegressionCV = "LogisticRegressionCV";
export const MLPClassifier = "MLPClassifier";
export const MultinomialNB = "MultinomialNB";
export const NuSVC = "NuSVC";
export const QuadraticDiscriminantAnalysis = "QuadraticDiscriminantAnalysis";
export const RandomForestClassifier = "RandomForestClassifier";
export const SGDClassifier = "SGDClassifier";
export const SVC = "SVC";

export const CLASSIFICATION_PARAMS = {
    [AdaBoostClassifier]: [
        {
            name: "n_estimators",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 100,
                    defaultMax: 50,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [BaggingClassifier]: [
        {
            name: "n_estimators",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 100,
                    defaultMax: 10,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [BayesianGaussianMixture]: [
        {
            name: "n_components",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 100,
                    defaultMax: 1,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [BernoulliNB]: [
        {
            name: "alpha",
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
    [CalibratedClassifierCV]: [
        {
            name: "method",
            subParams: [
                {
                    options: ["sigmoid", "isotonic"],
                    default: "sigmoid",
                    name: "method",
                    label: "Method",
                    type: "string"
                }
            ]
        }
    ],
    [ComplementNB]: [
        {
            name: "alpha",
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
    [DecisionTreeClassifier]: [
        {
            name: "max_depth",
            mode: "rangeWithNull",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: null,
                    max: 100,
                    defaultMax: null,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [ExtraTreesClassifier]: [
        {
            name: "n_estimators",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 100,
                    defaultMax: 10,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [ExtraTreeClassifier]: [
        {
            name: "max_depth",
            mode: "rangeWithNull",
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
    [GaussianMixture]: [
        {
            name: "n_components",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 100,
                    defaultMax: 100,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [GaussianNB]: [
        {
            name: "var_smoothing",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 0,
                    defaultMin: 0,
                    max: 100,
                    defaultMax: 1e-9,
                    stepSize: 1,
                    type: "float"
                })
            )
        }
    ],
    [GaussianProcessClassifier]: [
        {
            name: "n_restarts_optimizer",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 0,
                    defaultMin: 0,
                    max: 100,
                    defaultMax: 0,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [GradientBoostingClassifier]: [
        {
            name: "n_estimators",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 1000,
                    defaultMax: 100,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [KNeighborsClassifier]: [
        {
            name: "n_neighbors",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 100,
                    defaultMax: 5,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [LabelPropagation]: [
        {
            name: "n_neighbors",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 100,
                    defaultMax: 5,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [LabelSpreading]: [
        {
            name: "n_neighbors",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 100,
                    defaultMax: 5,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [LinearDiscriminantAnalysis]: [
        {
            name: "n_components",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: NUM_OF_FEATURES,
                    defaultMax: 3,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [LogisticRegression]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 1000,
                    defaultMax: 100,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [LogisticRegressionCV]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 1000,
                    defaultMax: 100,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [MLPClassifier]: [
        {
            name: "max_iter",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 1000,
                    defaultMax: 200,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [MultinomialNB]: [
        {
            name: "alpha",
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
    [NuSVC]: [
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
    [QuadraticDiscriminantAnalysis]: [
        {
            name: "tol",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1.0e-6,
                    defaultMin: 1.0e-6,
                    max: 10000,
                    defaultMax: 1.0e-2,
                    stepSize: 1,
                    type: "float"
                })
            )
        }
    ],
    [RandomForestClassifier]: [
        {
            name: "n_estimators",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 1,
                    defaultMin: 1,
                    max: 100,
                    defaultMax: 10,
                    stepSize: 1,
                    type: "int"
                })
            )
        }
    ],
    [SGDClassifier]: [
        {
            name: "alpha",
            mode: "range",
            subParams: [].concat(
                constantHelpers.createRange({
                    min: 0,
                    defaultMin: 0,
                    max: 100,
                    defaultMax: 0.0001,
                    stepSize: 1,
                    type: "float"
                })
            )
        }
    ],
    [SVC]: [
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
    ]
};
