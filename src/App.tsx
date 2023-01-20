import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import {
    cleanAllBoxes,
    cleanBox, cleanSelectBoxes,
    initLocalStorageToNone,
    renderBoundingBoxes, renderBoxAndContinue,
    renderBoxesFromLocalStorage
} from "./boundingBoxes";
import {colorToDifficulty, keyToColor, mousePosition} from "./utils";
import OpenSheetMusicDisplay from "./lib/OpenSheetMusicDisplay";



// Point Eel web socket to the instance
export const eel = window.eel
eel.set_host( 'ws://localhost:8080' )

// Expose the `sayHelloJS` function to Python as `say_hello_js`
function sayHelloJS( x: any ) {
  console.log( 'Hello from ' + x )
}
// WARN: must use window.eel to keep parse-able eel.expose{...}
window.eel.expose( sayHelloJS, 'say_hello_js' )

// Test anonymous function when minimized. See https://github.com/samuelhwilliams/Eel/issues/363
function show_log(msg:string) {
  console.log(msg)
}
window.eel.expose(show_log, 'show_log')

// Test calling sayHelloJS, then call the corresponding Python function
sayHelloJS( 'Javascript World!' )
eel.say_hello_py( 'Javascript World!' )

// Set the default path. Would be a text input, but this is a basic example after all
const defPath = '~'
interface IAppState {
  file: string;
  path: string
}

