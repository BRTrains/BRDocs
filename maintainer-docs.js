const mEsc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lineHelp={info:'Identity and player-facing names for this vehicle family.',identifier:'Stable internal key; it must be unique within the project.',name:'Visible base name used in the purchase list.',stats:'Shared technical defaults; profiles and liveries may override individual values.',vehicle_type:'OpenTTD feature: train, tram, road_vehicle, ship, or plane.',train_type:'Train subtype: locomotive, multiple_unit, wagon, or coach.',weight:'Mass in metric tonnes.',length:'Vehicle length in template units; 8 is a full-length vehicle.',power:'Power in horsepower.',speed:'Service speed in mph.',design_speed:'Optional technical maximum in mph; used with the speed-mode parameter.',tractive_effort:'Preferred input is TE in kN. Values below 1 are treated as a raw TE coefficient; values above 1 are treated as TE in kN and converted automatically.',power_type:'One or more traction tokens such as diesel or electric.',track_type:'Logical project rail systems, not raw railtype labels.',cargo:'Cargo preset, explicit cargo class, none, or a list.',dates:'Availability dates; use YYYY, YYYY-MM, or YYYY-MM-DD.',introduction_date:'Date the vehicle or profile becomes available.',profiles:'Buyable formations, roles, and performance variants.',num_vehicles:'Number of articulated parts in this profile.',capacity:'Capacity per articulated part.',liveries:'Named paint/operator variants.',spritesheet:'PNG sheet selected for this profile or livery; narrower scopes override broader ones.',sprite_override:'Custom sprite template/mapping; not a replacement for spritesheet.',special_tags:'Tags used for operator or project badges.'};
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
  tractive_effort: 75
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
    special_tags: [operator/BR]`)}<h2>Required and optional sections</h2><dl class="maintainer-fields"><dt><code>info</code> — required</dt><dd><code>identifier</code> must be unique; <code>name</code> is visible. Nickname, subtitle, prototype, and operator fields are optional.</dd><dt><code>stats</code> — required</dt><dd>Choose <code>vehicle_type</code>. Train candidates normally also specify <code>train_type</code>, weight, length, power, speed, TE, and power type.</dd><dt><code>cargo</code> — optional</dt><dd>Use <code>none</code>, a preset such as <code>passenger</code>, <code>parcels</code>, <code>mail</code>, <code>containerised</code>, <code>bulk</code>, <code>tank</code>, or <code>open_wagon</code>; or an explicit class such as <code>CC_PIECE_GOODS</code>.</dd><dt><code>dates</code> — recommended</dt><dd><code>introduction_date</code> accepts <code>YYYY</code>, <code>YYYY-MM</code>, or <code>YYYY-MM-DD</code>.</dd><dt><code>profiles</code> — required in practice</dt><dd>Add at least one. Use <code>DEFAULT</code> for one ordinary configuration; use meaningful identifiers for formations or roles.</dd><dt><code>liveries</code> — optional</dt><dd>Paint/operator variants. Restrict them to profiles with a <code>profiles</code> list.</dd></dl><h2>Accepted enum-style values</h2><ul><li><code>vehicle_type</code>: <code>train</code>, <code>tram</code>, <code>road_vehicle</code>, <code>ship</code>, <code>plane</code>.</li><li><code>train_type</code>: <code>locomotive</code>, <code>multiple_unit</code>, <code>wagon</code>, <code>coach</code>.</li><li><code>lighting</code>: <code>auto</code>, <code>exact</code>, <code>none</code>.</li><li><code>tilt</code>: <code>none</code>, <code>basic</code>, <code>modest</code>, <code>strong</code>, <code>extreme</code>, or a number.</li><li><code>track_type</code>: project values such as <code>RAIL</code>, <code>ELRL</code>, <code>THIRD</code>, <code>FOURTH</code>.</li><li><code>power_type</code>: commonly <code>steam</code>, <code>diesel</code>, <code>electric</code>, <code>third_rail</code>, <code>overhead</code>, <code>hydrogen</code>, <code>battery</code>, <code>gas_turbine</code>.</li></ul><h2>Profiles and liveries</h2><p>A profile is what the player buys: a formation, coach role, or performance variant. <code>num_vehicles</code> is the articulated part count and <code>capacity</code> is the capacity per part as defined by the project.</p>${code(`profiles:
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
  tractive_effort: 75
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
    special_tags: [operator/Caledonian Sleeper]`)}<p>${tip('The narrowest override wins: livery values override profile values, which override vehicle-level values. This avoids copying a whole vehicle just because one formation has a different speed or sheet.')} Keep shared facts at the vehicle level and only repeat differences.</p><h2>How the sections fit together</h2><h3><code>info</code> — identity and display text</h3><p><code>identifier</code> is a stable internal key and must be unique. <code>name</code> is the player-facing base name. <code>nickname</code>, <code>sub_name</code>, <code>based_on</code>, and <code>operator</code> are optional descriptive metadata. Do not use a display name as a substitute for a stable identifier.</p><h3><code>stats</code> — shared physical and technical facts</h3><p>Put the default weight, length, power, speeds, traction, track systems, and traction types here. A profile or livery can override fields that genuinely differ. Numeric speed values are authored in mph; weight is metric tonnes; power is horsepower; TE should normally be supplied in kN. Values below 1 are treated as a raw TE coefficient instead; values above 1 are treated as TE in kN and converted to the coefficient BRBuild needs. A value of 0 therefore means a zero coefficient. For example, write <code>tractive_effort: 75</code> for 75 kN, or <code>tractive_effort: 0.08</code> when you intentionally want to provide the raw coefficient.</p><h3><code>cargo</code> — what can be carried</h3><p>Use a preset (<code>passenger</code>, <code>parcels</code>, <code>mail</code>, <code>containerised</code>, <code>bulk</code>, <code>tank</code>, <code>open_wagon</code>), <code>none</code>, an explicit OpenTTD class such as <code>CC_PIECE_GOODS</code>, or a list. Leaving it out is different from <code>none</code>: omitted means no cargo property is emitted; <code>none</code> explicitly means it carries nothing. <code>non_cargo_classes</code> removes classes even when a broader preset allows them. <code>default_cargo_type</code> currently accepts <code>DEFAULT_CARGO_FIRST_REFITTABLE</code>. <code>autorefit: true</code> enables consist cargo adoption.</p><h3><code>dates</code> and lifecycle</h3><p><code>introduction_date</code> accepts <code>YYYY</code>, <code>YYYY-MM</code>, or <code>YYYY-MM-DD</code>. <code>model_life</code> controls how long the model is available; <code>retire_early</code> moves retirement earlier or later; <code>vehicle_life</code> controls an individual vehicle's lifetime. A profile can have its own introduction date.</p><h2>Profiles: formations and roles</h2><p>Profiles are the configurations that become variants in the purchase list. Each needs an <code>identifier</code>. Set <code>name</code> when the profile should be visible as a formation label. <code>num_vehicles</code> controls the articulated part count; <code>capacity</code> is capacity per part. Profiles may override <code>weight</code>, <code>power</code>, <code>speed</code>, <code>design_speed</code>, <code>track_type</code>, <code>cargo</code>, <code>introduction_date</code>, <code>tilt</code>, <code>lighting</code>, <code>has_cab</code>, and <code>spritesheet</code>. <code>types</code> can deliberately emit the profile as multiple target vehicle types, for example <code>[train, tram]</code>.</p>${code(`profiles:
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
maintainerPages['vehicle-yaml'].body+=`<h2>Field reference tables</h2><p>Use the short description first. Hover or tap any line in a code block for a reminder of what that line controls.</p><table class="maintainer-option-table"><thead><tr><th>Field</th><th>Where</th><th>Required?</th><th>What it controls</th></tr></thead><tbody><tr><td><code>info.identifier</code></td><td>info</td><td>Yes</td><td>Stable unique internal identity.</td></tr><tr><td><code>info.name</code></td><td>info</td><td>Yes</td><td>Base name shown to players.</td></tr><tr><td><code>vehicle_type</code></td><td>stats</td><td>Yes</td><td>OpenTTD feature and graphics family.</td></tr><tr><td><code>train_type</code></td><td>stats</td><td>Train only</td><td>Locomotive, multiple unit, wagon, or coach classification.</td></tr><tr><td><code>weight</code></td><td>stats/profile/livery</td><td>Usually</td><td>Mass in tonnes.</td></tr><tr><td><code>length</code></td><td>stats</td><td>Usually</td><td>Template length; 8 is full length.</td></tr><tr><td><code>power</code></td><td>stats/profile/livery</td><td>Powered stock</td><td>Horsepower.</td></tr><tr><td><code>speed</code></td><td>stats/profile/livery</td><td>Usually</td><td>Service speed in mph.</td></tr><tr><td><code>design_speed</code></td><td>stats/profile/livery</td><td>No</td><td>Optional technical maximum.</td></tr><tr><td><code>tractive_effort</code></td><td>stats</td><td>Powered train</td><td>TE in kN, normally; values below 1 may be supplied as a raw TE coefficient.</td></tr><tr><td><code>power_type</code></td><td>stats</td><td>Usually</td><td>Traction and inferred effects/costs.</td></tr><tr><td><code>track_type</code></td><td>stats/profile/livery</td><td>No</td><td>Logical compatible rail systems.</td></tr><tr><td><code>cargo</code></td><td>root/profile</td><td>No</td><td>Refittable cargo classes or a preset.</td></tr><tr><td><code>introduction_date</code></td><td>dates/profile</td><td>Recommended</td><td>Purchase-list availability.</td></tr><tr><td><code>num_vehicles</code></td><td>profile</td><td>Usually</td><td>Articulated parts in the formation.</td></tr><tr><td><code>capacity</code></td><td>profile</td><td>Carrying stock</td><td>Capacity per part.</td></tr><tr><td><code>profiles</code></td><td>livery</td><td>No</td><td>Limits a livery to profile identifiers.</td></tr><tr><td><code>spritesheet</code></td><td>profile/livery</td><td>No</td><td>Alternate PNG source sheet.</td></tr><tr><td><code>sprite_override</code></td><td>profile/livery</td><td>No</td><td>Custom sprite template/mapping.</td></tr></tbody></table><h2>Enum reference</h2><table class="maintainer-option-table"><thead><tr><th>Enum</th><th>Allowed values</th><th>Notes</th></tr></thead><tbody><tr><td><code>vehicle_type</code></td><td><code>train</code>, <code>tram</code>, <code>road_vehicle</code>, <code>ship</code>, <code>plane</code></td><td>One value; chooses the feature.</td></tr><tr><td><code>train_type</code></td><td><code>locomotive</code>, <code>multiple_unit</code>, <code>wagon</code>, <code>coach</code></td><td>Only meaningful for trains.</td></tr><tr><td><code>lighting</code></td><td><code>auto</code>, <code>exact</code>, <code>none</code></td><td>Directional lamp overlay behaviour.</td></tr><tr><td><code>tilt</code></td><td><code>none</code>, <code>basic</code>, <code>modest</code>, <code>strong</code>, <code>extreme</code>, or number</td><td>Curve-speed tilt convention.</td></tr><tr><td><code>usage</code></td><td><code>TRAM</code>, <code>TRAM_TRAIN</code>, <code>LIGHT_RAIL</code>, <code>UNDERGROUND</code>, <code>METRO</code>, <code>SUBURBAN</code>, <code>COMMUTER</code>, <code>LOCAL</code>, <code>REGIONAL</code>, <code>INTERCITY</code>, <code>HIGH_SPEED</code></td><td>Optional project category.</td></tr><tr><td><code>track_type</code></td><td><code>RAIL</code>, <code>ELRL</code>, <code>THIRD</code>, <code>FOURTH</code></td><td>Logical values; project files may define fallbacks.</td></tr><tr><td><code>power_type</code></td><td><code>steam</code>, <code>diesel</code>, <code>diesel_hydraulic</code>, <code>diesel_electric</code>, <code>diesel_mechanical</code>, <code>electric</code>, <code>ohle</code>, <code>overhead</code>, <code>third_rail</code>, <code>fourth_rail</code>, <code>catenary</code>, <code>hydrogen</code>, <code>battery</code>, <code>gas_turbine</code></td><td>One or more values may be combined for bi-mode or tri-mode traction.</td></tr></tbody></table>`;
maintainerPages.sprites={title:'Sprites and artwork',intro:'BRBuild reads pixel artwork from recognised template rows. This page explains where images go, how the eight views work, how replacements are ingested, and how to diagnose artwork failures.',body:`<div class="maintainer-callout"><strong>The safe workflow</strong><p>Published artwork is the last known-good input. Put a replacement in <code>new/</code>, run a build, and let BRBuild publish it only after the candidate succeeds. Never edit the published sheet directly when you are trying to replace it.</p></div><h2>Where images live</h2><p>The default sheet is beside the vehicle YAML and normally has the same base name. A vehicle folder may also contain managed drop folders and optional standalone sheets.</p>${code(`[project]/src/vehicles/Class416_2/
├── Class416_2.yaml       # vehicle metadata
├── Class416_2.png         # published default sheet
├── new/                   # incoming replacement PNGs
│   └── Class416_2.png
├── ingested/              # latest normalised source copy
│   └── Class416_2.png
├── error/                 # failed drops kept for diagnosis
└── Class416_2.pnml        # optional hand-written NML`,'text')}<p>A profile or livery can select another sheet with <code>spritesheet: OtherSheet.png</code>. That file is relative to the candidate folder and follows the same geometry and palette rules.</p><h2>What a spritesheet contains</h2><p>BRBuild expects a NewGRF template layout: recognised rows containing the directional drawings for the vehicle type. The normal set has eight views, covering the two end-on, diagonal, and side directions used by OpenTTD. The row detector also records offsets, width, height, template, vehicle type, and source sheet.</p><p>${tip('The builder detects rows instead of treating the image as an arbitrary strip. Keeping the template geometry intact lets it match the right drawing to the right direction and articulated part.')} Do not resize, crop, add a border, or change row spacing unless you are deliberately producing artwork for a different template.</p><h3>Pixel and palette rules</h3><ul><li>Use PNG, not JPEG: JPEG compression changes individual pixels and can break detection.</li><li>Use the project's OpenTTD/NewGRF palette. Do not convert to a full-colour palette without knowing the project's palette configuration.</li><li>Keep transparent/background pixels and template spacing as supplied by the artist workflow.</li><li>Draw within the row's expected bounds. A vehicle that is too wide or too tall can overlap neighbouring rows.</li><li>Preserve pixel art at its authored resolution. Scaling by arbitrary percentages creates blurred edges and misplaced pixels.</li></ul><h2>Replacing artwork safely</h2><ol><li>Start from the tracked <code>ingested/</code> sheet, or from the current published sheet if no ingested copy exists.</li><li>Edit the artwork without changing the template's row geometry.</li><li>Place exactly one replacement PNG in <code>new/</code>.</li><li>Run the normal build or reset-graphics workflow.</li><li>On success, BRBuild publishes the normalised sheet beside the YAML, updates <code>ingested/</code>, and empties <code>new/</code>.</li><li>On failure, the drop is moved to <code>error/</code>; the working published and ingested sheets remain unchanged.</li></ol><p>${tip('The failed image is kept in error/ so the exact broken input remains available for comparison. A failed candidate must not silently replace working artwork.')} Git retains older revisions, so keeping only the latest ingested source is intentional.</p><h2>Multiple sheets and livery artwork</h2><p>Most candidates use one default sheet. Use a profile sheet when the formation or role has different drawings, and a livery sheet when the paint scheme has genuinely different artwork.</p>${code(`profiles:
  - identifier: dvt
    spritesheet: BRMk3DVT.png

liveries:
  - name: "Network SouthEast"
    profiles: [dvt]
    spritesheet: NetworkSouthEastDVT.png`)}<p>Resolution is livery, then profile, then vehicle. Each source sheet has its own row cursor and cache. A livery can therefore use a different image without shifting which rows another sheet consumes.</p><h2><code>spritesheet</code> versus <code>sprite_override</code></h2><dl class="maintainer-fields"><dt><code>spritesheet</code></dt><dd>Chooses the PNG file from which rows are read. Use it when a profile or livery has its own sheet.</dd><dt><code>sprite_override</code></dt><dd>Chooses a custom sprite template/mapping for a variant. Use it when the row layout needs deliberate mapping that normal detection cannot express; it is not simply an alternate filename.</dd></dl><p>Both can be scoped to a profile or livery. Do not use <code>sprite_override</code> merely because the paint scheme has a different PNG; use <code>spritesheet</code> for that case.</p><h2>Derived caches</h2><p>BRBuild may write these beside a sheet:</p><ul><li><code>&lt;sheet&gt;.png.cache</code> and <code>.cacheindex</code>: nmlc's encoded sprite cache.</li><li><code>&lt;sheet&gt;.png.sheetcache.json</code>: detected rows, palette, templates, vehicle type, and the source hash.</li></ul><p>They are derived files, not build inputs. Add them to <code>.gitignore</code>. They are safe to delete; BRBuild will regenerate them, with one slower row-detection pass.</p><h2>Lighting overlays</h2><p>BRBuild can detect directional headlamps and generate a second transparent overlay for trains that back up. The default <code>lighting: auto</code> detects the artwork and may use one unambiguous sibling livery to infer a matching pattern. Use <code>lighting: exact</code> when the artwork must be trusted only as drawn, or <code>lighting: none</code> to disable the overlay.</p><p>Lighting is resolved livery → profile → vehicle, just like other per-variant fields. A sheet with unclear lamps is not automatically modified; the build logs the decision so it can be checked.</p><h2>Common artwork failures</h2><dl class="maintainer-fields"><dt>“No rows detected”</dt><dd>Check that the PNG uses the correct template, palette, row spacing, and transparent/background pixels.</dd><dt>Rows are assigned to the wrong vehicle</dt><dd>Check that the sheet is in the right candidate folder and that its dimensions match the intended template.</dd><dt>Artwork appears shifted</dt><dd>Do not crop the source. Restore the template margins and offsets, then ingest through <code>new/</code>.</dd><dt>Replacement was not published</dt><dd>Read the candidate's first build error and inspect <code>error/</code>. A failed candidate deliberately leaves the previous sheet untouched.</dd><dt>A livery uses the wrong artwork</dt><dd>Check the livery's <code>profiles</code> identifiers and whether it needs <code>spritesheet</code> rather than <code>sprite_override</code>.</dd></dl><h2>Artwork checklist</h2><ul><li>Is the file a PNG with the project's palette?</li><li>Is it in the candidate folder or the correct <code>new/</code> drop folder?</li><li>Does its name match the sheet selected by <code>spritesheet</code>?</li><li>Are all expected views present and in the correct template rows?</li><li>Did you add exactly one replacement PNG to <code>new/</code>?</li><li>Did you inspect the first build error before changing unrelated YAML?</li></ul>`};
