/*
      ___                         ___           ___           ___ 
     /\  \          ___          /\__\         /\  \         /\  \    
    /::\  \        /\  \        /:/ _/_       |::\  \        \:\  \   
   /:/\:\__\       \:\  \      /:/ /\__\      |:|:\  \        \:\  \  
  /:/ /:/  /        \:\  \    /:/ /:/ _/_   __|:|\:\  \   ___  \:\  \ 
 /:/_/:/__/___  ___  \:\__\  /:/_/:/ /\__\ /::::|_\:\__\ /\  \  \:\__\
 \:\/:::::/  / /\  \ |:|  |  \:\/:/ /:/  / \:\~~\  \/__/ \:\  \ /:/  /
  \::/~~/~~~~  \:\  \|:|  |   \::/_/:/  /   \:\  \        \:\  /:/  / 
   \:\~~\       \:\__|:|__|    \:\/:/  /     \:\  \        \:\/:/  /  
    \:\__\       \::::/__/      \::/  /       \:\__\        \::/  /   
     \/__/        ~~~~           \/__/         \/__/         \/__/    

*/

import init, { Emulator } from "./pkg/rvemu.js";

const fileIn = document.getElementById("file");
const buffer = document.getElementById("buffer");

const termContainer = document.getElementById("terminal");
const term  = new Terminal({cursorBlink: true});

console.log(Terminal);
console.log(FitAddon.FitAddon);

const fitAddon = new FitAddon.FitAddon();
const newLine = "\r\n$ ";
const deleteLine = "\x1b[2K\r";

const fileReader = new FileReader();
let files = [];
let execute_once = false;

async function initialize() {
  // Load the wasm file.
  await init();

  term.loadAddon(fitAddon);
  term.open(termContainer);
  fitAddon.fit();

  runTerminal();

  buffer.addEventListener('DOMSubtreeModified', (e) => {
    if (e.target.childNodes.length <= 0) {
      term.write("$ ");
      return;
    }
    const firstChild = e.target.childNodes[0];
    term.write(deleteLine);
    term.writeln(firstChild.innerText);
    e.target.removeChild(firstChild);
  });

  fileReader.onloadend = e => {
    const emu = Emulator.new();
    const bin = new Uint8Array(fileReader.result);
    emu.set_binary(bin);
    emu.execute();
  };

  fileIn.onchange = e => {
    let names = "";
    for (let i=0; i<file.files.length; i++) {
      names += file.files[i].name;
      if (i < file.files.length-1) {
        names += ", ";
      }
    }
    files.push.apply(files, file.files);
    term.write(deleteLine);
    term.write("uploaded " + names);
    prompt();
  };
}

function prompt() {
  term.write(newLine);
}

function help() {
  term.writeln("Supports the following commands:");
  term.writeln("  upload      open local files for an execution on the emulator");
  term.writeln("  ls          list files you uploaded");
  term.writeln("  run [file]  execute a file");
  term.write("  help        print all commands you can use");
}

function upload() {
  fileIn.click();
}

function run(filename) {
  for (let i=0; i<files.length; i++) {
    if (filename == files[i].name) {
      fileReader.readAsArrayBuffer(files[i]);
      return;
    }
  }
  term.write("\r\n" + filename + ": No such file");
}

function ls() {
  let names = "";
  for (let i=0; i<files.length; i++) {
    names += files[i].name;
    if (i < files.length-1) {
      names += ", ";
    }
  }
  term.write("\r\n" + names);
}

function command(input) {
  const com = input.split(" ");
  switch (com[0]) {
    case "":
      break;
    case "upload":
      upload();
      break;
    case "ls":
      ls();
      break;
    case "run":
      if (com[1] == undefined) {
        term.writeln("");
        help();
        break;
      }
      term.writeln("\r\nstart to execute " + com[1]);
      run(com[1]);
      break;
    default:
      term.writeln("");
      help();
  }
}

function runTerminal() {
  if (term._initialized) {
      return;
  }

  term._initialized = true;

  term.prompt = () => {
    term.write('\r\n$ ');
  };

  term.writeln("Welcome to RISC-V emulator!");
  term.writeln("This is a work-in-progress project. You can see the progress at https://github.com/d0iasm/rvemu");
  term.writeln("Bug reports or feature requests are always welcome: https://github.com/d0iasm/rvemu/issues");
  term.writeln("");
  help();
  term.writeln("");
  prompt();

  let input = "";
  let cursor = 0;
  term.onKey(e => {
    const printable = !e.domEvent.altKey && !e.domEvent.altGraphKey && !e.domEvent.ctrlKey && !e.domEvent.metaKey;

    if (e.domEvent.keyCode === 13) { // Enter key
      command(input);
      input = "";
      cursor = 0;
      prompt();
    } else if (e.domEvent.keyCode === 8) { // Backspace key
      // Do not delete the prompt
      if (term._core.buffer.x > 2) {
        input = input.substr(0, cursor-1) + input.substr(cursor);
        if (cursor > input.length) {
          cursor--;
        }
        term.write(deleteLine);
        term.write("$ ");
        term.write(input);
      }
    } else if (e.domEvent.keyCode === 37) { // Arrow left
      if (cursor > 0) {
        cursor--;
      }
      term.write(e.key);
    } else if (e.domEvent.keyCode === 39) { // Arrow right
      if (cursor < input.length) {
        cursor++;
      }
      term.write(e.key);
    } else if (printable) {
      cursor++;
      input = input.substr(0, cursor) + e.key + input.substr(cursor);
      term.write(e.key);
    }
  });
}

initialize();
