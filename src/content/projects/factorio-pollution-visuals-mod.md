## Project context

Factorio is a game where the player is stranded on an alien planet and must build a factory to survive. As production increases, machines generate pollution which spreads across map chunks and eventually angers local wildlife.

While the game includes a pollution overlay on the map, it’s difficult to understand pollution levels during normal gameplay. Players often need to constantly open the map to see where pollution is spreading.

![Project visual for Factorio Pollution Visuals Mod.](/images/projects/factorio-pollution-visuals-mod/vanilla_example.png "example of how a player can spot pollution")

## The idea

I thought it would be interesting to make pollution visible directly in the world by adding a seamless smog cloud to polluted areas.

The concept was simple:

- Heavier pollution → thicker smog
- Light pollution → subtle haze
- No pollution → clear air

This approach gives players immediate visual feedback about the environmental impact of their factory without needing to constantly check the map. It also adds a layer of atmosphere :)

## Implementation

Luckily, the developers of Factorio provide excellent modding support through their API, making it straightforward to experiment with gameplay and visual changes.

Factorio stores pollution per chunk, so the mod operates entirely on chunk data. Each chunk is tracked, sampled, and rendered independently. This allows the smog to match the pollution simulation exactly.

The implementation consists of three core parts:

- chunk sampling
- sprite calculation
- layered rendering loop/fading

### The sprite system

One of the biggest challenges was avoiding visible seams between chunks. A single sprite per chunk creates hard edges, so the mod uses multiple modular sprites that tile together:

- center sprites
- edge sprites (top, bottom, left, right)
- corner sprites
- inverted corner sprites

Each piece is rendered depending on neighbouring pollution values so the smog blends smoothly across chunk boundaries. This means every transition between polluted and non-polluted chunks can be handled visually.

![Project visual for Factorio Pollution Visuals Mod.](/images/projects/factorio-pollution-visuals-mod/all_sprites.png "all the sprites needed for the project")

### Every tick

Every tick the script checks a couple of things depending on the state:

- check if the current mod version has initialised and is set up
- check the current polluted chunks
- check all chunks
- fade in/out marked chunks

```lua control.lua
local function on_tick()
    ensure_state()

    if storage.is_setup == false then
        setup()
    elseif (not storage.is_checking) and (not storage.is_fading) then
        check_polluted_chunks()
    elseif storage.is_checking then
        check_all_chunks()
    elseif storage.is_fading then
        fade()
    end
```

In this article we will only discuss the ``check_polluted_chunks`` cycle. Feel free to check out my GitHub page for the full source code if we want an in-depth look.

### Check polluted chunks

The mod runs an internal loop that processes polluted chunks incrementally:

```lua control.lua
local function check_polluted_chunks()
    local chunks_per_tick = get_setting("chunks-per-tick-pollution-visuals")

    for _ = 1, chunks_per_tick do
        local index, chunk_data = next(storage.polluted_chunks, storage.polluted_chunks_i)
        if index == nil then
            storage.polluted_chunks_i = nil
            storage.is_fading = true
            break
        end

        storage.polluted_chunks_i = index
        check_polluted_chunk(chunk_data)
    end
end
```

This spreads the workload across ticks to avoid performance spikes.

Players can change how many chunks they would like to be checked per tick so a more performant experience.

In the ``check_polluted_chunk`` function, the code checks a chunk and does the following:

- Samples pollution for the chunk
- Computes density thresholds for each layer
- Fetches the correct sprites
- Compares them with currently rendered sprites
- Flags sprites for fade in or out when needed

Below is the whole function.

