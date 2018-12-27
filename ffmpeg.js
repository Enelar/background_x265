const spawn = require('./process.js');

function printidle() {
  let printidle = new spawn('xprintidle');
  return printidle.toString();
}

function watcher(proc)
{
  let watchdog = setInterval(async () => {
  	let idle = await printidle();

  	if (idle < 5 * 1000) {
  	  proc.pause();
  	}

  	if (idle > 5 * 1000) {
  	  proc.resume();
  	}
  }, 500);

  proc.waitExit()
  	.then(() => {
  	  clearInterval(watchdog);
  	})
}


module.exports =
{
  format: (file) => {
  	let proc = new spawn("ffmpeg", ["-i", file]);
  	let resolve;
  	let resolved = false;

  	proc.onStderr((data) => {
  	  let str = data.toString();
  	  let m;

	  let regex = /^.*?\n\s+(Stream.*?)\n/gsi;
  	  
  	  while (m = regex.exec(str))
  	  {
  	  	if (m[1].search('h264'))
  	  	  resolve(true), resolved = true;
  	  }
  	})

  	proc.waitExit().then(() => {
  	  if (!resolved)
  	  	resolve(false);
  	});


  	return new Promise((r) => (resolve = r, undefined))
  }
  ,
  convert: (fileA, fileB) => {
  	let args = 
  	[
  	  "-y",
  	  "-vaapi_device",
  	  "/dev/dri/renderD128",
  	  "-i",
  	  fileA,
  	  '-vf',
  	  'format=nv12,hwupload,hwdownload',
  	  '-preset',
  	  'faster',
  	  '-pix_fmt',
  	  'yuv420p',
  	  '-crf',
  	  '27',
  	  '-g',
  	  25 /* average fps */ * 60 /* seconds in minute */ * 5 /* minutes to frame */,
  	  '-bf',
  	  25 /* average fps */ * 10 /* max seconds of motion scene */,
  	  '-c:v',
  	  'libx265',
  	  '-c:a',
  	  'libopus',
  	  '-b:a',
  	  '40k',
  	  fileB
  	];

  	let proc = new spawn("ffmpeg", args);
  	
  	watcher(proc);

  	proc.onStdout((data) => console.log(data.toString()));

  	return proc.waitExit();
  }
  ,
  duration: (file) => {
  	let proc = new spawn("ffmpeg", ["-i", file]);
  	let resolve;
  	let resolved = false;

  	proc.onStderr((data) => {
  	  let str = data.toString();
  	  let m;

	  let regex = /^.*?\n\s+duration:\s*(.*?)[.,]/gsi;
  	  
  	  while (m = regex.exec(str))
  	  {
  	  	resolve(m[1]);
  	  	resolved = true;
  	  }
  	})

  	proc.waitExit().then(() => {
  	  if (!resolved)
  	  	resolve(false);
  	});


  	return new Promise((r) => (resolve = r, undefined))
  }

}