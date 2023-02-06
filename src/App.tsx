import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import {
  cleanAllBoxes,
  cleanSelectBoxes,
  deleteBoxAndGoBack,
  initLocalStorageToNone,
  renderBoundingBoxes,
  renderBoxAndContinue,
  renderBoxesFromLocalStorage
} from "./boundingBoxes";
import {contains, IAppState, keyToColor, max, min, mousePosition, range} from "./utils";
// import OpenSheetMusicDisplay from "./lib/OpenSheetMusicDisplay";
import {OpenSheetMusicDisplay, PointF2D} from "opensheetmusicdisplay";


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

const firstFile = "craig_files/beethoven-piano-sonatas-master/kern/sonata01-1.musicxml";
const lastFile = "xmander_files/5028687.musicxml";
const  selectColor = "#b7bbbd";


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


  public constructor(props: any) {
    super(props);
    console.log("CONSTRUCTOR CALLED");

    // Don't call this.setState() here!
    this.state.file = firstFile;
    this.color = selectColor;
    this.hideBoundingBoxes = false;
    document.addEventListener("keydown", (event) => this.handleKeyDown(event));
    document.addEventListener("mousedown", (event) => this.handleMouseDown(event));

  }

  async initOSMD() {
    console.log("initOSMD with state file:", this.state.file)
    await this.osmd.load(this.state.file);
    await this.osmd.render();

    this.measureList = this.osmd.GraphicSheet.measureList;
    console.log(this.measureList);
    this.lastMeasureNumber = this.measureList[this.measureList.length - 1][0].MeasureNumber;
    this.firstMeasureNumber = this.measureList[0][0].MeasureNumber;
    let annotations = JSON.parse(window.localStorage.getItem(this.state.file) as string);

    if (!annotations) {
      this.currentBox = this.firstMeasureNumber;
      initLocalStorageToNone(this.measureList, this.state.file);
    } else {
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

  handleClick(event: any) {
    // @ts-ignore
    const file = event.target.value;
    // this.setState(state => state.file = file);
    this.setState({ file: file });
    this.osmd = this.divRef.current.osmd;
    this.currentBox = this.firstMeasureNumber;
    this.measureList = this.osmd.graphic.measureList;
  }

  handleMouseDown(eventDown: MouseEvent) {
    // If not pressing shift key, do not do anything
    if (!eventDown.shiftKey || this.color === "#b7bbbd") {
      return
    }
    cleanSelectBoxes();

    let initPos = mousePosition(eventDown);  // find initial position
    const maxDist = new PointF2D(5, 5);

    let initNearestNote = this.osmd.graphic.GetNearestNote(initPos, maxDist);
    let initMeasure = initNearestNote.sourceNote.SourceMeasure.MeasureNumber;  // measure where closest note is

    onmouseup = (eventUp) => {
      if (this.color === "#b7bbbd" || !eventUp.shiftKey) {  // if not pressing shift key, return
        return
      }

      let finalPos = mousePosition(eventUp);
      let finalNearestNote = this.osmd.GraphicSheet.GetNearestNote(finalPos, maxDist);
      let finalMeasure = finalNearestNote.sourceNote.SourceMeasure.MeasureNumber;

      // if selection is from right to left, swap initial and final
      if (finalMeasure < initMeasure) {
        const previousFinalMeasure = finalMeasure;
        finalMeasure = initMeasure;
        initMeasure = previousFinalMeasure;
      }
      renderBoundingBoxes(range(initMeasure, finalMeasure), this.color, this.measureList, this.state.file);
      this.currentBox = finalMeasure + 1;
      renderBoundingBoxes([this.currentBox], selectColor, this.measureList, this.state.file);
    };
  }

  selectPreviousBox() {
    cleanSelectBoxes();
    this.hideBoundingBoxes = false;
    this.currentBox = max(this.firstMeasureNumber, this.currentBox - 1)

    renderBoundingBoxes([this.currentBox], selectColor, this.measureList, this.state.file);
  };

  selectNextBox() {
    cleanSelectBoxes();
    this.hideBoundingBoxes = false;
    this.currentBox = min(this.currentBox + 1, this.lastMeasureNumber);
    renderBoundingBoxes([this.currentBox], selectColor, this.measureList, this.state.file);
  };

  hideBoxes() {
    this.hideBoundingBoxes = !this.hideBoundingBoxes;
    if (this.hideBoundingBoxes) {
      cleanSelectBoxes();
    } else {
      renderBoundingBoxes([this.currentBox], selectColor, this.measureList, this.state.file)
    }
  }

  clear() {
    this.currentBox = this.firstMeasureNumber;
    cleanAllBoxes();
    initLocalStorageToNone(this.measureList, this.state.file);
  }

  annotate(event: KeyboardEvent) {
    let difficulty = event.code[event.code.length -1]; // last char is difficulty
    // @ts-ignore
    this.color = keyToColor[difficulty];
    if (!event.shiftKey) {
      this.currentBox = renderBoxAndContinue(this.currentBox, this.color, this.measureList, this.state.file);
    }
  }

  public saveToJson = () => {
    let annotations = JSON.parse(window.localStorage.getItem(this.state.file) as string);
    console.log("saveToJson has been called")
    console.log("saveToJson state file: ", this.state.file);
    eel.save_to_json(this.state.file, annotations);
  }

   selectNextFile = async () => {
     console.log("selectNextFile has been called")
     console.log("selectNextFile state.file before calling eel", this.state.file)
     this.saveToJson();
     eel.pick_next_file(this.state.file)((file: string) => this.setState({file}))

     console.log("selectNextFile state.file after calling eel", this.state.file)
     await this.initOSMD();

   }

  public selectPreviousFile = async () => {
    console.log("selectPreviousFile has been called")
    console.log("selectPreviousFile state.file before calling eel", this.state.file)
    this.saveToJson();
    eel.pick_previous_file(this.state.file)((file: string) => this.setState({ file }))

    console.log("selectPreviousFile state.file after calling eel", this.state.file)
    await this.initOSMD();


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
        this.annotate(event);
      }
      else if (keyCode === "KeyH") {
        this.hideBoxes();
      }
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Music Sheet Annotator</h1>

        </header>
        <button className='App-button' onClick={this.saveToJson}>Save</button>
        <button className='App-button' disabled={this.state.file === firstFile} onClick={this.selectPreviousFile}>Previous</button>
        <button className='App-button' disabled={this.state.file === lastFile} onClick={this.selectNextFile}>Next</button>

        <div id="score"/>
      </div>
    );
  }
}

export default App;
