export const CLASSIFIER_WINDOW = "CLASSIFIER_WINDOW";

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
    [AdaBoostClassifier]: [
        {
            name: "n_estimators",
            type: "int",
            mode: "range",
            min: 0,
            max: 50,
            step: 1,
            displayName: "Number of Estimators"
        }
    ],
    [BaggingClassifier]: [
        {
            name: "n_estimators",
            type: "int",
            mode: "range",
            min: 0,
            max: 10,
            step: 1,
            displayName: "Number of Estimators"
        }
    ],
    [BayesianGaussianMixture]: [
        {
            name: "n_components",
            type: "int",
            mode: "range",
            min: 0,
            max: 1,
            step: 1,
            displayName: "Number of Components"
        }
    ],
    [BernoulliNB]: [
        {
            name: "alpha",
            type: "float",
            mode: "range",
            min: 0,
            max: 1,
            step: 1,
            displayName: "Alpha"
        }
    ]
};
