const mEsc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
maintainerPages['vehicle-yaml']={title:'Vehicle YAML',intro:'The vehicle file is the main thing most maintainers edit. It describes the identity, behaviour, formations, paint schemes, dates, and artwork choices for one vehicle family.',body:`<div class="maintainer-callout"><strong>How to use this page</strong><p>Start with the minimum example, get one vehicle building, then add fields from the complete example only when you need them. A field is normally shared by all variants until a profile or livery overrides it.</p></div><h2>Where the file belongs</h2><p>Each candidate has its own directory. The YAML filename normally matches the directory and the published default spritesheet sits beside it.</p>${code(`[project]/src/vehicles/Class416_2/
├── Class416_2.yaml
├── Class416_2.png
├── new/
├── ingested/
└── error/`,'text')}<h2>Minimum example</h2><p>This is the smallest useful shape for a simple train. Values are deliberately ordinary; replace them with the real vehicle's values.</p>${code(`info:
  identifier: class_101
  name: "Class 101"

stats:
  vehicle_type: train
  train_type: multiple_unit
  weight: 38
  length: 8
  power: 600
  speed: 70
  tractive_effort: 0.15
  power_type: [diesel]

cargo: passenger

dates:
  introduction_date: 1956-01-01

profiles:
  - identifier: DEFAULT
    num_vehicles: 1
    capacity: 64`)}<p><strong>Required in practice:</strong> a unique <code>info.identifier</code>, a visible <code>info.name</code>, <code>stats.vehicle_type</code>, one profile, and artwork in the expected location. The other statistics make the generated vehicle useful and should normally be supplied.</p><h2>More complete example</h2><p>This example shows profiles, profile overrides, restricted liveries, a standalone sheet, and the common descriptive fields. It is a reference shape, not something to copy unchanged.</p>${code(`info:
  identifier: br_mk3
  name: "Mk3 Coach"
  sub_name: "Passenger coach"
  based_on: "British Rail Mk3"
  operator: "British Rail"

usage: INTERCITY
classification: passenger_coach

stats:
  vehicle_type: train
  train_type: coach
  weight: 43
  length: 8
  power: 0
  speed: 125
  tractive_effort: 0
  track_type: [RAIL]
  power_type: []
  lighting: auto

cargo: passenger
non_cargo_classes: [CC_LIQUID]
autorefit: false
loading_speed: 5

dates:
  introduction_date: 1975-04-21
model_life: 40
vehicle_life: 30

profiles:
  - identifier: standard
    name: "Trailer Second"
    num_vehicles: 1
    capacity: 72
    introduction_date: 1975-04-21
  - identifier: sleeper
    name: "Sleeper"
    sub_name: "Sleeping coach"
    num_vehicles: 1
    capacity: 26
    speed: 125
    spritesheet: BRMk3Sleeper.png

liveries:
  - name: "BR Blue"
    profiles: [standard, sleeper]
    special_tags: [operator/BR]
  - name: "InterCity"
    profiles: [standard]
    special_tags: [operator/InterCity]
  - name: "Caledonian Sleeper"
    profiles: [sleeper]
    spritesheet: CaledonianSleeper.png
    special_tags: [operator/Caledonian Sleeper]`)}<p>${tip('The narrowest override wins: livery values override profile values, which override vehicle-level values. This avoids copying a whole vehicle just because one formation has a different speed or sheet.')} Keep shared facts at the vehicle level and only repeat differences.</p><h2>How the sections fit together</h2><h3><code>info</code> — identity and display text</h3><p><code>identifier</code> is a stable internal key and must be unique. <code>name</code> is the player-facing base name. <code>nickname</code>, <code>sub_name</code>, <code>based_on</code>, and <code>operator</code> are optional descriptive metadata. Do not use a display name as a substitute for a stable identifier.</p><h3><code>stats</code> — shared physical and technical facts</h3><p>Put the default weight, length, power, speeds, traction, track systems, and traction types here. A profile or livery can override fields that genuinely differ. Numeric speed values are authored in mph; weight is metric tonnes; power is horsepower; tractive effort is a coefficient such as <code>0.08</code>.</p><h3><code>cargo</code> — what can be carried</h3><p>Use a preset (<code>passenger</code>, <code>parcels</code>, <code>mail</code>, <code>containerised</code>, <code>bulk</code>, <code>tank</code>, <code>open_wagon</code>), <code>none</code>, an explicit OpenTTD class such as <code>CC_PIECE_GOODS</code>, or a list. Leaving it out is different from <code>none</code>: omitted means no cargo property is emitted; <code>none</code> explicitly means it carries nothing. <code>non_cargo_classes</code> removes classes even when a broader preset allows them. <code>default_cargo_type</code> currently accepts <code>DEFAULT_CARGO_FIRST_REFITTABLE</code>. <code>autorefit: true</code> enables consist cargo adoption.</p><h3><code>dates</code> and lifecycle</h3><p><code>introduction_date</code> accepts <code>YYYY</code>, <code>YYYY-MM</code>, or <code>YYYY-MM-DD</code>. <code>model_life</code> controls how long the model is available; <code>retire_early</code> moves retirement earlier or later; <code>vehicle_life</code> controls an individual vehicle's lifetime. A profile can have its own introduction date.</p><h2>Profiles: formations and roles</h2><p>Profiles are the configurations that become variants in the purchase list. Each needs an <code>identifier</code>. Set <code>name</code> when the profile should be visible as a formation label. <code>num_vehicles</code> controls the articulated part count; <code>capacity</code> is capacity per part. Profiles may override <code>weight</code>, <code>power</code>, <code>speed</code>, <code>design_speed</code>, <code>track_type</code>, <code>cargo</code>, <code>introduction_date</code>, <code>tilt</code>, <code>lighting</code>, <code>has_cab</code>, and <code>spritesheet</code>. <code>types</code> can deliberately emit the profile as multiple target vehicle types, for example <code>[train, tram]</code>.</p>${code(`profiles:
  - identifier: two_car
    name: "2-Car"
    num_vehicles: 2
    capacity: 164
  - identifier: dvt
    name: "Driving Trailer"
    num_vehicles: 1
    capacity: 0
    has_cab: true
    spritesheet: UnitDVT.png`)}<h2>Liveries: paint schemes and sprite selection</h2><p>A livery is a named visual/operator variant. Without <code>profiles</code>, it applies to every profile. With <code>profiles</code>, every identifier must exactly match a profile.</p>${code(`liveries:
  - name: "BR Blue"
    profiles: [two_car, dvt]
    special_tags: [operator/BR]
  - name: "Network SouthEast"
    profiles: [two_car]
    special_tags: [operator/Network SouthEast]`)}<h3>How liveries interact with spritesheets</h3><p>By default, every profile and livery consumes rows from the candidate's default <code>Class416_2.png</code>. Set <code>spritesheet</code> on a profile when that profile has different artwork; set it on a livery when that paint scheme has its own sheet. A livery sheet overrides a profile sheet, which overrides the vehicle sheet.</p><p>The path is relative to the candidate folder. The separate sheet follows the same template geometry, row detection, palette, lighting, purchase-icon, cache, and ingestion rules as the default sheet. Its file cursor is independent. Sharing a sheet does not mean sharing its YAML data.</p>${code(`profiles:
  - identifier: dvt
    spritesheet: BRMk3DVT.png

liveries:
  - name: "Network SouthEast"
    profiles: [dvt]
    spritesheet: NetworkSouthEastDVT.png`)}<h3><code>sprite_override</code></h3><p><code>sprite_override</code> is different from <code>spritesheet</code>. A spritesheet chooses the image file from which rows are read. <code>sprite_override</code> selects a custom sprite template/mapping file for the variant. Use it only when the artwork's layout needs a deliberate mapping that the normal detected template cannot provide.</p>${code(`liveries:
  - name: "Special artwork"
    sprite_override: special_livery.png
    profiles: [standard]`)}<p>Keep the override file beside the candidate and ensure it matches the expected BRBuild/NML format. Do not use <code>sprite_override</code> merely because a livery needs a different PNG; use <code>spritesheet</code> for that.</p><h2>Every enum and accepted value</h2><h3><code>vehicle_type</code></h3><p>Exactly one of: <code>train</code>, <code>tram</code>, <code>road_vehicle</code>, <code>ship</code>, <code>plane</code>. This chooses the OpenTTD feature and the template family.</p><h3><code>train_type</code></h3><p>For trains, one of: <code>locomotive</code> (powered engine), <code>multiple_unit</code> (self-contained train), <code>wagon</code> (freight vehicle), or <code>coach</code> (passenger/non-powered stock).</p><h3><code>power_type</code></h3><p>Use one or more of: <code>steam</code>; <code>diesel</code>, <code>diesel_hydraulic</code>, <code>diesel_electric</code>, <code>diesel_mechanical</code>; <code>electric</code>, <code>ohle</code>, <code>overhead</code>, <code>third_rail</code>, <code>fourth_rail</code>, <code>catenary</code>; <code>hydrogen</code>; <code>battery</code>; <code>gas_turbine</code>. Multiple entries describe bi-mode or tri-mode traction. Some tokens are BRBuild conventions mapped onto the closest OpenTTD mechanics.</p><h3><code>track_type</code></h3><p>Logical project values are normally <code>RAIL</code>, <code>ELRL</code>, <code>THIRD</code>, and <code>FOURTH</code>. They resolve through <code>RailTypes.yaml</code> and are not raw sprite labels.</p><h3><code>lighting</code></h3><p><code>auto</code> detects directional lamps and can infer a matching pattern from sibling liveries; <code>exact</code> trusts only the artwork's own evidence; <code>none</code> disables the lighting overlay.</p><h3><code>tilt</code></h3><p><code>none</code>, <code>basic</code>, <code>modest</code>, <code>strong</code>, and <code>extreme</code> are project levels. A numeric value is also accepted for a custom curve modifier.</p><h3><code>usage</code></h3><p>Optional project category: <code>TRAM</code>, <code>TRAM_TRAIN</code>, <code>LIGHT_RAIL</code>, <code>UNDERGROUND</code>, <code>METRO</code>, <code>SUBURBAN</code>, <code>COMMUTER</code>, <code>LOCAL</code>, <code>REGIONAL</code>, <code>INTERCITY</code>, or <code>HIGH_SPEED</code>. It affects project rules and badges, not the base OpenTTD feature.</p><h2>Common mistakes</h2><ul><li>Using tabs or inconsistent indentation.</li><li>Reusing a profile identifier in another vehicle when a livery refers to the wrong candidate.</li><li>Using <code>spritesheet</code> when the real requirement is a custom mapping, or using <code>sprite_override</code> when only the PNG differs.</li><li>Writing raw railtype labels in <code>track_type</code> instead of logical project values.</li><li>Putting artwork in <code>new/</code> with zero or multiple PNGs.</li><li>Duplicating the entire vehicle for one livery-specific change instead of using the override precedence.</li></ul>`};
function tip(text){return `<span class="help-tip" tabindex="0" title="${mEsc(text)}" aria-label="Why? ${mEsc(text)}">?</span>`}
function code(text,lang='yaml'){return `<pre class="maintainer-code"><code class="language-${lang}">${mEsc(text)}</code></pre>`}
function renderMaintainerPage(page='overview'){const item=maintainerPages[page]||maintainerPages.overview;$('maintainer-content').innerHTML=`<div class="crumb">Maintainer / ${mEsc(page)}</div><h1>${mEsc(item.title)}</h1><p class="lead">${mEsc(item.intro)}</p>${item.body}`;document.querySelectorAll('#maintainer-content a[href^="#/maintainer/"]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();location.hash=link.getAttribute('href').slice(1)}));document.querySelectorAll('#maintainer-nav [data-maintainer-page]').forEach(link=>link.classList.toggle('active',link.dataset.maintainerPage===page))}
