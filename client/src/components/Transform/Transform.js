// import "ace-builds/src-noconflict/keybinding-emacs";
// import "ace-builds/src-noconflict/keybinding-vim";
// import "ace-builds/src-noconflict/mode-javascript";
// import "ace-builds/src-noconflict/theme-github";

import "./Transform.css";

// import AceEditor from "react-ace";
import React, { useState, useEffect, useRef, useMemo } from "react";
import workerize from "workerize";

import { WindowCircularProgress, WindowError } from "../WindowHelpers/WindowCenter";
import {
    WindowLayout,
    ExpandingContainer,
    WindowNoPad,
    WindowCover
} from "../WindowHelpers/WindowLayout";
import { createNewId } from "../../utils/utils";
import { usePinnedFeatures, useNewFeature } from "../../hooks/DataHooks";
import { useWindowManager } from "../../hooks/WindowHooks";

// // Helpers
// /**
//  * Sanitize a feature name into a valid Javascript identifier
//  * @param {string} name feature name
//  * @return {string} valid identifier
//  */
// const sanitizeName = name => {
//     // General guidelines from
//     // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Variables

//     if (/([a-zA-Z]|\$|_)/.exec(name[0]) === null) {
//         name[0] = "_";
//     }

//     return name.replace(/[^A-Za-z0-9_$]/g, "_");
// };

// /**
//  * Editor status line
//  */
// const EditorLine = props => {
//     const onClick = () => props.valid && props.onExecute();

//     const infoCount = props.annotations.filter(a => a.type === "info").length;
//     const warningsCount = props.annotations.filter(a => a.type === "warning").length;
//     const errorsCount = props.annotations.filter(a => a.type === "error").length;

//     return (
//         <div className="Transform__editorLine monospace">
//             <WindowLayout direction="row" align="baseline">
//                 <span>
//                     {errorsCount} errors, {warningsCount} warnings, {infoCount} info -{" "}
//                     {props.prog.length} chars -&nbsp;
//                 </span>
//                 {props.keyHandler === "" ? (
//                     <span onClick={props.nextKeyHandler} className="Transform--selectable">
//                         default
//                     </span>
//                 ) : (
//                     <span
//                         onClick={props.nextKeyHandler}
//                         className="Transform__editorLine--highlight Transform--selectable"
//                     >
//                         {props.keyHandler}
//                     </span>
//                 )}
//                 <ExpandingContainer />
//                 {!props.executing ? (
//                     <span
//                         className="Transform__editorLineExecute"
//                         data-valid={props.valid}
//                         onClick={onClick}
//                     >
//                         &nbsp;execute&nbsp;
//                     </span>
//                 ) : (
//                     <span className="Transform__editorLineExecute" onClick={props.onStopExecute}>
//                         &nbsp;back to edit&nbsp;
//                     </span>
//                 )}
//             </WindowLayout>
//         </div>
//     );
// };

// const getLocalStorageKey = features => {
//     return "transformer:" + features.map(f => f.get("feature")).join("/");
// };

// /**
//  * Ace editor component
//  */
// const CodeEditor = props => {
//     const [editorID, setEditorID] = useState(createNewId());

//     // compute default value of form field

//     const localStorageKey = useMemo(() => getLocalStorageKey(props.features), [props.features]);

//     // use the ace component as a controlled form
//     const [content, setContent] = useState("");

//     // ensure the component loads in/out of localstorage
//     useEffect(() => {
//         if (window.localStorage.getItem(localStorageKey) === null) {
//             // compute the default value of the editor
//             let getDisplayName = name =>
//                 name === sanitizeName(name) ? name : `${sanitizeName(name)} (${name})`;
//             let defaultValue = "/**\n * Available features:\n";
//             defaultValue += props.features
//                 .map(f => ` *  - ${getDisplayName(f.get("feature"))}`)
//                 .join("\n");
//             defaultValue += "\n */\n\nreturn 0;";

//             window.localStorage.setItem(localStorageKey, defaultValue);
//         }
//         props.onChange(window.localStorage.getItem(localStorageKey));
//         setContent(window.localStorage.getItem(localStorageKey));
//     }, []);
//     const contentUpdate = e => {
//         window.localStorage.setItem(localStorageKey, e);
//         setContent(e);
//         props.onChange(e);
//     }; // wrapping avoids react error

