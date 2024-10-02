import * as contentful from "contentful";
import StoryblokClient from "storyblok-js-client";
import { log, download, cleanAssetUrl } from "./helper.js";
import { readFile } from "node:fs/promises";

// Iniatialize clients
const Storyblok = new StoryblokClient({
	oauthToken: process.env.SB_TOKEN,
});

const ctClient = contentful.createClient({
	space: process.env.CT_SPACE,
	accessToken: process.env.CT_TOKEN,
});

// Get a Contentful "Page" content type entry
const ctEntry = await ctClient.getEntry(process.env.CT_ENTRY);

log("ct-entry", ctEntry);

// Upload image to Storyblok
const sbAsset = await Storyblok.post(`spaces/${process.env.SB_SPACE}/assets`, {
	"filename": ctEntry.fields.gridConfig.fields.image.fields.file.fileName,
	"size": `${ctEntry.fields.gridConfig.fields.image.fields.file.details.image.width}x${ctEntry.fields.gridConfig.fields.image.fields.file.details.image.height}`,
	"validate_upload": 1
});

log("sb-asset", sbAsset);

const file = `tmp/${ctEntry.fields.gridConfig.fields.image.fields.file.fileName}`;

await download(`http:${ctEntry.fields.gridConfig.fields.image.fields.file.url}`, file)

const form = new FormData();

for (let key in sbAsset.data.fields) {
	form.append(key, sbAsset.data.fields[key])
}

const blob = new Blob([await readFile(file)]);

form.append("file", blob);

const sbAssetUpload = await fetch(sbAsset.data.post_url, {
	method: "POST",
	body: form,
});

log("sb-upload", sbAssetUpload);

const sbAssentFinal = await Storyblok.get(`spaces/${process.env.SB_SPACE}/assets/${sbAsset.data.id}/finish_upload`);

log("sb-upload-final", sbAssentFinal);

// Map the fields
const sbEntry = {
	story: {
		name: ctEntry.fields.title,
		slug: ctEntry.fields.slug,
		parent_id: process.env.SB_PARENT,
		content: {
			component: "page",
			page_title: ctEntry.fields.pageTitle,
			meta_title: ctEntry.fields.metaTitle,
			meta_description: ctEntry.fields.metaDescription,
			white_menu: ctEntry.fields.whiteMenu,
			grid_config: [
				{
					title: ctEntry.fields.gridConfig.fields.title,
					slug: ctEntry.fields.gridConfig.fields.slug,
					config: ctEntry.fields.gridConfig.fields.config,
					component: "dynamic_grid",
					image: {
						id: sbAssentFinal.data.id,
						filename: cleanAssetUrl(sbAssentFinal.data.filename),
						fieldtype: "asset"
					}
				}
			]
		},
	},
};

log("sb-entry", sbEntry);

// Create Storyblok entry
const sbResponse = await Storyblok.post(`spaces/${process.env.SB_SPACE}/stories`, sbEntry);

log("sb-response", sbResponse);