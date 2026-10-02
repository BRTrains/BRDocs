const maintainerPages={
  overview:{title:'Maintainer guide',intro:'How BRBuild projects fit together, where files belong, and how to build a vehicle without needing prior NML knowledge.',body:`<div class="maintainer-callout"><strong>Start here</strong><p>BRBuild turns project YAML and pixel artwork into an OpenTTD NewGRF. Keep shared project settings in <code>BRBuild.yaml</code>, GRF-wide settings in <code>src/grf/GRF.yaml</code>, and each vehicle in its own folder.</p></div><h2>The recommended reading order</h2><ol><li><a href="#/maintainer/project-layout">Create the folder layout.</a></li><li><a href="#/maintainer/brbuild-yaml">Configure the root manifest.</a></li><li><a href="#/maintainer/grf-yaml">Describe the compiled GRF.</a></li><li><a href="#/maintainer/vehicle-yaml">Create one vehicle YAML.</a></li><li><a href="#/maintainer/sprites">Add and replace artwork safely.</a></li><li><a href="#/maintainer/advanced">Add advanced files only when needed.</a></li><li><a href="#/maintainer/build-checklist">Run the first build.</a></li></ol><p>Start with one vehicle and one profile. Once that builds, add liveries and additional formations one at a time.</p>`},
  'project-layout':{title:'Project folder layout',intro:'A predictable folder structure is the foundation of a buildable BRBuild project.',body:`<p>Place the project beside the BRBuild repository. The root manifest identifies the project; <code>target_folders</code> identifies the folders whose child directories contain vehicles.</p>${code(`[project]/
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
            ├── new/          # replacement artwork goes here
            ├── ingested/     # managed working copy
            ├── error/        # failed artwork drops
            └── Class416_2.pnml # optional`)}<p>A vehicle directory and its YAML normally have the same name. Put the YAML and published PNG beside one another. Do not put a vehicle YAML directly in <code>src/vehicles</code>.</p><p>${tip('Explicit target folders stop tools, experiments, and unrelated directories from accidentally becoming vehicles.')} Use forward slashes in configuration paths.</p>`},
  'brbuild-yaml':{title:'BRBuild.yaml',intro:'The root manifest tells BRBuild what this project is and where to find its inputs.',body:`${code(`project:
  name: MyNewGRF
  build: true
  docs: true
  target_folders:
    - src/vehicles
  grf_folder: src/grf
  sound_folder: src/sound
  palette: Sprites/ttd-newgrf-dos.gpl`)}<dl class="maintainer-fields"><dt><code>project.name</code> — required</dt><dd>Unique project name used in build output and documentation.</dd><dt><code>build</code> — optional</dt><dd>Use <code>true</code> to include the project in bulk builds; <code>false</code> skips it.</dd><dt><code>docs</code> — optional</dt><dd>Use <code>true</code> to expose the project to the hosted documentation site. Omit it or use <code>false</code> for private/build-only projects.</dd><dt><code>target_folders</code> — required for vehicles</dt><dd>List of folders relative to the project root. Their child directories are scanned for candidate YAML files.</dd><dt><code>grf_folder</code> — optional</dt><dd>Folder containing <code>GRF.yaml</code>; defaults to <code>src/grf</code>.</dd><dt><code>sound_folder</code> — optional</dt><dd>Folder containing sounds; defaults to <code>src/sound</code>.</dd><dt><code>palette</code> — optional</dt><dd>Palette used when reading sprites. Use the palette required by the project.</dd></dl>`},
  'grf-yaml':{title:'src/grf/GRF.yaml',intro:'GRF.yaml describes the compiled NewGRF as a whole: its identity, version, purchase list, and player settings.',body:`${code(`grf:
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
      1: Design Speed`)}<h2>Important fields</h2><ul><li><code>grf.grfid</code> is the stable four-character identifier. Treat it as permanent.</li><li><code>short_name</code>, <code>name</code>, and <code>description</code> are internal/player-facing metadata.</li><li><code>versioning.version</code> is the current version; <code>compatible_version</code> is the oldest save-compatible version.</li><li><code>purchase_list.order</code> accepts <code>none</code>, <code>date</code>, or <code>grouped</code>. A <code>file</code> can select a manual NML sort file.</li></ul><h2>Parameters</h2><p>Each parameter needs an identifier, display name, description, minimum, maximum, and default. The optional <code>names</code> map gives friendly labels to numeric values.</p><p>${tip('Parameter descriptions appear in OpenTTD settings. Explain the effect, not just the name.')} Keep identifiers stable because generated switches and saved settings can refer to them.</p><h2>Companion files</h2><p><code>RailTypes.yaml</code> defines logical track types. Files under <code>custom_nml/</code> contain project-wide hand-written NML. Both are optional.</p>`},
  'vehicle-yaml':{title:'Vehicle YAML',intro:'One vehicle YAML describes one vehicle family. This is the main file most maintainers will edit.',body:`<p>The file is data, not a program. YAML indentation matters: use spaces, not tabs. This is a complete small train example:</p>${code(`info:
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
    special_tags: [operator/BR]`)}<h2>Required and optional sections</h2><dl class="maintainer-fields"><dt><code>info</code> — required</dt><dd><code>identifier</code> must be unique; <code>name</code> is visible. Nickname, subtitle, prototype, and operator fields are optional.</dd><dt><code>stats</code> — required</dt><dd>Choose <code>vehicle_type</code>. Train candidates normally also specify <code>train_type</code>, weight, length, power, speed, tractive effort, and power type.</dd><dt><code>cargo</code> — optional</dt><dd>Use <code>none</code>, a preset such as <code>passenger</code>, <code>parcels</code>, <code>mail</code>, <code>containerised</code>, <code>bulk</code>, <code>tank</code>, or <code>open_wagon</code>; or an explicit class such as <code>CC_PIECE_GOODS</code>.</dd><dt><code>dates</code> — recommended</dt><dd><code>introduction_date</code> accepts <code>YYYY</code>, <code>YYYY-MM</code>, or <code>YYYY-MM-DD</code>.</dd><dt><code>profiles</code> — required in practice</dt><dd>Add at least one. Use <code>DEFAULT</code> for one ordinary configuration; use meaningful identifiers for formations or roles.</dd><dt><code>liveries</code> — optional</dt><dd>Paint/operator variants. Restrict them to profiles with a <code>profiles</code> list.</dd></dl><h2>Accepted enum-style values</h2><ul><li><code>vehicle_type</code>: <code>train</code>, <code>tram</code>, <code>road_vehicle</code>, <code>ship</code>, <code>plane</code>.</li><li><code>train_type</code>: <code>locomotive</code>, <code>multiple_unit</code>, <code>wagon</code>, <code>coach</code>.</li><li><code>lighting</code>: <code>auto</code>, <code>exact</code>, <code>none</code>.</li><li><code>tilt</code>: <code>none</code>, <code>basic</code>, <code>modest</code>, <code>strong</code>, <code>extreme</code>, or a number.</li><li><code>track_type</code>: project values such as <code>RAIL</code>, <code>ELRL</code>, <code>THIRD</code>, <code>FOURTH</code>.</li><li><code>power_type</code>: commonly <code>steam</code>, <code>diesel</code>, <code>electric</code>, <code>third_rail</code>, <code>overhead</code>, <code>hydrogen</code>, <code>battery</code>, <code>gas_turbine</code>.</li></ul><h2>Profiles and liveries</h2><p>A profile is what the player buys: a formation, coach role, or performance variant. <code>num_vehicles</code> is the articulated part count and <code>capacity</code> is the capacity per part as defined by the project.</p>${code(`profiles:
  - identifier: five_car
    name: "5-Car"
    num_vehicles: 5
    capacity: 450
    speed: 100
  - identifier: driving_trailer
    name: "Driving Trailer"
    num_vehicles: 1
    capacity: 72
    has_cab: true
    spritesheet: BRUnitDVT.png`)}<p>Overrides resolve from livery, then profile, then vehicle. Put a fact at the narrowest level where it is true. <code>has_cab: true</code> marks a driving trailer; <code>spritesheet</code> selects a separate PNG beside the YAML.</p>`},
  sprites:{title:'Sprites and artwork',intro:'BRBuild expects pixel artwork in recognised template rows. The drop-folder workflow protects the last working sheet.',body:`<h2>Where the published sheet goes</h2>${code(`[project]/src/vehicles/Class416_2/
├── Class416_2.yaml
└── Class416_2.png`,'text')}<p>Use the project palette and the correct vehicle template. A sheet contains the eight directional views expected by the template; do not resize or crop it casually.</p><h2>Replacing artwork</h2><ol><li>Put exactly one replacement PNG in <code>new/</code>.</li><li>Run the build. BRBuild normalises it and, on success, publishes the sheet beside the YAML and keeps a source copy in <code>ingested/</code>.</li><li>If the build fails, the drop moves to <code>error/</code> and the previous working sheet remains in place.</li></ol><p>${tip('The drop folder makes artwork updates transactional: a bad sheet cannot silently replace a working one.')} Keep artwork changes separate from YAML changes while diagnosing failures.</p><h2>Generated files</h2><p><code>.cache</code>, <code>.cacheindex</code>, and <code>.sheetcache.json</code> files are derived metadata, not inputs. Ignore them in git; they are safe to delete.</p>`},
  advanced:{title:'Advanced files',intro:'Most vehicles need only YAML and PNG. These files are escape hatches for behaviour the normal model cannot express.',body:`<h2>RailTypes.yaml</h2><p>Define logical track types and ordered fallback labels. If you provide this file, include every logical type the project still uses.</p>${code(`RAIL: [RAIL]
ELRL: [SAAA, SAAE, ELRL]
THIRD: [SAA3, 3RDR, ELRL]
FOURTH: [SAA4, SAA3, 4RDR, ELRL]`)}<h2>PNML/NML</h2><p>A vehicle-level <code>.pnml</code> sits beside its YAML and is collated before that vehicle's generated blocks. Project-wide files go under <code>src/grf/custom_nml/</code>.</p>${code(`nml_override:
  default: sw_my_vehicle_graphics`)}<p>Use this for unusual switches, cargo-driven graphics, or randomised sprite chains. Keep ordinary vehicle data in YAML.</p><h2>IDs and releases</h2><p><code>src/grf/VehicleIDData.yaml</code> stores numeric vehicle IDs. Use a release build when the variant set is ready for savegame compatibility. Do not casually edit the registry.</p>`},
  'build-checklist':{title:'First-build checklist',intro:'A short, repeatable path from an empty folder to a useful error message or a successful GRF.',body:`<ol><li>Create the project tree and root <code>BRBuild.yaml</code>.</li><li>Add <code>src/grf/GRF.yaml</code> with a stable GRF ID and visible metadata.</li><li>Create one vehicle folder with matching YAML and PNG names.</li><li>Start with one profile and no livery-specific overrides.</li><li>Check enum spelling, indentation, dates, and relative paths.</li><li>Run BRBuild and read the first error, not only the final summary.</li><li>Only then add more profiles, liveries, standalone sheets, or custom NML.</li></ol><div class="maintainer-callout"><strong>Rule of thumb</strong><p>Put shared facts at vehicle level, formation-specific facts in profiles, and paint/operator-specific facts in liveries. If variants need different artwork, use separate sheets rather than compensating with unrelated stats.</p></div><p>For deeper behaviour, consult BRBuild's <code>docs/project.md</code> and <code>docs/build-manifest.md</code>. The generated manifest is the authoritative record of what a successful build emitted.</p>`}
};
function tip(text){return `<span class="help-tip" tabindex="0" title="${esc(text)}" aria-label="Why? ${esc(text)}">?</span>`}
function code(text,lang='yaml'){return `<pre class="maintainer-code"><code class="language-${lang}">${esc(text)}</code></pre>`}
function renderMaintainerPage(page='overview'){const item=maintainerPages[page]||maintainerPages.overview;$('maintainer-content').innerHTML=`<div class="crumb">Maintainer / ${esc(page)}</div><h1>${esc(item.title)}</h1><p class="lead">${esc(item.intro)}</p>${item.body}`;document.querySelectorAll('#maintainer-content a[href^="#/maintainer/"]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();location.hash=link.getAttribute('href').slice(1)}));document.querySelectorAll('#maintainer-nav [data-maintainer-page]').forEach(link=>link.classList.toggle('active',link.dataset.maintainerPage===page))}
