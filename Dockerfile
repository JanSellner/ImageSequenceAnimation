FROM ubuntu:24.04

MAINTAINER Milania

# Set the correct locale so that non-ASCII characters can be processed correctly (https://stackoverflow.com/questions/28405902/how-to-set-the-locale-inside-a-ubuntu-docker-container/38553499#38553499)
# And set correct timezone (https://stackoverflow.com/questions/40234847/docker-timezone-in-ubuntu-16-04-image)
RUN apt-get update && apt-get install -y \
           locales \
           tzdata \
    && sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen \
    && dpkg-reconfigure --frontend=noninteractive locales \
    && update-locale LANG=en_US.UTF-8 \
    && ln -fs /usr/share/zoneinfo/Europe/Berlin /etc/localtime && dpkg-reconfigure -f noninteractive tzdata

ENV LANG en_US.UTF-8

# Set up the environment and install basic tools
RUN mkdir /home/ImageSequenceAnimation \
    && apt-get update && apt-get install -y \
	   curl \
       python3 python3-pip python-is-python3

# Install NodeJS and required packages
RUN mkdir /nodejs \
    && latest_node=$(curl -s --location https://nodejs.org/dist/latest/ | grep -oP 'node-v\d+\.\d+\.\d+-linux-x64.tar.gz(?=</a>)') \
    && curl --location https://nodejs.org/dist/latest/$latest_node | tar --extract --gzip --strip-components=1 --directory=/nodejs \
    && PATH="$PATH:/nodejs/bin" \
    && npm install -g uglify-js@3.17.4

ENV PATH $PATH:/nodejs/bin

WORKDIR /home/ImageSequenceAnimation
