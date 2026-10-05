# BRDocs

Hosted documentation browser for BRBuild projects. Place this repository beside `BRTrains3`, `BRMetro2`, `OpenTTE2`, `BREditor`, and `BRBuild`.

The server reads sibling project folders on every API request. It discovers directories containing `BRBuild.yaml`, reads vehicle YAML and generated BRBuild manifests directly, and does not bake project data into the site. Formation previews use the manifest's resolved sprite pattern and render each of the eight views in the browser, converting the blue and white source backgrounds to transparency in the generated canvas only.

When a vehicle detail page is opened, the server searches Wikimedia Commons for a matching photograph, accepts only CC BY, CC BY-SA, CC0, or public-domain results, downloads the image into the persistent `.images/commons` store, while search metadata is also retained in `.cache/commons`. Maintainer-submitted images are downloaded to the same local persistent store before the override is recorded, and every browser-facing image URL is served by BRDocs with a long-lived cache policy; the version query changes whenever a maintainer image changes. Persistent image files are never removed by cache expiry or ordinary cache clearing; maintainer actions are the only removal path. Set `BRDOCS_IMAGE_STORE` to move the persistent store and `BRDOCS_CACHE` to move the disposable search cache. Maintainer login verification reads the SHA-256 password hash from `.admin-password-hash` (or `BRDOCS_ADMIN_PASSWORD_HASH`); the password itself is never sent to or embedded in the frontend. Maintainers can also set a specific HTTPS image plus credits URL, or explicitly select no image, for an individual unit.

```sh
node server.mjs
# open http://localhost:4173
```

Set `BRDOCS_ROOT` when the sibling projects live somewhere else. This is intentionally a server-side app: a hosted browser cannot inspect its host's parent directory without an API.
