const { spawn } = require('child_process');

class thread
{
  constructor(program, args) {
  	this.p = spawn(program, args);

  	this.exitPromise = new Promise(r => {
  	  this.exitResolve = r;
  	});

  	this.p.on('exit', (code, signal) => this.exitResolve(code, signal));
  }

  waitExit() {
  	return this.exitPromise;
  }

  onStdout(cb) {
  	this.p.stdout.on('data', cb);
  }

  onStderr(cb) {
  	this.p.stderr.on('data', cb);
  }

  pipe(next) {
	let proc = next.proc();
	proc.stdin.setEncoding('utf-8');

  	this.onStdout(data => {
  	  proc.stdin.write(data);
  	})

  	this.waitExit().then(() => {
  	  proc.stdin.end();
  	})
  }

  pause() {
  	this.p.kill('SIGSTOP');
  }

  resume() {
  	this.p.kill('SIGCONT');
  }

  proc() {
  	return this.p;
  }

  toString() {
  	this.accum = "";
  	this.onStdout((data) => {
  	  this.accum = data.toString();
  	})
  	
  	return this.waitExit()
  		.then(() => this.accum);
  }
};

module.exports = thread;