# Desktop Recorder App

This is the Electron UI for a desktop recorder app I worked on for a couple of
years as a hobby project. The C++ code for this project is found here: [Desktop Recorder Library](https://github.com/jgcoded/DesktopRecorderLibrary). The app reached 10K monthly active users on the Windows Store.

Here is a demo of what the app looked like.

[![Watch the demo](https://img.youtube.com/vi/GGDT2mmUgYg/maxresdefault.jpg)](https://youtu.be/GGDT2mmUgYg)

## Features

* GPU Accelerated video encoding to MP4
* On-the-fly, GPU-based texture resizing
* Multiple monitor support
* Monitor rotation support
* Microphone Audio Capture
* Mouse capture and rendering

## Install

Clone the repo and install dependencies:

```bash
git clone https://github.com/jgcoded/DesktopRecorerApp.git
cd DesktopRecorderApp
npm install
```

## Starting Development

Start the app in the `dev` environment:

```bash
npm start
```

## Packaging for Production

To package apps for the local platform:

```bash
npm run package
```

## Electron React Boilerplate
<img src=".erb/img/erb-banner.svg" width="100%" />

<br>

  This project was scaffolded with [Electron React Boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate). Please consider supporting Electron React Boilerplate on their Github.
</p>

## License

GPLv3 © [jgcoded](https://github.com/jgcoded/DesktopRecorderApp)