//     // keep track of the annotations from the ace layer
//     const [annotations, setAnnotations] = useState([]);

//     const editorKeyHandlers = ["", "vim", "emacs"];
//     const [editorKeyHandler, setEditorKeyHandler] = useState(0);
//     const nextHandler = () =>
//         setEditorKeyHandler((editorKeyHandler + 1) % editorKeyHandlers.length);

//     // we know everything's okay if there are no errors
//     const isValid = annotations.filter(a => a.type !== "info").length === 0;

//     const execute = () => props.onExecute(content);

//     return (
//         <React.Fragment>
//             <AceEditor
//                 mode="javascript"
//                 theme="github"
//                 name={editorID}
//                 width=""
//                 height="100%"
//                 editorProps={{ $blockScrolling: true }}
//                 onChange={contentUpdate}
//                 onValidate={setAnnotations}
//                 keyboardHandler={editorKeyHandlers[editorKeyHandler]}
//                 enableLiveAutocomplete={true}
//                 value={content}
//             />
//             <EditorLine
//                 annotations={annotations}
//                 prog={content}
//                 valid={isValid}
//                 onExecute={execute}
//                 onStopExecute={props.onStopExecute}
//                 executing={props.executing}
//                 keyHandler={editorKeyHandlers[editorKeyHandler]}
//                 nextKeyHandler={nextHandler}
//             />
//         </React.Fragment>
//     );
// };

// /**
//  * An *extremely* stateful component that shows the progress of execution
//  */
// const Executor = props => {
//     const [stage, setStage] = useState("initial");

//     const newFeature = useNewFeature();
//     const [messages, setMessages] = useState([]);
//     const [transformFn, setTransformFn] = useState(null);
//     const [results, setResults] = useState(null);
//     const [outputName, setOutputName] = useState("transformed vector");

//     // worker lifecycle management
//     const [worker, _setWorker] = useState(null);
//     const setWorker = wrkr => {
//         if (worker !== null) {
//             worker.shutdown();
//         }
//         _setWorker(wrkr);
//     };
//     useEffect(() => {
//         return () => {
//             // clean up a worker when this component is unmounted
//             if (worker !== null) {
//                 worker.shutdown();
//             }
//         };
//     });

//     const iref = useRef();

//     const addMessage = (message, color, indent = 0, save = true) => {
//         let style = { marginLeft: `${indent}em` };
//         if (color !== undefined) {
//             style.color = `var(--${color})`;
//         }

//         let newMsg = (
//             <div key={message} style={style}>
//                 {message}
//             </div>
//         );
//         if (save) {
//             setMessages([...messages, newMsg]);
//         }
//         return newMsg;
//     };

//     useEffect(() => {
//         console.log("running stage effect at " + stage);
//         if (stage === "initial") {
//             try {
//                 // HERE (start to) BE DRAGONS

//                 // map the arguments onto the function
//                 let args = props.features.map(f => sanitizeName(f.get("feature"))).toJS();
//                 const arglist = args.join(", ");

//                 const newBody = `function (${arglist}) {${"\n" + props.transform + "\n"}}`;

//                 // create the body of the function we will inject into our worker
//                 setTransformFn(newBody);

//                 addMessage("\u21b3 parse passed!", "green", 2);
//                 setStage("execute");
//             } catch (e) {
//                 addMessage(e.stack, "orange", 2);
//                 setStage("error");
//             }
//         } else if (stage === "execute") {
//             // Create our function which will perform the transpose and the mapping
//             const vectorWorker = workerize(`
//                 export function createVector(features) {
//                     let transform = null;

//                     try {
//                         transform = ${transformFn};
//                     } catch(e) {
//                         return {
//                             error: true,
//                             message: e.toString(),
//                             index: -1
//                         };
//                     }

//                     // map across the features to extract the feature data, creating
//                     // a (features x data length) matrix. next, perform a features-ary zip
//                     // to create a (data length x features) matrix. this must be done carefully
//                     // in order to preserve the indices for the lookup. because immutable doesn't support
//                     // N-ary zips, we'll have to emulate it by mapping along axis zero
//                     const cleaned = features.map(f => f.data); // indices preserved

//                     // this may be inefficient but w/e
//                     const transposed = cleaned[0].map((f, i) => cleaned.map(row => row[i]));

