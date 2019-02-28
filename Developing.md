# Developing Notes

## Build the Bundle
1. Build the docker image
    ```
    docker build --tag animation-i .
    ```
2. Run the Python build script
    ```
    docker run -v "${PWD}:/home/ImageSequenceAnimation" --rm -it animation-i python build.py
    ```

## Update JSZip
Run the corresponding update script with the desired version number:
```
docker run -v "${PWD}:/home/ImageSequenceAnimation" --rm -it animation-i python update_jszip.py VERSION
```
