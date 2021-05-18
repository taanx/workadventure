import type {ITiledMap, ITiledMapLayer} from "./ITiledMap";

/**
 * Flatten the grouped layers
 */
export function flattenGroupLayersMap(map: ITiledMap) {
    const flatLayers: ITiledMapLayer[] = [];
    flattenGroupLayers(map.layers, '', flatLayers);
    return flatLayers;
}

function flattenGroupLayers(layers : ITiledMapLayer[], prefix : string, flatLayers: ITiledMapLayer[]) {
    for (const layer of layers) {
        if (layer.type === 'group') {
            flattenGroupLayers(layer.layers, prefix + layer.name + '/', flatLayers);
        } else {
            const layerWithNewName = { ...layer };
            layerWithNewName.name = prefix+layerWithNewName.name;
            flatLayers.push(layerWithNewName);
        }
    }
}