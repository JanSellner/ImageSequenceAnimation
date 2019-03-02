import subprocess
import re
import sys

# The version of the library is set as command line argument
if len(sys.argv) != 2:
    raise ValueError('You must specify a version number.\nUsage: python ' + os.path.basename(__file__) + ' VERSION')

version = sys.argv[1]

# Minify and bundle all js files
result = subprocess.run('uglifyjs vendor/jszip.min.js src/ImageSequenceAnimation.js src/ImageSequenceAnimationControls.js --mangle --compress', stdout=subprocess.PIPE, shell=True)
bundle_minified = result.stdout.decode('utf-8')

# Extract the licence information from the jszip library
path_jszip = 'vendor/jszip.min.js'
with open(path_jszip, 'r', encoding='utf-8') as file:
    jszip = file.read()

match = re.search(r'^/\*.+?\*/', jszip, re.DOTALL)

if not match:
    raise ValueError('Could not extract licence information from the file ' + path_jszip)

preamble_jszip = match.group(0)

# Own version information
preamble = '/*!\nImageSequenceAnimation v' + version + '\n*/'

# Write the output file
path_bundle = 'dist/ImageSequenceAnimation.bundle.min.js'
with open(path_bundle, 'w', encoding='utf-8') as file:
    file.write(preamble + '\n' + preamble_jszip + '\n' + bundle_minified)

print('Successfully wrote the file ' + path_bundle)
