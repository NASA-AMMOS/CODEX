export const CLASSIFIER_WINDOW = "CLASSIFIER_WINDOW";
export const CLASSIFIER_LOADING_WINDOW = "CLASSIFIER_LOADING_WINDOW";
export const CLASSIFIER_RESULTS_WINDOW = "CLASSIFIER_RESULTS_WINDOW";

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

export const CLASSIFIER_TYPES = [
    AdaBoostClassifier,
    BaggingClassifier,
    BayesianGaussianMixture,
    BernoulliNB,
    CalibratedClassifierCV,
    ComplementNB,
    DecisionTreeClassifier,
    ExtraTreesClassifier,
    ExtraTreeClassifier,
    GaussianMixture,
    GaussianNB,
    GaussianProcessClassifier,
    GradientBoostingClassifier,
    KNeighborsClassifier,
    LabelPropagation,
    LabelSpreading,
    LinearDiscriminantAnalysis,
    LogisticRegression,
    LogisticRegressionCV,
    MLPClassifier,
    MultinomialNB,
    NuSVC,
    QuadraticDiscriminantAnalysis,
    RandomForestClassifier,
    SGDClassifier,
    SVC
];

export const CLASSIFIER_PARAMS = {
    [AdaBoostClassifier]: {
        name: "n_estimators",
        mode: "range",
        params: [
            {
                type: "int",
                name: "min",
                label: "Min parameter label",
                default: 1,
                min: 1,
                max: 100,
                helperText: "1 or higher"
            },
            {
                type: "int",
                name: "max",
                label: "Max parameter label",
                default: 100,
                min: 1,
                max: 100,
                helperText: "Up to 100"
            },
            {
                type: "int",
                name: "step",
                label: "Step size",
                default: 1,
                min: 1,
                max: 100,
                helperText: "Between 1 and 100"
            }
        ]
    },
    [BaggingClassifier]: {
        name: "n_estimators",
        mode: "range",
        params: [
            {
                type: "int",
                name: "min",
                label: "Min parameter label",
                default: 1,
                min: 1,
                max: 100,
                helperText: "1 or higher"
            },
            {
                type: "int",
                name: "max",
                label: "Max parameter label",
                default: 10,
                min: 1,
                max: 10,
                helperText: "Up to 10"
            },
            {
                type: "int",
                name: "step",
                label: "Step size",
                default: 1,
                min: 1,
                max: 100,
                helperText: "Between 1 and 100"
            }
        ]
    },
    [BayesianGaussianMixture]: {
        name: "n_components",
        mode: "range",
        params: [
            {
                type: "int",
                name: "min",
                label: "Min parameter label",
                default: 1,
                min: 1,
                max: 100,
                helperText: "1 or higher"
            },
            {
                type: "int",
                name: "max",
                label: "Max parameter label",
                default: 10,
                min: 1,
                max: 10,
                helperText: "Up to 10"
            },
            {
                type: "int",
                name: "step",
                label: "Step size",
                default: 1,
                min: 1,
                max: 100,
                helperText: "Between 1 and 100"
            }
        ]
    },
    [BernoulliNB]: {
        name: "alpha",
        mode: "range",
        params: [
            {
                type: "float",
                name: "min",
                label: "Min parameter label",
                default: 1,
                min: 1,
                max: 100,
                helperText: "1 or higher"
            },
            {
                type: "float",
                name: "max",
                label: "Max parameter label",
                default: 1,
                min: 1,
                max: 1,
                helperText: "Up to 1"
            },
            {
                type: "float",
                name: "step",
                label: "Step size",
                default: 1,
                min: 1,
                max: 100,
                helperText: "Between 0 and 100"
            }
        ]
    },
    [CalibratedClassifierCV]: {
        name: "method",
        params: [
            {
                options: ["sigmoid", "isotonic"],
                default: "sigmoid",
                name: "method",
                label: "Method",
                type: "string"
            }
        ]
    },
    [ComplementNB]: {
        name: "alpha",
        mode: "range",
        params: [
            {
                type: "float",
                name: "min",
                label: "Min parameter label",
                default: 1,
                min: 1,
                max: 100,
                helperText: "1 or higher"
            },
            {
                type: "float",
                name: "max",
                label: "Max parameter label",
                default: 1,
                min: 1,
                max: 1,
                helperText: "Up to 1"
            },
            {
                type: "float",
                name: "step",
                label: "Step size",
                default: 1,
                min: 1,
                max: 100,
                helperText: "Between 0 and 100"
            }
        ]
    }
};
