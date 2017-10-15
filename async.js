async function fun(time) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			console.log(time + 'sleep');
			resolve();
		}, 5000)
	})
}

const start = async function() {
	console.log('start');
	await fun(5000);
	await fun(4000);
	await fun(3000);
	await fun(2000);
	await fun(1000);
	console.log('stop');
}

start();