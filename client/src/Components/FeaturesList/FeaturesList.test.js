import React from "react";
import { FeaturesList } from "./FeaturesList";
import { shallow } from "enzyme";
import { fromJS } from "immutable";
import sinon from "sinon";

// set up a test
const setup = (features, filterString, featureSelect, featureUnselect) => {
    // default props
    features = features || fromJS([["a", true], ["b", false], ["c", false]]);
    filterString = filterString || "";
    featureSelect = featureSelect || (() => {});
    featureUnselect = featureUnselect || (() => {});

    return shallow(
        <FeaturesList
            features={features}
            filterString={filterString}
            onOffAll={"all"}
            featureSelect={featureSelect}
            featureUnselect={featureUnselect}
        />
    );
};

describe("<FeaturesList/>", () => {
    it("renders without crashing", () => {
        setup();
    });

    it("should render a list of features", () => {
        const wrapper = setup();

        expect(wrapper.find("li")).toHaveLength(3);
        expect(
            wrapper
                .find("li")
                .first()
                .text()
        ).toEqual("a");
        expect(
            wrapper
                .find("li")
                .last()
                .text()
        ).toEqual("c");
        // there should be a selected class on the first element
        expect(
            wrapper
                .find("li")
                .first()
                .prop("className")
        ).toMatch(/selected/);
    });

    it("should handle selecting a feature", () => {
        // inject a sinon fake featureSelect callback
        const featureSelect = sinon.fake();
        const wrapper = setup(undefined, undefined, featureSelect, undefined);

        expect(featureSelect.callCount).toEqual(0);

        wrapper
            .find("li")
            .last()
            .simulate("click", { shiftKey: false });

        expect(featureSelect.callCount).toEqual(1);
        expect(featureSelect.args[0][0]).toEqual("c");
    });

    it("should handle unselecting a feature", () => {
        // inject a sinon fake featureSelect callback
        const featureUnselect = sinon.fake();
        const wrapper = setup(undefined, undefined, undefined, featureUnselect);

        expect(featureUnselect.callCount).toEqual(0);

        wrapper
            .find("li")
            .first()
            .simulate("click", { shiftKey: false });

        expect(featureUnselect.callCount).toEqual(1);
        expect(featureUnselect.args[0][0]).toEqual("a");
    });

    it("should filter based on the filterString prop", () => {
        const wrapper = setup(undefined, "a");
        expect(wrapper.find("li")).toHaveLength(1);
    });

    it("shouldn't render anything if the filter doesn't match", () => {
        const wrapper = setup(undefined, "d");
        expect(wrapper.find("li")).toHaveLength(0);
    });
});
