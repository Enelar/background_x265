const spawn = require('./process.js');
const ffmpeg = require('./ffmpeg.js');

const find = new spawn('find', ['/home/user', '-type', 'f']);
const grep = new spawn('grep', ['.mp4$']);

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

   	let resolve;
    for (let line of lines) {
    	await singleThread;

    	singleThread = new Promise((r) => {resolve = r});
    	
    	await forEachFile(line);
    	
    	resolve(true);
    }
})


function durationToSec(duration)
{
  return duration.split(':').reduce((a, x) => a * 60 + parseInt(x), 0);
}

async function forEachFile(file)
{
	let format = await ffmpeg.format(file);

  	if (!format)
      return;

    let duration = await ffmpeg.duration(file);

    if (!duration)
      return;

    console.log(file, duration);

    let target = file.replace(/\.mp4$/, ".mkv");
    let convert = ffmpeg.convert(file, target);

    await convert;

    let new_duration = await ffmpeg.duration(target);

    console.log(duration, "=>", new_duration);
    if (Math.abs(durationToSec(duration) - durationToSec(new_duration)) < 2)
    {
      new spawn('rm', [file]);
      console.log(`DONE ${file}`)
    }
    else
    {
	  new spawn('rm', [target]);
	  console.log(`REVERT ${target}`)
    }

    


    return convert;
}