```lua control.lua

local function check_polluted_chunk(chunk_data)
    local surface = game.surfaces[chunk_data.surface]
    if not surface then return end

    local x = chunk_data.position.x
    local y = chunk_data.position.y
    local chunk_pollution = sample_pollution(surface, x, y)
    local max_layers = get_setting("layers-pollution-visuals")
    local offset = get_setting("x-offset-pollution-visuals")
    local a = get_setting("y-intercept-pollution-visuals")
    local b = get_setting("base-pollution-visuals")
    local players = get_players_to_render_for()
    local r_id = chunk_data.r_id

    for i = 1, max_layers do
        local level = a * (b ^ i) + offset
        local next_sprites = compute_sprites(surface, x, y, level, chunk_pollution)

        local current_ids = normalize_layer_ids(r_id[i])
        local current_sprites = {}
        local valid_ids = {}

        for _, id in pairs(current_ids) do
            local current_object = get_render_object(id)
            if current_object ~= nil then
                valid_ids[#valid_ids + 1] = id
                current_sprites[#current_sprites + 1] = current_object.animation
            end
        end

        if #valid_ids > 0 then
            r_id[i] = valid_ids
        else
            r_id[i] = nil
        end

        if #valid_ids > 0 then
            if next_sprites == nil then
                for _, id in pairs(valid_ids) do
                    fade_out_entry(id, x, y)
                end
                r_id[i] = nil
            elseif not string_lists_equal(next_sprites, current_sprites) then
                for _, id in pairs(valid_ids) do
                    fade_out_entry(id, x, y)
                end

                local new_ids = {}
                for _, sprite_name in pairs(next_sprites) do
                    local new_id = create_sprite(surface, sprite_name, x, y, players)
                    new_ids[#new_ids + 1] = new_id
                    fade_in_entry(new_id, x, y)
                end

                r_id[i] = new_ids
            end
        elseif next_sprites ~= nil then
            local new_ids = {}
            for _, sprite_name in pairs(next_sprites) do
                local new_id = create_sprite(surface, sprite_name, x, y, players)
                new_ids[#new_ids + 1] = new_id
                fade_in_entry(new_id, x, y)
            end
            r_id[i] = new_ids
        end
    end

    if chunk_pollution <= 0 and not has_neighbor_pollution(surface, x, y) and next(r_id) == nil then
        storage.polluted_chunks[key_for(chunk_data.surface, x, y)] = nil
    end
end
```

The function begins by gathering all required values:

```lua control.lua
local chunk_pollution = sample_pollution(surface, x, y)
local max_layers = get_setting("layers-pollution-visuals")
local offset = get_setting("x-offset-pollution-visuals")
local a = get_setting("y-intercept-pollution-visuals")
local b = get_setting("base-pollution-visuals")
```

These settings define how many smog layers exist and how pollution maps to visual density.

Each chunk can render multiple stacked smog layers. The function iterates over them:

```lua control.lua

for i = 1, max_layers do
    local level = a * (b ^ i) + offset
    local next_sprites = compute_sprites(surface, x, y, level, chunk_pollution)
```

The exponential formula determines the pollution threshold for each layer.
Higher layers require more pollution and therefore appear only in dense areas.

Instead of recreating sprites every update, the function compares what should exist with what already exists:

```lua control.lua
elseif not string_lists_equal(next_sprites, current_sprites) then
    for _, id in pairs(valid_ids) do
        fade_out_entry(id, x, y)
    end
```

If the sprite set changes:

- existing sprites are marked to be faded out
- new sprites are created
- new sprites are marked to be faded in

This prevents flickering and reduces unnecessary rendering operations.

### Sprite Calculation

The core logic for choosing sprites checks all neighbouring chunks and diagonals:

```lua control.lua

local n = sample_pollution(surface, x, y - 1) > level
local e = sample_pollution(surface, x + 1, y) > level
local s = sample_pollution(surface, x, y + 1) > level
local w = sample_pollution(surface, x - 1, y) > level
local ne = sample_pollution(surface, x + 1, y - 1) > level
local se = sample_pollution(surface, x + 1, y + 1) > level
local sw = sample_pollution(surface, x - 1, y + 1) > level
local nw = sample_pollution(surface, x - 1, y - 1) > level
```

Based on these values, the mod decides whether the chunk should render:

- a full middle tile
- an edge
- a convex corner
- a concave corner
- nothing

## Closing thoughts

The goal was to make pollution something players can feel moment-to-moment instead of something only visible on the map. I feel that I have achieved this goal very well.

<!-- gallery -->
![image](https://assets-mod.factorio.com/assets/6628c5a5e7e05b62ec610d4eb51bb74e6ec030c2.png " ")
![image](https://assets-mod.factorio.com/assets/e9ebdd31dff6baf831cb1ee01d523859c4c4ad1c.png " ")
<!-- /gallery -->

There are still some bugs present. When two sources of pollution meet in the middle, the conditions to pick a fitting sprite are missing, which causes noticeable seams. In the future I will probably fix this, but for now this is a minor issue, especially since this does not happen often.

If you're interested in trying it yourself or looking at the source code, you can find the project here:

- Mod Portal: [Pollution Visuals](https://mods.factorio.com/mod/pollution-visuals)
- GitHub Repository: [DowneyX/pollution-visuals](https://github.com/DowneyX/pollution-visuals)

Feedback, suggestions, and contributions are always welcome.
