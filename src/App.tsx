import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import {
  cleanAllBoxes,
  cleanSelectBoxes,
  deleteBoxAndGoBack,
  renderBoundingBoxesMeasures, renderBoundingBoxesAndAnnotate, renderBoundingBoxesFromCoords,
  renderBoxAndContinue,
  renderBoxesFromLocalStorage
} from "./boundingBoxes";
import {
  contains,
  firstFile,
  IAppState,
  keyToColor,
  lastFile,
  markCorrupted,
  max,
  min, MouseData,
  mousePosition,
  range,
  recordAnnotationTime,
  selectColor
} from "./utils";
// import OpenSheetMusicDisplay from "./lib/OpenSheetMusicDisplay";
import {OpenSheetMusicDisplay, PointF2D} from "opensheetmusicdisplay";
import {initIrregularBoxes, initLocalStorageToNone} from "./annotations";


// Point Eel web socket to the instance
export const eel = window.eel
eel.set_host('ws://localhost:8080')

// Expose the `sayHelloJS` function to Python as `say_hello_js`
function sayHelloJS(x: any) {
  console.log('Hello from ' + x)
}
// WARN: must use window.eel to keep parse-able eel.expose{...}
window.eel.expose(sayHelloJS, 'say_hello_js')

// Test anonymous function when minimized. See https://github.com/samuelhwilliams/Eel/issues/363
function show_log(msg: string) {
  console.log(msg)
}
window.eel.expose(show_log, 'show_log')

// Test calling sayHelloJS, then call the corresponding Python function
sayHelloJS('Javascript World!')
eel.say_hello_py('Javascript World!')


