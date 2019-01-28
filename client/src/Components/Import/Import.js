import React, { Component } from "react";
import "./Import.css";

import { formulas } from "../../formulas/formulas";
import { parser } from "../../parser/parser.js";

// redux!
import { connect } from "react-redux";
import { fileLoad } from "../../../actions/data";

/* eslint import/no-webpack-loader-syntax: off */
import WorkerUpload from "worker-loader!../../workers/upload.worker";
const workerUpload = new WorkerUpload();

class Import extends Component {
  constructor() {
    super();

    this.vars = {
      fileToUpload: null,
      etf: null
    };

    this.state = {
      fileToUpload: null,
      isUploading: false
    };

    workerUpload.addEventListener("message", e => {
      console.log(
        "%cUpload",
        "background: #800075; padding: 0px 4px 0px 4px;",
        e
      );
    });
  }

  uploadLocalData(file, type, progressCallback, completeCallback) {
    if (!file) return;
    this.parseFile(file, type, progressCallback, filedata => {
      filedata = this.validateData(filedata);
      completeCallback();
      this.props.fileLoad(filedata, file.name);
    });
  }

  parseFile(file, type, progressCallback, completeCallback) {
    let filedata = [];
    parser.parseFile(
      file,
      type,
      function(data, progress) {
        filedata.push(data);
        if (typeof progressCallback === "function") {
          progressCallback(progress);
        }
      },
      function() {
        if (typeof completeCallback === "function") {
          completeCallback(filedata);
        }
      }
    );
  }

  /**
   * Reformats data to be valid before placement into the store
   *  and warns anything that's not
   */
  validateData(filedata) {
    // replace spaces with _
    filedata[0] = formulas.cleanStringArray(filedata[0]);

    // rename duplicate headers
    let columnHeaders = [];
    for (let c = 0; c < filedata[0].length; c++) {
      let idx = columnHeaders.indexOf(filedata[0][c]);
      if (idx !== -1) {
        console.warn(
          "File Parse CSV - Found a duplicate column: " + filedata[0][c]
        );
        filedata[0][c] += "_DUPLICATE";
      }
      columnHeaders.push(filedata[0][c]);
    }

    // remove empty columns
    for (let c = filedata[0].length - 1; c > 0; c--) {
      if (filedata[0][c].length === 0) {
        console.warn("File Parse CSV - Found an empty column: " + c);
        for (let r = 0; r < filedata.length; r++) {
          filedata[r].splice(c, 1);
        }
      }
    }

    return filedata;
  }

  //UI Pieces

  drop_handler(e) {
    e.preventDefault();
    // If dropped items aren't files, reject them
    this.vars.e = e;
    var dt = e.dataTransfer;
    if (dt.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (let i = 0; i < dt.items.length; i++) {
        if (dt.items[i].kind === "file") {
          var f = dt.items[i].getAsFile();
          this.setState({ fileToUpload: f, isUploading: false });
        }
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      for (let i = 0; i < dt.files.length; i++) {
        this.setState({ fileToUpload: dt.files[i], isUploading: false });
      }
    }
  }
  dragover_handler(e) {
    // Prevent default select and drag behavior
    e.preventDefault();
  }
  dragend_handler(e) {
    // Remove all of the drag data
    this.vars.e = e;
    var dt = e.dataTransfer;
    if (dt.items) {
      // Use DataTransferItemList interface to remove the drag data
      for (var i = 0; i < dt.items.length; i++) {
        dt.items.remove(i);
      }
    } else {
      // Use DataTransfer interface to remove the drag data
      e.dataTransfer.clearData();
    }
  }
  browseChange(e) {
    this.vars.etf = e.target.files;
    this.vars.fileToUpload = e.target.files[0];
    this.setState({ fileToUpload: e.target.files[0], isUploading: false });
    this.uploadClick();
  }
  uploadClick(e) {
    this.props.setProgress(0);
    var that = this;
    if (this.vars.fileToUpload !== null) {
      //Client Version
      this.uploadLocalData(
        this.vars.fileToUpload,
        "csv",
        function(progress) {
          that.props.setProgress(progress);
        },
        function() {
          that.props.completedLoad();
          that.setState({ fileToUpload: null });
        }
      );

      //Server Version
      workerUpload.postMessage({
        files: this.vars.etf,
        NODE_ENV: process.env.NODE_ENV
      });
    }
  }

  render() {
    return (
      <div className="Import">
        <div id="container">
          <div id="inputfilebutton">
            Import
            <div
              id="dropzone"
              onDrop={e => this.drop_handler(e)}
              onDragOver={e => this.dragover_handler(e)}
              onDragEnd={e => this.dragend_handler(e)}
            >
              <input
                id="inputfile"
                multiple="true"
                name="files[]"
                type="file"
                onChange={e => this.browseChange(e)}
              />
              <div id="filetoupload">
                {this.state.fileToUpload ? this.state.fileToUpload.name : ""}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// redux store
const mapStateToProps = state => {
  const domain = state.get("data");
  return {
    data: domain.get("data")
  };
};
const mapDispatchToProps = dispatch => ({
  fileLoad: (data, name) => dispatch(fileLoad(data, name))
});

export { Import };
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Import);
