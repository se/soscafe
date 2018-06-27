const restify = require("restify");
const fetch = require("node-fetch");

// MonoPush Group Url
let pushUrl;
let environment = process.env.ENVIRONMENT || "Development";

console.info(`You are running on ${environment} environment.`);

if (environment === "Production") {
	pushUrl = process.env.PUSH_URL;
} else {
	pushUrl = process.env.PUSH_URL_DEVELOPMENT;
}

if (!pushUrl) {
	throw "You must provide your PUSH_URL in your environment variables.";
}

function respond(req, res, next) {
	const query = req.query;
	const headers = req.headers;
	if (!headers || !headers["x-secret"] || headers["x-secret"] != process.env.SECRET) {
		res.send(403, "You are not authorized for this request.");
		res.end();
		return;
	}

	if (query.file) {
		var url = `${query.file}`;
		fetch(url)
			.then(res => res.text())
			.then(body => {
				const content = { message: body };

				content.message = content.message.replace(/\(YANINDA[\+| ]PİLAV\+YOĞURT\+SU\)\n/gi, "");
				content.message = content.message.replace(/\d+[,]\d+\sTL[\n]/gi, "");
				content.message = content.message.replace(/\d+[,]\d+TL[\n]/gi, "");
				content.message = content.message.replace("5,00TL", "");

				content.message = content.message.split("\n");

				const day = content.message[0];

				content.message = content.message.slice(4);
				content.message = content.message.slice(0, content.message.length - 1);

				content.message = content.message.filter(function(n) {
					return n != null && n.trim() != "";
				});

				content.message.forEach(function(part, index, theArray) {
					theArray[index] = theArray[index].trim();
				});

				content.message = content.message.join("\n");

				content.message = `[[ ${day} tarihli Sos Cafe Yemek Menüsü ]] \n` + "=============== \n" + content.message;

				fetch(pushUrl, {
					method: "POST",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json"
					},
					body: JSON.stringify(content)
				});
			});
	}
	console.log(`File is ${req.query.file}`);
	res.send(200, "Thank you.");
	res.end();
	next();
}

var server = restify.createServer();
server.post("/hook", respond);

server.use(restify.plugins.queryParser());
server.use(restify.plugins.jsonBodyParser());
server.use(restify.plugins.bodyParser());

const trimContent = data => {};

server.listen(process.env.PORT || 8092, function() {
	console.log("%s listening at %s", server.name, server.url);
});