export class App extends Component <{}, {

}> {
  divRef: any;
  selectColor: string;
  color: string;
  hideBoundingBoxes: boolean;
  osmd: any;
  measureList: any;
  lastMeasureNumber: any;
  firstMeasureNumber: any;
  currentBox: any;
  highlightedBoxes: any;


  public constructor(props: any) {
    super(props);
    console.log("CONSTRUCTOR CALLED");

    // Don't call this.setState() here!
    this.state.file = "MuzioClementi_SonatinaOpus36No1_Part2.xml";
    //this.state.file = "craig_files/beethoven-piano-sonatas-master/kern/sonata01-2.musicxml"
    this.divRef = React.createRef();
    this.selectColor = "#b7bbbd";
    this.color = "#b7bbbd";
    this.hideBoundingBoxes = false;
    document.addEventListener("keydown", (event) => this.handleKeyDown(event));
    document.addEventListener("mousedown", (event) => this.handleMouseDown(event));

  }

    async initOSMD(){
        console.log("initOSMD state file:", this.state.file)
        this.osmd = this.divRef.current.osmd;
        await new Promise(r => setTimeout(r, 2000)); // wait for osmd to load

        this.measureList = this.osmd.GraphicSheet.measureList;
        this.lastMeasureNumber = this.measureList[this.measureList.length - 1][0].MeasureNumber;
        this.firstMeasureNumber = this.measureList[0][0].MeasureNumber;
        this.currentBox = this.firstMeasureNumber;

        this.highlightedBoxes = JSON.parse(window.localStorage.getItem(this.state.file) as string);
        if (!this.highlightedBoxes){
           this.highlightedBoxes = initLocalStorageToNone(this.firstMeasureNumber, this.lastMeasureNumber, this.state.file);
        }

        this.currentBox = renderBoxesFromLocalStorage(this.measureList, this.state.file);
        renderBoundingBoxes([this.currentBox], this.selectColor, this.measureList, this.state.file);

        // re-render in case of resize
        let measureList  = this.measureList;
        let scoreName = this.state.file;
        let currentBox = this.currentBox;
        let selectColor = this.selectColor;

        window.onresize = async function(){
          await new Promise(r => setTimeout(r, 2000)); // wait for osmd to load
          cleanAllBoxes();
          renderBoxesFromLocalStorage(measureList, scoreName)
          renderBoundingBoxes([currentBox], selectColor, measureList,scoreName);

        };
    };


    async componentDidMount() {
    await this.initOSMD();
    console.log("componentDidMount called")
  }

  async componentDidUpdate() {
        console.log("componentDidUpdate called");

     await this.initOSMD();
  }

  handleClick(event: any) {
      // @ts-ignore
    const file = event.target.value;
  // this.setState(state => state.file = file);
    this.setState({file: file});
    this.osmd = this.divRef.current.osmd;
    this.currentBox = this.firstMeasureNumber;
    this.measureList = this.osmd.graphic.measureList;
}
 handleMouseDown(eventDown: MouseEvent){
    if (!eventDown.shiftKey || this.color === "#b7bbbd"){
      return
    }
    cleanSelectBoxes();

    //let highlightedBoxes = JSON.parse(window.localStorage.getItem(scoreName) as string);
    let initPos = mousePosition(eventDown);
    const maxDist = {x: 5, y: 5};

    let initNearestNote = this.osmd.graphic.GetNearestNote(initPos, maxDist);
    let initMeasure = initNearestNote.sourceNote.SourceMeasure.MeasureNumber;

    onmouseup = (eventUp) => {
      if (this.color === "#b7bbbd" || !eventUp.shiftKey) {
        return
      }

      let finalPos = mousePosition(eventUp);
      // let finalNearestNote = musicSheet.GraphicSheet.GetNearestNote(
      let finalNearestNote = this.osmd.GraphicSheet.GetNearestNote(finalPos, maxDist);

      let finalMeasure = finalNearestNote.sourceNote.SourceMeasure.MeasureNumber;

      if (finalMeasure < initMeasure) {  // if selection is from right to left, swap init and final
        const previousFinalMeasure = finalMeasure;
        finalMeasure = initMeasure;
        initMeasure = previousFinalMeasure;
      }
      this.currentBox = finalMeasure;
      for (let measure = initMeasure; measure < finalMeasure + 1; measure++) {
        // @ts-ignore
        if (this.highlightedBoxes[measure] !== colorToDifficulty[this.color]) {
          cleanBox(measure, this.state.file);
          renderBoundingBoxes([measure], this.color, this.measureList, this.state.file);
        }
      }

      this.currentBox += 1;

      renderBoundingBoxes([this.currentBox], this.selectColor, this.measureList, this.state.file);
    };
  }

  selectPreviousBox() {
    this.color = this.selectColor;
    cleanSelectBoxes();
    this.currentBox -= 1;
    console.log("Current box: ", this.currentBox);
    if (this.currentBox <= 1) {
      this.currentBox = 1;
    }
    renderBoundingBoxes([this.currentBox], this.color, this.measureList, this.state.file);
  };

    selectNextBox() {
    this.color = this.selectColor;
    cleanSelectBoxes();
    this.currentBox += 1;
    console.log("Current box: ", this.currentBox);
    renderBoundingBoxes([this.currentBox], this.color, this.measureList, this.state.file);

    if (this.currentBox >= this.lastMeasureNumber) {
      this.currentBox = this.lastMeasureNumber;
    }
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
    else if (event.code === "Escape"){
      this.currentBox = this.firstMeasureNumber;
      cleanAllBoxes();
      this.color = this.selectColor;
      initLocalStorageToNone(this.firstMeasureNumber, this.measureList.length, this.state.file);
      renderBoundingBoxes([this.currentBox], this.selectColor, this.measureList, this.state.file); // render select box

    }
    else if (event.code === "Backspace"){
      cleanBox(this.currentBox, this.state.file);
      if (this.currentBox > this.firstMeasureNumber){
        cleanSelectBoxes();
        this.currentBox -= 1;
      } else {
        this.currentBox = this.firstMeasureNumber;
      }
      renderBoundingBoxes([this.currentBox], this.selectColor, this.measureList, this.state.file); // render select box
  }
  else if (event.code === "Digit1" || event.code === "Numpad1"){
    this.color = keyToColor["1"];
    if (this.currentBox <= this.lastMeasureNumber && !event.shiftKey){
      this.currentBox = renderBoxAndContinue(this.currentBox, this.color, this.measureList, this.state.file);
    }
  }
  else if (event.code === "Digit2" || event.code === "Numpad2"){
    this.color = keyToColor["2"];
    if (this.currentBox <= this.lastMeasureNumber && !event.shiftKey){
      this.currentBox = renderBoxAndContinue(this.currentBox, this.color, this.measureList, this.state.file);
    }
  }
  else if (event.code === "Digit3" || event.code === "Numpad3"){
    this.color = keyToColor["3"];
    if (this.currentBox <= this.lastMeasureNumber && !event.shiftKey){
      this.currentBox = renderBoxAndContinue(this.currentBox, this.color, this.measureList, this.state.file);
    }
  }
  else if (event.code === "KeyH"){
    this.hideBoundingBoxes = !this.hideBoundingBoxes;
    if (this.hideBoundingBoxes) {
      cleanSelectBoxes();
    } else {
      renderBoundingBoxes([this.currentBox], this.selectColor, this.measureList, this.state.file)
    }
  }
}


  public state: IAppState = {
   path: defPath,
   file:  ""
  }

  public pickFile = () => {
       console.log("pickFile() has been called")
    let file = this.state.file;
    eel.pick_file(defPath)(( message: string ) => this.setState( { message } ) )
    eel.save_to_json(file, this.highlightedBoxes);

  }

  public saveToJson = () => {
       console.log("saveToJson has been called")
       console.log("saveToJson Highlighted boxes", this.highlightedBoxes);
       console.log("saveToJson state file: ", this.state.file);
       eel.save_to_json(this.state.file, this.highlightedBoxes);
  }

  public selectNextFile = () => {
       console.log("selectNextFile has been called")
       console.log("selectNextFile state.file before calling eel", this.state.file)
       // eel.save_to_json(this.state.file, this.highlightedBoxes);
       eel.pick_next_file()(( file: string ) => this.setState( { file } ))
       // eel.pick_next_file()(( file: string ) => console.log("File returned by eel", file ))

       console.log("selectNextFile state.file after calling eel", this.state.file)
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
            {/*<button className='App-button' onClick={this.pickFile}>Pick Random File From `{this.state.path}`</button>*/}

        </header>

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
          <button className='App-button' onClick={this.saveToJson}>Save</button> {/*todo why does it relaod the page?*/}
          <button className='App-button' onClick={this.selectNextFile}>></button> {/*todo why does it relaod the page?*/}


        <div id="music-sheet" >


        </div>
        <OpenSheetMusicDisplay file={this.state.file} ref={this.divRef} />
      </div>
    );
  }
}

export default App;
