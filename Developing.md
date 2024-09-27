# Developing Notes

## Build the Bundle
1. Build the docker image
    ```
    docker build --tag animation-i .
    ```
2. Run the Python build script
    ```
    docker run -v "${PWD}:/home/ImageSequenceAnimation" --rm -it animation-i python build.py x.y.z
    ```
3. Create and push a git tag with the new version number

## Update JSZip
Run the corresponding update script with the new version number:
```
docker run -v "${PWD}:/home/ImageSequenceAnimation" --rm -it animation-i python vendor/update_jszip.py x.y.z
```
Afterwards, you can create a new version of the bundle. 
