# BRDocs

Hosted documentation browser for BRBuild projects. Place this repository beside `BRTrains3`, `BRMetro2`, `OpenTTE2`, `BREditor`, and `BRBuild`.

The server reads sibling project folders on every API request. It discovers directories containing `BRBuild.yaml`, reads vehicle YAML and generated BRBuild manifests directly, and does not bake project data into the site. Formation previews use the manifest's resolved sprite pattern and render each of the eight views in the browser, converting the blue and white source backgrounds to transparency in the generated canvas only.

When a vehicle detail page is opened, the server searches Wikimedia Commons for a matching photograph, accepts only CC BY, CC BY-SA, CC0, or public-domain results, downloads the image into `.cache/commons`, and shows it as the page header with attribution. The spritesheet is used only when no suitable openly licensed Commons image is available. Set `BRDOCS_CACHE` to move this cache outside the repository. Maintainer login verification reads the SHA-256 password hash from `.admin-password-hash` (or `BRDOCS_ADMIN_PASSWORD_HASH`); the password itself is never sent to or embedded in the frontend. Maintainers can also set a specific HTTPS image plus credits URL, or explicitly select no image, for an individual unit.

```sh
node server.mjs
# open http://localhost:4173
```

Set `BRDOCS_ROOT` when the sibling projects live somewhere else. This is intentionally a server-side app: a hosted browser cannot inspect its host's parent directory without an API.
