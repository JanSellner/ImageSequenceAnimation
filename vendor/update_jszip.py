import os
import os
import shutil
import sys
import urllib.request
import zipfile


def download_file(url, filename):
    # Some user agent is required for the request. Otherwise, a 403 forbidden error might occur
    user_agent = 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.0.7) Gecko/2009021910 Firefox/3.0.7'
    headers = {
        'User-Agent': user_agent
    }

    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request) as response, open(filename, 'wb') as file:
        data = response.read()
        file.write(data)


# The version of the library is set as command line argument
if len(sys.argv) != 2:
    raise ValueError('You must specify a version number.\nUsage: python ' + os.path.basename(__file__) + ' VERSION')

version = sys.argv[1]

# Download file
url = 'https://github.com/Stuk/jszip/archive/v' + version + '.zip'
downloaded_file = 'JSZip.zip'

download_file(url, downloaded_file)

# Extract relevant files
with zipfile.ZipFile(downloaded_file, 'r') as zip:
    file_main = 'jszip-' + version + '/dist/jszip.min.js'
    zip.extract(file_main)

# Copy files to destination
shutil.copy2(file_main, os.path.join(os.path.dirname(__file__), 'jszip.min.js'))

# Clean up
shutil.rmtree('jszip-' + version)
os.remove(downloaded_file)
