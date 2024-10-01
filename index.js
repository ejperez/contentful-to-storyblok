import * as contentful from "contentful";
import StoryblokClient from "storyblok-js-client";

const Storyblok = new StoryblokClient({
  oauthToken: process.env.SB_TOKEN,
});

const ctClient = contentful.createClient({
  space: process.env.CT_SPACE,
  accessToken: process.env.CT_TOKEN,
});

ctClient
  .getEntry(process.env.CT_ENTRY)
  .then((result) => {
    const sbFields = {
      story: {
        name: result.fields.title,
        slug: result.fields.slug,
        parent_id: process.env.SB_PARENT,
        content: {
          component: "page",
          page_title: result.fields.pageTitle,
          meta_title: result.fields.metaTitle,
          meta_description: result.fields.metaDescription,
          white_menu: result.fields.whiteMenu,
        },
      },
    };

    Storyblok.post(`spaces/${process.env.SB_SPACE}/stories`, sbFields)
      .then((result) => console.log(result))
      .catch((error) => console.error(error));
  })
  .catch((err) => console.log(err));
