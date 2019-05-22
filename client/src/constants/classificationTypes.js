import * as constantHelpers from "constants/constantHelpers";

export const CLASSIFICATION_WINDOW = "CLASSIFICATION_WINDOW";
export const CLASSIFICATION_LOADING_WINDOW = "CLASSIFICATION_LOADING_WINDOW";
export const CLASSIFICATION_RESULTS_WINDOW = "CLASSIFICATION_RESULTS_WINDOW";

export const AdaBoostClassification = "AdaBoostClassification";
export const BaggingClassification = "BaggingClassification";
export const BayesianGaussianMixture = "BayesianGaussianMixture";
export const BernoulliNB = "BernoulliNB";
export const CalibratedClassificationCV = "CalibratedClassificationCV";
export const ComplementNB = "ComplementNB";
export const DecisionTreeClassification = "DecisionTreeClassification";
export const ExtraTreesClassification = "ExtraTreesClassification";
export const ExtraTreeClassification = "ExtraTreeClassification";
export const GaussianMixture = "GaussianMixture";
export const GaussianNB = "GaussianNB";
export const GaussianProcessClassification = "GaussianProcessClassification";
export const GradientBoostingClassification = "GradientBoostingClassification";
export const KNeighborsClassification = "KNeighborsClassification";
export const LabelPropagation = "LabelPropagation";
export const LabelSpreading = "LabelSpreading";
export const LinearDiscriminantAnalysis = "LinearDiscriminantAnalysis";
export const LogisticRegression = "LogisticRegression";
export const LogisticRegressionCV = "LogisticRegressionCV";
export const MLPClassification = "MLPClassification";
export const MultinomialNB = "MultinomialNB";
export const NuSVC = "NuSVC";
export const QuadraticDiscriminantAnalysis = "QuadraticDiscriminantAnalysis";
export const RandomForestClassification = "RandomForestClassification";
export const SGDClassification = "SGDClassification";
export const SVC = "SVC";

export const CLASSIFICATION_TYPES = [
    AdaBoostClassification,
    BaggingClassification,
    BayesianGaussianMixture,
    BernoulliNB,
    CalibratedClassificationCV,
    ComplementNB,
    DecisionTreeClassification,
    ExtraTreesClassification,
    ExtraTreeClassification,
    GaussianMixture,
    GaussianNB,
    GaussianProcessClassification,
    GradientBoostingClassification,
    KNeighborsClassification,
    LabelPropagation,
    LabelSpreading,
    LinearDiscriminantAnalysis,
    LogisticRegression,
    LogisticRegressionCV,
    MLPClassification,
    MultinomialNB,
    NuSVC,
    QuadraticDiscriminantAnalysis,
    RandomForestClassification,
    SGDClassification,
    SVC
];

export const CLASSIFICATION_PARAMS = {
    [AdaBoostClassification]: [
        {
            name: "n_estimators",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 100, 1, "int"))
        }
    ],
    [BaggingClassification]: [
        {
            name: "n_estimators",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 100, 1, "int"))
        }
    ],
    [BayesianGaussianMixture]: [
        {
            name: "n_components",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 100, 1, "int"))
        }
    ],
    [BernoulliNB]: [
        {
            name: "alpha",
            mode: "range",
            subParams: [].concat(constantHelpers.createRange(1, 100, 1, "int"))
        }
    ],
    [CalibratedClassificationCV]: [
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
            subParams: [].concat(constantHelpers.createRange(1, 100, 1, "int"))
        }
    ]
};