//                     // now, create the output vector
//                     let output = new Array(transposed.length).fill(0);

//                     // apply the lambda against the row
//                     for (let i = 0; i < transposed.length; i++) {
//                         try {
//                             output[i] = transform(...transposed[i]);
//                         } catch (e) {
//                             return {
//                                 error: true,
//                                 message: e.toString(),
//                                 index: i
//                             };
//                         }
//                     }
//                     return {
//                         error: false,
//                         output
//                     };
//                 }

//                 export function shutdown() {
//                     // workaround as .terminate(); does not seem to work
//                     close();
//                 }
//             `);

//             setWorker(vectorWorker);

//             vectorWorker
//                 .createVector(props.features.toJS())
//                 .then(r => {
//                     if (r.error) {
//                         if (r.index === -1) {
//                             addMessage(
//                                 "\u21b3 execution failed at parse!\n    " + r.message,
//                                 "orange",
//                                 2
//                             );
//                         } else {
//                             addMessage(
//                                 "\u21b3 execution failed at index " +
//                                     r.index +
//                                     "\n    " +
//                                     r.message,
//                                 "orange",
//                                 2
//                             );
//                         }
//                         setStage("error");
//                     } else {
//                         setResults(r.output);
//                         addMessage("\u21b3 execution complete!", "green", 2);
//                         setStage("save");
//                     }
//                 })
//                 .catch(e => {
//                     addMessage(
//                         "\u21b3 execution failed internally!\n    " + e.toString,
//                         "orange",
//                         2
//                     );
//                     setStage("error");
//                 });
//         } else if (stage === "save") {
//             let handleKeyUp = e => {
//                 if (e.key === "Enter") {
//                     // save the feature and advance to the next stage
//                     setOutputName(e.nativeEvent.target.value);
//                     newFeature(e.nativeEvent.target.value, results);
//                     setStage("done");
//                 }
//             };
//             setMessages([
//                 ...messages,
//                 addMessage("Ready to save feature!\nName to assign to new feature:", "", 0, false),
//                 <div key="newFeatureName" className="Transform__ExecutorFeatureName">
//                     &#x21b3;&nbsp;
//                     <input
//                         type="text"
//                         size="26"
//                         ref={iref}
//                         placeholder="NewFeature (enter to save)"
//                         onKeyUp={handleKeyUp}
//                     />
//                 </div>
//             ]);
//         } else if (stage === "done") {
//             iref.current.disabled = true;
//             addMessage("Feature transformation complete!", "green", 0);
//         } else if (stage === "error") {
//             addMessage("Halted execution due to error.", "red");
//         }
//     }, [stage]);

//     return (
//         <WindowCover>
//             <div className="Transform__Executor monospace">
//                 <div>Building transformer...</div>
//                 {messages}
//             </div>
//         </WindowCover>
//     );
// };

// const executeTransform = (lambda, features) => {};

const Transform = props => {
    return null;
    //     const win = useWindowManager(props, {
    //         title: "Data Transformer",
    //         minSize: {
    //             width: 475,
    //             height: 150
    //         },
    //         width: 500,
    //         height: 400
    //     });

    //     const features = usePinnedFeatures(win);
    //     const newFeature = useNewFeature();
    //     const [transformFn, setTransformFn] = useState(""); // transform text

    //     const [executing, setIsExecuting] = useState(false);

    //     if (features === null) {
    //         return <WindowCircularProgress />;
    //     } else if (features.size === 0) {
    //         return <WindowError>Please select at least one feature to use this tool.</WindowError>;
    //     } else {
    //         win.setTitle(
    //             `Data Transformer: ${features
    //                 .map(f => f.get("feature"))
    //                 .toJS()
    //                 .join(", ")}`
    //         );
    //     }

    //     const startExecution = () => setIsExecuting(true);
    //     const stopExecution = () => setIsExecuting(false);

    //     return (
    //         <WindowNoPad>
    //             <CodeEditor
    //                 features={features}
    //                 onChange={setTransformFn}
    //                 onExecute={startExecution}
    //                 executing={executing}
    //                 onStopExecute={stopExecution}
    //             />
    //             {executing && <Executor features={features} transform={transformFn} />}
    //         </WindowNoPad>
    //     );
};

export default Transform;
