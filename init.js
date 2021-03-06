const spawn = require('./process.js');
const ffmpeg = require('./ffmpeg.js');

const find = new spawn('find', ['/home/kberezin', '-type', 'f']);
const grep = new spawn('grep', ['-E', '\.(mp4|avi|wmv)$']);

Array.prototype.last = function() {
    return this[this.length - 1];
}

let singleThread = Promise.resolve();

find.pipe(grep);
grep.onStdout(async function (data) {
	let buffer = (this.accum || []).join("\n")
		+ data.toString();
    let lines = buffer.toString().split(/(\r?\n)/g);

    if (buffer.slice(-1) !== "\n")
       this.accum = [lines.pop()];
    else
       this.accum = [];

   	grep.pause();

   	let resolve;
    for (let line of lines) {
    	if (line == "\n")
    	  continue;

    	await singleThread;

    	singleThread = new Promise((r) => {resolve = r});

    	await forEachFile(line);

    	resolve(true);
    }

    grep.resume();
})


function durationToSec(duration)
{
  return duration.split(':').reduce((a, x) => a * 60 + parseInt(x), 0);
}

async function forEachFile(file)
{
  let size_before = new spawn("ls", ["-lah", file]);
  size_before = await size_before.toString();

	let format = await ffmpeg.format(file);

  	if (!format)
      return;

    let duration = await ffmpeg.duration(file);

    if (!duration)
      return;

    console.log(duration, size_before);

    let target = file.replace(/(.*)\.(.*)$/, "$1.mkv");
    let convert = ffmpeg.convert(file, target);

    await convert;

    let new_duration = await ffmpeg.duration(target);


    // console.log("\n", duration, "=>", new_duration);
    if (new_duration && Math.abs(durationToSec(duration) - durationToSec(new_duration)) < 2)
    {

      new spawn('rm', [file]);
      console.log(`DONE ${file}`);
    }
    else
    {
	  new spawn('rm', [target]);
	  console.log(`REVERT ${target}`)
    }




    return convert;
}