function tip(text){return `<span class="help-tip" tabindex="0" title="${mEsc(text)}" aria-label="Why? ${mEsc(text)}">?</span>`}
Object.assign(lineHelp,{info:'Identity and player-facing names for this vehicle family.',identifier:'Stable internal key; it must be unique within the project.',name:'Visible base name used in the purchase list.',stats:'Shared technical defaults; profiles and liveries may override individual values.',vehicle_type:'OpenTTD feature: train, tram, road_vehicle, ship, or plane.',train_type:'Train subtype: locomotive, multiple_unit, wagon, or coach.',weight:'Mass in metric tonnes.',length:'Vehicle length in template units; 8 is a full-length vehicle.',power:'Power in horsepower.',speed:'Service speed in mph.',design_speed:'Optional technical maximum in mph; used with the speed-mode parameter.',tractive_effort:'Preferred input is TE in kN. Values below 1 are treated as a raw TE coefficient; values above 1 are treated as TE in kN and converted automatically.',power_type:'One or more traction tokens such as diesel or electric.',track_type:'Logical project rail systems, not raw railtype labels.',cargo:'Cargo preset, explicit cargo class, none, or a list.',dates:'Availability dates; use YYYY, YYYY-MM, or YYYY-MM-DD.',introduction_date:'Date the vehicle or profile becomes available.',profiles:'Buyable formations, roles, and performance variants.',identifier:'Stable identifier used when profiles are referenced by a livery.',num_vehicles:'Number of articulated parts in this profile.',capacity:'Capacity per articulated part.',liveries:'Named paint/operator variants.',profiles:'Restricts this livery to these profile identifiers.',spritesheet:'PNG sheet selected for this profile or livery; narrower scopes override broader ones.',sprite_override:'Custom sprite template/mapping; not a replacement for spritesheet.',special_tags:'Tags used for operator or project badges.'});
function helpForLine(line){const match=line.match(/^\s*([A-Za-z_]+):/);return match?.[1]&&lineHelp[match[1]]||'This YAML line contributes to the vehicle variant described by this file.'}
function code(text,lang='yaml'){return `<pre class="maintainer-code"><code class="language-${lang}">${text.split('\n').map(line=>`<span class="code-line" tabindex="0" data-tooltip="${mEsc(helpForLine(line))}">${mEsc(line)||' '}</span>`).join('')}</code></pre>`}
function renderMaintainerPage(page='overview'){const item=maintainerPages[page]||maintainerPages.overview;$('maintainer-content').innerHTML=`<div class="crumb">Maintainer / ${mEsc(page)}</div><h1>${mEsc(item.title)}</h1><p class="lead">${mEsc(item.intro)}</p>${item.body}`;document.querySelectorAll('#maintainer-content a[href^="#/maintainer/"]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();location.hash=link.getAttribute('href').slice(1)}));document.querySelectorAll('#maintainer-content .code-line').forEach(line=>line.addEventListener('click',()=>line.classList.toggle('code-line-open')));document.querySelectorAll('#maintainer-nav [data-maintainer-page]').forEach(link=>link.classList.toggle('active',link.dataset.maintainerPage===page))}
