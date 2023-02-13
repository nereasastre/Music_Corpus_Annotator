"""Main Python application file to interact with local files"""

import json
import os
import pathlib
import platform
import sys
from time import sleep

import eel

global index_path
global app_path

# Use latest version of Eel from parent directory
sys.path.insert(1, '../../')


def load_json(name_file):
    """
    Loads data from a .json file
    @param str name_file: Path to the .json file
    @returns dict: The .json data
    """
    with open(name_file, 'r') as fp:
        return json.load(fp)


def get_all_paths_from_index():
    """Returns all paths from index.json"""
    data = load_json(index_path)
    # order all paths
    all_paths = [p for v in data.values() for p in v['path'].values()]
    # get index of file in all paths
    return all_paths


@eel.expose  # Expose function to JavaScript
def say_hello_py(x):
    """Print message from JavaScript on app initialization, then call a JS
    function."""
    print('Hello from %s' % x)  # noqa T001
    eel.say_hello_js('Python {from within say_hello_py()}!')


@eel.expose
def pick_last_annotated():
    """Finds the last annotated score in index.json and returns the file """
    data = load_json(index_path)
    print("pick_last_annotated() called")
    # order all paths
    all_paths = [(p, v['annotated']) for v in data.values()
                 for p in v['path'].values()]

    # List of annotated files
    annotated_scores = [t[0] for t in all_paths if t[1]]

    # If no scores have been annotated
    if not annotated_scores:
        return all_paths[0][0]  # return first file
    last_annotated_index = all_paths.index((annotated_scores[-1], True))
    last_annotated_file = all_paths[max(0, last_annotated_index)][0]
    print(f"Rendering last annotated file: {last_annotated_file} ...")
    return last_annotated_file


@eel.expose
def mark_annotated(file):
    # Open the file and save annotations
    data = load_json(index_path)

    # Return a dict with {path: title}
    paths_titles = dict([(p, t) for t in data.keys()
                         for p in data[t]["path"].values()])
    title = paths_titles[file]
    paths_list = list(paths_titles)
    try:
        next_file = paths_list[paths_list.index(file) + 1]
        print(next_file)
    except (ValueError, IndexError):
        next_file = file
        print(next_file)

    # Score will be annotated when file is the last path of the title
    next_title = paths_titles[next_file]
    if next_title == title:
        return

    print("Next title != title")
    data[title]["annotated"] = True

    # To avoid the window from reloading, delete file if it exists
    if os.path.isfile(index_path):
        os.remove(index_path)

    sleep(0.5)  # wait 0.5 seconds between deleting and writing to avoid reload

    # Open the file and save annotations
    with open(index_path, 'w') as index:
        json.dump(data, index, indent=4)
        index.close()


@eel.expose
def pick_next_file(file):
    """Finds the current file in index.json and returns the next file """
    all_paths = get_all_paths_from_index()
    current_index = all_paths.index(file)

    # Return next path. If file is the last file, return file
    next_file = all_paths[min(current_index + 1, len(all_paths) - 1)]
    print(f"Rendering next file: {next_file}")
    return next_file


@eel.expose
def pick_previous_file(file):
    """
    Finds the current file in index.json and returns the previous file
     @param str file: The path of the current file
    """
    all_paths = get_all_paths_from_index()
    current_index = all_paths.index(file)

    # Return previous path. If file is the first file, return file
    previous_file = all_paths[max(current_index - 1, 0)]
    print(f"Rendering previous file: {previous_file}")
    return previous_file


@eel.expose
def save_to_json(score_name, annotations):
    """
    Creates a .json file with the annotations of the current score

    @param str score_name: The path to the score to be saved
    @param str annotations: The score annotations
    @return None
    """
    score_name = pathlib.Path(score_name).stem  # get just the file name
    annotations_folder = os.path.join(app_path, "public", "annotations")

    if not os.path.isdir(annotations_folder):
        os.mkdir(annotations_folder)

    print("App path: ", app_path)
    print("Annotations folder: ", annotations_folder)

    # Path to the .json file to write
    score_annotations = os.path.join(annotations_folder, f"{score_name}.json")

    # To avoid the window from reloading, delete file if it exists
    if os.path.isfile(score_annotations):
        os.remove(score_annotations)

    sleep(0.5)  # wait 0.5 seconds between deleting and writing to avoid reload

    # Open the file and save annotations
    with open(score_annotations, 'w') as annotated_score:
        print(f"Saving annotations to {score_annotations} ...")
        json.dump(annotations, annotated_score, indent=4)

    print("Done!")


def start_eel(develop):
    """Start Eel with either production or development configuration."""
    global index_path
    global app_path
    if develop:
        directory = 'src'
        app = None
        page = {'port': 3000}
        app_path = os.getcwd()
        index_path = os.path.join(app_path, 'public', 'index.json')
    else:
        directory = 'build'
        app = 'chrome-app'
        page = 'index.html'
        app_path = pathlib.Path(os.getcwd()).parent
        print("Build app_path: ", app_path)
        index_path = os.path.join(app_path, 'public', 'index.json')

    eel.init(directory, ['.tsx', '.ts', '.jsx', '.js', '.html'])

    # These will be queued until the first connection is made,
    # but won't be repeated on a page reload
    say_hello_py('Python World!')
    # Call a JavaScript function (must be after `eel.init()`)
    eel.say_hello_js('Python World!')

    eel.show_log('https://github.com/samuelhwilliams/Eel/issues/363 (show_log)')

    eel_kwargs = dict(
        host='localhost',
        port=8080,
        size=(1280, 800),
    )
    try:
        eel.start(page, mode=app, **eel_kwargs)
    except EnvironmentError:
        # If Chrome isn't found, fallback to Microsoft Edge on Win10 or greater
        if sys.platform in ['win32', 'win64'] and int(platform.release()) >= 10:
            eel.start(page, mode='edge', **eel_kwargs)
        else:
            raise


if __name__ == '__main__':
    import sys

    # Pass any second argument to enable debugging
    start_eel(develop=len(sys.argv) == 2)
