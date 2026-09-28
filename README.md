# BRDocs

Hosted documentation browser for BRBuild projects. Place this repository beside `BRTrains3`, `BRMetro2`, `OpenTTE2`, `BREditor`, and `BRBuild`.

The server reads sibling project folders on every API request. It discovers directories containing `BRBuild.yaml`, reads vehicle YAML and generated BRBuild manifests directly, and does not bake project data into the site. Formation previews use the manifest's resolved sprite pattern and render each of the eight views in the browser, converting the blue and white source backgrounds to transparency in the generated canvas only.

```sh
node server.mjs
# open http://localhost:4173
```

Set `BRDOCS_ROOT` when the sibling projects live somewhere else. This is intentionally a server-side app: a hosted browser cannot inspect its host's parent directory without an API.
