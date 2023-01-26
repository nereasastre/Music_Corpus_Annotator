"""Main Python application file for the EEL-CRA demo."""

import os
import pathlib
import platform
import random
import sys
import json
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


@eel.expose
def pick_next_file2(file='craig_files/beethoven-piano-sonatas-master/kern/sonata01-2.musicxml'):
    index_path = os.path.join(os.getcwd(), 'public', 'index.json')
    with open(index_path, 'r+') as f:
        data = json.load(f)
        all_files = list(data.keys())
        all_values = list(data.values())
        entry_paths = data[all_files[0]]['path']
        print("FILE IN STR", file in str(all_values))
        if len(entry_paths) > 1:
            print("craig_files/beethoven-piano-sonatas-master/kern/sonata01-2.musicxml" in all_values)
            # print(all_values.index("craig_files/beethoven-piano-sonatas-master/kern/sonata01-2.musicxml"))
            print("length 1")
            print(len(data[all_files[600]]['path']))

        file_path = os.path.join(
            os.getcwd(), 'public', entry_paths['2']
        )
        relative_path = file_path.split("public\\")[-1]
        print("Relative path: ", relative_path)

    return relative_path


def load_json(name_file):
    data = None
    with open(name_file, 'r') as fp:
        data = json.load(fp)
    return data


@eel.expose
def pick_next_file(file):
    """Finds the current file in index.jon and returns the next file """
    print(file)
    index_path = os.path.join(os.getcwd(), 'public', 'index.json')
    # load json
    data = load_json(index_path)
    # order all paths
    all_paths = [p for v in data.values() for p in v['path'].values()]
    # get index of file in all paths
    current_index = all_paths.index(file)
    # return next path
    return all_paths[current_index + 1] if current_index < len(index_path) else -1


@eel.expose
def save_to_json(score_name, annotations):
    score_name = pathlib.Path(score_name).stem  # get just the file name
    annotations_folder = os.path.join(os.getcwd(), "public", "annotations")
    score_annotations = os.path.join(annotations_folder, f"{score_name}.json")

    print("PATH EXISTS BEFORE", os.path.exists(score_annotations))

    if os.path.isfile(score_annotations):
        os.remove(score_annotations)

    print("PATH EXISTS AFTER", os.path.exists(score_annotations))

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
