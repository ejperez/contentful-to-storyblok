import fs from "node:fs";
import http from "node:http";

export const log = (filename, data) => {
	fs.writeFile(`logs/${filename}.json`, JSON.stringify(data, null, 4), err => err && console.error(err));
}

export const download = async (url, dest) => {
	var file = fs.createWriteStream(dest);

	return new Promise((resolve, reject) => {
		http.get(url, (response) => {
			response.pipe(file);

			file.on("finish", () => {
				file.close();
				resolve();
			});

			file.on("error", reject);
		});
	});
}

export const cleanAssetUrl = (url) => {
	return url.replaceAll("s3.amazonaws.com/", "")
}