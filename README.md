**Table of Contents**

<!-- TOC -->

- [Music Corpus Annotator Documentation](#music-corpus-annotator-documentation)
    - [Usage](#usage)
    - [Quick start](#quick-start)
    - [Main Files](#main-files)

<!-- /TOC -->

# Music Corpus Annotator Documentation

Music Corpus Annotator is an app to annotate the difficulty of music scores. This particular project was generated from 
the eel example https://github.com/python-eel/Eel/tree/main/examples/07%20-%20CreateReactApp.

If you run into any issues with the app, open a [new issue](https://github.com/nereasastre/Music_Corpus_Annotator/issues) and tag @nereasastre

## Usage
Music Corpus Annotator allows the user to annotate the difficulty of music scores. Some functionalities and buttons that control them:
- **Annotate**: On start, the current measure is highlighted in gray. To annotate that entire measure, just press 1 (easy), 2 (medium) or 3 (hard) 
in your keyboard. If you wish to annotate similar areas in the score, you can also use the 19 keys in your keyboard from the letters Q to L. 
  This will highlight the measure with the color of the key that you pressed.
- **Annotate with the mouse**: In order to annotate from a coordinate to another one with the mouse, press que shift button + the annotation (1, 2, 3 or Q-L). 
  Then, hold the shift key and click on the first note that you wish to annotate. Drag until the last note to annotate and release the mouse click. This will render a box from the 
  first note you clicked on to the note where you released the mouse button. If instead of highlighting from note to note you want to highlight
  all the measures entirely from the first to the last position, you can use the "Alt" key instead of Shift.
- **Select a box**: In order to move to another box without annotating, just use the arrow keys (left to move backwards, right
  to move forward). This will update the select box. If you cannot see the select box, press the Period "." key, and it will appear again.
- **Delete a measure**: To delete the last annotated measure, use the Backspace button. If you want to delete a measure 
  that is not the last one, go to the measure using the arrow keys. Once it is highlighted in gray, press the Backspace key.
- **Go to the next/previous score**: In order to go to the next score in index.json, press the "Next" button. To render the previous score,
press the "Previous" button.
- **Clear all annotations**: If you wish to clear all your annotations, press the Esc key.  
- **Save annotations**: If you want to save your annotations to a .json file, press the "Save" button. This is not mandatory, since
saving is automatically done.

This is what the application will look like after some annotations:
![Demo.png](Demo.png)

That is it! Please also bear in mind that the application is currently slow when rendering large music scores. I am actively trying to improve this inconvenience.


## Quick Start
Clone the repository to use the app. Run `git clone https://github.com/nereasastre/Music_Corpus_Annotator/` in your system's terminal.
To use the app directly, go to the dist/ folder and open music_corpus_annotator.exe.

Other ways to run the app:
1. **Configure:** In the app's directory, run `npm install` and `pip install bottle bottle-websocket future whichcraft pyinstaller`
2. **Demo:** Build static files with `npm run build` then run the application with `python eel_CRA.py`. A Chrome-app window should open running the built code from `build/`
3. **Distribute:** (Run `npm run build` first) Build a binary distribution with PyInstaller using `python -m eel eel_CRA.py build --onefile --name Music_Corpus_Annotator` 
   This generates the application Music_Corpus_Annotator.exe. 
4. **Develop:** Open two prompts. In one, run  `python eel_CRA.py true` and the other, `npm start`. A browser window should open in your default web browser at: [http://localhost:3000/](http://localhost:3000/). As you make changes to the JavaScript in `src/` the browser will reload. Any changes to `eel_CRA.py` will require a restart to take effect. You may need to refresh the browser window if it gets out of sync with eel.


## Main Files

Critical files for this app:

- `public/index.json`: File with all of the measures that will be rendered. To use this app with a different collection of measures, update `index.json` to have a score identifier, which contains information about the score. The score needs to have a "path" entry with the path to the scores, and an "annotated" entry for every path in the score. An example of the minimal structure to make the app work with 2 files, and your own `index.json` is the following:
  ```
  {
    "n-1": {
        "path": {
            "1": "clementi/no_1_1.musicxml",
            "2": "clementi/no_1_2.musicxml",
            "3": "clementi/no_1_3.musicxml"
        },
        "annotated": {
            "1": false,
            "2": false,
            "3": false
        }
    },
    "n-2": {
        "path": {
            "1": "clementi/no_2_1.musicxml",
            "2": "clementi/no_2_2.musicxml",
            "3": "clementi/no_2_3.musicxml"
        },
        "annotated": {
            "1": false,
            "2": false,
            "3": false
        }
    }
  }
  ```
  
  

- `src/App.tsx`: Main application file for annotating
- `eel_CRA.py`: Basic `eel` file
  - If run without arguments, the `eel` script will load `index.html` from the build/ directory (which is ideal for building with PyInstaller/distribution)
  - If any 2nd argument (i.e. `true`) is provided, the app enables a "development" mode and attempts to connect to the React server on port 3000
  - Used to edit and save local files
- `public/index.html`: Added location of `eel.js` file based on options set in eel_CRA.py
- `src/react-app-env.d.ts`: This file declares window.eel as a valid type for tslint. Note: capitalization of `window`
- `src/App.css`: Added some basic button styling
- `src/boundingBoxes.tsx`: Contains functions used for rendering difficulty bounding boxes.




