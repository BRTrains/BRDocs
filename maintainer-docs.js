function renderMaintainerDocs(){
  const tip=(text,label='?')=>`<span class="help-tip" tabindex="0" title="${esc(text)}" aria-label="Why? ${esc(text)}">${label}</span>`;
  const code=(text,lang='yaml')=>`<pre class="maintainer-code"><code class="language-${lang}">${esc(text)}</code></pre>`;
  const section=(id,title,body)=>`<section class="maintainer-section" id="${id}"><h2>${title}</h2>${body}</section>`;
  const yaml=`project:
  name: MyNewGRF
  build: true
  docs: true
  target_folders:
    - src/vehicles
  grf_folder: src/grf
  palette: Sprites/ttd-newgrf-dos.gpl`;
  const vehicle=`info:
  identifier: class_416_2
  name: "Class 416/2"
  nickname: "2-EPB"

stats:
  vehicle_type: train
  train_type: multiple_unit
  weight: 135
  length: 8
  power: 1000
  speed: 75
  tractive_effort: 0.08
  track_type: [THIRD]
  power_type: [electric]

cargo: passenger

dates:
  introduction_date: 1956-04-21

profiles:
  - identifier: two_car
    name: "2-Car"
    num_vehicles: 2
    capacity: 82

liveries:
  - name: "BR Green"
    special_tags: [operator/BR]`;
  $('docs-content').innerHTML=`
    <div class="crumb">${esc(state.project.name)} / maintainer docs</div>
    <h1>Maintainer documentation.</h1>
    <p class="lead">A practical guide to creating and maintaining a BRBuild project. Start with the folder layout, then copy the complete vehicle example and change one field at a time. You do not need to know NML to use the normal YAML workflow.</p>
    <div class="maintainer-callout"><strong>Before you start</strong><p>BRBuild is a converter: you describe a vehicle in YAML, provide pixel artwork in a known template, and it generates the NML and GRF data. Keep source files in the project; never edit generated output as a permanent fix.</p></div>
    <nav class="maintainer-toc" aria-label="Maintainer documentation contents"><a href="#maintainer-layout">Folder layout</a><a href="#maintainer-build">BRBuild.yaml</a><a href="#maintainer-grf">GRF.yaml</a><a href="#maintainer-vehicle">Vehicle YAML</a><a href="#maintainer-sprites">Sprites and images</a><a href="#maintainer-advanced">Advanced files</a><a href="#maintainer-checklist">Checklist</a></nav>
    ${section('maintainer-layout','1. The project folder',`<p>Put the project beside the BRBuild repository. The root manifest tells BRBuild where to find the GRF settings and which folders contain vehicle candidates.</p>${code(`[project]/
├── BRBuild.yaml
├── build.py                 # optional convenience script
└── src/
    ├── grf/
    │   ├── GRF.yaml
    │   ├── RailTypes.yaml    # optional
    │   └── custom_nml/       # optional hand-written NML
    └── vehicles/
        └── Class416_2/
            ├── Class416_2.yaml
            ├── Class416_2.png
            ├── new/          # put a replacement PNG here
            ├── ingested/     # managed working copy
            ├── error/        # failed drops
            └── Class416_2.pnml # optional`)}<p><strong>Important:</strong> a vehicle directory and its YAML normally have the same name. A target folder is not itself a vehicle; every immediate child candidate must contain its matching YAML.</p><p>Paths in configuration are relative to the project root unless stated otherwise. Use forward slashes, even on Windows.</p>`)}
    ${section('maintainer-build','2. The root manifest: BRBuild.yaml',`<p>This is the first file BRBuild reads. It identifies the project and its input directories. The smallest useful version is:</p>${code(yaml)}<dl class="maintainer-fields"><dt><code>project.name</code> — required</dt><dd>Unique project name used in build output and documentation.</dd><dt><code>project.build</code> — optional</dt><dd><code>true</code> enables the project in bulk builds; <code>false</code> skips it.</dd><dt><code>project.docs</code> — optional</dt><dd>Set <code>true</code> to opt the project into hosted documentation discovery. Omit it or use <code>false</code> for private/build-only projects.</dd><dt><code>target_folders</code> — required for vehicles</dt><dd>List of folders, relative to the root, whose child directories are scanned for candidates. Most projects use <code>src/vehicles</code>.</dd><dt><code>grf_folder</code> — optional</dt><dd>Folder containing <code>GRF.yaml</code>; defaults to <code>src/grf</code>.</dd><dt><code>sound_folder</code> — optional</dt><dd>Folder containing sound assets; defaults to <code>src/sound</code>.</dd><dt><code>palette</code> — optional</dt><dd>Palette file used when reading sprites. Use the palette required by the project, such as <code>Sprites/ttd-newgrf-dos.gpl</code>.</dd></dl><p>${tip('Keeping target folders explicit prevents tools, experiments, and unrelated directories from accidentally becoming vehicles.')} Do not put a vehicle YAML directly in <code>src/vehicles</code>; put it in its own subfolder.</p>`)}
    ${section('maintainer-grf','3. The GRF configuration: src/grf/GRF.yaml',`<p>This file describes the compiled NewGRF as a whole: its identity, version, purchase-list order, player parameters, and optional global rules.</p>${code(`grf:
  grfid: BRT3
  short_name: BRTrains3
  name: BRTrains 3
  description: UK railway vehicles for OpenTTD

versioning:
  version: 1
  compatible_version: 1

purchase_list:
  order: grouped

params:
  - identifier: param_speed_mode
    name_str: Speed Mode
    desc_str: Choose service or design speed
    min_value: 0
    max_value: 1
    def_value: 1
    names:
      0: Service Speed
      1: Design Speed`)}<h3>Common fields</h3><ul><li><code>grf.grfid</code>: the stable four-character GRF ID. Treat it as permanent; changing it makes OpenTTD see a different GRF.</li><li><code>short_name</code>, <code>name</code>, <code>description</code>: internal and player-visible names.</li><li><code>versioning.version</code>: current version; <code>compatible_version</code>: oldest save-compatible version.</li><li><code>purchase_list.order</code>: <code>none</code>, <code>date</code>, or <code>grouped</code>. <code>file</code> may name a manual NML sort file.</li></ul><h3>Parameters</h3><p>Each parameter needs an identifier, display name, description, minimum, maximum, and default. Add <code>names</code> when numeric values need friendly labels. The <code>names</code> map is optional; the numeric range is not.</p><p>${tip('The description becomes the player-facing tooltip in NewGRF settings, so explain the effect rather than repeating the parameter name.')} Keep identifiers stable because generated switches and saved settings may refer to them.</p><h3>Optional companion files</h3><p><code>RailTypes.yaml</code> defines the logical rail types used by vehicles. <code>custom_nml/</code> holds project-wide hand-written NML. Use these only when the generated model cannot express the required behaviour.</p>`)}
    ${section('maintainer-vehicle','4. Vehicle YAML — the important part',`<p>One YAML file describes one vehicle family. The file is data, not a program. YAML indentation matters: use spaces, not tabs, and keep list items aligned. The following is a complete, minimal train example:</p>${code(vehicle)}<h3>Required and optional blocks</h3><dl class="maintainer-fields"><dt><code>info</code> — required</dt><dd><code>identifier</code> must be unique. <code>name</code> is the visible name. <code>nickname</code>, <code>sub_name</code>, <code>based_on</code>, and <code>operator</code> are optional descriptive fields.</dd><dt><code>stats</code> — required</dt><dd>At minimum choose <code>vehicle_type</code>. Train projects normally also set <code>train_type</code>, weight, length, power, speed, tractive effort, and power type.</dd><dt><code>cargo</code> — optional</dt><dd>Use <code>none</code>, a preset such as <code>passenger</code>, <code>parcels</code>, <code>mail</code>, <code>containerised</code>, <code>bulk</code>, <code>tank</code>, <code>open_wagon</code>, or an explicit class such as <code>CC_PIECE_GOODS</code>.</dd><dt><code>dates</code> — strongly recommended</dt><dd><code>introduction_date</code> accepts <code>YYYY</code>, <code>YYYY-MM</code>, or <code>YYYY-MM-DD</code>. A profile may override it.</dd><dt><code>profiles</code> — required in practice</dt><dd>List at least one profile. Use <code>identifier: DEFAULT</code> for a single ordinary configuration, or a meaningful identifier for each formation/role.</dd><dt><code>liveries</code> — optional</dt><dd>List paint schemes. If omitted, BRBuild still has the vehicle/profile but no named paint variants.</dd></dl><h3>Enums and value formats</h3><ul><li><code>vehicle_type</code>: <code>train</code>, <code>tram</code>, <code>road_vehicle</code>, <code>ship</code>, <code>plane</code>.</li><li><code>train_type</code>: <code>locomotive</code>, <code>multiple_unit</code>, <code>wagon</code>, <code>coach</code>.</li><li><code>power_type</code>: commonly <code>steam</code>, <code>diesel</code>, <code>electric</code>, <code>third_rail</code>, <code>overhead</code>, <code>hydrogen</code>, <code>battery</code>, <code>gas_turbine</code>; use a YAML list when there is more than one.</li><li><code>track_type</code>: logical project values such as <code>RAIL</code>, <code>ELRL</code>, <code>THIRD</code>, <code>FOURTH</code>; this is not a raw sprite or track label.</li><li><code>lighting</code>: <code>auto</code>, <code>exact</code>, or <code>none</code>.</li><li><code>tilt</code>: <code>none</code>, <code>basic</code>, <code>modest</code>, <code>strong</code>, <code>extreme</code>, or a numeric modifier.</li><li><code>types</code> on a profile: a list such as <code>[train, tram]</code> when one profile intentionally emits more than one vehicle type.</li></ul><h3>Profiles: formations and overrides</h3><p>A profile is the configuration a player actually buys: for example, a 2-car unit, a sleeper coach, or a driving trailer. <code>num_vehicles</code> is the number of articulated parts. <code>capacity</code> is capacity per part as defined by the project. Profile values override vehicle-level values; use profile fields only where they differ.</p>${code(`profiles:
  - identifier: five_car
    name: "5-Car"
    num_vehicles: 5
    capacity: 450
    speed: 100
    introduction_date: 1998-01-01
  - identifier: driving_trailer
    name: "Driving Trailer"
    num_vehicles: 1
    capacity: 72
    has_cab: true
    spritesheet: BRUnitDVT.png`)}<h3>Liveries: paint schemes and restrictions</h3><p>A livery can apply to every profile or only named profiles. The names in <code>profiles</code> must exactly match profile identifiers.</p>${code(`liveries:
  - name: "BR Blue"
    profiles: [five_car, driving_trailer]
    special_tags: [operator/BR]
  - name: "Network SouthEast"
    profiles: [five_car]
    special_tags: [operator/Network SouthEast]`)}<p>Overrides resolve from the narrowest level outward: livery, then profile, then vehicle. This lets one paint scheme change a power figure or cab without duplicating the whole vehicle.</p><h3>Special cases</h3><ul><li><code>has_cab: true</code> marks a driving trailer that can lead while backing up.</li><li><code>spritesheet</code> selects a separate PNG beside the vehicle YAML for a profile or livery.</li><li><code>nml_override</code> points a callback at hand-written NML when YAML cannot express the behaviour; do not use it for ordinary vehicles.</li></ul>`)}
    ${section('maintainer-sprites','5. Artwork and image locations',`<p>By default, place the published sheet beside the YAML and give it the same base name:</p>${code(`[project]/src/vehicles/Class416_2/
├── Class416_2.yaml
└── Class416_2.png`,'text')}<p>The PNG must use the BRBuild/NewGRF template rows for its vehicle type and the project's palette. Do not resize or crop it casually: the row detector expects the template geometry and eight directional views.</p><h3>Replacing artwork safely</h3><ol><li>Put exactly one replacement PNG in the vehicle's <code>new/</code> folder.</li><li>Run the build. BRBuild normalises it and, on success, publishes the sheet beside the YAML and keeps a source copy in <code>ingested/</code>.</li><li>If the build fails, the drop moves to <code>error/</code>; the previously working sheet is left unchanged.</li></ol><p>Do not edit generated <code>.cache</code>, <code>.cacheindex</code>, or <code>.sheetcache.json</code> files. They are safe to delete and should be ignored by git.</p><p>${tip('The drop folder makes artwork updates transactional: a bad sheet cannot silently replace a working one.')} Keep artwork changes separate from YAML changes when diagnosing a build.</p>`)}
    ${section('maintainer-advanced','6. Optional and advanced files',`<h3>RailTypes.yaml</h3><p>Use this when the project needs explicit fallback labels for logical track types. If you provide it, define every logical type the project uses.</p>${code(`RAIL: [RAIL]
ELRL: [SAAA, SAAE, ELRL]
THIRD: [SAA3, 3RDR, ELRL]
FOURTH: [SAA4, SAA3, 4RDR, ELRL]`)}<h3>PNML/NML</h3><p>A vehicle-level <code>.pnml</code> sits beside its YAML and is collated before that vehicle's generated blocks. Project-wide files go under <code>src/grf/custom_nml/</code>. Use hand-written NML for unusual switches, randomised graphics, or cargo-driven behaviour that the YAML model cannot describe.</p>${code(`nml_override:
  default: sw_my_vehicle_graphics`)}<h3>IDs and releases</h3><p><code>src/grf/VehicleIDData.yaml</code> stores numeric vehicle IDs. Normal development builds may reuse IDs; use a release build when the variant set is ready for savegame compatibility. Do not casually edit the registry.</p>`)}
    ${section('maintainer-checklist','7. A reliable first build',`<ol><li>Create the folder tree and root <code>BRBuild.yaml</code>.</li><li>Add <code>src/grf/GRF.yaml</code> with a stable GRF ID and visible metadata.</li><li>Create one vehicle directory with matching YAML and PNG names.</li><li>Start with one profile and no livery-specific overrides.</li><li>Validate enum spelling, indentation, dates, and relative paths.</li><li>Run BRBuild and read the first error, not only the final summary.</li><li>Only then add more profiles, liveries, standalone sheets, or custom NML.</li></ol><div class="maintainer-callout"><strong>Rule of thumb</strong><p>Put shared facts at vehicle level, formation-specific facts in profiles, and paint/operator-specific facts in liveries. If two variants need different artwork, give them separate sheets or an explicit sprite override rather than trying to compensate with unrelated stats.</p></div><p>For deeper builder behaviour, consult BRBuild's <code>docs/project.md</code> and <code>docs/build-manifest.md</code>. The generated manifest is the authoritative record of what a successful build actually emitted.</p>`)}
  `;
}
