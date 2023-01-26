"""Main Python application file for the EEL-CRA demo."""

import os
import pathlib
import platform
import random
import sys
import json
from time import sleep

import eel

# Use latest version of Eel from parent directory
sys.path.insert(1, '../../')


@eel.expose  # Expose function to JavaScript
def say_hello_py(x):
    """Print message from JavaScript on app initialization, then call a JS function."""
    print('Hello from %s' % x)  # noqa T001
    eel.say_hello_js('Python {from within say_hello_py()}!')


@eel.expose
def expand_user(folder):
    """Return the full path to display in the UI."""
    return '{}/*'.format(os.path.expanduser(folder))


@eel.expose
def pick_file(folder):
    """Return a random file from the specified folder."""
    folder = os.path.expanduser(folder)
    if os.path.isdir(folder):
        listFiles = [_f for _f in os.listdir(folder) if not os.path.isdir(os.path.join(folder, _f))]
        if len(listFiles) == 0:
            return 'No Files found in {}'.format(folder)
        return random.choice(listFiles)
    else:
        return '{} is not a valid folder'.format(folder)


def load_json(name_file):
    data = None
    with open(name_file, 'r') as fp:
        data = json.load(fp)
    return data


@eel.expose
def pick_next_file(file):
    """Finds the current file in index.jon and returns the next file """
    index_path = os.path.join(os.getcwd(), 'public', 'index.json')
    # load json
    data = load_json(index_path)
    # order all paths
    all_paths = [p for v in data.values() for p in v['path'].values()]
    # get index of file in all paths
    current_index = all_paths.index(file)
    # return next path
    next_file = all_paths[current_index + 1] if current_index < len(index_path) else -1
    print(f"Rendering next file: {next_file}")
    return next_file


@eel.expose
def save_to_json(score_name, annotations):
    score_name = pathlib.Path(score_name).stem  # get just the file name
    annotations_folder = os.path.join(os.getcwd(), "public", "annotations")
    score_annotations = os.path.join(annotations_folder, f"{score_name}.json")

    if os.path.isfile(score_annotations):
        os.remove(score_annotations)

    sleep(0.5)

    with open(score_annotations, 'w') as annotated_score:
        print(f"Saving annotations to {score_annotations} ...")
        json.dump(annotations, annotated_score, indent=4)

    print("Done!")


def start_eel(develop):
    """Start Eel with either production or development configuration."""

    if develop:
        directory = 'src'
        app = None
        page = {'port': 3000}
    else:
        directory = 'build'
        app = 'chrome-app'
        page = 'index.html'

    eel.init(directory, ['.tsx', '.ts', '.jsx', '.js', '.html'])

    # These will be queued until the first connection is made, but won't be repeated on a page reload
    say_hello_py('Python World!')
    eel.say_hello_js('Python World!')   # Call a JavaScript function (must be after `eel.init()`)

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
