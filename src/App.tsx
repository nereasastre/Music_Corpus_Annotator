import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import {
  cleanAllBoxes,
  cleanBox,
  cleanSelectBoxes,
  initLocalStorageToNone,
  renderBoundingBoxes,
  renderBoxAndContinue,
  renderBoxesFromLocalStorage
} from "./boundingBoxes";
import {colorToDifficulty, IAppState, keyToColor, mousePosition} from "./utils";
import OpenSheetMusicDisplay from "./lib/OpenSheetMusicDisplay";


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

const firstFile = "craig_files/beethoven-piano-sonatas-master/kern/sonata01-2.musicxml";
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
    this.divRef = React.createRef();
    this.color = selectColor;
    this.hideBoundingBoxes = false;
    document.addEventListener("keydown", (event) => this.handleKeyDown(event));
    document.addEventListener("mousedown", (event) => this.handleMouseDown(event));

  }

  async initOSMD() {
    console.log("initOSMD with state file:", this.state.file)
    this.osmd = this.divRef.current.osmd;

    // wait for osmd.GraphicSheet to not be undefined
    let iteration = 0;
    while (this.osmd.GraphicSheet === undefined  && iteration < 1000) {
      await new Promise(r => setTimeout(r, 100));
      iteration += 1;
      console.log("Waiting for osmd to load...")
    }

    this.measureList = this.osmd.GraphicSheet.measureList;
    this.lastMeasureNumber = this.measureList[this.measureList.length - 1][0].MeasureNumber;
    this.firstMeasureNumber = this.measureList[0][0].MeasureNumber;
    this.currentBox = this.firstMeasureNumber;

    let highlightedBoxes = JSON.parse(window.localStorage.getItem(this.state.file) as string);

    if (!highlightedBoxes) {
      initLocalStorageToNone(this.measureList, this.state.file);
    }

    this.currentBox = renderBoxesFromLocalStorage(this.measureList, this.state.file);
    renderBoundingBoxes([this.currentBox], selectColor, this.measureList, this.state.file);

    // re-render in case of resize
    let measureList = this.measureList;
    let scoreName = this.state.file;

    window.onresize = async function () {
      await new Promise(r => setTimeout(r, 2000)); // wait for osmd to load
      cleanAllBoxes();
      let currentBox = renderBoxesFromLocalStorage(measureList, scoreName)
      renderBoundingBoxes([currentBox], selectColor, measureList, scoreName);

    };
  };

  public state: IAppState = {
    file: ""
  }


  async componentDidMount() {
    console.log("componentDidMount called")
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

    let highlightedBoxes = JSON.parse(window.localStorage.getItem(this.state.file) as string);
    let initPos = mousePosition(eventDown);  // find initial position
    const maxDist = { x: 5, y: 5 };

    let initNearestNote = this.osmd.graphic.GetNearestNote(initPos, maxDist);
    let initMeasure = initNearestNote.sourceNote.SourceMeasure.MeasureNumber;  // measure where closest note is

    onmouseup = (eventUp) => {
      if (this.color === "#b7bbbd" || !eventUp.shiftKey) {
        return
      }

      let finalPos = mousePosition(eventUp);
      // let finalNearestNote = musicSheet.GraphicSheet.GetNearestNote(
      let finalNearestNote = this.osmd.GraphicSheet.GetNearestNote(finalPos, maxDist);
      let finalMeasure = finalNearestNote.sourceNote.SourceMeasure.MeasureNumber;

      // if selection is from right to left, swap initial and final
      if (finalMeasure < initMeasure) {
        const previousFinalMeasure = finalMeasure;
        finalMeasure = initMeasure;
        initMeasure = previousFinalMeasure;
      }
      this.currentBox = finalMeasure;
      for (let measure = initMeasure; measure < finalMeasure + 1; measure++) {
        // @ts-ignore
        if (highlightedBoxes[measure] !== colorToDifficulty[this.color]) {
          cleanBox(measure, this.state.file);
          renderBoundingBoxes([measure], this.color, this.measureList, this.state.file);
        }
      }

      this.currentBox += 1;

      renderBoundingBoxes([this.currentBox], selectColor, this.measureList, this.state.file);
    };
  }

  selectPreviousBox() {
    cleanSelectBoxes();
    this.currentBox -= 1;
    if (this.currentBox <= this.firstMeasureNumber) {
      this.currentBox = this.firstMeasureNumber;
    }
    renderBoundingBoxes([this.currentBox], selectColor, this.measureList, this.state.file);
  };

  selectNextBox() {
    cleanSelectBoxes();
    this.currentBox += 1;

    if (this.currentBox >= this.lastMeasureNumber) {
      this.currentBox = this.lastMeasureNumber;
    }
    renderBoundingBoxes([this.currentBox], selectColor, this.measureList, this.state.file);

  };

  handleKeyDown(event: KeyboardEvent) {
    this.lastMeasureNumber = this.measureList[this.measureList.length - 1][0].MeasureNumber;
    if (event.code === "ArrowLeft") {
      if (this.currentBox > 0) {
        this.selectPreviousBox();
        this.hideBoundingBoxes = false;
      }
    }
    else if (event.code === "ArrowRight") {
      if (this.currentBox < this.lastMeasureNumber) {
        this.selectNextBox();
        this.hideBoundingBoxes = false;

      }
    }
    else if (event.code === "Escape") {
      this.currentBox = this.firstMeasureNumber;
      cleanAllBoxes();
      initLocalStorageToNone(this.measureList, this.state.file);

    }
    else if (event.code === "Backspace") {
      cleanBox(this.currentBox, this.state.file);
      if (this.currentBox > this.firstMeasureNumber) {
        cleanSelectBoxes();
        this.currentBox -= 1;
      } else {
        this.currentBox = this.firstMeasureNumber;
      }
      renderBoundingBoxes([this.currentBox], selectColor, this.measureList, this.state.file); // render select box
    }
    else if (event.code === "Digit1" || event.code === "Digit2" || event.code === "Digit3"
    || event.code === "Numpad1" || event.code === "Numpad2" || event.code === "Numpad3") {
      let difficulty = event.code[event.code.length -1]; // last char is difficulty
      // @ts-ignore
      this.color = keyToColor[difficulty];
      if (this.currentBox <= this.lastMeasureNumber && !event.shiftKey) {
        this.currentBox = renderBoxAndContinue(this.currentBox, this.color, this.measureList, this.state.file);
      }
    }

    else if (event.code === "KeyH") {
      this.hideBoundingBoxes = !this.hideBoundingBoxes;
      if (this.hideBoundingBoxes) {
        cleanSelectBoxes();
      } else {
        renderBoundingBoxes([this.currentBox], selectColor, this.measureList, this.state.file)
      }
    }
  }

  public saveToJson = () => {
    let highlightedBoxes = JSON.parse(window.localStorage.getItem(this.state.file) as string);
    console.log("saveToJson has been called")
    console.log("saveToJson Highlighted boxes", highlightedBoxes);
    console.log("saveToJson state file: ", this.state.file);

    eel.save_to_json(this.state.file, highlightedBoxes);
  }

  public selectNextFile = () => {
    console.log("selectNextFile has been called")
    console.log("selectNextFile state.file before calling eel", this.state.file)
    this.saveToJson();
    eel.pick_next_file(this.state.file)((file: string) => this.setState({ file }))

    console.log("selectNextFile state.file after calling eel", this.state.file)
    this.osmd = this.divRef.current.osmd;
    this.currentBox = this.firstMeasureNumber;
    this.measureList = this.osmd.graphic.measureList;

  }

  public selectPreviousFile = () => {
    console.log("selectPreviousFile has been called")
    console.log("selectPreviousFile state.file before calling eel", this.state.file)
    this.saveToJson();
    eel.pick_previous_file(this.state.file)((file: string) => this.setState({ file }))

    console.log("selectPreviousFile state.file after calling eel", this.state.file)
    this.osmd = this.divRef.current.osmd;
    this.currentBox = this.firstMeasureNumber;
    this.measureList = this.osmd.graphic.measureList;

  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Music Sheet Annotator</h1>

        </header>
        {/*
                        <select onChange={this.handleClick.bind(this)}>

               <option value="MuzioClementi_SonatinaOpus36No1_Part2.xml">Muzio Clementi: Sonatina Opus 36 No1 Part2</option>
          <option value="Beethoven_AnDieFerneGeliebte.xml">Beethoven: An Die Ferne Geliebte</option>
          <option value="064-1a-BH-001.musicxml">F. Chopin: Valse No. 1</option>
          <option value="064-1a-BH-002.musicxml">F. Chopin: Valse No. 2</option>
          <option value="064-1a-BH-003.musicxml">F. Chopin: Valse No. 3</option>
          <option value="070-1-Sam-001.musicxml">F. Chopin: 070-1-Sam-001</option>
          <option value="070-1-Sam-002.musicxml">F. Chopin: 070-1-Sam-002</option>
          <option value="070-1-Sam-003.musicxml">F. Chopin: 070-1-Sam-003</option>


        </select>
        */

        }

        <button className='App-button' onClick={this.saveToJson}>Save</button>
        <button className='App-button' disabled={this.state.file === firstFile} onClick={this.selectPreviousFile}>Previous</button>
        <button className='App-button' disabled={this.state.file === lastFile} onClick={this.selectNextFile}>Next</button>


        <div id="music-sheet" >


        </div>
        <OpenSheetMusicDisplay file={this.state.file} ref={this.divRef} />
      </div>
    );
  }
}

export default App;