export class App extends Component<{}, {

}> {
  divRef: any;
  color: string;
  hideBoundingBoxes: boolean;
  osmd: any;
  measureList: any;
  lastMeasureNumber: any;
  firstMeasureNumber: any;
  currentBox: any;
  cursor: any


  // @ts-ignore
  private currentNote: number;
  public constructor(props: any) {
    super(props);
    console.log("Constructor called");
    this.color = selectColor;
    this.hideBoundingBoxes = false;
    document.addEventListener("keydown", (event) => this.handleKeyDown(event));
    document.addEventListener("mousedown", (event) => this.handleMouseDown(event));
    window.addEventListener("beforeunload", (event) => this.saveToJson());
    this.getLastAnnotated();
  }

  async getLastAnnotated() {
    await eel.pick_last_annotated()((file: string) => this.setState({file}))
    console.log("Getting last annotated file: ", this.state.file)
  }


  async initOSMD() {
    console.log("initOSMD with state file:", this.state.file)
    this.currentNote = 0
    await this.osmd.load(this.state.file);
    await this.osmd.render();

    this.osmd.cursor.iterator.currentMeasureIndex = this.currentBox;
    this.measureList = this.osmd.GraphicSheet.measureList;
    this.lastMeasureNumber = this.measureList[this.measureList.length - 1][0].MeasureNumber;
    this.firstMeasureNumber = this.measureList[0][0].MeasureNumber;
    let irregularBoxes = JSON.parse(window.localStorage.getItem("irregularBoxes_".concat(this.state.file)) as string);

    if (!irregularBoxes) {
      initIrregularBoxes(this.state.file)
    }

    let annotations = JSON.parse(window.localStorage.getItem(this.state.file) as string);

    if (!annotations) {
      this.currentBox = this.firstMeasureNumber;
      initLocalStorageToNone(this.measureList, this.state.file);

    } else {
      annotations["startTime"] = Date.now();
      window.localStorage.setItem(this.state.file, JSON.stringify(annotations));
      this.currentBox = renderBoxesFromLocalStorage(this.measureList, this.state.file);
    }

    // re-render in case of resize
    let measureList = this.measureList;
    let scoreName = this.state.file;

    window.onresize = async function () {
      await new Promise(r => setTimeout(r, 1000)); // wait for osmd to load
      cleanAllBoxes();
      renderBoxesFromLocalStorage(measureList, scoreName)

    };
  };

  public state: IAppState = {
    file: ""
  }


  async componentDidMount() {
    console.log("componentDidMount called")
    var container = document.getElementById("score");
    // @ts-ignore
    this.osmd = new OpenSheetMusicDisplay(container);
    await this.initOSMD();
  }

  async componentDidUpdate() {
    console.log("componentDidUpdate called");
    await this.initOSMD();
  }

  handleMouseDown(eventDown: MouseEvent) {
    // If not pressing shift key, do not do anything
    if ((!eventDown.shiftKey && !eventDown.altKey) || this.color === "#b7bbbd") {
      return
    }
    cleanSelectBoxes();

    let initPos = mousePosition(eventDown);  // find initial position
    console.log("INITI POSTIION: ", initPos)
    const maxDist = new PointF2D(5, 5);

    let initNearestNote = this.osmd.GraphicSheet.GetNearestNote(initPos, maxDist);  // nearest note at start
    if (initNearestNote === undefined){
      return
    }
    let initMeasure = initNearestNote.sourceNote.SourceMeasure.MeasureNumber;  // measure where closest note is

    onmouseup = (eventUp) => {
    if ((!eventDown.shiftKey && !eventDown.altKey) || this.color === "#b7bbbd") {
      return
    }

      let finalPos = mousePosition(eventUp);
      console.log("FINAL POSTIION: ", finalPos)

      let finalNearestNote = this.osmd.GraphicSheet.GetNearestNote(finalPos, maxDist);
      if (finalNearestNote === undefined){
      return
      }
      let finalMeasure = finalNearestNote.sourceNote.SourceMeasure.MeasureNumber;

      // if selection is from right to left, swap initial and final
      if (finalMeasure < initMeasure) {
        const previousFinalMeasure = finalMeasure;
        finalMeasure = initMeasure;
        initMeasure = previousFinalMeasure;
      }
      if (eventUp.shiftKey) {
        renderBoundingBoxesAndAnnotate(range(initMeasure, finalMeasure), this.color, this.measureList, this.state.file);
        this.currentBox = min(finalMeasure + 1, this.lastMeasureNumber);
        renderBoundingBoxesMeasures([this.currentBox], selectColor, this.measureList, this.state.file);
      } else if (eventUp.altKey){
        const initData: MouseData = {
          pos: initPos,
          nearestNote: initNearestNote,
          measure: initMeasure
          }

        const finalData: MouseData = {
          pos: finalPos,
          nearestNote: finalNearestNote,
          measure: finalMeasure
          }
          renderBoundingBoxesFromCoords(initData, finalData, this.color, this.measureList, this.state.file)
      }
    };
  }

  selectPreviousBox() {
    cleanSelectBoxes();
    this.hideBoundingBoxes = false;
    this.currentBox = max(this.firstMeasureNumber, this.currentBox - 1)

    renderBoundingBoxesMeasures([this.currentBox], selectColor, this.measureList, this.state.file);
  };

  selectNextBox() {
    cleanSelectBoxes();
    this.hideBoundingBoxes = false;
    this.currentBox = min(this.currentBox + 1, this.lastMeasureNumber);
    renderBoundingBoxesMeasures([this.currentBox], selectColor, this.measureList, this.state.file);
  };

  hideBoxes() {
    this.hideBoundingBoxes = !this.hideBoundingBoxes;
    if (this.hideBoundingBoxes) {
      cleanSelectBoxes();
    } else {
      renderBoundingBoxesMeasures([this.currentBox], selectColor, this.measureList, this.state.file)
    }
  }

  clear() {
    this.currentBox = this.firstMeasureNumber;
    cleanAllBoxes();
    initLocalStorageToNone(this.measureList, this.state.file);
  }

  annotateMeasure = async (event: KeyboardEvent) => {
    let difficulty = event.code[event.code.length -1]; // last char is difficulty
    // @ts-ignore
    this.color = keyToColor[difficulty];
    if (!event.shiftKey && !event.altKey) {
      this.currentBox = renderBoxAndContinue(this.currentBox, this.color, this.measureList, this.state.file);
    }
  }

  annotateSingleNote() {
    console.log("CURRENT COLOR", this.color)
    this.osmd.cursor.iterator.currentMeasureIndex = this.currentBox;
    this.osmd.cursor.show()
    this.osmd.cursor.cursorOptions.color = "#FF4633";
    this.osmd.cursor.iterator.currentMeasureIndex = this.currentBox;
    // this.osmd.cursor.show()

    // renderBoxNote(this.currentBox, "#FF4633", this.osmd, this.state.file, this.currentNote)
    this.currentNote = min(this.measureList[this.currentBox][0].staffEntries.length - 1 , this.currentNote + 1)
    this.osmd.cursor.next();
    console.log(this.osmd.cursor)


  }

  public saveToJson = () => {
    recordAnnotationTime(this.state.file);
    let annotations = JSON.parse(window.localStorage.getItem(this.state.file) as string);
    let annotationsToSave = annotations;

    // do not save the following fields to .json
    // @ts-ignore
    delete annotationsToSave["startTime"]
    delete annotationsToSave["isCorrupted"]

    console.log("Saving annotations to json...")
    if (!annotations["isCorrupted"]) {
      eel.save_to_json(this.state.file, annotationsToSave);
    } else {
      eel.save_to_json(this.state.file, "corrupted file");
    }
  }

   selectNextFile = async () => {
     console.log("Rendering next file...")
     this.saveToJson();
     eel.pick_next_file(this.state.file)((file: string) => this.setState({file}))

     await this.initOSMD();

   }

  public selectPreviousFile = async () => {
    console.log("Rendering previous file...")
    this.saveToJson();
    eel.pick_previous_file(this.state.file)((file: string) => this.setState({ file }))

    await this.initOSMD();


  }
  public markAnnotated = async () => {

  }

    handleKeyDown(event: KeyboardEvent) {
      this.lastMeasureNumber = this.measureList[this.measureList.length - 1][0].MeasureNumber;
      let annotation_keycodes = ["Digit1", "Digit2", "Digit3", "Numpad1", "Numpad2", "Numpad3"];
      let keyCode = event.code;

      if (keyCode === "ArrowLeft") {
        this.selectPreviousBox();
      }
      else if (keyCode === "ArrowRight") {
          this.selectNextBox();
      }
      else if (keyCode === "Escape") {
        this.clear();
      }
      else if (keyCode === "Backspace") {
        this.currentBox = deleteBoxAndGoBack(this.currentBox, this.measureList, this.state.file);

      }
      else if (contains(annotation_keycodes, keyCode)) {  // if event.code is in annotations_folder
        this.annotateMeasure(event);
      }
      else if (keyCode === "KeyH") {
        this.hideBoxes();
      }
      else if (keyCode === "KeyN") {
        console.log("CURSOR", this.osmd.cursor)
        this.annotateSingleNote();
      }
      else if (keyCode ==="Delete" && event.ctrlKey){
        markCorrupted(this.state.file);
      }
  }

  render() {
    return (
      <div className="App">
        <header className="header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1>Music Corpus Annotator</h1>

        </header>
        <p>You are annotating: {this.state.file}</p>
        <button className='App-button' onClick={this.saveToJson}>Save</button>
        <button className='App-button' disabled={this.state.file === firstFile} onClick={this.selectPreviousFile}>Previous</button>
        <button className='App-button' disabled={this.state.file === lastFile} onClick={this.selectNextFile}>Next</button>
        <div id="score"/>
      </div>
    );
  }
}

export default App;
